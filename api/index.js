import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  path: '/socket.io/'
});

app.use(cors());
app.use(express.json());

// 房间数据存储
const rooms = new Map();

// Socket.io 处理逻辑
io.on('connection', (socket) => {
  socket.on('join-room', (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { id: roomId, users: new Map(), gameState: null });
    }
    const room = rooms.get(roomId);
    room.users.set(socket.id, { socketId: socket.id, userId });
    io.to(roomId).emit('user-joined', { userId, roomUsers: Array.from(room.users.values()) });
  });
});

// 核心路由：处理所有非 API 请求
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// 关键修复：让 Express 处理根路径和所有静态请求
app.get('*', (req, res) => {
  // 在 Vercel 环境中，index.html 通常在根目录
  const indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // 备用方案：尝试相对路径
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

export default app;
