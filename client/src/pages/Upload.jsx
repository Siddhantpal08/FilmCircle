import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Other'];
const POSTER_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%23161622'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' fill='%234a4a6a' font-size='40'%3E🎬%3C/text%3E%3Ctext x='50%25' y='68%25' text-anchor='middle' fill='%234a4a6a' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function Upload() {
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const [form, setForm] = useState({ title: '', genre: '', director: '', actors: '', plot: '', posterUrl: '', streamingLinks: [{ platform: '', url: '' }] });
    const [posterMode, setPosterMode] = useState('url'); // 'url' | 'file'
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleLinkChange = (i, field, val) => setForm(f => {
        const links = [...f.streamingLinks];
        links[i] = { ...links[i], [field]: val };
        return { ...f, streamingLinks: links };
    });
    const addLink = () => setForm(f => ({ ...f, streamingLinks: [...f.streamingLinks, { platform: '', url: '' }] }));
    const removeLink = (i) => setForm(f => ({ ...f, streamingLinks: f.streamingLinks.filter((_, idx) => idx !== i) }));

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPosterFile(file);
        const reader = new FileReader();
        reader.onload = ev => setPosterPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleUrlChange = (e) => {
        setForm(f => ({ ...f, posterUrl: e.target.value }));
        setPosterPreview(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            const links = form.streamingLinks.filter(l => l.platform.trim() && l.url.trim());
            // If file mode, use the base64 preview as posterUrl (in a real app you'd upload to a CDN)
            const posterUrl = posterMode === 'file' ? posterPreview : form.posterUrl;
            const res = await movieService.upload({ ...form, posterUrl, streamingLinks: links });
            setSuccess('Film uploaded successfully! Redirecting…');
            setTimeout(() => navigate(`/movie/${res.data._id}`), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally { setLoading(false); }
    };

    const currentPreview = posterMode === 'url' ? posterPreview : posterPreview;

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '680px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>🎥 Upload Your Film</h1>
                <p style={{ marginBottom: '2rem', color: 'var(--clr-text-muted)' }}>Share your independent project with the FilmCircle community.</p>

                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✓ {success}</div>}

                <form className="card" style={{ padding: '2rem' }} onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Film title" required disabled={loading} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Genre</label>
                            <select className="form-select" name="genre" value={form.genre} onChange={handleChange} disabled={loading}>
                                <option value="">Select genre…</option>
                                {GENRES.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Director</label>
                            <input className="form-input" name="director" value={form.director} onChange={handleChange} placeholder="Director name" disabled={loading} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cast</label>
                            <input className="form-input" name="actors" value={form.actors} onChange={handleChange} placeholder="Main actors" disabled={loading} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description / Plot</label>
                        <textarea className="form-textarea" name="plot" value={form.plot} onChange={handleChange} placeholder="Briefly describe your film…" rows={3} disabled={loading} />
                    </div>

                    {/* Poster Upload */}
                    <div className="form-group">
                        <label className="form-label">Poster Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <button type="button"
                                className={`btn btn-sm ${posterMode === 'url' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => { setPosterMode('url'); setPosterPreview(form.posterUrl); }}>
                                🔗 URL
                            </button>
                            <button type="button"
                                className={`btn btn-sm ${posterMode === 'file' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setPosterMode('file')}>
                                📁 Upload File
                            </button>
                        </div>

                        {posterMode === 'url' ? (
                            <input className="form-input" name="posterUrl" type="url" value={form.posterUrl}
                                onChange={handleUrlChange} placeholder="https://…" disabled={loading} />
                        ) : (
                            <div>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()}>
                                    {posterFile ? `📎 ${posterFile.name}` : 'Choose file…'}
                                </button>
                            </div>
                        )}

                        {/* Poster preview or placeholder */}
                        <div style={{ marginTop: '0.75rem', width: '120px', height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#161622', flexShrink: 0 }}>
                            <img
                                src={currentPreview || POSTER_PLACEHOLDER}
                                alt="Poster preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.src = POSTER_PLACEHOLDER; }}
                            />
                        </div>
                    </div>

                    {/* Streaming Links */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Where to Watch</label>
                        {form.streamingLinks.map((link, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input className="form-input" style={{ flex: '0 0 140px' }} placeholder="Platform" value={link.platform} onChange={e => handleLinkChange(i, 'platform', e.target.value)} disabled={loading} />
                                <input className="form-input" placeholder="URL" type="url" value={link.url} onChange={e => handleLinkChange(i, 'url', e.target.value)} disabled={loading} />
                                {form.streamingLinks.length > 1 && (
                                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-error)', flexShrink: 0 }} onClick={() => removeLink(i)}>✕</button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addLink} disabled={loading}>+ Add link</button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Uploading…
                            </>
                        ) : '🚀 Upload Film'}
                    </button>
                </form>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </main>
    );
}
