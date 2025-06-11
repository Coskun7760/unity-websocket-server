const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

// Render için DÜZELTİLDİ: Ortam değişkeninden portu al
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
});

app.get("/", (req, res) => res.send('Signal Server Running!'));

const webSocket = require("ws");
const wss = new webSocket.Server({ server });

// WebSocket sunucusu başladığında logla
wss.on("listening", () => {
    console.log(`WebSocket server listening on port ${PORT} (WSS)`);
});

wss.on("connection", function (socket) {
    // Some feedback on the console
    console.log("A client just connected");
    
    // Logları takip etmek için bir ID atayalım (Glitch kodunda olmayabilir)
    socket.id = Math.random().toString(36).substring(2, 15);
    console.log(`Client ${socket.id} connected.`);
    
    socket.on("message", function (msg) {
        const msgStr = msg.toString();
        const parts = msgStr.split('|');
        const peerId = parts.length > 1 ? parts[1] : 'Unknown-PeerId'; // Hata önleme
        console.log("Received message from " + peerId  + " client: " + msg);
        
        // Broadcast that message to all connected clients except sender
        wss.clients.forEach(function (client) {
            // Sadece bağlantısı açık olanlara gönder
            if (client !== socket && client.readyState === webSocket.OPEN) {
                client.send(msg);
            }
        });
    });

    socket.on("close", function () {
        console.log(`Client ${socket.id} disconnected`); // ID'yi loga ekle
    });

    // Hata yakalama ekle (Glitch kodunda olmayabilir)
    socket.on("error", function (error) {
        console.error(`WebSocket error for client ${socket.id}:`, error);
    });
});