/**
 * Pure helpers for translating between pointer positions, the normalised
 * coordinates sent over the wire, and the pixels drawn on a canvas.
 *
 * These are deliberately free of React and DOM globals so they can be unit
 * tested directly.
 */

/** Board background. The eraser paints with this colour so replays stay exact. */
export const BOARD_BACKGROUND = "#ffffff";

/** Brush widths are authored against this width and scale with the board. */
export const REFERENCE_WIDTH = 1000;

export const MIN_BRUSH = 1;
export const MAX_BRUSH = 64;

export const PALETTE = [
  { name: "Ink", value: "#1b1f24" },
  { name: "Red", value: "#e5484d" },
  { name: "Amber", value: "#f5a524" },
  { name: "Green", value: "#30a46c" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Violet", value: "#8b5cf6" },
];

/** Restrict `value` to the inclusive `min`..`max` range. */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Convert a pointer position into board coordinates in the 0..1 range.
 *
 * Normalising means a segment drawn on a 375px phone lands in the same relative
 * place on a 1440px desktop, which raw `offsetX`/`offsetY` pixels cannot do.
 *
 * @param {{clientX:number, clientY:number}} point Pointer event position.
 * @param {{left:number, top:number, width:number, height:number}} rect
 *   The canvas' bounding rectangle in CSS pixels.
 */
export function toBoardPoint(point, rect) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };

  return {
    x: clamp((point.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((point.clientY - rect.top) / rect.height, 0, 1),
  };
}

/**
 * Build the wire payload for a stroke between two board points.
 *
 * @returns {{x0:number,y0:number,x1:number,y1:number,color:string,width:number}}
 */
export function createSegment(from, to, { color, width }) {
  return {
    x0: from.x,
    y0: from.y,
    x1: to.x,
    y1: to.y,
    color,
    width: clamp(width, MIN_BRUSH, MAX_BRUSH),
  };
}

/**
 * Scale an authored brush width to the current board size, so a stroke keeps its
 * relative thickness on any screen.
 */
export function scaleBrush(width, boardWidth) {
  const scaled = (width * boardWidth) / REFERENCE_WIDTH;
  return Math.max(scaled, 0.5);
}

/**
 * Paint one segment onto a 2D context.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {object} segment Normalised segment.
 * @param {{width:number, height:number}} size Board size in CSS pixels.
 */
export function paintSegment(context, segment, size) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = segment.color;
  context.lineWidth = scaleBrush(segment.width, size.width);
  context.beginPath();
  context.moveTo(segment.x0 * size.width, segment.y0 * size.height);
  context.lineTo(segment.x1 * size.width, segment.y1 * size.height);
  context.stroke();
  context.restore();
}

/**
 * Repaint the whole board from history. Used after a resize, which clears the
 * canvas backing store, and when the server sends existing state on join.
 */
export function repaint(context, segments, size) {
  context.clearRect(0, 0, size.width, size.height);
  context.fillStyle = BOARD_BACKGROUND;
  context.fillRect(0, 0, size.width, size.height);

  for (const segment of segments) {
    paintSegment(context, segment, size);
  }
}
