// असली Node.js और Socket.io बैकएंड सर्वर कोड
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// फ्रंटएंड फाइलों को सर्व करने के लिए
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let waitingUser = null;

io.on("connection", (socket) => {
    console.log("एक नया यूज़र सर्वर से जुड़ा: " + socket.id);

    // जब कोई यूज़र Next बटन दबाएगा
    socket.on("find-stranger", () => {
        if (waitingUser && waitingUser.id !== socket.id) {
            // अगर पहले से कोई इंतज़ार कर रहा है, तो दोनों को जोड़ दो
            const stranger = waitingUser;
            waitingUser = null;

            // दोनों यूज़र्स को एक सीक्रेट रूम में डालो
            const roomId = socket.id + "#" + stranger.id;
            socket.join(roomId);
            stranger.join(roomId);

            // दोनों को सिग्नल भेजो कि अजनबी मिल गया है
            io.to(roomId).emit("chat-started", roomId);
            console.log("जोड़ी बन गई! रूम आईडी: " + roomId);
        } else {
            // अगर कोई नहीं है, तो इसे वेटिंग लिस्ट में डालो
            waitingUser = socket;
            socket.emit("waiting-status", "अजनबियों की तलाश जारी है...");
        }
    });

    // जब कोई मैसेज भेजेगा
    socket.on("send-msg", (data) => {
        // रूम के दूसरे बंदे को मैसेज ट्रांसफर करो
        socket.to(data.room).emit("receive-msg", data.text);
    });

    // जब कोई डिसकनेक्ट होगा
    socket.on("disconnect", () => {
        console.log("यूज़र चला गया: " + socket.id);
        if (waitingUser && waitingUser.id === socket.id) {
            waitingUser = null;
        }
    });
});

// सर्वर को पोर्ट 3000 पर चालू करो
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`असली बैकएंड सर्वर चालू है पोर्ट: ${PORT}`);
});
