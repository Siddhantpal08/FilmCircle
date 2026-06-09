const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const Post = require('../models/Post');
const Club = require('../models/Club');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Helper: sign JWT
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── OTP helpers ──────────────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// @route   POST /api/auth/send-otp
// @desc    Send a 6-digit OTP to email before account creation
// @access  Public
const sendOtp = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }

        const existingEmail    = await User.findOne({ email: email.toLowerCase().trim() });
        const existingUsername = await User.findOne({ username: username.trim() });

        // A user is "pending" if they called sendOtp before but never verified.
        // A user is "registered" if (a) isEmailVerified=true OR (b) they have no OTP fields
        // (i.e. they're an old account created before the OTP system was added).
        const isPending    = (u) => u && !u.isEmailVerified && (u.otp || u.otpExpiry);
        const isRegistered = (u) => u && !isPending(u);

        if (isRegistered(existingEmail)) {
            return res.status(409).json({ message: 'Email already registered. Please log in instead.' });
        }
        if (isRegistered(existingUsername)) {
            return res.status(409).json({ message: 'Username already taken. Please choose another.' });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10) * 60 * 1000);

        // Reuse stale pending record if one exists, otherwise create fresh
        let pendingUser = (isPending(existingEmail) ? existingEmail : null)
                       || (isPending(existingUsername) ? existingUsername : null);

        if (pendingUser) {
            pendingUser.username  = username.trim();
            pendingUser.email     = email.toLowerCase().trim();
            pendingUser.password  = password; // hashed by pre-save hook
            pendingUser.otp       = hashOtp(otp);
            pendingUser.otpExpiry = otpExpiry;
            await pendingUser.save();
        } else {
            pendingUser = await User.create({
                username: username.trim(),
                email:    email.toLowerCase().trim(),
                password,
                otp:      hashOtp(otp),
                otpExpiry,
                isEmailVerified: false,
            });
        }

        await sendOtpEmail(pendingUser.email, pendingUser.username, otp);
        console.log(`[sendOtp] OTP dispatched to ${pendingUser.email}`);

        res.json({ message: 'OTP sent. Check your email inbox.' });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete account registration
// @access  Public
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            isEmailVerified: false,
        });

        if (!user) {
            return res.status(400).json({ message: 'No pending registration found for this email' });
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'OTP not requested. Please start registration again.' });
        }
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (user.otp !== hashOtp(otp.toString().trim())) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        // Mark verified and clear OTP fields
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/register
// @access  Public — kept for backward-compat; OTP path is preferred
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
        await req.user.populate('joinedClubs', 'name');
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

// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        // Always return success to prevent email enumeration attacks
        if (!user) {
            return res.json({ message: 'If that email is registered, a reset link has been sent.' });
        }

        // Generate a secure random token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetToken = hashedToken;
        user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save({ validateBeforeSave: false });

        const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
        const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

        await sendPasswordResetEmail(user.email, user.username, resetUrl);

        res.json({ message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) {
        // Clean up token on mail failure so user can retry
        try {
            const u = await User.findOne({ email: req.body?.email?.toLowerCase().trim() });
            if (u) { u.resetToken = undefined; u.resetTokenExpiry = undefined; await u.save({ validateBeforeSave: false }); }
        } catch (_) { /* ignore */ }
        console.error('[forgotPassword] Error:', err.message);
        res.status(500).json({ message: 'Failed to send reset email. Please check server email configuration.' });
    }
};

// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, email, password } = req.body;
        if (!token || !email || !password) {
            return res.status(400).json({ message: 'Token, email, and new password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
        }

        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, getMe, updateProfile, deleteAccount, forgotPassword, resetPassword, sendOtp, verifyOtp };
