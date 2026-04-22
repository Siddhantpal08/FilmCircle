const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const Post = require('../models/Post');
const Club = require('../models/Club');

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
        const { bio, avatarUrl, username } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (bio !== undefined) user.bio = bio;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        // Update username if provided and different from current
        if (username !== undefined && username.trim() !== user.username) {
            const trimmed = username.trim();
            if (trimmed.length < 3 || trimmed.length > 30) {
                return res.status(400).json({ message: 'Username must be 3–30 characters' });
            }
            const taken = await User.findOne({ username: trimmed });
            if (taken) return res.status(409).json({ message: 'Username already taken' });
            user.username = trimmed;
        }

        await user.save();
        res.json({
            message: 'Profile updated',
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            username: user.username,
        });
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/auth/account
// @access  Private
// Cascade-deletes all content authored by the user before removing the account.
const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 1. Delete all reviews by this user
        await Review.deleteMany({ userId });

        // 2. Delete all indie movies uploaded by this user
        await Movie.deleteMany({ uploadedBy: userId, isIndependent: true });

        // 3. Delete all community posts authored by this user
        await Post.deleteMany({ author: userId });

        // 4. Remove this user's embedded comments from any remaining posts
        await Post.updateMany(
            { 'comments.author': userId },
            { $pull: { comments: { author: userId } } }
        );

        // 5. Remove this user from all posts' likes arrays
        await Post.updateMany(
            { likes: userId },
            { $pull: { likes: userId } }
        );

        // 6. Remove this user from all club members arrays
        //    Also remove club posts authored by this user
        await Club.updateMany(
            {},
            {
                $pull: {
                    members: userId,
                    posts: { author: userId },
                },
            }
        );

        // 7. Delete the user document itself
        await User.findByIdAndDelete(userId);

        res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, getMe, updateProfile, deleteAccount };
