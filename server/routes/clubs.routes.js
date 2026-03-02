const express = require('express');
const {
    getClubs, createClub, getClubById, joinClub, leaveClub, postInClub
} = require('../controllers/clubController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getClubs);                        // GET /api/clubs
router.post('/', protect, createClub);            // POST /api/clubs
router.get('/:id', getClubById);                  // GET /api/clubs/:id
router.post('/:id/join', protect, joinClub);       // POST /api/clubs/:id/join
router.post('/:id/leave', protect, leaveClub);     // POST /api/clubs/:id/leave
router.post('/:id/posts', protect, postInClub);    // POST /api/clubs/:id/posts

module.exports = router;
