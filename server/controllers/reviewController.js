const Review = require('../models/Review');
const Movie = require('../models/Movie');
const mongoose = require('mongoose');

const FIVE_MINUTES = 5 * 60 * 1000;
const validOpinions = ['skip', 'considerable', 'goForIt', 'excellent'];

// @route   POST /api/reviews
// @access  Private
const submitReview = async (req, res, next) => {
    try {
        const { movieId, opinion, comment } = req.body;

        if (!movieId) return res.status(400).json({ message: 'movieId is required' });
        if (!validOpinions.includes(opinion)) {
            return res.status(400).json({ message: `Opinion must be one of: ${validOpinions.join(', ')}` });
        }

        // Check for duplicate review
        const existing = await Review.findOne({ movieId, userId: req.user._id });
        if (existing) {
            return res.status(409).json({
                message: 'You have already reviewed this movie.',
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
// @access  Private (owner only, within 5 minutes of submission)
const updateReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });

        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }

        if (Date.now() - new Date(review.createdAt).getTime() > FIVE_MINUTES) {
            return res.status(403).json({ message: 'Opinions can only be changed within 5 minutes of submitting.' });
        }

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
        const reviews = await Review.find({ movieId })
            .populate('userId', 'username avatarUrl')
            .sort({ createdAt: -1 });

        // Compute opinion distribution
        const distribution = { skip: 0, considerable: 0, goForIt: 0, excellent: 0 };
        reviews.forEach(r => { distribution[r.opinion]++; });
        const total = reviews.length;

        // Compute percentages
        const percentages = {};
        Object.keys(distribution).forEach(k => {
            percentages[k] = total > 0 ? Math.round((distribution[k] / total) * 100) : 0;
        });

        // Return up to 10 individual reviews for the feed (filter out ones with deleted users)
        const reviewList = reviews
            .filter(r => r.userId != null)
            .slice(0, 10)
            .map(r => ({
                _id: r._id,
                opinion: r.opinion,
                comment: r.comment,
                createdAt: r.createdAt,
                username: r.userId.username,
                avatarUrl: r.userId.avatarUrl,
            }));

        res.json({ reviews: reviewList, distribution, percentages, total });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/reviews/user/:movieId
// @access  Private — get current user's review for a specific movie
const getUserReviewForMovie = async (req, res, next) => {
    try {
        const review = await Review.findOne({ movieId: req.params.movieId, userId: req.user._id });
        if (!review) return res.status(200).json(null);
        res.json(review);
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/reviews/user
// @access  Private — get current user's reviews
const getMyReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
        const movieIds = reviews.map(r => r.movieId);
        
        // Find movies in local DB
        const dbMovies = await Movie.find({
            $or: [
                { _id: { $in: movieIds.filter(id => mongoose.isValidObjectId(id)) } },
                { imdbID: { $in: movieIds } }
            ]
        });

        const movieMap = {};
        dbMovies.forEach(m => {
            movieMap[m._id.toString()] = { title: m.title, posterUrl: m.posterUrl, year: m.year };
            if (m.imdbID) {
                movieMap[m.imdbID] = { title: m.title, posterUrl: m.posterUrl, year: m.year };
            }
        });

        // For any remaining reviews whose movies are not in local DB (e.g. OMDb imdbIDs),
        // we can fetch their details from OMDB in parallel.
        const missingImdbIds = movieIds.filter(id => !/^[a-f\d]{24}$/i.test(id) && !movieMap[id]);
        
        const OMDB_BASE = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';
        const OMDB_KEY = process.env.OMDB_API_KEY;

        if (missingImdbIds.length > 0 && OMDB_KEY && OMDB_KEY !== 'your_omdb_api_key_here') {
            const axios = require('axios');
            const promises = missingImdbIds.map(async (id) => {
                try {
                    const response = await axios.get(OMDB_BASE, { params: { i: id, apikey: OMDB_KEY } });
                    if (response.data && response.data.Response !== 'False') {
                        movieMap[id] = {
                            title: response.data.Title,
                            posterUrl: response.data.Poster !== 'N/A' ? response.data.Poster : '',
                            year: response.data.Year
                        };
                    }
                } catch (err) {
                    console.warn(`Failed to fetch OMDb movie ${id} in getMyReviews:`, err.message);
                }
            });
            await Promise.allSettled(promises);
        }

        const resolvedReviews = reviews.map(r => {
            const movie = movieMap[r.movieId];
            return {
                _id: r._id,
                movieId: r.movieId,
                opinion: r.opinion,
                comment: r.comment,
                createdAt: r.createdAt,
                movieTitle: movie ? movie.title : 'Unknown Movie',
                moviePoster: movie ? movie.posterUrl : '',
                movieYear: movie ? movie.year : '',
            };
        });

        res.json(resolvedReviews);
    } catch (err) {
        next(err);
    }
};

module.exports = { submitReview, updateReview, getReviewsForMovie, getUserReviewForMovie, getMyReviews };
