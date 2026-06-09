const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, deleteAccount, forgotPassword, resetPassword, sendOtp, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateBody');

const router = express.Router();

// POST /api/auth/send-otp  — step 1: validate fields & send OTP
router.post('/send-otp', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateBody,
], sendOtp);

// POST /api/auth/verify-otp — step 2: confirm OTP & create account
router.post('/verify-otp', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
    validateBody,
], verifyOtp);

// POST /api/auth/register
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateBody,
], register);

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validateBody,
], login);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

// PUT /api/auth/profile (protected)
router.put('/profile', protect, updateProfile);

// DELETE /api/auth/account (protected) — cascade-delete all user data + account
router.delete('/account', protect, deleteAccount);

// POST /api/auth/forgot-password
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Enter a valid email'),
    validateBody,
], forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateBody,
], resetPassword);

module.exports = router;
