import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Other'];

export default function Upload() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', genre: '', director: '', actors: '', plot: '', posterUrl: '', streamingLinks: [{ platform: '', url: '' }] });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            const links = form.streamingLinks.filter(l => l.platform.trim() && l.url.trim());
            const res = await movieService.upload({ ...form, streamingLinks: links });
            setSuccess('Film uploaded successfully!');
            setTimeout(() => navigate(`/movie/${res.data._id}`), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '680px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>🎥 Upload Your Film</h1>
                <p style={{ marginBottom: '2rem' }}>Share your independent project with the FilmCircle community.</p>

                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✓ {success}</div>}

                <form className="card" style={{ padding: '2rem' }} onSubmit={handleSubmit}>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Film title" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Genre</label>
                            <select className="form-select" name="genre" value={form.genre} onChange={handleChange}>
                                <option value="">Select genre…</option>
                                {GENRES.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Director</label>
                            <input className="form-input" name="director" value={form.director} onChange={handleChange} placeholder="Director name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cast</label>
                            <input className="form-input" name="actors" value={form.actors} onChange={handleChange} placeholder="Main actors" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description / Plot</label>
                        <textarea className="form-textarea" name="plot" value={form.plot} onChange={handleChange} placeholder="Briefly describe your film…" rows={3} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Poster Image URL</label>
                        <input className="form-input" name="posterUrl" type="url" value={form.posterUrl} onChange={handleChange} placeholder="https://…" />
                        {form.posterUrl && <img src={form.posterUrl} alt="Poster preview" style={{ marginTop: '0.5rem', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} onError={e => e.target.style.display = 'none'} />}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Where to Watch (Streaming Links)</label>
                        {form.streamingLinks.map((link, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input className="form-input" style={{ flex: '0 0 140px' }} placeholder="Platform (e.g. YouTube)" value={link.platform} onChange={e => handleLinkChange(i, 'platform', e.target.value)} />
                                <input className="form-input" placeholder="URL" type="url" value={link.url} onChange={e => handleLinkChange(i, 'url', e.target.value)} />
                            </div>
                        ))}
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addLink}>+ Add another link</button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Uploading…' : '🚀 Upload Film'}
                    </button>
                </form>
            </div>
        </main>
    );
}
