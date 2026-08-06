import { useCallback, useEffect, useRef, useState } from "react";

import { socket } from "../lib/socket";
import { EVENTS } from "../lib/events";
import {
  BOARD_BACKGROUND,
  createSegment,
  paintSegment,
  repaint,
  toBoardPoint,
} from "../lib/board";

/** Delay before re-checking for layout when the board mounts at zero size. */
const RESIZE_RETRY_MS = 100;

/**
 * Owns the canvas: local drawing, sync with peers, and redraw on resize.
 *
 * The board keeps its own copy of every segment. That history is what makes the
 * canvas survive a resize (which blanks the backing store) and what the server
 * replays to anyone joining an in-progress session.
 *
 * @param {{color: string, width: number, erasing: boolean}} tool Active tool.
 */
export function useWhiteboard(tool) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  /** Board size in CSS pixels — drawing coordinates are expressed in this space. */
  const sizeRef = useRef({ width: 0, height: 0 });
  /** @type {React.MutableRefObject<Array<object>>} */
  const segmentsRef = useRef([]);
  /** Last point of the in-progress stroke, in normalised coordinates. */
  const lastPointRef = useRef(null);
  /** Pending retry timer used to size the board once it has layout. */
  const retryRef = useRef(0);

  const [hasContent, setHasContent] = useState(false);

  // Pointer handlers read the tool from a ref so that changing colour mid-session
  // doesn't tear down and rebuild the listeners.
  const toolRef = useRef(tool);
  toolRef.current = tool;

  /** Add to history and paint in one step, so the two never diverge. */
  const commitSegment = useCallback((segment) => {
    segmentsRef.current.push(segment);
    // React bails out when the value is unchanged, so this is cheap to call on
    // every segment rather than tracking the transition by hand.
    setHasContent(true);

    // Before the board has layout there is no context to paint on. The segment
    // still belongs in history — the repaint that follows sizing draws it.
    const context = contextRef.current;
    if (context) paintSegment(context, segment, sizeRef.current);
  }, []);

  /**
   * Match the backing store to the element's CSS size and the display's pixel
   * ratio, then replay history. Without the ratio, strokes look blurry on
   * high-DPI screens; without the replay, resizing wipes the board.
   */
  const resizeCanvas = useCallback(function resize() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // The board has no layout yet — typically a tab opened in the background,
      // where ResizeObserver callbacks are not delivered while the tab is
      // hidden. Without a retry the canvas would keep its default 300x150
      // backing store and render blank even after the tab is shown.
      //
      // A timer rather than requestAnimationFrame: frame callbacks are tied to
      // the rendering loop and never run in a tab that is not compositing,
      // which is exactly the case being recovered from here.
      clearTimeout(retryRef.current);
      retryRef.current = setTimeout(resize, RESIZE_RETRY_MS);
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);

    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    contextRef.current = context;
    sizeRef.current = { width: rect.width, height: rect.height };

    repaint(context, segmentsRef.current, sizeRef.current);
  }, []);

  useEffect(() => {
    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    if (canvasRef.current) observer.observe(canvasRef.current);
    // devicePixelRatio can change when a window moves between displays.
    window.addEventListener("resize", resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(retryRef.current);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const onRemoteDraw = (segment) => commitSegment(segment);

    const onBoardState = (payload) => {
      const segments = Array.isArray(payload?.segments) ? payload.segments : [];
      segmentsRef.current = segments;
      setHasContent(segments.length > 0);
      if (contextRef.current) {
        repaint(contextRef.current, segments, sizeRef.current);
      }
    };

    const onClear = () => {
      segmentsRef.current = [];
      setHasContent(false);
      if (contextRef.current) {
        repaint(contextRef.current, [], sizeRef.current);
      }
    };

    socket.on(EVENTS.DRAW, onRemoteDraw);
    socket.on(EVENTS.BOARD_STATE, onBoardState);
    socket.on(EVENTS.CLEAR, onClear);

    return () => {
      socket.off(EVENTS.DRAW, onRemoteDraw);
      socket.off(EVENTS.BOARD_STATE, onBoardState);
      socket.off(EVENTS.CLEAR, onClear);
    };
  }, [commitSegment]);

  const pointFrom = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return toBoardPoint(event, canvas.getBoundingClientRect());
  }, []);

  const startStroke = useCallback(
    (event) => {
      // Ignore right/middle click, which otherwise starts an invisible stroke.
      if (event.button != null && event.button !== 0) return;

      const canvas = canvasRef.current;
      // Pointer capture keeps the stroke alive when the pointer leaves the
      // canvas, and guarantees we still receive the matching pointerup. The old
      // mouse-only version left the board stuck in drawing mode instead.
      if (canvas?.setPointerCapture && event.pointerId != null) {
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // Capture is a nicety; drawing still works without it.
        }
      }

      lastPointRef.current = pointFrom(event);
    },
    [pointFrom],
  );

  const extendStroke = useCallback(
    (event) => {
      if (!lastPointRef.current) return;

      const { color, width, erasing } = toolRef.current;
      const style = { color: erasing ? BOARD_BACKGROUND : color, width };

      // Coalesced events recover the positions the browser batched between
      // frames, which keeps fast strokes smooth instead of visibly angular.
      const moves =
        typeof event.getCoalescedEvents === "function"
          ? event.getCoalescedEvents()
          : [];
      const points = (moves.length > 0 ? moves : [event]).map(pointFrom);

      for (const point of points) {
        const segment = createSegment(lastPointRef.current, point, style);
        commitSegment(segment);
        socket.emit(EVENTS.DRAW, segment);
        lastPointRef.current = point;
      }
    },
    [commitSegment, pointFrom],
  );

  const endStroke = useCallback((event) => {
    const canvas = canvasRef.current;
    if (canvas?.releasePointerCapture && event?.pointerId != null) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Already released — nothing to do.
      }
    }
    lastPointRef.current = null;
  }, []);

  const clearBoard = useCallback(() => {
    socket.emit(EVENTS.CLEAR);
    // Clear locally too, so the board responds even while offline.
    segmentsRef.current = [];
    setHasContent(false);
    if (contextRef.current) {
      repaint(contextRef.current, [], sizeRef.current);
    }
  }, []);

  /** Save the current board as a PNG. */
  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `synccanvas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return {
    canvasRef,
    hasContent,
    handlers: {
      onPointerDown: startStroke,
      onPointerMove: extendStroke,
      onPointerUp: endStroke,
      onPointerCancel: endStroke,
    },
    clearBoard,
    exportPng,
  };
}
