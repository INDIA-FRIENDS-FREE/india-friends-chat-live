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
    console.log("यूज़र जुड़ गया: " + socket.id);

    socket.on("find-stranger", () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            const roomName = `room-${waitingUser.id}-${socket.id}`;
            waitingUser.join(roomName);
            socket.join(roomName);
            io.to(roomName).emit("chat-start", { room: roomName });
            waitingUser = null;
        } else {
            waitingUser = socket;
            socket.emit("waiting-status", "अजनबियों की तलाश जारी है...");
        }
    });

    // स्मार्ट मैसेज ट्रांसफर (यह फोटो, टेक्स्ट, व्यू-वन्स सब एक साथ भेजेगा)
    socket.on("send-msg", (data) => {
        socket.to(data.room).emit("receive-msg", data);
    });

    // डिलीट मैसेज का नया लॉजिक 🗑️
    socket.on("delete-msg", (data) => {
        socket.to(data.room).emit("msg-deleted", { msgId: data.msgId });
    });

    socket.on("disconnect", () => {
        console.log("यूज़र चला गया: " + socket.id);
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`सर्वर चालू है पोर्ट: ${PORT}`);
});
