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
  console.log('Client connected');

  // Bağlanan her istemciye benzersiz bir kimlik (ID) ata
  ws.id = Math.random().toString(36).substring(2, 15);
  console.log(`Client ${ws.id} connected`);

  // İstemciden mesaj alındığında
  ws.on('message', message => {
    const messageString = message.toString();
    console.log(`Received message from ${ws.id}: ${messageString}`);

    // Gelen mesajı JSON olarak ayrıştırmaya çalış
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(messageString);
    } catch (e) {
      console.error(`Error parsing message from ${ws.id}: ${messageString}, Error: ${e}`);
      return; // JSON değilse işlemi durdur
    }

    // Mesajın bir "type" alanı ve bir "payload" alanı olduğunu varsayıyoruz
    // WebRTC sinyalleşme mesajları genellikle bu formatta olur:
    // { "type": "offer", "payload": { /* SDP data */ } }
    // { "type": "answer", "payload": { /* SDP data */ } }
    // { "type": "candidate", "payload": { /* ICE candidate data */ } }
    // { "type": "joinRoom", "payload": { "room": "someRoomID" } }

    if (parsedMessage.type === 'joinRoom') {
      ws.room = parsedMessage.payload.room;
      console.log(`Client ${ws.id} joined room: ${ws.room}`);
      // Oda bilgisi alındığında, aynı odadaki diğer kişilere bilgi verilebilir
      // veya oturum başlatılabilir.
    } else if (ws.room) { // Sadece bir odada olan istemciler arasında yönlendir
      // Aynı odadaki diğer tüm istemcilere mesajı yönlendir
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN && client.room === ws.room) {
          console.log(`Relaying message from ${ws.id} to ${client.id} in room ${ws.room}: ${messageString}`);
          client.send(messageString);
        }
      });
    } else {
      console.log(`Client ${ws.id} sent message before joining room: ${messageString}`);
      // Oda ID'si olmayan mesajları işleme (veya hata döndürme)
      ws.send(JSON.stringify({ type: 'error', payload: 'Please join a room first.' }));
    }
  });

  // Bağlantı kapandığında
  ws.on('close', () => {
    console.log(`Client ${ws.id} disconnected from room ${ws.room || 'N/A'}`);
  });

  // Hata oluştuğunda
  ws.on('error', error => {
    console.error(`WebSocket error for client ${ws.id}:`, error);
  });
});

// Statik dosyalar için Express'i kullan (Glitch'teki örnekler için gerekli olabilir)
// Kendi projenizde bu kısım zorunlu olmayabilir, ancak WebRTC sinyalleşme
// sunucusu bazen test için statik bir index.html dosyası sunabilir.
app.use(express.static('public'));

// HTTP sunucusunu dinlemeye başla
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});