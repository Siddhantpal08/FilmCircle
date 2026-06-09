const axios = require('axios');
const Movie = require('../models/Movie');

const OMDB_BASE = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';
const OMDB_KEY = process.env.OMDB_API_KEY;

// TMDB — used only for exact movie-detail lookups via numeric TMDB ID
const TMDB_BASE = 'https://api.tmdb.org/3';
const TMDB_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;

// Curated list of 30 popular/trending titles (by imdbID)
const TRENDING_IDS = [
    'tt9362722', // Spider-Man: Across the Spider-Verse
    'tt15398776', // Oppenheimer
    'tt1517268', // Barbie
    'tt6791350', // Guardians of the Galaxy Vol. 3
    'tt14209916', // The Creator
    'tt5109784', // Asteroid City
    'tt3447590', // Dune: Part Two
    'tt1745960', // Top Gun: Maverick
    'tt10151854', // The Whale
    'tt15321791', // All of Us Strangers
    'tt11304740', // Poor Things
    'tt13186482', // The Zone of Interest
    'tt0111161', // The Shawshank Redemption
    'tt0468569', // The Dark Knight
    'tt0816692', // Interstellar
    'tt1375666', // Inception
    'tt0120737', // The Lord of the Rings: The Fellowship
    'tt6718170', // The Super Mario Bros. Movie
    'tt1630029', // Avatar: The Way of Water
    'tt7125580', // The Holdovers
    'tt21823606', // Dream Scenario
    'tt21954842', // Saltburn
    'tt9114286', // Black Panther: Wakanda Forever
    'tt10366460', // Knock at the Cabin
    'tt12593682', // Elemental
    'tt14916392', // Transformers: Rise of the Beasts
    'tt0903747', // Breaking Bad (using movie-style)
    'tt8589698', // Tenet
    'tt3581652', // Bottoms
    'tt15671028', // Mission: Impossible – Dead Reckoning
];

