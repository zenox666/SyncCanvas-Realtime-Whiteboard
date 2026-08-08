import React, { useCallback, useState } from "react";

import StatusBar from "./components/StatusBar";
import Toolbar from "./components/Toolbar";
import Whiteboard from "./components/Whiteboard";
import { useConnection } from "./hooks/useConnection";
import { useWhiteboard } from "./hooks/useWhiteboard";
import { PALETTE } from "./lib/board";
import "./App.css";

const DEFAULT_COLOR = PALETTE[0].value;
const DEFAULT_WIDTH = 4;

/**
 * Application shell: owns the active tool and wires the board to the socket.
 */
function App() {
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [erasing, setErasing] = useState(false);

  const { status, users, error } = useConnection();
  const { canvasRef, handlers, hasContent, clearBoard, exportPng } =
    useWhiteboard({ color, width, erasing });

  // Clearing wipes the board for everyone, so make it deliberate.
  const confirmClear = useCallback(() => {
    const confirmed = window.confirm(
      "Clear the board for everyone currently connected?",
    );
    if (confirmed) clearBoard();
  }, [clearBoard]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__titles">
          <h1 className="app__title">
            <span aria-hidden="true">🎨</span> SyncCanvas
          </h1>
          <p className="app__subtitle">
            A shared whiteboard. Draw simultaneously with anyone on this link.
          </p>
        </div>
        <StatusBar status={status} users={users} error={error} />
      </header>

      <main className="app__main">
        <Toolbar
          color={color}
          onColorChange={setColor}
          width={width}
          onWidthChange={setWidth}
          erasing={erasing}
          onErasingChange={setErasing}
          onClear={confirmClear}
          onExport={exportPng}
          hasContent={hasContent}
        />

        <Whiteboard
          canvasRef={canvasRef}
          handlers={handlers}
          erasing={erasing}
          empty={!hasContent}
        />
      </main>
    </div>
  );
}

export default App;
