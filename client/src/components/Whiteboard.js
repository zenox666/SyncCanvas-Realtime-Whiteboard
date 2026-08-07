import React from "react";

/**
 * The drawing surface.
 *
 * Sizing lives entirely in CSS; the hook syncs the canvas backing store to
 * whatever size the layout settles on, so the board is responsive without any
 * fixed width in JavaScript.
 *
 * @param {object} props
 * @param {React.RefObject<HTMLCanvasElement>} props.canvasRef
 * @param {object} props.handlers Pointer handlers from `useWhiteboard`.
 * @param {boolean} props.erasing Whether the eraser cursor should be shown.
 * @param {boolean} props.empty Whether to show the "start drawing" hint.
 */
function Whiteboard({ canvasRef, handlers, erasing, empty }) {
  return (
    <div className="board">
      <canvas
        ref={canvasRef}
        className={`board__canvas${erasing ? " board__canvas--erasing" : ""}`}
        aria-label="Shared drawing board"
        role="img"
        {...handlers}
      />
      {empty && (
        <p className="board__hint" aria-hidden="true">
          Start drawing — everyone on this link sees it instantly.
        </p>
      )}
    </div>
  );
}

export default Whiteboard;
