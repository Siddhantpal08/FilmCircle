import { Link } from 'react-router-dom';

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23201f1f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23c0392b' font-size='30'%3E🎬%3C/text%3E%3Ctext x='50%25' y='63%25' text-anchor='middle' fill='%23a88a85' font-size='12'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function MovieCard({ movie, indie = false }) {
    const id = movie.imdbID || movie._id;
    let poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : (movie.posterUrl || FALLBACK);
    if (poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
    const title = movie.Title || movie.title;
    const year = movie.Year || movie.year || '';
    const genre = movie.Genre || movie.genre || '';

    return (
        <>
            <Link to={`/movie/${id}`} className="movie-card group">
                <div className="movie-card-poster">
                    <img
                        src={poster}
                        alt={title}
                        className="movie-poster-img"
                        onError={e => { e.target.src = FALLBACK; }}
                        loading="lazy"
                    />
                    {indie && <span className="movie-indie-badge">Indie</span>}
                    {/* Score overlay (appears on hover) */}
                    <div className="movie-score-overlay">
                        <div className="movie-score-badge">
                            <span>✦</span>
                        </div>
                    </div>
                </div>
                <div className="movie-card-body">
                    <h3 className="movie-card-title">{title}</h3>
                    <p className="movie-card-meta">
                        {year}{year && genre ? ' • ' : ''}{genre ? genre.split(',')[0].trim() : ''}
                    </p>
                </div>
            </Link>

            <style>{`
                .movie-card {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border-radius: var(--radius);
                    background: transparent;
                    cursor: pointer;
                    text-decoration: none;
                    transition: transform 0.3s ease;
                    width: 160px;
                    flex-shrink: 0;
                }
                .movie-card:hover { transform: scale(1.04); }

                .movie-card-poster {
                    position: relative;
                    aspect-ratio: 2/3;
                    overflow: hidden;
                    border-radius: var(--radius);
                    background: var(--clr-surface-container);
                    border: 1px solid rgba(89,65,61,0.15);
                    transition: box-shadow 0.4s ease;
                }
                .movie-card:hover .movie-card-poster {
                    box-shadow: 0 0 30px 8px rgba(192, 57, 43, 0.18);
                }

                .movie-poster-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                    transition: transform 0.5s ease;
                }
                .movie-card:hover .movie-poster-img { transform: scale(1.06); }

                .movie-indie-badge {
                    position: absolute;
                    top: 0.5rem;
                    left: 0.5rem;
                    background: rgba(0, 114, 150, 0.85);
                    color: #c0e8ff;
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 0.15rem 0.5rem;
                    border-radius: var(--radius-full);
                    backdrop-filter: blur(4px);
                    z-index: 2;
                }

                .movie-score-overlay {
                    position: absolute;
                    top: 0.75rem;
                    right: 0.75rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 2;
                }
                .movie-card:hover .movie-score-overlay { opacity: 1; }
                .movie-score-badge {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: rgba(19,19,19,0.85);
                    backdrop-filter: blur(8px);
                    border: 1.5px solid var(--clr-primary-container);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--clr-primary);
                    font-size: 1rem;
                }

                .movie-card-body {
                    padding: 0.75rem 0.25rem 0.5rem;
                }
                .movie-card-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    line-height: 1.3;
                    margin-bottom: 0.2rem;
                    color: var(--clr-on-surface);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: color 0.2s;
                }
                .movie-card:hover .movie-card-title { color: var(--clr-primary); }
                .movie-card-meta {
                    font-size: 0.78rem;
                    color: var(--clr-secondary);
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </>
    );
}
