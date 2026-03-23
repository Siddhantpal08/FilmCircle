const express = require('express');
const {
    getClubs, createClub, getClubById, joinClub, leaveClub, postInClub, updateClub, deleteClub, deleteClubPost
} = require('../controllers/clubController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getClubs);                              // GET /api/clubs
router.post('/', protect, createClub);                  // POST /api/clubs
router.get('/:id', getClubById);                        // GET /api/clubs/:id
router.put('/:id', protect, updateClub);                // PUT /api/clubs/:id (creator)
router.delete('/:id', protect, deleteClub);             // DELETE /api/clubs/:id (creator)
router.post('/:id/join', protect, joinClub);            // POST /api/clubs/:id/join
router.post('/:id/leave', protect, leaveClub);          // POST /api/clubs/:id/leave
router.post('/:id/posts', protect, postInClub);         // POST /api/clubs/:id/posts
router.delete('/:id/posts/:postId', protect, deleteClubPost); // DELETE /api/clubs/:id/posts/:postId

module.exports = router;
