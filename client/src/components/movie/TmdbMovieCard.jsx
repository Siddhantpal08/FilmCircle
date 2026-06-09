// TMDB integration — local test only, do not commit yet

/**
 * TmdbMovieCard.jsx
 * ─────────────────
 * Card for TMDB-sourced movies (homepage discovery + search results).
 * Accepts both lowercase TMDB-shape props (poster/title/year/imdbRating)
 * and uppercase OMDB-shape props (Poster/Title/Year/Rating).
 */

import { Link } from 'react-router-dom';

const FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23201f1f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23c0392b' font-size='30'%3E🎬%3C/text%3E%3Ctext x='50%25' y='63%25' text-anchor='middle' fill='%23a88a85' font-size='12'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function TmdbMovieCard({ movie }) {
    // Support both lowercase (TMDB search shape) and uppercase (OMDB shape)
    const rawPoster = movie.poster || (movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null);
    const poster    = rawPoster || FALLBACK;
    const title     = movie.title || movie.Title || '';
    const year      = movie.year  || movie.Year  || '';
    const rating    = movie.imdbRating || movie.Rating; // e.g. "7.8"
    const tmdbId    = movie.tmdbId || movie.imdbID;

    // Navigate to /movie/<tmdbId>?title=<title>&poster=<poster>&year=<year>
    // Backend resolves the numeric tmdbId via TMDB → OMDB enrichment.
    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (year)  params.set('year', year);
    if (rawPoster) params.set('poster', rawPoster);
    const to = `/movie/${tmdbId}?${params.toString()}`;

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
                            ? <><span style={{ fontSize: '0.65rem', marginRight: '1px' }}>★</span>{parseFloat(rating).toFixed(1)}</>
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

