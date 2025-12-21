import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("draw_line", (data) => {
        socket.broadcast.emit("draw_line", data);
    });

    socket.on("clear_board", () => {
        io.emit("clear_board");
    });
});

httpServer.listen(3001, () => {
    console.log("SERVER RUNNING ON PORT 3001");
});