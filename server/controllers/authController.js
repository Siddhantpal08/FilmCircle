const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: sign JWT
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Check for duplicate email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // Check for duplicate username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        const user = await User.create({ username, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        res.json({
            token,
            user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/auth/me
// @access  Private (requires protect middleware)
const getMe = async (req, res, next) => {
    try {
        // req.user is already set by authMiddleware
        res.json({
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            bio: req.user.bio,
            avatarUrl: req.user.avatarUrl,
            uploadedMovies: req.user.uploadedMovies,
            joinedClubs: req.user.joinedClubs,
        });
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { bio, avatarUrl } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();
        res.json({ message: 'Profile updated', bio: user.bio, avatarUrl: user.avatarUrl });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, getMe, updateProfile };
