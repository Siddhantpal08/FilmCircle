import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import InfographicChart from '../components/movie/InfographicChart';
import ReviewButtons from '../components/movie/ReviewButtons';
import Loader from '../components/common/Loader';

const FALLBACK = 'https://via.placeholder.com/300x450/13131f/7c5cfc?text=No+Poster';

export default function MovieDetail() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [movie, setMovie] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReviews = async () => {
        const res = await reviewService.getForMovie(id);
        setReviewData(res.data);
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            movieService.getById(id).then(r => setMovie(r.data)),
            reviewService.getForMovie(id).then(r => setReviewData(r.data)),
            ...(isAuthenticated ? [reviewService.getMyReview(id).then(r => setMyReview(r.data)).catch(() => { })] : []),
        ])
            .catch(() => setError('Movie not found or data unavailable.'))
            .finally(() => setLoading(false));
    }, [id, isAuthenticated]);

    if (loading) return <div className="page"><Loader /></div>;
    if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;
    if (!movie) return null;

    const title = movie.Title || movie.title;
    const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : (movie.posterUrl || FALLBACK);
    const genre = movie.Genre || movie.genre || '—';
    const director = movie.Director || movie.director || '—';
    const plot = movie.Plot || movie.plot || 'No description available.';
    const year = movie.Year || movie.year || '';
    const actors = movie.Actors || movie.actors || '';
    const imdbRating = movie.imdbRating;
    const streaming = movie.streamingLinks || [];
    const isIndie = movie.isIndependent;

    return (
        <main className="page">
            <div className="container">
                <div className="movie-detail-grid">
                    {/* Poster */}
                    <div className="poster-col">
                        <img src={poster} alt={title} className="detail-poster" onError={e => { e.target.src = FALLBACK; }} />
                        {isIndie && <span className="badge badge-indie" style={{ marginTop: '0.75rem' }}>🎬 Independent Film</span>}
                        {imdbRating && <div className="imdb-badge">⭐ IMDb: {imdbRating}</div>}
                    </div>

                    {/* Info */}
                    <div className="info-col">
                        <h1 className="movie-title">{title} {year && <span className="movie-year">({year})</span>}</h1>
                        {genre && <div className="genre-tags">{genre.split(',').map(g => <span key={g} className="badge badge-primary">{g.trim()}</span>)}</div>}
                        <p className="movie-plot">{plot}</p>
                        {director && <div className="meta-row"><strong>Director:</strong> {director}</div>}
                        {actors && <div className="meta-row"><strong>Cast:</strong> {actors}</div>}

                        {/* Streaming Links */}
                        {streaming.length > 0 && (
                            <div className="streaming-section">
                                <h3>Watch On</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    {streaming.map((s, i) => (
                                        <a key={i} href={s.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">▶ {s.platform}</a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        <div className="review-section">
                            <h3>Community Opinion</h3>
                            {reviewData && <InfographicChart distribution={reviewData.distribution} total={reviewData.total} percentages={reviewData.percentages} />}
                        </div>

                        {/* Submit Review */}
                        {isAuthenticated ? (
                            <div>
                                <h3>Your Opinion</h3>
                                <ReviewButtons movieId={id} existingReview={myReview} onUpdate={fetchReviews} />
                            </div>
                        ) : (
                            <p style={{ marginTop: '1rem' }}>
                                <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Login</Link> to submit your opinion.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .movie-detail-grid { display: grid; grid-template-columns: 280px 1fr; gap: 3rem; padding-top: 1rem; }
        .detail-poster { width: 100%; border-radius: var(--radius); box-shadow: var(--shadow); }
        .imdb-badge { margin-top: 0.5rem; background: rgba(247,183,49,0.15); color: var(--clr-accent); padding: 0.3rem 0.75rem; border-radius: var(--radius-sm); font-weight: 600; display: inline-block; }
        .movie-title { margin-bottom: 0.5rem; }
        .movie-year { color: var(--clr-text-muted); font-size: 0.7em; }
        .genre-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
        .movie-plot { color: var(--clr-text-muted); line-height: 1.7; margin-bottom: 1rem; }
        .meta-row { font-size: 0.9rem; color: var(--clr-text-muted); margin-bottom: 0.4rem; }
        .meta-row strong { color: var(--clr-text); }
        .streaming-section, .review-section { margin-top: 1.5rem; }
        .streaming-section h3, .review-section h3 { margin-bottom: 0.75rem; }
        @media (max-width: 768px) { .movie-detail-grid { grid-template-columns: 1fr; } .poster-col { max-width: 260px; margin: 0 auto; } }
      `}</style>
        </main>
    );
}
