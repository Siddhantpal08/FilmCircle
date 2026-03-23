const Review = require('../models/Review');

// @route   POST /api/reviews
// @access  Private
const submitReview = async (req, res, next) => {
    try {
        const { movieId, opinion, comment } = req.body;

        if (!movieId) return res.status(400).json({ message: 'movieId is required' });
        const validOpinions = ['skip', 'considerable', 'goForIt', 'excellent'];
        if (!validOpinions.includes(opinion)) {
            return res.status(400).json({ message: `Opinion must be one of: ${validOpinions.join(', ')}` });
        }

        // Check for duplicate review
        const existing = await Review.findOne({ movieId, userId: req.user._id });
        if (existing) {
            return res.status(409).json({
                message: 'You have already reviewed this movie. Use PUT /api/reviews/:id to update it.',
                reviewId: existing._id,
            });
        }

        const review = await Review.create({ movieId, userId: req.user._id, opinion, comment: comment?.trim() || '' });
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/reviews/:id
// @access  Private (owner only)
const updateReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }

        const validOpinions = ['skip', 'considerable', 'goForIt', 'excellent'];
        if (!validOpinions.includes(req.body.opinion)) {
            return res.status(400).json({ message: `Opinion must be one of: ${validOpinions.join(', ')}` });
        }

        review.opinion = req.body.opinion;
        if (req.body.comment !== undefined) review.comment = req.body.comment?.trim() || '';
        await review.save();
        res.json(review);
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/reviews/movie/:movieId
// @access  Public
const getReviewsForMovie = async (req, res, next) => {
    try {
        const { movieId } = req.params;
        const reviews = await Review.find({ movieId }).populate('userId', 'username avatarUrl');

        // Compute opinion distribution
        const distribution = { skip: 0, considerable: 0, goForIt: 0, excellent: 0 };
        reviews.forEach(r => { distribution[r.opinion]++; });
        const total = reviews.length;

        // Compute percentages
        const percentages = {};
        Object.keys(distribution).forEach(k => {
            percentages[k] = total > 0 ? Math.round((distribution[k] / total) * 100) : 0;
        });

        res.json({ reviews, distribution, percentages, total });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/reviews/user/:movieId
// @access  Private — get current user's review for a specific movie
const getUserReviewForMovie = async (req, res, next) => {
    try {
        const review = await Review.findOne({ movieId: req.params.movieId, userId: req.user._id });
        if (!review) return res.status(404).json({ message: 'No review found for this movie' });
        res.json(review);
    } catch (err) {
        next(err);
    }
};

module.exports = { submitReview, updateReview, getReviewsForMovie, getUserReviewForMovie };
