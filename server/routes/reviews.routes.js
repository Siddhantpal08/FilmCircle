const express = require('express');
const {
    submitReview, updateReview, getReviewsForMovie, getUserReviewForMovie
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitReview);                       // POST /api/reviews
router.put('/:id', protect, updateReview);                    // PUT /api/reviews/:id
router.get('/movie/:movieId', getReviewsForMovie);            // GET /api/reviews/movie/:movieId
router.get('/user/:movieId', protect, getUserReviewForMovie); // GET /api/reviews/user/:movieId

module.exports = router;
