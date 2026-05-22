// TMDB integration — local test only, do not commit yet

/**
 * TmdbMovieCard.jsx
 * ─────────────────
 * Card for TMDB-sourced movies (homepage discovery only).
 * Visually identical to MovieCard.
 *
 * ROUTING: Navigates to /movie/<tmdbId>?title=<title>
 *   - The backend getMovieById detects the numeric TMDB ID and uses ?title
 *     to perform an OMDB title-lookup (t= param), returning full OMDB movie data.
 *   - All OMDB detail-page logic (plot, cast, ratings, reviews) stays 100% untouched.
 */

import { Link } from 'react-router-dom';

const FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23201f1f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23c0392b' font-size='30'%3E🎬%3C/text%3E%3Ctext x='50%25' y='63%25' text-anchor='middle' fill='%23a88a85' font-size='12'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function TmdbMovieCard({ movie }) {
    const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : FALLBACK;
    const title  = movie.Title;
    const year   = movie.Year || '';
    const rating = movie.Rating; // e.g. "7.8"

    // Navigate to /movie/<tmdbId>?title=<title>
    // Backend resolves the numeric tmdbId via OMDB t= (exact title) lookup.
    const to = `/movie/${movie.tmdbId}?title=${encodeURIComponent(title)}&poster=${encodeURIComponent(poster)}&year=${encodeURIComponent(year)}`;

    return (
        <Link to={to} className="movie-card group" style={{ textDecoration: 'none' }}>
            <div className="movie-card-poster">
                <img
                    src={poster}
                    alt={title}
                    className="movie-poster-img"
                    onError={e => { e.target.src = FALLBACK; }}
                    loading="lazy"
                />
                {/* Rating badge — top-right, visible on hover */}
                <div className="movie-score-overlay">
                    <div className="movie-score-badge tmdb-rating-badge">
                        {rating
                            ? <><span style={{ fontSize: '0.65rem', marginRight: '1px' }}>★</span>{rating}</>
                            : <span>✦</span>
                        }
                    </div>
                </div>
            </div>
            <div className="movie-card-body">
                <h3 className="movie-card-title">{title}</h3>
                <p className="movie-card-meta">{year}</p>
            </div>

            <style>{`
                .tmdb-rating-badge {
                    width: auto;
                    min-width: 40px;
                    padding: 0 0.45rem;
                    font-size: 0.78rem;
                    font-weight: 700;
                    border-radius: var(--radius-full);
                    letter-spacing: 0.02em;
                }
            `}</style>
        </Link>
    );
}
