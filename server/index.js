/**
 * SyncCanvas realtime server.
 *
 * Relays drawing events between everyone connected to the board and keeps a
 * capped in-memory history so that late joiners receive the current state.
 */
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { createBoard, sanitizeSegment } from "./lib/strokes.js";
import { EVENTS } from "./lib/events.js";
import { parseCorsOrigin } from "./lib/config.js";

const PORT = Number(process.env.PORT) || 3001;

/**
 * Comma-separated allow-list, e.g. "http://localhost:3000,https://myapp.app".
 * Defaults to "*" so the project runs with zero configuration; set
 * CORS_ORIGIN in production to lock the socket down to your own frontend.
 */
const CORS_ORIGIN = parseCorsOrigin(process.env.CORS_ORIGIN);

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

const board = createBoard();

/**
 * How many people are on the board.
 *
 * Counts sockets in the namespace rather than `io.engine.clientsCount`: the
 * engine only decrements once the underlying transport finishes closing, which
 * lands well after the `disconnect` event and would report a departed user as
 * still present.
 */
const connectedUsers = () => io.of("/").sockets.size;

/** Health probe for uptime monitors and platform health checks. */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    connections: connectedUsers(),
    segments: board.size,
  });
});

const broadcastPresence = () => {
  io.emit(EVENTS.PRESENCE, { users: connectedUsers() });
};

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Hand the newcomer the board as it stands, then tell everyone the count changed.
  socket.emit(EVENTS.BOARD_STATE, { segments: board.snapshot() });
  broadcastPresence();

  socket.on(EVENTS.DRAW, (payload) => {
    const segment = sanitizeSegment(payload);
    if (!segment) {
      console.warn(`[socket] rejected malformed segment from ${socket.id}`);
      return;
    }

    board.add(segment);
    socket.broadcast.emit(EVENTS.DRAW, segment);
  });

  socket.on(EVENTS.CLEAR, () => {
    board.clear();
    io.emit(EVENTS.CLEAR);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    broadcastPresence();
  });

  socket.on("error", (error) => {
    console.error(`[socket] error on ${socket.id}:`, error.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`SyncCanvas server listening on http://localhost:${PORT}`);
});

httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT to a free port.`);
    process.exit(1);
  }
  throw error;
});

// Close sockets before exiting so platform restarts don't drop connections abruptly.
const shutdown = (signal) => () => {
  console.log(`\n${signal} received, shutting down.`);
  io.close(() => httpServer.close(() => process.exit(0)));
};

process.on("SIGINT", shutdown("SIGINT"));
process.on("SIGTERM", shutdown("SIGTERM"));
