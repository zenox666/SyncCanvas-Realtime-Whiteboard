/**
 * Test double for the shared socket.
 *
 * Enabled with `jest.mock("./lib/socket")`. It records outgoing emits and lets a
 * test push server events into the app, so socket wiring can be covered without
 * a live backend.
 */
const listeners = new Map();

export const SERVER_URL = "http://localhost:3001";

export const socket = {
  connected: false,

  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return socket;
  },

  off(event, handler) {
    listeners.get(event)?.delete(handler);
    return socket;
  },

  emit: jest.fn(),
  connect: jest.fn(() => {
    socket.connected = true;
  }),

  io: {
    on() {},
    off() {},
  },
};

/** Deliver an event to the app as though the server had sent it. */
export function emitFromServer(event, payload) {
  for (const handler of listeners.get(event) ?? []) {
    handler(payload);
  }
}

/** Reset between tests so state does not leak across cases. */
export function resetSocket() {
  listeners.clear();
  socket.connected = false;
  socket.emit.mockClear();
  socket.connect.mockClear();
}
