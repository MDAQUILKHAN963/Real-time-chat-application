const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// File Upload Route
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    const { receiverId, content } = req.body;
    if (!req.file || !receiverId) {
        return res.status(400).json({ message: 'No file uploaded or missing receiver' });
    }

    try {
        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content: content || '',
            fileUrl: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype,
            fileName: req.file.originalname,
        });

        const fullMessage = await Message.findById(message._id)
            .populate('sender', 'username')
            .populate('receiver', 'username');

        res.status(201).json(fullMessage);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

router.post('/', protect, async (req, res) => {
    const { content, receiverId } = req.body;
    if (!content || !receiverId) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content,
        });
        const fullMessage = await Message.findById(message._id)
            .populate('sender', 'username')
            .populate('receiver', 'username');
        res.status(201).json(fullMessage);
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
});

router.get('/:userId', protect, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id },
            ],
        })
            .populate('sender', 'username')
            .populate('receiver', 'username')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Clear chat history
router.delete('/:userId', protect, async (req, res) => {
    try {
        await Message.deleteMany({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ]
        });
        res.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing chat' });
    }
});

module.exports = router;
