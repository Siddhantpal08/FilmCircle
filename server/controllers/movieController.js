const axios = require('axios');
const Movie = require('../models/Movie');

const OMDB_BASE = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';
const OMDB_KEY = process.env.OMDB_API_KEY;

// Log warning at startup if key not configured
if (!OMDB_KEY || OMDB_KEY === 'your_omdb_api_key_here') {
    console.warn('⚠️  OMDB_API_KEY is not set. Movie search/detail for non-indie films will be unavailable.');
    console.warn('   Get a free key at https://www.omdbapi.com/apikey.aspx and add it to your .env file.');
}

// Helper: call OMDb and handle errors
const omdbGet = async (params) => {
    if (!OMDB_KEY || OMDB_KEY === 'your_omdb_api_key_here') {
        const err = new Error('OMDB_API_KEY is not configured. Add your key to the .env file to enable movie search. Get one free at https://www.omdbapi.com/apikey.aspx');
        err.statusCode = 503;
        throw err;
    }
    const response = await axios.get(OMDB_BASE, { params: { ...params, apikey: OMDB_KEY } });
    if (response.data.Response === 'False') {
        const err = new Error(response.data.Error || 'Movie not found');
        err.statusCode = 404;
        throw err;
    }
    return response.data;
};


// @route   GET /api/movies/search?q=title
// @access  Public
const searchMovies = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query cannot be empty' });
        }
        const data = await omdbGet({ s: q.trim() });
        res.json({ results: data.Search || [], totalResults: data.totalResults });
    } catch (err) {
        if (err.statusCode === 404) {
            return res.status(200).json({ results: [], totalResults: '0' });
        }
        if (err.statusCode === 503) {
            return res.status(503).json({ message: err.message });
        }
        next(err);
    }
};

// @route   GET /api/movies/independent
// @access  Public
const getIndependentMovies = async (req, res, next) => {
    try {
        const movies = await Movie.find({ isIndependent: true })
            .populate('uploadedBy', 'username avatarUrl')
            .sort({ createdAt: -1 });
        res.json(movies);
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/movies/:id
// @access  Public
// Handles both OMDb imdbID (starts with 'tt') and MongoDB ObjectId (for independent films)
const getMovieById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Try as OMDb imdbID first
        if (id.startsWith('tt')) {
            try {
                const data = await omdbGet({ i: id, plot: 'full' });
                return res.json(data);
            } catch (omdbErr) {
                // Fall through to DB lookup
            }
        }

        // Look up as MongoDB document (for independent films)
        const movie = await Movie.findById(id).populate('uploadedBy', 'username avatarUrl');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json(movie);
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/movies/upload
// @access  Private
const uploadMovie = async (req, res, next) => {
    try {
        const { title, genre, director, actors, plot, posterUrl, streamingLinks } = req.body;

        if (!title) return res.status(400).json({ message: 'Title is required' });

        const movie = await Movie.create({
            title,
            genre,
            director,
            actors,
            plot,
            posterUrl,
            streamingLinks: streamingLinks || [],
            uploadedBy: req.user._id,
            isIndependent: true,
        });

        // Add to user's uploaded list
        req.user.uploadedMovies.push(movie._id);
        await req.user.save();

        res.status(201).json(movie);
    } catch (err) {
        next(err);
    }
};

// @route   PUT /api/movies/:id
// @access  Private (owner only)
const updateMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        if (movie.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this movie' });
        }

        const updates = ['title', 'genre', 'director', 'actors', 'plot', 'posterUrl', 'streamingLinks'];
        updates.forEach(field => {
            if (req.body[field] !== undefined) movie[field] = req.body[field];
        });
        await movie.save();
        res.json(movie);
    } catch (err) {
        next(err);
    }
};

// @route   DELETE /api/movies/:id
// @access  Private (owner only)
const deleteMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        if (movie.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this movie' });
        }

        await movie.deleteOne();
        res.json({ message: 'Movie removed successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { searchMovies, getIndependentMovies, getMovieById, uploadMovie, updateMovie, deleteMovie };
