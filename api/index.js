import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'] 
});

// 中间件
app.use(cors());
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// 房间数据存储 (在 Vercel Serverless 下由于内存不稳定，仅能维持极短时间同步)
const rooms = new Map();

// Socket.io 事件处理
io.on('connection', (socket) => {
  socket.on('join-room', (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { id: roomId, users: new Map(), gameState: null, createdAt: Date.now() });
    }
    const room = rooms.get(roomId);
    room.users.set(socket.id, { socketId: socket.id, userId: userId, joinedAt: Date.now() });
    socket.emit('room-joined', { roomId: roomId, users: Array.from(room.users.values()) });
    io.to(roomId).emit('user-joined', { userId: userId, socketId: socket.id, roomUsers: Array.from(room.users.values()) });
  });

  socket.on('update-state', (data) => {
    const { roomId, state } = data;
    if (rooms.has(roomId)) {
      rooms.get(roomId).gameState = state;
      io.to(roomId).emit('state-updated', { state: state, timestamp: Date.now() });
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        const userId = room.users.get(socket.id).userId;
        room.users.delete(socket.id);
        if (room.users.size === 0) rooms.delete(roomId);
        else io.to(roomId).emit('user-left', { userId, socketId: socket.id, roomUsers: Array.from(room.users.values()) });
      }
    }
  });
});

// 路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

export default app;
