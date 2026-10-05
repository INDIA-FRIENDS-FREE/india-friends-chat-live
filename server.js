 const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

let waitingUser = null;

io.on("connection", (socket) => {
    console.log("User connected: " + socket.id);

    socket.on("find-stranger", () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomName = "room-" + waitingUser.id + "-" + socket.id;
            
            waitingUser.join(roomName);
            socket.join(roomName);

            io.to(roomName).emit("chat-start", { room: roomName });
            waitingUser = null;
        } else {
            waitingUser = socket;
            socket.emit("waiting-status", "searching");
        }
    });

    socket.on("send-msg", (data) => {
        socket.to(data.room).emit("receive-msg", data.text);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
