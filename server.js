const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ─────────────────────────────────────────────
// 持久化存储（JSON 文件，模拟云端）
// ─────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function roomFile(roomId) {
  return path.join(DATA_DIR, `room_${roomId}.json`);
}

function loadRoom(roomId) {
  try {
    const f = roomFile(roomId);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {}
  return null;
}

function saveRoom(roomId, state) {
  try {
    fs.writeFileSync(roomFile(roomId), JSON.stringify(state), 'utf8');
  } catch (e) {
    console.error('saveRoom error:', e.message);
  }
}

// ─────────────────────────────────────────────
// 内存缓存
// roomStates : Map<roomId, gameState>
// roomMembers: Map<roomId, Set<socketId>>
// socketRoom : Map<socketId, roomId>
// ─────────────────────────────────────────────
const roomStates  = new Map();
const roomMembers = new Map();
const socketRoom  = new Map();

function getState(roomId) {
  if (!roomStates.has(roomId)) {
    const saved = loadRoom(roomId);
    roomStates.set(roomId, saved || { roomId, createdAt: Date.now(), gameState: null });
  }
  return roomStates.get(roomId);
}

function setState(roomId, state) {
  roomStates.set(roomId, state);
  saveRoom(roomId, state);  // 立刻持久化
}

function occupancy(roomId) {
  return (roomMembers.get(roomId) || new Set()).size;
}

// 定期将所有内存状态写盘（防止意外丢失）
setInterval(() => {
  for (const [roomId, state] of roomStates) {
    saveRoom(roomId, state);
  }
}, 30_000);

// ─────────────────────────────────────────────
// 静态文件
// ─────────────────────────────────────────────
app.use(express.static(__dirname));

// API: 检查房间是否存在
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const state = loadRoom(roomId);
  res.json({ exists: !!state, roomId });
});

// ─────────────────────────────────────────────
// Socket.io 逻辑
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} 已连接`);

  // ── 加入房间 ──────────────────────────────
  socket.on('join-room', ({ roomId, peerId }) => {
    // 离开旧房间
    const oldRoom = socketRoom.get(socket.id);
    if (oldRoom) {
      socket.leave(oldRoom);
      const members = roomMembers.get(oldRoom);
      if (members) { members.delete(socket.id); if (!members.size) roomMembers.delete(oldRoom); }
      io.to(oldRoom).emit('occupancy-update', occupancy(oldRoom));
    }

    // 加入新房间
    socket.join(roomId);
    socketRoom.set(socket.id, roomId);
    if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
    roomMembers.get(roomId).add(socket.id);

    console.log(`[→] ${socket.id} (peer:${peerId}) 加入房间 ${roomId}`);

    // 将已有状态推送给刚加入者
    const existing = getState(roomId);
    socket.emit('room-joined', {
      roomId,
      state: existing.gameState || null,
      online: occupancy(roomId)
    });

    // 通知房间内其他人在线数变化
    socket.to(roomId).emit('occupancy-update', occupancy(roomId));

    // 告知房间内所有人（含自身）最新在线数
    io.to(roomId).emit('occupancy-update', occupancy(roomId));
  });

  // ── 接收完整游戏状态（增量或全量）────────
  socket.on('push-state', ({ roomId, gameState, partial }) => {
    if (!roomId) return;
    const current = getState(roomId);

    let merged;
    if (partial && current.gameState) {
      // 浅合并：只更新变动字段
      merged = { ...current.gameState, ...gameState };
    } else {
      merged = gameState;
    }

    const next = { ...current, gameState: merged, updatedAt: Date.now() };
    setState(roomId, next);

    // 广播给房间内 除自己以外 的所有人
    socket.to(roomId).emit('state-update', { gameState: merged, partial: !!partial });
  });

  // ── 细粒度操作同步（点击、输入等）────────
  // 这保证了"操作意识独立，结果同步"的体验
  socket.on('sync-action', ({ roomId, action }) => {
    if (!roomId) return;
    socket.to(roomId).emit('peer-action', action);
  });

  // ── 请求最新完整状态（重连时）────────────
  socket.on('request-state', ({ roomId }) => {
    const existing = getState(roomId);
    socket.emit('state-update', { gameState: existing.gameState || null, partial: false });
  });

  // ── 断开 ──────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socketRoom.get(socket.id);
    if (roomId) {
      const members = roomMembers.get(roomId);
      if (members) { members.delete(socket.id); if (!members.size) roomMembers.delete(roomId); }
      io.to(roomId).emit('occupancy-update', occupancy(roomId));
      socketRoom.delete(socket.id);
    }
    console.log(`[-] ${socket.id} 已断开`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🪿 鹅鸭杀 · 跨网络实时同步版 已启动！       ║
  ║   本地:  http://localhost:${PORT}               ║
  ║   局域网: http://<本机IP>:${PORT}               ║
  ╚══════════════════════════════════════════════╝
  `);
});