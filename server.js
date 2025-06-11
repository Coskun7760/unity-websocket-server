const WebSocket = require('ws');

// Render, uygulamalara dinamik bir port atar.
// process.env.PORT ortam değişkeninden veya varsayılan olarak 8080 portunu kullan.
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: port });

wss.on('listening', () => {
  console.log(`WebSocket server listening on port ${port}`);
});

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    // Gelen mesajı string'e çevir
    const messageString = message.toString(); 
    console.log(`Received message: ${messageString}`);

    // Gelen mesajı tüm bağlı istemcilere geri gönder (echo)
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(`Echo from server: ${messageString}`);
      }
    });

    // Sadece mesajı gönderen istemciye özel bir cevap
    ws.send(`You sent: ${messageString}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

console.log('WebSocket server is starting...');