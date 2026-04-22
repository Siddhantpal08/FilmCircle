const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validateBody');

const router = express.Router();

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

module.exports = router;
