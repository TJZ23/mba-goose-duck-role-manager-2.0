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

// 存储各个房间的实时状态和最后更新时间
const roomStates = new Map();
// 存储每个房间的在线人数
const roomOccupancy = new Map();

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    let currentRoom = null;
    console.log('用户已连接:', socket.id);

    // 加入房间
    socket.on('join-room', (roomId) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            updateOccupancy(currentRoom, -1);
        }
        
        currentRoom = roomId;
        socket.join(roomId);
        updateOccupancy(roomId, 1);
        
        console.log(`用户 ${socket.id} 加入了房间: ${roomId}`);
        
        // 如果房间已有状态，立即发送给新加入者（实现实时接管）
        if (roomStates.has(roomId)) {
            socket.emit('state-update', roomStates.get(roomId));
        }
    });

    // 接收全量状态更新（通常由修改者触发）
    socket.on('broadcast-state', (data) => {
        const { roomId, state } = data;
        roomStates.set(roomId, state);
        // 转发给房间内除发送者以外的所有人
        socket.to(roomId).emit('state-update', state);
    });

    // 接收并转发细粒度动作（点击、输入等）
    socket.on('sync-action', (data) => {
        const { roomId, action } = data;
        // 动作转发不仅能实现同步，还能保持两端 UI 交互一致
        socket.to(roomId).emit('peer-action', action);
    });

    socket.on('disconnect', () => {
        if (currentRoom) {
            updateOccupancy(currentRoom, -1);
        }
        console.log('用户已断开:', socket.id);
    });

    function updateOccupancy(roomId, delta) {
        let count = roomOccupancy.get(roomId) || 0;
        count += delta;
        if (count <= 0) {
            roomOccupancy.delete(roomId);
            // 可选：如果房间没人了，可以决定是否保留状态（这里保留，以便重连）
        } else {
            roomOccupancy.set(roomId, count);
        }
        io.to(roomId).emit('occupancy-update', count);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    🚀 鹅鸭杀角色管理【全网实时同步版】已启动！
    本地访问: http://localhost:${PORT}
    局域网访问: http://<你的局域网IP>:${PORT}
    =============================================
    `);
});
