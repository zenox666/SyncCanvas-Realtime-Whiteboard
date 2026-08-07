import React from "react";

const LABELS = {
  connected: "Live",
  connecting: "Connecting…",
  disconnected: "Offline",
};

/**
 * Connection state and how many people share the board.
 *
 * @param {object} props
 * @param {"connected"|"connecting"|"disconnected"} props.status
 * @param {number} props.users Connected user count, including this one.
 * @param {string|null} props.error Last connection error, if any.
 */
function StatusBar({ status, users, error }) {
  const connected = status === "connected";

  return (
    <div className="status" role="status" aria-live="polite">
      <span className={`status__dot status__dot--${status}`} aria-hidden="true" />
      <span className="status__label">{LABELS[status] ?? status}</span>

      {connected && (
        <span className="status__meta">
          {users} {users === 1 ? "person" : "people"} drawing
        </span>
      )}

      {!connected && error && (
        <span className="status__meta status__meta--error" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}

export default StatusBar;
