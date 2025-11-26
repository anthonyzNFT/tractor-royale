import Fastify from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';

const fastify = Fastify({ logger: true });
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

interface Room {
  id: string;
  peers: Map<string, WebSocket>;
  hostId: string;
  createdAt: number;
}

const rooms = new Map<string, Room>();

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, request: any) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomId = url.searchParams.get('room');
  const playerId = url.searchParams.get('player');

  if (!roomId || !playerId) {
    ws.close(1008, 'Missing room or player ID');
    return;
  }

  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      peers: new Map(),
      hostId: playerId,
      createdAt: Date.now(),
    };
    rooms.set(roomId, room);
    console.log(`Created room: ${roomId}`);
  }

  room.peers.set(playerId, ws);
  console.log(`Player ${playerId} joined room ${roomId}`);

  const peerList = Array.from(room.peers.keys()).filter(id => id !== playerId);
  ws.send(JSON.stringify({
    type: 'peer-list',
    peers: peerList,
  }));

  for (const [peerId, peerWs] of room.peers) {
    if (peerId !== playerId && peerWs.readyState === WebSocket.OPEN) {
      peerWs.send(JSON.stringify({
        type: 'player-joined',
        playerId,
      }));
    }
  }

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'signal' && message.to) {
        const targetWs = room!.peers.get(message.to);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            type: 'signal',
            from: playerId,
            signal: message.signal,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    room!.peers.delete(playerId);
    console.log(`Player ${playerId} left room ${roomId}`);

    for (const [peerId, peerWs] of room!.peers) {
      if (peerWs.readyState === WebSocket.OPEN) {
        peerWs.send(JSON.stringify({
          type: 'player-left',
          playerId,
        }));
      }
    }

    if (room!.peers.size === 0) {
      rooms.delete(roomId);
      console.log(`Deleted empty room: ${roomId}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for player ${playerId}:`, error);
  });
});

fastify.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

fastify.get('/health', async () => {
  return {
    status: 'ok',
    rooms: rooms.size,
    totalPlayers: Array.from(rooms.values()).reduce((sum, room) => sum + room.peers.size, 0),
  };
});

setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000;
  
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > maxAge && room.peers.size === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up old room: ${roomId}`);
    }
  }
}, 5 * 60 * 1000);

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Signaling server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
