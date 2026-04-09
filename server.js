const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

const DATA_FILE = path.join(__dirname, 'rooms_save.json');

// In-memory format: { [roomId]: { state: Object, hostSocketId: String, users: Set } }
let rooms = {};

// Load previous state
try {
    if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        for (let roomId in parsed) {
            rooms[roomId] = {
                state: parsed[roomId].state,
                hostSocketId: null,
                users: new Set()
            };
        }
        console.log(`Loaded ${Object.keys(rooms).length} rooms from cloud storage.`);
    }
} catch (e) {
    console.error('Failed to load DB:', e);
}

function saveDB() {
    try {
        const saveObj = {};
        for (let roomId in rooms) {
            if (rooms[roomId].state) {
                saveObj[roomId] = { state: rooms[roomId].state };
            }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(saveObj, null, 2));
    } catch (e) {
        console.error('Failed to save DB:', e);
    }
}

io.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('joinRoom', (roomId) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            rooms[currentRoom]?.users.delete(socket.id);
        }

        socket.join(roomId);
        currentRoom = roomId;

        if (!rooms[roomId]) {
            rooms[roomId] = { state: null, hostSocketId: socket.id, users: new Set() };
        }
        rooms[roomId].users.add(socket.id);

        let isHost = false;
        // If there's no host, or the recorded host is no longer connected to this room
        if (!rooms[roomId].hostSocketId || !rooms[roomId].users.has(rooms[roomId].hostSocketId)) {
            rooms[roomId].hostSocketId = socket.id;
            isHost = true;
        } else if (rooms[roomId].hostSocketId === socket.id) {
            isHost = true;
        }

        // Send confirmation to the joined user
        socket.emit('roomJoined', {
            roomId: roomId,
            isHost: isHost,
            state: rooms[roomId].state
        });

        // Broadcast occupancy update to EVERYONE in the room
        io.to(roomId).emit('occupancyUpdate', rooms[roomId].users.size);
    });

    socket.on('updateState', (stateObj) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        
        // Update server cache
        rooms[currentRoom].state = stateObj;
        saveDB(); // "Auto save history in the cloud"
        
        // Broadcast state to all other clients in the room
        socket.to(currentRoom).emit('stateUpdate', stateObj);
    });

    socket.on('simClick', (clickData) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const hostId = rooms[currentRoom].hostSocketId;
        if (hostId) {
            io.to(hostId).emit('simClick', clickData);
        }
    });

    socket.on('simInput', (inputData) => {
        if (!currentRoom || !rooms[currentRoom]) return;
        const hostId = rooms[currentRoom].hostSocketId;
        if (hostId) {
            io.to(hostId).emit('simInput', inputData);
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && rooms[currentRoom]) {
            rooms[currentRoom].users.delete(socket.id);
            
            // Broadcast new occupancy
            io.to(currentRoom).emit('occupancyUpdate', rooms[currentRoom].users.size);

            // Reassign host if the leaving user was the host
            if (rooms[currentRoom].hostSocketId === socket.id) {
                rooms[currentRoom].hostSocketId = null;
                // Assign new host if there are users left
                if (rooms[currentRoom].users.size > 0) {
                    const nextHost = Array.from(rooms[currentRoom].users)[0];
                    rooms[currentRoom].hostSocketId = nextHost;
                    io.to(nextHost).emit('hostAssigned');
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
