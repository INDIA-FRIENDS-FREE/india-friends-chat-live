 const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// HTML फाइलों को सर्व करने के लिए
app.use(express.static(path.join(__dirname)));

let waitingUser = null;

io.on("connection", (socket) => {
    console.log("यूज़र जुड़ गया: " + socket.id);

    socket.on("find-stranger", () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            // अगर कोई पहले से इंतज़ार कर रहा है, तो दोनों को रूम में जोड़ो
            const roomName = `room-${waitingUser.id}-${socket.id}`;
            
            waitingUser.join(roomName);
            socket.join(roomName);

            io.to(roomName).emit("chat-start", { room: roomName });
            waitingUser = null;
        } else {
            // अगर कोई नहीं है, तो इसे वेटिंग में डालो
            waitingUser = socket;
            socket.emit("waiting-status", "अजनबियों की तलाश जारी है...");
        }
    });

    // जब कोई मैसेज भेजेगा
    socket.on("send-msg", (data) => {
        socket.to(data.room).emit("receive-msg", data.text);
    });

    // जब कोई डिस्कनेक्ट होगा
    socket.on("disconnect", () => {
        console.log("यूज़र चला गया: " + socket.id);
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
    });
});

// Render के लिए पोर्ट सेटिंग (लाइन 64 जो ब्लॉक कर रही थी, उसे फिक्स कर दिया है)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`असली बैकएंड सर्वर चालू है पोर्ट: ${PORT}`);
});
