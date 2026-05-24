import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { movieService, reviewService, bookmarkService } from '../services';
import { useAuth } from '../context/AuthContext';
import InfographicChart from '../components/movie/InfographicChart';
import Loader from '../components/common/Loader';
import CustomSelect from '../components/common/CustomSelect';

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23201f1f'/%3E%3Ctext x='50%25' y='44%25' text-anchor='middle' fill='%23c0392b' font-size='60'%3E%F0%9F%8E%AC%3C/text%3E%3Ctext x='50%25' y='57%25' text-anchor='middle' fill='%23a88a85' font-size='16'%3ENo Poster%3C/text%3E%3C/svg%3E";
const OPINIONS = [
    { key: 'skip', emoji: '⏭️', label: 'Skip', color: '#888' },
    { key: 'considerable', emoji: '🤔', label: 'Timepass', color: '#c8c6c5' },
    { key: 'goForIt', emoji: '✅', label: 'Go For It', color: '#ffb4a9' },
    { key: 'excellent', emoji: '⭐', label: 'Perfection', color: '#c0392b' },
];
const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Other'];
const GENRE_OPTIONS = [{ value: '', label: 'Select genre…' }, ...GENRES.map(g => ({ value: g, label: g }))];
const FIVE_MIN = 5 * 60 * 1000;

// Countdown hook — tracks time remaining within the 5-min edit window
function useEditTimer(createdAt) {
    const [secsLeft, setSecsLeft] = useState(() => {
        if (!createdAt) return 0;
        return Math.max(0, Math.ceil((FIVE_MIN - (Date.now() - new Date(createdAt).getTime())) / 1000));
    });
    const ref = useRef(null);
    useEffect(() => {
        if (!createdAt) return;
        const tick = () => {
            const remaining = FIVE_MIN - (Date.now() - new Date(createdAt).getTime());
            setSecsLeft(Math.max(0, Math.ceil(remaining / 1000)));
            if (remaining <= 0) clearInterval(ref.current);
        };
        ref.current = setInterval(tick, 1000);
        return () => clearInterval(ref.current);
    }, [createdAt]);
    return secsLeft;
}

// Read-only card — shown when review is locked (past 5-min window)
function SubmittedOpinionCard({ review }) {
    const op = OPINIONS.find(o => o.key === review.opinion) || OPINIONS[0];
    return (
        <div className="submitted-opinion-card" style={{ borderColor: op.color, background: `${op.color}12` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: review.comment ? '0.75rem' : 0 }}>
                <span style={{ fontSize: '2rem' }}>{op.emoji}</span>
                <div>
                    <div style={{ fontWeight: 700, color: op.color, fontSize: '1.05rem' }}>{op.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--clr-secondary)' }}>Your opinion · locked</div>
                </div>
            </div>
            {review.comment && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--clr-secondary)', borderTop: `1px solid ${op.color}33`, paddingTop: '0.65rem', lineHeight: 1.6 }}>
                    "{review.comment}"
                </p>
            )}
        </div>
    );
}

// Editable form — shown within the 5-min window (both new submission AND edits)
function OpinionForm({ movieId, existingReview, secsLeft, onUpdate }) {
    const [selected, setSelected] = useState(existingReview?.opinion || null);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
    const ss = String(secsLeft % 60).padStart(2, '0');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selected) { setError('Please select an opinion first.'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            if (existingReview?._id) {
                await reviewService.update(existingReview._id, { opinion: selected, comment });
                setSuccess('Opinion updated!');
            } else {
                await reviewService.submit({ movieId, opinion: selected, comment });
                setSuccess('Opinion submitted!');
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {existingReview && secsLeft > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#f5a623', fontWeight: 600 }}>⏱ {mm}:{ss}</span> remaining to change your opinion
                </div>
            )}
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
                <label className="form-label">Add a comment <span style={{ color: 'var(--clr-secondary)', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                    className="form-textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Share your thoughts…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    disabled={loading}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-secondary)', textAlign: 'right' }}>{comment.length}/500</div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={loading || !selected}>
                {loading ? (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Submitting…</>) : existingReview ? 'Update Opinion' : 'Submit Opinion'}
            </button>
            {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>✓ {success}</div>}
        </form>
    );
}

// Shows a handful of other community opinions below the chart
function ReviewFeed({ reviews }) {
    if (!reviews || reviews.length === 0) return null;
    const opMap = Object.fromEntries(OPINIONS.map(o => [o.key, o]));
    return (
        <div className="review-feed">
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--clr-secondary)' }}>What others said</h4>
            {reviews.map((r, i) => {
                const op = opMap[r.opinion] || opMap.skip;
                return (
                    <div key={r._id || i} className="review-feed-item" style={{ borderLeftColor: op.color }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: r.comment ? '0.3rem' : 0 }}>
                            <span style={{ fontSize: '1.1rem' }}>{op.emoji}</span>
                            <strong style={{ color: op.color, fontSize: '0.85rem' }}>{op.label}</strong>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>
                                {r.username || 'User'}
                            </span>
                        </div>
                        {r.comment && <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--clr-secondary)', lineHeight: 1.5 }}>"{r.comment}"</p>}
                    </div>
                );
            })}
        </div>
    );
}

