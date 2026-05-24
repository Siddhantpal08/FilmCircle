import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services';
import CustomSelect from '../components/common/CustomSelect';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Other'];
const GENRE_OPTIONS = [{ value: '', label: 'Select genre…' }, ...GENRES.map(g => ({ value: g, label: g }))];

const UploadIcon = () => (
    <svg className="poster-drop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export default function Upload() {
    const navigate = useNavigate();
    const posterInputRef = useRef(null);
    const [form, setForm] = useState({ title: '', genre: '', director: '', actors: '', plot: '', posterUrl: '', streamingLinks: [{ platform: '', url: '' }] });
    const [posterPreview, setPosterPreview] = useState('');
    const [isDraggingPoster, setIsDraggingPoster] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const posterReady = !!posterPreview;

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleLinkChange = (i, field, val) => setForm(f => {
        const links = [...f.streamingLinks];
        links[i] = { ...links[i], [field]: val };
        return { ...f, streamingLinks: links };
    });
    const addLink = () => setForm(f => ({ ...f, streamingLinks: [...f.streamingLinks, { platform: '', url: '' }] }));
    const removeLink = (i) => setForm(f => ({ ...f, streamingLinks: f.streamingLinks.filter((_, idx) => idx !== i) }));

    const setPosterFromFile = (file) => {
        if (!file?.type.startsWith('image/')) {
            setError('Poster must be an image file.');
            return;
        }
        setError('');
        const reader = new FileReader();
        reader.onload = (ev) => setPosterPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handlePosterInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) setPosterFromFile(file);
        e.target.value = '';
    };

    const handlePosterDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingPoster(false);
        const file = e.dataTransfer.files?.[0];
        if (file) setPosterFromFile(file);
    };

    const handlePosterUrlBlur = () => {
        const url = form.posterUrl.trim();
        if (url) setPosterPreview(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            const links = form.streamingLinks.filter(l => l.platform.trim() && l.url.trim());
            const posterUrl = posterPreview || form.posterUrl;
            const res = await movieService.upload({ ...form, posterUrl, streamingLinks: links });
            setSuccess('Film uploaded successfully! Redirecting…');
            setTimeout(() => navigate(`/movie/${res.data._id}`), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <main className="page upload-page">
            <div className="container upload-container">
                <header className="upload-header">
                    <h1>Upload Your Film</h1>
                    <p>Share your independent project with the FilmCircle community.</p>
                </header>

                {error && <div className="alert alert-error upload-alert">{error}</div>}
                {success && <div className="alert alert-success upload-alert">✓ {success}</div>}

                <form className="upload-grid" onSubmit={handleSubmit}>
                    <div className="upload-col-left">
                        <div className="upload-field-block">
                            <label className="form-label upload-label">Film Poster</label>
                            <input
                                ref={posterInputRef}
                                type="file"
                                accept="image/*"
                                className="upload-hidden-input"
                                onChange={handlePosterInputChange}
                                disabled={loading}
                            />
                            <div
                                className={`poster-dropzone ${isDraggingPoster ? 'is-dragging' : ''} ${posterReady ? 'has-image' : ''}`}
                                onDragEnter={(e) => { e.preventDefault(); setIsDraggingPoster(true); }}
                                onDragOver={(e) => { e.preventDefault(); setIsDraggingPoster(true); }}
                                onDragLeave={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingPoster(false);
                                }}
                                onDrop={handlePosterDrop}
                                onClick={() => !loading && posterInputRef.current?.click()}
                                onKeyDown={(e) => { if (e.key === 'Enter') posterInputRef.current?.click(); }}
                                role="button"
                                tabIndex={0}
                            >
                                {posterReady ? (
                                    <img
                                        src={posterPreview}
                                        alt="Poster preview"
                                        className="poster-dropzone-img"
                                    />
                                ) : (
                                    <div className="poster-dropzone-empty">
                                        <UploadIcon />
                                        <span className="poster-drop-text">Drag &amp; drop poster</span>
                                        <span className="poster-drop-hint">JPG or PNG</span>
                                    </div>
                                )}
                            </div>
                            <input
                                className="form-input upload-compact-input"
                                name="posterUrl"
                                type="url"
                                value={form.posterUrl}
                                onChange={handleChange}
                                onBlur={handlePosterUrlBlur}
                                placeholder="Or paste poster URL…"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="upload-col-right">
                        <div className="upload-row-2">
                            <div className="upload-field-block">
                                <label className="form-label upload-label">Title <span className="upload-required">*</span></label>
                                <input className="form-input upload-compact-input" name="title" value={form.title} onChange={handleChange} placeholder="Film title" required disabled={loading} />
                            </div>
                            <div className="upload-field-block">
                                <label className="form-label upload-label">Genre</label>
                                <CustomSelect
                                    name="genre"
                                    value={form.genre}
                                    onChange={handleChange}
                                    options={GENRE_OPTIONS}
                                    disabled={loading}
                                    className="upload-compact-select"
                                />
                            </div>
                        </div>

                        <div className="upload-row-2">
                            <div className="upload-field-block">
                                <label className="form-label upload-label">Director</label>
                                <input className="form-input upload-compact-input" name="director" value={form.director} onChange={handleChange} placeholder="Director name" disabled={loading} />
                            </div>
                            <div className="upload-field-block">
                                <label className="form-label upload-label">Cast</label>
                                <input className="form-input upload-compact-input" name="actors" value={form.actors} onChange={handleChange} placeholder="Main actors" disabled={loading} />
                            </div>
                        </div>

                        <div className="upload-field-block">
                            <label className="form-label upload-label">Description / Plot</label>
                            <textarea
                                className="form-textarea upload-compact-input upload-plot"
                                name="plot"
                                value={form.plot}
                                onChange={handleChange}
                                placeholder="Briefly describe your film…"
                                rows={3}
                                disabled={loading}
                            />
                        </div>

                        <div className="upload-field-block upload-watch-block">
                            <label className="form-label upload-label">Where to Watch</label>
                            <p className="upload-watch-hint">Add links where viewers can watch your film (YouTube, Vimeo, Netflix, etc.).</p>
                            {form.streamingLinks.map((link, i) => (
                                <div key={i} className="watch-link-row">
                                    <input
                                        className="form-input upload-compact-input"
                                        placeholder="Platform"
                                        value={link.platform}
                                        onChange={e => handleLinkChange(i, 'platform', e.target.value)}
                                        disabled={loading}
                                    />
                                    <input
                                        className="form-input upload-compact-input"
                                        placeholder="URL"
                                        type="url"
                                        value={link.url}
                                        onChange={e => handleLinkChange(i, 'url', e.target.value)}
                                        disabled={loading}
                                    />
                                    {form.streamingLinks.length > 1 && (
                                        <button type="button" className="watch-link-remove" onClick={() => removeLink(i)} disabled={loading} aria-label="Remove link">×</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="upload-add-link" onClick={addLink} disabled={loading}>+ Add link</button>
                        </div>
                    </div>

                    <div className="upload-col-footer">
                        <button type="submit" className="upload-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-spin">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Uploading…
                                </>
                            ) : 'Upload Film'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes upload-spin { to { transform: rotate(360deg); } }

                .upload-page {
                    padding-top: 6rem;
                    padding-bottom: 1.5rem;
                }
                .upload-container { max-width: 1180px; }
                .upload-header { margin-bottom: 1rem; }
                .upload-header h1 {
                    margin: 0 0 0.35rem;
                    font-size: clamp(1.5rem, 2.5vw, 1.85rem);
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: var(--clr-on-surface);
                }
                .upload-header p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--clr-secondary);
                }
                .upload-alert { margin-bottom: 0.75rem; }

                .upload-grid {
                    display: grid;
                    grid-template-columns: minmax(220px, 35%) 1fr;
                    gap: 1.25rem 2rem;
                    align-items: start;
                }
                .upload-col-footer { grid-column: 1 / -1; padding-top: 0.25rem; }
                .upload-col-left,
                .upload-col-right {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    min-width: 0;
                }
                .upload-field-block {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .upload-label {
                    margin: 0;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--clr-on-surface);
                }
                .upload-required { color: #C0392B; }
                .upload-compact-input {
                    font-size: 0.875rem;
                    padding: 0.5rem 0.7rem;
                }
                .upload-compact-select .custom-select-trigger {
                    padding: 0.5rem 0.7rem;
                    font-size: 0.875rem;
                }
                .upload-row-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .upload-plot {
                    min-height: 4.5rem;
                    max-height: 5.5rem;
                    resize: vertical;
                    line-height: 1.45;
                }
                .upload-watch-hint {
                    margin: 0 0 0.35rem;
                    font-size: 0.78rem;
                    color: var(--clr-secondary);
                    line-height: 1.4;
                }
                .upload-hidden-input { display: none; }

                .poster-dropzone {
                    position: relative;
                    width: 100%;
                    height: 300px;
                    border: 2px dashed #C0392B;
                    border-radius: var(--radius);
                    overflow: hidden;
                    cursor: pointer;
                    background: #161616;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .poster-dropzone:hover,
                .poster-dropzone.is-dragging {
                    border-color: #e74c3c;
                    box-shadow: 0 0 0 1px rgba(192, 57, 43, 0.2);
                }
                .poster-dropzone.has-image { border-style: solid; border-color: rgba(89, 65, 61, 0.4); }
                .poster-dropzone-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .poster-dropzone-empty {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 1rem;
                }
                .poster-drop-icon { color: #C0392B; margin-bottom: 0.5rem; }
                .poster-drop-text {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--clr-on-surface);
                }
                .poster-drop-hint {
                    font-size: 0.72rem;
                    color: var(--clr-secondary);
                    margin-top: 0.2rem;
                }

                .watch-link-row {
                    display: grid;
                    grid-template-columns: 0.9fr 1.4fr auto;
                    gap: 0.4rem;
                    align-items: center;
                    margin-bottom: 0.4rem;
                }
                .watch-link-remove {
                    width: 28px;
                    height: 28px;
                    border: none;
                    border-radius: var(--radius-sm);
                    background: rgba(89, 65, 61, 0.2);
                    color: var(--clr-secondary);
                    font-size: 1.1rem;
                    cursor: pointer;
                    line-height: 1;
                }
                .watch-link-remove:hover { color: #C0392B; }
                .upload-add-link {
                    align-self: flex-start;
                    padding: 0;
                    border: none;
                    background: none;
                    color: #C0392B;
                    font-size: 0.78rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                }
                .upload-add-link:hover { text-decoration: underline; }

                .upload-submit-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.85rem 1.5rem;
                    border: none;
                    border-radius: var(--radius-sm);
                    background: #C0392B;
                    color: #fff;
                    font-size: 0.95rem;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .upload-submit-btn:hover:not(:disabled) { background: #a93226; }
                .upload-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .upload-spin { animation: upload-spin 0.8s linear infinite; }

                @media (max-width: 900px) {
                    .upload-grid { grid-template-columns: 1fr; }
                    .poster-dropzone { max-width: 220px; margin: 0 auto; }
                    .upload-row-2 { grid-template-columns: 1fr; }
                }
            `}</style>
        </main>
    );
}
