const express = require('express');
const {
    getPosts, createPost, toggleLike, addComment, updatePost, deletePost
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/posts', getPosts);                          // GET /api/community/posts
router.post('/posts', protect, createPost);              // POST /api/community/posts
router.put('/posts/:id', protect, updatePost);           // PUT /api/community/posts/:id
router.post('/posts/:id/like', protect, toggleLike);     // POST /api/community/posts/:id/like
router.post('/posts/:id/comment', protect, addComment);  // POST /api/community/posts/:id/comment
router.delete('/posts/:id', protect, deletePost);        // DELETE /api/community/posts/:id

module.exports = router;
