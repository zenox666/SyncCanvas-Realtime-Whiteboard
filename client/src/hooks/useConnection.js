import { useEffect, useState } from "react";

import { socket } from "../lib/socket";
import { EVENTS } from "../lib/events";

/** @typedef {"connecting"|"connected"|"disconnected"} ConnectionStatus */

/**
 * Opens the shared socket and tracks connection health plus how many people are
 * on the board.
 *
 * Surfacing this matters for a realtime app: without it, a backend that is down
 * looks identical to a board nobody else is drawing on.
 *
 * @returns {{status: ConnectionStatus, users: number, error: string|null}}
 */
export function useConnection() {
  const [status, setStatus] = useState(
    socket.connected ? "connected" : "connecting",
  );
  const [users, setUsers] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onConnect = () => {
      setStatus("connected");
      setError(null);
    };

    const onDisconnect = () => {
      setStatus("disconnected");
      setUsers(0);
    };

    const onConnectError = (err) => {
      setStatus("disconnected");
      setError(err?.message || "Unable to reach the server");
    };

    const onReconnectAttempt = () => setStatus("connecting");

    const onPresence = (payload) => {
      setUsers(Number(payload?.users) || 0);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on(EVENTS.PRESENCE, onPresence);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off(EVENTS.PRESENCE, onPresence);
    };
  }, []);

  return { status, users, error };
}
