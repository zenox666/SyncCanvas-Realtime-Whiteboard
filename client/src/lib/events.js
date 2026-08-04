/**
 * Socket event names shared by the client and server.
 *
 * Keeping them in one place stops the two halves of the app drifting apart over
 * a typo. This file mirrors `server/lib/events.js` — change both together.
 */
export const EVENTS = Object.freeze({
  /** Client -> server -> peers: one drawn line segment. */
  DRAW: "draw_segment",
  /** Either direction: wipe the board for everyone. */
  CLEAR: "clear_board",
  /** Server -> client: full board history, sent on connect. */
  BOARD_STATE: "board_state",
  /** Server -> clients: number of connected users. */
  PRESENCE: "presence",
});
