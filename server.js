const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 存储各个房间的实时状态
const roomStates = new Map();

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 加入房间
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // 如果房间已有状态，发送给新加入者
        if (roomStates.has(roomId)) {
            socket.emit('state-update', roomStates.get(roomId));
        }
    });

    // 状态更新请求（由房主或操作者发起）
    socket.on('broadcast-state', (data) => {
        const { roomId, state } = data;
        roomStates.set(roomId, state);
        // 广播给房间内除自己以外的所有人
        socket.to(roomId).emit('state-update', state);
    });

    // 模拟点击/输入同步
    socket.on('sync-action', (data) => {
        const { roomId, action } = data;
        // 广播动作给房间内除自己以外的所有人
        socket.to(roomId).emit('peer-action', action);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    鹅鸭杀角色管理同步后端已启动！
    本地访问: http://localhost:${PORT}
    局域网访问: http://<你的IP>:${PORT}
    =============================================
    `);
});
