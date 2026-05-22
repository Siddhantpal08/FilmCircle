const express = require('express');
const {
    searchMovies, getIndependentMovies, getMovieById, uploadMovie, updateMovie, deleteMovie, getTrendingMovies, suggestMovies,
    toggleInteresting, getInterestingLeaderboard,
} = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', searchMovies);                        // GET /api/movies/search?q=title
router.get('/suggest', suggestMovies);                      // GET /api/movies/suggest?q= (autocomplete)
router.get('/independent', getIndependentMovies);           // GET /api/movies/independent
router.get('/trending', getTrendingMovies);                 // GET /api/movies/trending (cached 24h)
router.get('/interesting/leaderboard', getInterestingLeaderboard); // GET /api/movies/interesting/leaderboard
router.post('/upload', protect, uploadMovie);               // POST /api/movies/upload (auth)
router.post('/interesting/:movieId', toggleInteresting);    // POST /api/movies/interesting/:movieId
router.get('/:id', getMovieById);                          // GET /api/movies/:id
router.put('/:id', protect, updateMovie);                  // PUT /api/movies/:id (auth, owner)
router.delete('/:id', protect, deleteMovie);               // DELETE /api/movies/:id (auth, owner)

module.exports = router;