// In-memory cache — refreshes once per day to minimise OMDB token usage
let trendingCache = null;
let trendingCachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
// Primary: TMDB search/movie (fast, no key limits for common use)
// Fallback: OMDB if TMDB key is unavailable
const searchMovies = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query cannot be empty' });
        }

        // ── Primary: TMDB search ──────────────────────────────────────────────
        if (TMDB_KEY) {
            const [page1Res, page2Res] = await Promise.allSettled([
                axios.get(`${TMDB_BASE}/search/movie`, {
                    params: { api_key: TMDB_KEY, query: q.trim(), language: 'en-US', page: 1, include_adult: false },
                }),
                axios.get(`${TMDB_BASE}/search/movie`, {
                    params: { api_key: TMDB_KEY, query: q.trim(), language: 'en-US', page: 2, include_adult: false },
                }),
            ]);

            const results1 = page1Res.status === 'fulfilled' ? (page1Res.value.data.results || []) : [];
            const results2 = page2Res.status === 'fulfilled' ? (page2Res.value.data.results || []) : [];
            const totalResults = page1Res.status === 'fulfilled'
                ? String(page1Res.value.data.total_results || 0)
                : '0';

            // Deduplicate & cap at 18 results
            const seen = new Set();
            const merged = [];
            for (const m of [...results1, ...results2]) {
                if (!seen.has(m.id)) {
                    seen.add(m.id);
                    merged.push({
                        // Map to a shape compatible with both MovieCard and TmdbMovieCard
                        imdbID: String(m.id),   // numeric TMDB id used as the navigation key
                        tmdbId: String(m.id),
                        Title: m.title || 'Unknown',
                        title: m.title || 'Unknown',
                        Year: m.release_date ? m.release_date.slice(0, 4) : '',
                        year: m.release_date ? m.release_date.slice(0, 4) : '',
                        Poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : 'N/A',
                        poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
                        Genre: '',
                        imdbRating: m.vote_average ? m.vote_average.toFixed(1) : null,
                        source: 'tmdb',
                    });
                }
                if (merged.length >= 18) break;
            }

            return res.json({ results: merged, totalResults });
        }

        // ── Fallback: OMDB (only if TMDB key is unavailable) ─────────────────
        const [page1, page2] = await Promise.allSettled([
            omdbGet({ s: q.trim(), page: 1 }),
            omdbGet({ s: q.trim(), page: 2 }),
        ]);
        const results1 = page1.status === 'fulfilled' ? (page1.value.Search || []) : [];
        const results2 = page2.status === 'fulfilled' ? (page2.value.Search || []) : [];
        const totalResults = page1.status === 'fulfilled' ? page1.value.totalResults : '0';

        const seen = new Set();
        const merged = [];
        for (const m of [...results1, ...results2]) {
            if (!seen.has(m.imdbID)) {
                seen.add(m.imdbID);
                merged.push(m);
            }
            if (merged.length >= 12) break;
        }

        res.json({ results: merged, totalResults });
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
// Handles:
//   1. OMDb imdbID (starts with 'tt')           → OMDB by i=
//   2. Numeric TMDB ID                          → TMDB /movie/{id} for imdb_id → OMDB by i=
//   3. MongoDB ObjectId                         → indie film from DB
const getMovieById = async (req, res, next) => {
    const { id } = req.params;
    // Hint params forwarded from the card click (used only for fallback display)
    const { title, poster, year } = req.query;

    // ── 1. OMDB imdbID (tt...) ───────────────────────────────────────────────
    if (id.startsWith('tt')) {
        try {
            const data = await omdbGet({ i: id, plot: 'full' });
            return res.json(data);
        } catch (omdbErr) {
            // fall through to DB lookup
        }
    }

    // ── 2. Numeric TMDB ID — fetch exact details from TMDB, then enrich via OMDB i= ──
    if (/^\d+$/.test(id)) {
        // Step A: call TMDB /movie/{id} to get canonical details including imdb_id
        let tmdbData = null;
        if (TMDB_KEY) {
            try {
                const tmdbRes = await axios.get(
                    `${TMDB_BASE}/movie/${id}`,
                    { params: { api_key: TMDB_KEY, language: 'en-US', append_to_response: 'credits' } }
                );
                tmdbData = tmdbRes.data;
            } catch (tmdbErr) {
                console.warn(`[TMDB] /movie/${id} lookup failed:`, tmdbErr.message);
            }
        }

        // Step B: if TMDB gave us an imdb_id, call OMDB by i= for exact, enriched data
        if (tmdbData && tmdbData.imdb_id) {
            try {
                const omdbData = await omdbGet({ i: tmdbData.imdb_id, plot: 'full' });
                // Merge: prefer OMDB fields, but fill any gaps with TMDB data
                return res.json({
                    ...omdbData,
                    // Ensure a good poster — prefer OMDB's, fall back to TMDB's
                    Poster:
                        (omdbData.Poster && omdbData.Poster !== 'N/A')
                            ? omdbData.Poster
                            : (tmdbData.poster_path
                                ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                                : (poster || 'N/A')),
                });
            } catch (omdbErr) {
                // OMDB lookup failed even though we have imdb_id — return TMDB data directly
                const directors = (tmdbData.credits?.crew || [])
                    .filter(c => c.job === 'Director')
                    .map(c => c.name)
                    .join(', ');
                const cast = (tmdbData.credits?.cast || [])
                    .slice(0, 5)
                    .map(c => c.name)
                    .join(', ');
                return res.json({
                    imdbID: tmdbData.imdb_id || id,
                    Title: tmdbData.title || title || 'Unknown',
                    Year: tmdbData.release_date ? tmdbData.release_date.slice(0, 4) : (year || 'Unknown'),
                    Poster: tmdbData.poster_path
                        ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                        : (poster || 'N/A'),
                    Genre: (tmdbData.genres || []).map(g => g.name).join(', ') || 'Unknown',
                    Plot: tmdbData.overview || 'No description available.',
                    Director: directors || '—',
                    Actors: cast || '—',
                    imdbRating: tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : null,
                    isIndependent: false,
                });
            }
        }

        // Step C: TMDB key missing or TMDB returned no imdb_id — fall back to OMDB
        // title+year search (?t= with &y= is more accurate than title alone)
        if (title) {
            try {
                const params = { t: title.trim(), plot: 'full' };
                if (year) params.y = year.trim();
                const data = await omdbGet(params);
                return res.json(data);
            } catch (omdbErr) {
                // Nothing worked — return a synthetic display object from the URL hints
                return res.json({
                    imdbID: id,
                    Title: title,
                    Year: year || 'Unknown',
                    Poster: poster || 'N/A',
                    Genre: 'Unknown',
                    Plot: 'No description available for this film.',
                    isIndependent: false,
                });
            }
        }

        // No title hint and no TMDB data — give up gracefully
        return res.status(404).json({ message: 'Movie not found — no lookup data available.' });
    }

    // ── 3. MongoDB ObjectId (indie films) ────────────────────────────────────
    try {
        const movie = await Movie.findById(id).populate('uploadedBy', 'username avatarUrl');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        return res.json(movie);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ message: 'Movie not found — invalid ID.' });
        }
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

// @route   GET /api/movies/trending
// @access  Public — returns curated list of popular movies from OMDb (cached 2h)
const getTrendingMovies = async (req, res, next) => {
    try {
        // Serve from cache if fresh
        if (trendingCache && Date.now() - trendingCachedAt < CACHE_TTL) {
            return res.json(trendingCache);
        }

        if (!OMDB_KEY || OMDB_KEY === 'your_omdb_api_key_here') {
            const err = new Error('OMDB_API_KEY is not configured.');
            err.statusCode = 503;
            throw err;
        }

        // Fetch all in parallel, skip failures gracefully
        const settled = await Promise.allSettled(
            TRENDING_IDS.map(id =>
                omdbGet({ i: id, plot: 'short' })
                    .then(d => ({ imdbID: d.imdbID, Title: d.Title, Year: d.Year, Poster: d.Poster, Genre: d.Genre, imdbRating: d.imdbRating }))
            )
        );
        const movies = settled
            .filter(r => r.status === 'fulfilled' && r.value?.imdbID)
            .map(r => r.value);

        trendingCache = movies;
        trendingCachedAt = Date.now();
        res.json(movies);
    } catch (err) {
        if (err.statusCode === 503) return res.status(503).json({ message: err.message });
        next(err);
    }
};