export default function MovieDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const titleHint = searchParams.get('title') || '';
    const posterHint = searchParams.get('poster') || '';
    const yearHint = searchParams.get('year') || '';
    const { isAuthenticated, user } = useAuth();
    const [movie, setMovie] = useState(null);
    const [reviewData, setReviewData] = useState(null);
    const [myReview, setMyReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editPosterPreview, setEditPosterPreview] = useState('');
    const editPosterRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isInteresting, setIsInteresting] = useState(false);

    useEffect(() => {
        if (id) {
            setIsBookmarked(bookmarkService.has(id));
            const interestingMap = JSON.parse(localStorage.getItem('filmcircle_interesting') || '{}');
            setIsInteresting(!!interestingMap[id]);
        }
    }, [id]);

    const toggleBookmark = () => {
        if (!movie) return;
        const rawPoster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : (movie.posterUrl || '');
        const state = bookmarkService.toggle({
            _id: movie._id,
            imdbID: movie.imdbID || movie._id,
            title: movie.Title || movie.title,
            Title: movie.Title || movie.title,
            Poster: rawPoster,
            posterUrl: rawPoster,
            Year: movie.Year || movie.year || '',
            year: movie.Year || movie.year || '',
            Genre: movie.Genre || movie.genre || '',
            genre: movie.Genre || movie.genre || '',
            isIndependent: movie.isIndependent
        });
        setIsBookmarked(state);
    };

    const toggleInteresting = () => {
        if (!id || !movie) return;
        const rawPoster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : (movie.posterUrl || '');
        const interestingMap = JSON.parse(localStorage.getItem('filmcircle_interesting') || '{}');
        const nextState = !interestingMap[id];
        if (nextState) {
            interestingMap[id] = {
                _id: movie._id,
                imdbID: movie.imdbID || movie._id,
                title: movie.Title || movie.title,
                Title: movie.Title || movie.title,
                Poster: rawPoster,
                posterUrl: rawPoster,
                Year: movie.Year || movie.year || '',
                year: movie.Year || movie.year || '',
                Genre: movie.Genre || movie.genre || '',
                genre: movie.Genre || movie.genre || '',
                isIndependent: movie.isIndependent
            };
        } else {
            delete interestingMap[id];
        }
        localStorage.setItem('filmcircle_interesting', JSON.stringify(interestingMap));
        setIsInteresting(nextState);

        // Sync the vote to the backend leaderboard (fire-and-forget — UI is already updated above)
        movieService.toggleInteresting(id, {
            title: movie.Title || movie.title,
            posterUrl: rawPoster,
            year: movie.Year || movie.year || '',
        }).catch(err => console.warn('[Interesting] backend sync error:', err));
    };

    const secsLeft = useEditTimer(myReview?.createdAt);
    const canEdit = secsLeft > 0;

    const fetchAll = () => {
        setLoading(true);
        Promise.all([
            // Pass titleHint, posterHint, yearHint so backend can resolve TMDB numeric IDs via OMDB title lookup or fallback
            movieService.getById(id, titleHint, posterHint, yearHint).then(r => setMovie(r.data)),
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
        <main className="page" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `url(${poster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(80px) brightness(0.12)',
                opacity: 0.5,
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
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
                            <p style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                                🔗 No watch link provided
                            </p>
                        )}
                        {imdbRating && <div className="imdb-badge" style={{ display: 'block', textAlign: 'center', marginTop: '0.75rem' }}>⭐ IMDb: {imdbRating}</div>}
                        
                        {isAuthenticated && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <button 
                                    className={`btn btn-sm ${isInteresting ? 'btn-primary' : 'btn-outline'}`} 
                                    onClick={toggleInteresting}
                                    style={{ width: '100%', justifyContent: 'center', gap: '0.35rem' }}
                                >
                                    {isInteresting ? '🔥 Interesting!' : '✨ Mark Interesting'}
                                </button>
                                <button 
                                    className={`btn btn-sm ${isBookmarked ? 'btn-primary' : 'btn-outline'}`} 
                                    onClick={toggleBookmark}
                                    style={{ width: '100%', justifyContent: 'center', gap: '0.35rem' }}
                                >
                                    {isBookmarked ? '🔖 Bookmarked' : '📌 Bookmark Film'}
                                </button>
                            </div>
                        )}

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
                                setEditPosterPreview(movie.posterUrl || '');
                                setEditMode(true);
                            }}>Edit Film</button>
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

                                {/* Streaming / Watch links */}
                                {streaming.length > 0 && (
                                    <div className="streaming-section">
                                        <h3>Watch On</h3>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                            {streaming.map((s, i) => (
                                                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                                                    ▶ {s.platform}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Community Opinion chart + reviews */}
                                <div className="review-section">
                                    <h3>Community Opinion</h3>
                                    {reviewData && reviewData.total > 0 ? (
                                        <>
                                            <InfographicChart distribution={reviewData.distribution} total={reviewData.total} percentages={reviewData.percentages} />
                                            <ReviewFeed reviews={reviewData.reviews} />
                                        </>
                                    ) : (
                                        <p style={{ color: 'var(--clr-secondary)', fontSize: '0.9rem' }}>No opinions yet. Be the first!</p>
                                    )}
                                </div>

                                {/* Your Opinion */}
                                <div className="review-section">
                                    <h3>Your Opinion</h3>
                                    {isAuthenticated ? (
                                        myReview ? (
                                            canEdit ? (
                                                <OpinionForm movieId={id} existingReview={myReview} secsLeft={secsLeft} onUpdate={fetchAll} />
                                            ) : (
                                                <SubmittedOpinionCard review={myReview} />
                                            )
                                        ) : (
                                            <OpinionForm movieId={id} existingReview={null} secsLeft={0} onUpdate={fetchAll} />
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
                                        <CustomSelect
                                            value={editForm.genre}
                                            onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                                            options={GENRE_OPTIONS}
                                        />
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
                                    <label className="form-label">Poster Image</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        {/* Preview */}
                                        <div style={{ width: '90px', height: '135px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#161622', flexShrink: 0 }}>
                                            <img
                                                src={editPosterPreview || FALLBACK}
                                                alt="Poster preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={e => { e.target.src = FALLBACK; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                                            <input
                                                ref={editPosterRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = ev => {
                                                        setEditPosterPreview(ev.target.result);
                                                        setEditForm(f => ({ ...f, posterUrl: ev.target.result }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => editPosterRef.current.click()}
                                            >
                                                📁 Upload Poster
                                            </button>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--clr-secondary)' }}>— or paste URL —</span>
                                            <input
                                                className="form-input"
                                                type="text"
                                                placeholder="https://…"
                                                value={editForm.posterUrl?.startsWith('data:') ? '' : (editForm.posterUrl || '')}
                                                onChange={e => {
                                                    setEditForm(f => ({ ...f, posterUrl: e.target.value }));
                                                    setEditPosterPreview(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>
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
                .detail-poster { width: 100%; border-radius: var(--radius); box-shadow: 0 0 40px rgba(0,0,0,0.6); display: block; }
                .imdb-badge { margin-top: 0.5rem; background: rgba(247,183,49,0.1); color: #f7b731; border: 1px solid rgba(247,183,49,0.25); padding: 0.3rem 0.75rem; border-radius: var(--radius-sm); font-weight: 600; display: inline-block; font-size: 0.875rem; }
                .badge-indie { background: rgba(0,114,150,0.15); color: var(--clr-tertiary); border: 1px solid rgba(0,114,150,0.3); font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; letter-spacing: 0.05em; }
                .movie-title { margin-bottom: 0.5rem; font-size: clamp(1.5rem, 3vw, 2.5rem); }
                .movie-year { color: var(--clr-secondary); font-size: 0.7em; }
                .genre-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
                .movie-plot { color: var(--clr-secondary); line-height: 1.7; margin-bottom: 1rem; font-size: 0.95rem; }
                .meta-row { font-size: 0.875rem; color: var(--clr-secondary); margin-bottom: 0.4rem; }
                .meta-row strong { color: var(--clr-on-surface); }
                .streaming-section, .review-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(89,65,61,0.2); }
                .streaming-section h3, .review-section h3 { margin-bottom: 0.75rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--clr-on-surface-variant); font-weight: 700; }
                .review-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.75rem; }
                .opinion-btn { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.85rem; border: 1.5px solid rgba(89,65,61,0.3); border-radius: var(--radius-sm); background: var(--clr-surface-container); color: var(--clr-secondary); cursor: pointer; transition: all 0.2s; font-family: inherit; }
                .opinion-btn:hover { border-color: var(--clr-primary-container); color: var(--clr-on-surface); background: rgba(192,57,43,0.06); transform: translateY(-2px); }
                .opinion-active { font-weight: 700; }

                /* Indie poster overlay */
                .poster-link-wrap { position: relative; display: block; border-radius: var(--radius); overflow: hidden; }
                .poster-link-wrap .detail-poster { transition: filter 0.3s; }
                .poster-link-wrap:hover .detail-poster { filter: brightness(0.5); }
                .poster-watch-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 700; color: #fff; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
                .poster-link-wrap:hover .poster-watch-overlay { opacity: 1; }

                /* Locked opinion card */
                .submitted-opinion-card { border: 1.5px solid; border-radius: var(--radius-sm); padding: 1rem 1.25rem; }

                /* Community review feed */
                .review-feed { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
                .review-feed-item { border-left: 3px solid; padding: 0.55rem 0.9rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; background: var(--clr-surface-high); }

                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) { .movie-detail-grid { grid-template-columns: 1fr; } .poster-col { max-width: 260px; margin: 0 auto; } }
            `}</style>
        </main>
    );
}
