/**
 * Stroke validation and board state.
 *
 * The server rebroadcasts whatever clients emit, so every payload is treated as
 * untrusted input and validated here before it reaches another user's canvas.
 *
 * Coordinates are normalised to the 0..1 range (fractions of the board's width
 * and height) rather than pixels. That lets a phone and a desktop share the same
 * board without their drawings drifting apart.
 */

/** Upper bound on retained segments, so a long session cannot exhaust memory. */
export const MAX_SEGMENTS = 5000;

/** Brush width is expressed against this reference board width, in pixels. */
export const MIN_BRUSH = 1;
export const MAX_BRUSH = 64;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isFraction = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

/**
 * Validate and normalise one line segment.
 *
 * @param {unknown} input Raw payload from a client.
 * @returns {{x0:number,y0:number,x1:number,y1:number,color:string,width:number}|null}
 *   A sanitised segment, or `null` if the payload is unusable.
 */
export function sanitizeSegment(input) {
  if (input === null || typeof input !== "object") return null;

  const { x0, y0, x1, y1, color, width } = input;

  if (![x0, y0, x1, y1].every(isFraction)) return null;
  if (typeof color !== "string" || !HEX_COLOR.test(color)) return null;
  if (typeof width !== "number" || !Number.isFinite(width)) return null;
  if (width < MIN_BRUSH || width > MAX_BRUSH) return null;

  return { x0, y0, x1, y1, color: color.toLowerCase(), width };
}

/**
 * In-memory history of everything drawn on the board.
 *
 * Without this a user joining an in-progress session sees an empty canvas, which
 * defeats the point of a shared board. History is deliberately not persisted —
 * the board is ephemeral and resets when the server restarts.
 */
export function createBoard({ maxSegments = MAX_SEGMENTS } = {}) {
  /** @type {Array<object>} */
  let segments = [];

  return {
    /**
     * Append a segment, dropping the oldest once the cap is reached.
     * @returns {boolean} `true` if the segment was accepted.
     */
    add(segment) {
      if (!segment) return false;
      segments.push(segment);
      if (segments.length > maxSegments) {
        segments = segments.slice(segments.length - maxSegments);
      }
      return true;
    },

    clear() {
      segments = [];
    },

    /** @returns {Array<object>} A copy, so callers cannot mutate history. */
    snapshot() {
      return segments.slice();
    },

    get size() {
      return segments.length;
    },
  };
}
