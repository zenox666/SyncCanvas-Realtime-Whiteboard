import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://sync-canvas-backend.onrender.com");

function App() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 3;

    setCtx(context);

    socket.on("draw_line", (data) => {
      const { x, y, prevX, prevY } = data;
      drawLine(context, x, y, prevX, prevY, false);
    });

    socket.on("clear_board", () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw_line");
      socket.off("clear_board");
    };
  }, []);

  const drawLine = (context, x, y, prevX, prevY, emit) => {
    context.beginPath();
    context.moveTo(prevX, prevY);
    context.lineTo(x, y);
    context.stroke();
    context.closePath();

    if (!emit) return;

    socket.emit("draw_line", { x, y, prevX, prevY });
  };

  const prevPos = useRef({ x: 0, y: 0 });

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    prevPos.current = { x: offsetX, y: offsetY };
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;
    drawLine(ctx, offsetX, offsetY, prevPos.current.x, prevPos.current.y, true);
    prevPos.current = { x: offsetX, y: offsetY };
  };

  const clearBoard = () => {
    socket.emit("clear_board");
  };

  return (
      <div className="App">
        <h1>SyncCanvas 🎨</h1>
        <p>Draw simultaneously with anyone on this link!</p>
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            width={800}
            height={500}
        />
        <div className="controls">
          <button onClick={clearBoard}>Clear Board</button>
        </div>
      </div>
  );
}

export default App;
