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
  }
});

// 中间件
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// 房间数据存储 (内存存储，适合单机或小规模部署)
const rooms = new Map();

// Socket.io 事件处理
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id} 已连接`);

  // 用户加入房间
  socket.on('join-room', (data) => {
    const { roomId, userId } = data;
    
    socket.join(roomId);
    
    // 获取或创建房间
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        gameState: null,
        createdAt: Date.now()
      });
    }

    const room = rooms.get(roomId);
    room.users.set(socket.id, {
      socketId: socket.id,
      userId: userId,
      joinedAt: Date.now()
    });

    console.log(`[房间] 用户 ${userId} (${socket.id}) 加入房间 ${roomId}`);

    // 告诉加入者房间的当前状态
    if (room.gameState) {
      socket.emit('sync-state', {
        state: room.gameState,
        roomUsers: Array.from(room.users.values())
      });
    } else {
      socket.emit('room-joined', {
        roomId: roomId,
        users: Array.from(room.users.values())
      });
    }

    // 广播用户加入事件（给房间内所有人）
    io.to(roomId).emit('user-joined', {
      userId: userId,
      socketId: socket.id,
      roomUsers: Array.from(room.users.values())
    });
  });

  // 同步游戏状态
  socket.on('update-state', (data) => {
    const { roomId, state } = data;
    
    if (!rooms.has(roomId)) {
      console.warn(`[警告] 房间 ${roomId} 不存在`);
      return;
    }

    const room = rooms.get(roomId);
    room.gameState = state;

    // 广播状态更新给房间内所有人（包括发送者）
    io.to(roomId).emit('state-updated', {
      state: state,
      timestamp: Date.now()
    });

    console.log(`[同步] 房间 ${roomId} 状态已更新 (来自: ${socket.id})`);
  });

  // 广播特定事件
  socket.on('broadcast-event', (data) => {
    const { roomId, event, payload } = data;
    
    if (!rooms.has(roomId)) {
      console.warn(`[警告] 房间 ${roomId} 不存在`);
      return;
    }

    // 广播事件给房间内所有人
    io.to(roomId).emit('event', {
      event: event,
      payload: payload,
      from: socket.id,
      timestamp: Date.now()
    });

    console.log(`[事件] 房间 ${roomId}: ${event}`);
  });

  // 用户更新个人状态（例如选择角色）
  socket.on('user-action', (data) => {
    const { roomId, action, payload } = data;
    
    if (!rooms.has(roomId)) {
      console.warn(`[警告] 房间 ${roomId} 不存在`);
      return;
    }

    // 广播用户操作
    io.to(roomId).emit('user-action', {
      from: socket.id,
      action: action,
      payload: payload,
      timestamp: Date.now()
    });

    console.log(`[操作] 房间 ${roomId}: ${action}`);
  });

  // 离开房间
  socket.on('leave-room', (data) => {
    const { roomId, userId } = data;

    socket.leave(roomId);

    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users.delete(socket.id);

      // 如果房间为空，删除房间
      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`[房间] 房间 ${roomId} 已删除（空房间）`);
      } else {
        // 通知房间内其他人
        io.to(roomId).emit('user-left', {
          userId: userId,
          socketId: socket.id,
          roomUsers: Array.from(room.users.values())
        });
      }
    }

    console.log(`[房间] 用户 ${userId} (${socket.id}) 离开房间 ${roomId}`);
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log(`[断开] ${socket.id} 已断开连接`);

    // 清理所有房间中的用户
    for (const [roomId, room] of rooms.entries()) {
      if (room.users.has(socket.id)) {
        const userId = room.users.get(socket.id).userId;
        room.users.delete(socket.id);

        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`[房间] 房间 ${roomId} 已删除（空房间）`);
        } else {
          io.to(roomId).emit('user-left', {
            userId: userId,
            socketId: socket.id,
            roomUsers: Array.from(room.users.values())
          });
        }
      }
    }
  });

  // 心跳保活
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// 路由：获取服务器状态
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    totalUsers: Array.from(rooms.values()).reduce((sum, r) => sum + r.users.size, 0)
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`[服务器] 《鹅鸭杀控制台》服务器运行在 http://localhost:${PORT}`);
  console.log(`[Socket.io] 已启用实时同步`);
  console.log(`[房间] 支持无限房间数量`);
});
