import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieService, reviewService } from '../services';
import { useAuth } from '../context/AuthContext';
import InfographicChart from '../components/movie/InfographicChart';
import Loader from '../components/common/Loader';

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23161622'/%3E%3Ctext x='50%25' y='44%25' text-anchor='middle' fill='%234a4a6a' font-size='60'%3E🎬%3C/text%3E%3Ctext x='50%25' y='57%25' text-anchor='middle' fill='%234a4a6a' font-size='16'%3ENo Poster%3C/text%3E%3C/svg%3E";
const OPINIONS = [
    { key: 'skip', emoji: '⏭️', label: 'Skip', color: '#e84545' },
    { key: 'considerable', emoji: '🤔', label: 'Considerable', color: '#f5a623' },
    { key: 'goForIt', emoji: '✅', label: 'Go For It', color: '#3cb878' },
    { key: 'excellent', emoji: '⭐', label: 'Excellent', color: '#7c5cfc' },
];
const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Other'];

// Read-only card shown once a user has already submitted their opinion
function SubmittedOpinionCard({ review }) {
    const op = OPINIONS.find(o => o.key === review.opinion) || OPINIONS[0];
    return (
        <div className="submitted-opinion-card" style={{ borderColor: op.color, background: `${op.color}12` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: review.comment ? '0.75rem' : 0 }}>
                <span style={{ fontSize: '2rem' }}>{op.emoji}</span>
                <div>
                    <div style={{ fontWeight: 700, color: op.color, fontSize: '1.05rem' }}>{op.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Your opinion · cannot be changed</div>
                </div>
            </div>
            {review.comment && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--clr-text-muted)', borderTop: `1px solid ${op.color}33`, paddingTop: '0.65rem', lineHeight: 1.6 }}>
                    "{review.comment}"
                </p>
            )}
        </div>
    );
}

