const Post = require('../models/Post');

// @route   GET /api/community/posts?page=1&limit=10
// @access  Public
const getPosts = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            Post.find()
                .populate('author', 'username avatarUrl')
                .populate('comments.author', 'username avatarUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Post.countDocuments(),
        ]);

        res.json({ posts, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/community/posts
// @access  Private
const createPost = async (req, res, next) => {
    try {
        const { content, movieRef } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Post content cannot be empty' });
        }

        const post = await Post.create({ content: content.trim(), author: req.user._id, movieRef: movieRef || null });
        const populated = await post.populate('author', 'username avatarUrl');
        res.status(201).json(populated);
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/community/posts/:id/like
// @access  Private
const toggleLike = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const userId = req.user._id;
        const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/community/posts/:id/comment
// @access  Private
const addComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text cannot be empty' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        post.comments.push({ author: req.user._id, text: text.trim() });
        await post.save();

        const updated = await Post.findById(post._id).populate('comments.author', 'username avatarUrl');
        res.status(201).json(updated.comments[updated.comments.length - 1]);
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/community/posts/:id
// @access  Private (owner only, within 5 min)
const updatePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        const FIVE_MINUTES = 5 * 60 * 1000;
        if (Date.now() - new Date(post.createdAt).getTime() > FIVE_MINUTES) {
            return res.status(403).json({ message: 'Posts can only be edited within 5 minutes of posting' });
        }

        const { content } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Post content cannot be empty' });
        }

        post.content = content.trim();
        post.editedAt = new Date();
        await post.save();

        const updated = await Post.findById(post._id).populate('author', 'username avatarUrl');
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/community/posts/:id
// @access  Private (owner only)
const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getPosts, createPost, toggleLike, addComment, updatePost, deletePost };
