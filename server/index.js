
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Logic
let onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        onlineUsers.set(userData._id, socket.id);
        io.emit('online-users', Array.from(onlineUsers.keys()));
        console.log('User setup:', userData._id);
    });

    socket.on('join-chat', (room) => {
        socket.join(room);
        console.log('User joined room:', room);
    });

    socket.on('new-message', (newMessage) => {
        const receiver = newMessage.receiver;
        if (!receiver || !receiver._id) return console.log('Receiver not defined');

        // Emit to the receiver's personal room
        socket.in(receiver._id).emit('message-received', newMessage);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop-typing', (room) => socket.in(room).emit('stop-typing'));

    socket.on('disconnect', () => {
        onlineUsers.forEach((value, key) => {
            if (value === socket.id) {
                onlineUsers.delete(key);
            }
        });
        io.emit('online-users', Array.from(onlineUsers.keys()));
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
