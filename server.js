// Node.js ve Express.js modüllerini içeri aktar
const express = require('express');
const http = require('http');
const WebSocket = require('ws'); // ws kütüphanesini kullanıyoruz

// Express uygulamasını oluştur
const app = express();

// Render'ın atadığı portu veya varsayılan olarak 8080'i kullan
const PORT = process.env.PORT || 8080;

// HTTP sunucusu oluştur ve Express uygulamasını bağla
const server = http.createServer(app);

// WebSocket sunucusunu HTTP sunucusu üzerinde başlat
const wss = new WebSocket.Server({ server });

// WebSocket sunucusu başlatıldığında
wss.on('listening', () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});

// WebSocket bağlantısı kurulduğunda
wss.on('connection', ws => {
  console.log('A client just connected'); // Genel bağlantı mesajı

  // İstemciden mesaj alındığında
  ws.on('message', message => {
    const msgStr = message.toString();
    // NEWPEER mesajlarından PeerId'yi çekmeye çalış
    const parts = msgStr.split('|');
    const peerId = parts.length > 1 ? parts[1] : 'Unknown-PeerId'; // PeerId'yi çek
    
    console.log(`Received message from ${peerId} client: ${msgStr}`);

    // Gelen mesajı, gönderen hariç tüm diğer bağlı istemcilere yayınla (broadcast)
    // Unity'nin kullandığı bu basit sinyalleşme, bir istemcinin mesajını
    // genellikle odasındaki diğer tek bir istemciye iletmek yerine
    // tüm diğer istemcilere gönderir ve istemci tarafta filtrelenir.
    wss.clients.forEach(function (client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // console.log(`Relaying message to client ${client.id || 'N/A'}: ${msgStr}`); // Hata ayıklama için
        client.send(msgStr);
      }
    });
  });

  // Bağlantı kapandığında
  ws.on('close', () => {
    console.log("Client disconnected");
  });

  // Hata oluştuğunda
  ws.on('error', error => {
    console.error("WebSocket error:", error);
  });
});

// HTTP sunucusunu dinlemeye başla
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});