// @route   GET /api/movies/suggest?q=partial
// @access  Public — lightweight autocomplete using TMDB search (returns up to 8 results)
// Uses TMDB multi-search since it provides instant, high-quality results and the key
// is already configured. Falls back gracefully to empty array on any error.
const suggestMovies = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.json([]);

        if (!TMDB_KEY) {
            // Fallback to OMDB if TMDB key unavailable
            if (!OMDB_KEY || OMDB_KEY === 'your_omdb_api_key_here') {
                return res.json([]);
            }
            const resp = await axios.get(OMDB_BASE, {
                params: { s: q.trim(), type: 'movie', apikey: OMDB_KEY },
            });
            const data = resp.data;
            const suggestions = (data.Search || []).slice(0, 8).map(m => ({
                id: m.imdbID,
                imdbID: m.imdbID,
                title: m.Title,
                year: m.Year,
                poster: m.Poster !== 'N/A' ? m.Poster : null,
                source: 'omdb',
            }));
            return res.json(suggestions);
        }

        // Primary path: TMDB multi-search (movies only)
        const tmdbResp = await axios.get(`${TMDB_BASE}/search/movie`, {
            params: {
                api_key: TMDB_KEY,
                query: q.trim(),
                language: 'en-US',
                page: 1,
                include_adult: false,
            },
        });

        const results = (tmdbResp.data.results || []).slice(0, 8);
        const suggestions = results.map(m => ({
            id: String(m.id),
            imdbID: String(m.id),   // use TMDB numeric id as the navigation key
            title: m.title || m.name || 'Unknown',
            year: m.release_date ? m.release_date.slice(0, 4) : '',
            poster: m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : null,
            source: 'tmdb',
        }));

        res.json(suggestions);
    } catch (err) {
        // Autocomplete failure is non-critical — return empty array gracefully
        console.error('[suggest] error:', err.message);
        res.json([]);
    }
};

// @route   POST /api/movies/interesting/:movieId
// @access  Public — uses a user identifier (auth user ID if logged in, else clientId header)
// Toggles the "Most Interesting" flag for a film and updates interestingCount
const toggleInteresting = async (req, res, next) => {
    try {
        const { movieId } = req.params;
        // Accept either an authenticated user ID or an anonymous clientId sent by the frontend
        const userId = req.user?._id?.toString() || req.headers['x-client-id'] || null;

        if (!userId) {
            return res.status(400).json({ message: 'User identifier required.' });
        }

        // Build a synthetic Movie document for OMDB/TMDB films not in our DB.
        // If the movieId is a real MongoDB ObjectId, findById works normally.
        // Otherwise we upsert a thin record keyed by imdbID or tmdbId.
        let movie;
        const isObjectId = /^[a-f\d]{24}$/i.test(movieId);
        if (isObjectId) {
            movie = await Movie.findById(movieId);
        } else {
            // For external IDs (tt... or numeric TMDB), upsert a minimal record
            movie = await Movie.findOneAndUpdate(
                { imdbID: movieId },
                {
                    $setOnInsert: {
                        title: req.body.title || movieId,
                        posterUrl: req.body.posterUrl || '',
                        year: req.body.year || '',
                        imdbID: movieId,
                        isIndependent: false,
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        if (!movie) return res.status(404).json({ message: 'Movie not found.' });

        const alreadyMarked = movie.interestingUsers.includes(userId);
        if (alreadyMarked) {
            // Un-mark
            movie.interestingUsers = movie.interestingUsers.filter(u => u !== userId);
            movie.interestingCount = Math.max(0, (movie.interestingCount || 1) - 1);
        } else {
            // Mark
            movie.interestingUsers.push(userId);
            movie.interestingCount = (movie.interestingCount || 0) + 1;
        }

        await movie.save();
        res.json({ marked: !alreadyMarked, interestingCount: movie.interestingCount });
    } catch (err) {
        next(err);
    }
};

// @route   GET /api/movies/interesting/leaderboard
// @access  Public — top 10 films by interestingCount
const getInterestingLeaderboard = async (req, res, next) => {
    try {
        const films = await Movie.find({ interestingCount: { $gt: 0 } })
            .sort({ interestingCount: -1 })
            .limit(10)
            .select('title imdbID posterUrl year interestingCount');
        res.json(films);
    } catch (err) {
        next(err);
    }
};

module.exports = { searchMovies, getIndependentMovies, getMovieById, uploadMovie, updateMovie, deleteMovie, getTrendingMovies, suggestMovies, toggleInteresting, getInterestingLeaderboard };