function OpinionForm({ movieId, onUpdate }) {
    const [selected, setSelected] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selected) { setError('Please select an opinion first.'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            await reviewService.submit({ movieId, opinion: selected, comment });
            setSuccess('Opinion submitted!');
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit opinion.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="review-btn-grid">
                {OPINIONS.map(({ key, emoji, label, color }) => (
                    <button
                        key={key}
                        type="button"
                        className={`opinion-btn ${selected === key ? 'opinion-active' : ''}`}
                        style={selected === key ? { borderColor: color, background: `${color}22`, color } : {}}
                        onClick={() => setSelected(key)}
                        disabled={loading}
                    >
                        <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Add a comment <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                    className="form-textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Share your thoughts about this film…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    disabled={loading}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textAlign: 'right' }}>{comment.length}/500</div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading || !selected}>
                {loading ? (
                    <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Submitting…
                    </>
                ) : 'Submit Opinion'}
            </button>
            {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>✓ {success}</div>}
        </form>
    );
}

export default function MovieDetail() {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const [movie, setMovie] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const fetchAll = () => {
        setLoading(true);
        Promise.all([
            movieService.getById(id).then(r => setMovie(r.data)),
            reviewService.getForMovie(id).then(r => setReviewData(r.data)).catch(() => setReviewData(null)),
            ...(isAuthenticated ? [reviewService.getMyReview(id).then(r => setMyReview(r.data)).catch(() => { })] : []),
        ])
            .catch(() => setError('Movie not found or data unavailable.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, [id, isAuthenticated]);

    if (loading) return <div className="page"><Loader /></div>;
    if (error) return <div className="page container"><div className="alert alert-error">{error}</div></div>;
    if (!movie) return null;

    const title = movie.Title || movie.title;
    const rawPoster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : (movie.posterUrl || '');
    let poster = rawPoster || FALLBACK;
    if (poster.startsWith('http://')) poster = poster.replace('http://', 'https://');
    const genre = movie.Genre || movie.genre || '—';
    const director = movie.Director || movie.director || '—';
    const plot = movie.Plot || movie.plot || 'No description available.';
    const year = movie.Year || movie.year || '';
    const actors = movie.Actors || movie.actors || '';
    const imdbRating = movie.imdbRating;
    const streaming = movie.streamingLinks || [];
    const isIndie = movie.isIndependent;
    const currentUserId = user?._id || user?.id;
    const uploadedById = movie.uploadedBy?._id || movie.uploadedBy?.id || movie.uploadedBy;
    const isOwner = isAuthenticated && isIndie && currentUserId && (uploadedById?.toString() === currentUserId?.toString());

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const links = (editForm.streamingLinks || []).filter(l => l.platform?.trim() && l.url?.trim());
            await movieService.update(id, { ...editForm, streamingLinks: links });
            setSaveMsg('Saved!');
            setEditMode(false);
            fetchAll();
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (err) {
            setSaveMsg(err.response?.data?.message || 'Failed to save.');
        } finally { setSaving(false); }
    };

    return (
        <main className="page">
            <div className="container">
                <div className="movie-detail-grid">
                    {/* Poster */}
                    <div className="poster-col">
                        {isIndie && streaming.length > 0 ? (
                            <a href={streaming[0].url} target="_blank" rel="noreferrer" className="poster-link-wrap" title={`Watch ${title}`}>
                                <img src={poster} alt={title} className="detail-poster" onError={e => { e.target.src = FALLBACK; }} />
                                <div className="poster-watch-overlay">▶ Watch Now</div>
                            </a>
                        ) : (
                            <img src={poster} alt={title} className="detail-poster" onError={e => { e.target.src = FALLBACK; }} />
                        )}
                        {isIndie && <span className="badge badge-indie" style={{ marginTop: '0.75rem', display: 'block', textAlign: 'center' }}>🎬 Independent Film</span>}
                        {isIndie && streaming.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                                🔗 No watch link provided
                            </p>
                        )}
                        {imdbRating && <div className="imdb-badge">⭐ IMDb: {imdbRating}</div>}
                        {isOwner && !editMode && (
                            <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem', width: '100%' }} onClick={() => {
                                setEditForm({
                                    title: movie.title || '',
                                    genre: movie.genre || '',
                                    director: movie.director || '',
                                    actors: movie.actors || '',
                                    plot: movie.plot || '',
                                    posterUrl: movie.posterUrl || '',
                                    streamingLinks: movie.streamingLinks?.length ? movie.streamingLinks : [{ platform: '', url: '' }],
                                });
                                setEditMode(true);
                            }}>✏️ Edit Film</button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="info-col">
                        {!editMode ? (
                            <>
                                <h1 className="movie-title">{title} {year && <span className="movie-year">({year})</span>}</h1>
                                {genre !== '—' && (
                                    <div className="genre-tags">
                                        {genre.split(',').map(g => <span key={g} className="badge badge-primary">{g.trim()}</span>)}
                                    </div>
                                )}
                                <p className="movie-plot">{plot}</p>
                                {director !== '—' && <div className="meta-row"><strong>Director:</strong> {director}</div>}
                                {actors && <div className="meta-row"><strong>Cast:</strong> {actors}</div>}
                                {saveMsg && <div className="alert alert-success" style={{ marginTop: '0.5rem' }}>✓ {saveMsg}</div>}

                                {/* Streaming / Watch Section */}
                                {streaming.length > 0 && (
                                    <div className="streaming-section">
                                        <h3>Watch On</h3>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                            {streaming.map((s, i) => (
                                                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ gap: '0.4rem' }}>
                                                    ▶ {s.platform}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Community Opinion */}
                                <div className="review-section">
                                    <h3>Community Opinion</h3>
                                    {reviewData ? <InfographicChart distribution={reviewData.distribution} total={reviewData.total} percentages={reviewData.percentages} /> : <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>No opinions yet.</p>}
                                </div>

                                {/* Your Opinion */}
                                <div className="review-section">
                                    <h3>Your Opinion</h3>
                                    {isAuthenticated ? (
                                        myReview ? (
                                            <SubmittedOpinionCard review={myReview} />
                                        ) : (
                                            <OpinionForm movieId={id} onUpdate={fetchAll} />
                                        )
                                    ) : (
                                        <p><Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Login</Link> to submit your opinion.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleSaveEdit}>
                                <h2 style={{ marginBottom: '1rem' }}>Edit Film Details</h2>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Title *</label>
                                        <input className="form-input" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Genre</label>
                                        <select className="form-select" value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}>
                                            <option value="">Select genre…</option>
                                            {GENRES.map(g => <option key={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Director</label>
                                        <input className="form-input" value={editForm.director} onChange={e => setEditForm(f => ({ ...f, director: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Cast</label>
                                        <input className="form-input" value={editForm.actors} onChange={e => setEditForm(f => ({ ...f, actors: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Plot / Description</label>
                                    <textarea className="form-textarea" rows={4} value={editForm.plot} onChange={e => setEditForm(f => ({ ...f, plot: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Poster URL</label>
                                    <input className="form-input" type="url" value={editForm.posterUrl} onChange={e => setEditForm(f => ({ ...f, posterUrl: e.target.value }))} placeholder="https://…" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Streaming Links</label>
                                    {(editForm.streamingLinks || []).map((link, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <input className="form-input" style={{ flex: '0 0 140px' }} placeholder="Platform" value={link.platform} onChange={e => { const l = [...editForm.streamingLinks]; l[i] = { ...l[i], platform: e.target.value }; setEditForm(f => ({ ...f, streamingLinks: l })); }} />
                                            <input className="form-input" placeholder="URL" type="url" value={link.url} onChange={e => { const l = [...editForm.streamingLinks]; l[i] = { ...l[i], url: e.target.value }; setEditForm(f => ({ ...f, streamingLinks: l })); }} />
                                        </div>
                                    ))}
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditForm(f => ({ ...f, streamingLinks: [...(f.streamingLinks || []), { platform: '', url: '' }] }))}>+ Add link</button>
                                </div>
                                {saveMsg && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{saveMsg}</div>}
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .movie-detail-grid { display: grid; grid-template-columns: 280px 1fr; gap: 3rem; padding-top: 1rem; }
                .detail-poster { width: 100%; border-radius: var(--radius); box-shadow: var(--shadow); display: block; }
                .imdb-badge { margin-top: 0.5rem; background: rgba(247,183,49,0.15); color: var(--clr-accent); padding: 0.3rem 0.75rem; border-radius: var(--radius-sm); font-weight: 600; display: inline-block; }
                .movie-title { margin-bottom: 0.5rem; }
                .movie-year { color: var(--clr-text-muted); font-size: 0.7em; }
                .genre-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
                .movie-plot { color: var(--clr-text-muted); line-height: 1.7; margin-bottom: 1rem; }
                .meta-row { font-size: 0.9rem; color: var(--clr-text-muted); margin-bottom: 0.4rem; }
                .meta-row strong { color: var(--clr-text); }
                .streaming-section, .review-section { margin-top: 1.5rem; }
                .streaming-section h3, .review-section h3 { margin-bottom: 0.75rem; }
                .review-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.75rem; }
                .opinion-btn { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 0.75rem; border: 1px solid var(--clr-border); border-radius: var(--radius-sm); background: transparent; color: var(--clr-text-muted); cursor: pointer; transition: all 0.2s; }
                .opinion-btn:hover { border-color: var(--clr-primary); color: var(--clr-text); }
                .opinion-active { font-weight: 600; }

                /* Indie poster – watch overlay */
                .poster-link-wrap { position: relative; display: block; border-radius: var(--radius); overflow: hidden; }
                .poster-link-wrap .detail-poster { transition: filter 0.25s; }
                .poster-link-wrap:hover .detail-poster { filter: brightness(0.55); }
                .poster-watch-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 700; color: #fff; opacity: 0; transition: opacity 0.25s; pointer-events: none; }
                .poster-link-wrap:hover .poster-watch-overlay { opacity: 1; }

                /* Submitted opinion card */
                .submitted-opinion-card { border: 1.5px solid; border-radius: var(--radius-sm); padding: 1rem 1.25rem; }

                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) { .movie-detail-grid { grid-template-columns: 1fr; } .poster-col { max-width: 260px; margin: 0 auto; } }
            `}</style>
        </main>
    );
}
