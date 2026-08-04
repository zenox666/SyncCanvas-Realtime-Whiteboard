import { io } from "socket.io-client";

/**
 * Backend URL.
 *
 * Configured through `REACT_APP_SERVER_URL` so the same source can point at a
 * local server during development and the deployed one in production. The
 * previous hardcoded production URL meant `npm start` never reached the local
 * server you were actually editing.
 */
export const SERVER_URL =
  process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

/**
 * Single shared connection for the app.
 *
 * `autoConnect` is off so importing this module has no side effects — tests can
 * import components without opening a real socket, and the connection is opened
 * deliberately when the board mounts.
 */
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});
