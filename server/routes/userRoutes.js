const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ username, password });
        res.status(201).json({
            _id: user._id,
            username: user.username,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.get('/', protect, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');

        const usersWithLastMessage = await Promise.all(users.map(async (u) => {
            const lastMessage = await Message.findOne({
                $or: [
                    { sender: req.user._id, receiver: u._id },
                    { sender: u._id, receiver: req.user._id }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...u._doc,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isSent: String(lastMessage.sender) === String(req.user._id)
                } : null
            };
        }));

        console.log(`Found ${usersWithLastMessage.length} users with previews`);
        res.json(usersWithLastMessage);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.username = req.body.username || user.username;
            user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                bio: updatedUser.bio,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router;
