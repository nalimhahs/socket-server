const app = require('fastify')();
const { join } = require('path');
const { readFile } = require('fs').promises;

app.register(require('fastify-socket.io'), {
  pingTimeout: 100,
  pingInterval: 50
});

app.get('/', async (req, reply) => {
  const data = await readFile(join(__dirname, 'index.html'));
  reply.header('content-type', 'text/html; charset=utf-8');
  reply.send(data);
});

var peers = [];
var totalCount = 0;

app.ready(err => {
  if (err) throw err;
  console.log('Server Runnning');
  app.io.on('connect', socket => {
    socket.x = Math.random();
    socket.y = Math.random();
    console.log('Socket connected!', socket.id);
    socket.emit('fetchpeers', peers);
    peers.push({
      id: socket.id,
      x: socket.x,
      y: socket.y
    });

    ++totalCount;
    socket.emit('updateCount', totalCount);
    setInterval(() => {
      socket.emit('updateCount', totalCount);
    }, 1000);

    socket.broadcast.emit('peerconnect', socket.id);

    socket.on('mousemove', (x, y) => {
      socket.x = x;
      socket.y = y;
      socket.volatile.broadcast.emit('peermove', socket.id, socket.x, socket.y);
    });

    socket.on('disconnect', () => {
      peers = peers.filter(function(peer) {
        return peer.id !== socket.id;
      });
      console.log('Socket Disconnected!', socket.id);
      socket.broadcast.emit('peerdisconnect', socket.id);
      socket.emit('updateCount', --totalCount);
    });
  });
});

app.listen(3000);
