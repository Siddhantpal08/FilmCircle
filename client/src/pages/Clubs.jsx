import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import CustomSelect from '../components/common/CustomSelect';

const GENRE_FILTERS = ['All', 'Drama', 'Horror', 'Sci-Fi', 'Action', 'Independent', 'Bollywood', 'General'];
const CLUB_GENRES = GENRE_FILTERS.filter(g => g !== 'All');
const CLUB_GENRE_OPTIONS = [{ value: '', label: 'Select genre…' }, ...CLUB_GENRES.map(g => ({ value: g, label: g }))];
const MAX_BANNER_BYTES = 3 * 1024 * 1024;
const MAX_LOGO_BYTES = 1 * 1024 * 1024;
const GENRE_EMOJIS = {
    Drama: '🎭', Horror: '👻', Thriller: '🕵️', 'Sci-Fi': '🤖', Comedy: '😂', Action: '💥',
    Romance: '💘', Independent: '🎥', Documentary: '📚', Animation: '🎨', Bollywood: '🎬',
    International: '🌍', General: '🏛️', All: '✨'
};

const getClubBanner = (genre) => {
    const g = (genre || '').toLowerCase();
    if (g.includes('action')) return '/banners/action.png';
    if (g.includes('horror')) return '/banners/horror.png';
    if (g.includes('sci-fi') || g.includes('scifi')) return '/banners/scifi.png';
    if (g.includes('drama')) return '/banners/drama.png';
    if (g.includes('independent') || g.includes('indie')) return '/banners/indie.png';
    return '/banners/default.png';
};

function ClubCard({ club, onJoin }) {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const emoji = GENRE_EMOJIS[club.genre] || '🏛️';
    const currentUserId = user?._id || user?.id;
    const isJoined = !!currentUserId && club.members?.some(m => m === currentUserId || m._id === currentUserId || m.id === currentUserId);
    const banner = club.bannerUrl || getClubBanner(club.genre);

    return (
        <div className="club-card" onClick={() => navigate(`/clubs/${club._id}`)}>
            <div className="club-card-icon" style={{ backgroundImage: `url(${banner})` }}>
                {club.logoUrl ? (
                    <img src={club.logoUrl} alt="" className="club-logo-badge" />
                ) : (
                    <span className="club-emoji-badge">{emoji}</span>
                )}
            </div>
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: 'var(--clr-on-surface)', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{club.name}</h3>
                    <span className="badge badge-primary" style={{ marginLeft: '0.5rem', flexShrink: 0 }}>{club.genre || 'General'}</span>
                </div>
                {club.description && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--clr-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {club.description}
                    </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)' }}>
                        👥 {club.memberCount || club.members?.length || 0} member{(club.memberCount || club.members?.length) !== 1 ? 's' : ''}
                    </span>
                    {isAuthenticated && (
                        <button
                            className={`btn btn-sm ${isJoined ? 'btn-ghost' : 'btn-outline'}`}
                            style={{ borderRadius: 'var(--radius-sm)', letterSpacing: '0.05em' }}
                            onClick={(e) => { e.stopPropagation(); onJoin(club._id); }}
                        >
                            {isJoined ? '✓ Joined' : 'Join Club'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const readImageFile = (file, maxBytes) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file.'));
        return;
    }
    if (file.size > maxBytes) {
        reject(new Error(`Image must be under ${Math.round(maxBytes / (1024 * 1024))}MB.`));
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
});

const isValidImageUrl = (str) => {
    const s = str.trim();
    if (!s) return false;
    if (s.startsWith('data:image/')) return true;
    try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
};

function MediaTabs({ mode, onChange }) {
    return (
        <div className="club-media-tabs" role="tablist">
            <button
                type="button"
                role="tab"
                aria-selected={mode === 'file'}
                className={`club-media-tab ${mode === 'file' ? 'club-media-tab-active' : ''}`}
                onClick={() => onChange('file')}
            >
                Upload File
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={mode === 'url'}
                className={`club-media-tab ${mode === 'url' ? 'club-media-tab-active' : ''}`}
                onClick={() => onChange('url')}
            >
                Paste URL
            </button>
        </div>
    );
}

export default function Clubs() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const bannerInputRef = useRef(null);
    const logoInputRef = useRef(null);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', genre: '' });
    const [bannerPreview, setBannerPreview] = useState('');
    const [logoPreview, setLogoPreview] = useState('');
    const [bannerFileName, setBannerFileName] = useState('');
    const [logoFileName, setLogoFileName] = useState('');
    const [bannerMode, setBannerMode] = useState('file');
    const [logoMode, setLogoMode] = useState('file');
    const [bannerUrlInput, setBannerUrlInput] = useState('');
    const [logoUrlInput, setLogoUrlInput] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [genreFilter, setGenreFilter] = useState('All');

    const resetCreateForm = () => {
        setForm({ name: '', description: '', genre: '' });
        setBannerPreview('');
        setLogoPreview('');
        setBannerFileName('');
        setLogoFileName('');
        setBannerMode('file');
        setLogoMode('file');
        setBannerUrlInput('');
        setLogoUrlInput('');
        if (bannerInputRef.current) bannerInputRef.current.value = '';
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const closeCreateForm = () => {
        setShowCreate(false);
        setError('');
        resetCreateForm();
    };

    const load = () => {
        setLoading(true);
        clubService.getAll().then(r => setClubs(r.data)).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const handleJoin = async (id) => {
        if (!isAuthenticated) { navigate('/login'); return; }
        try {
            await clubService.join(id);
            navigate(`/clubs/${id}`);
        } catch (err) {
            if (err.response?.status === 409) navigate(`/clubs/${id}`);
        }
    };

    const handleBannerChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        try {
            const dataUrl = await readImageFile(file, MAX_BANNER_BYTES);
            setBannerPreview(dataUrl);
            setBannerFileName(file.name);
        } catch (err) {
            setError(err.message);
            setBannerPreview('');
            setBannerFileName('');
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    const handleLogoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        try {
            const dataUrl = await readImageFile(file, MAX_LOGO_BYTES);
            setLogoPreview(dataUrl);
            setLogoFileName(file.name);
        } catch (err) {
            setError(err.message);
            setLogoPreview('');
            setLogoFileName('');
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const clearLogo = () => {
        setLogoPreview('');
        setLogoFileName('');
        setLogoUrlInput('');
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const applyBannerUrl = () => {
        const url = bannerUrlInput.trim();
        if (!isValidImageUrl(url)) {
            setError('Enter a valid image URL (https://…)');
            return;
        }
        setError('');
        setBannerPreview(url);
    };

    const applyLogoUrl = () => {
        const url = logoUrlInput.trim();
        if (!url) return;
        if (!isValidImageUrl(url)) {
            setError('Enter a valid image URL (https://…)');
            return;
        }
        setError('');
        setLogoPreview(url);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Club name is required'); return; }
        if (!bannerPreview) { setError('Banner image is required'); return; }
        setCreating(true); setError('');
        try {
            const res = await clubService.create({
                ...form,
                bannerUrl: bannerPreview,
                logoUrl: logoPreview || undefined,
            });
            closeCreateForm();
            navigate(`/clubs/${res.data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create club');
        } finally { setCreating(false); }
    };

    const filtered = clubs.filter(c => {
        const matchGenre = genreFilter === 'All' || (c.genre || 'General') === genreFilter;
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.genre || '').toLowerCase().includes(search.toLowerCase());
        return matchGenre && matchSearch;
    });

    return (
        <main className="page">
            <div className="container">
                {/* Header */}
                <div className="clubs-header">
                    <div>
                        <h1>Clubs</h1>
                        <p style={{ color: 'var(--clr-secondary)', marginTop: '0.5rem', maxWidth: 540, fontSize: '0.95rem' }}>
                            Join niche circles of cinephiles or create your own exclusive community to discuss cinema, host watch parties, and share curated lists.
                        </p>
                    </div>
                    {isAuthenticated && (
                        <button className="btn btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }} onClick={() => setShowCreate(true)}>
                            + Create Club
                        </button>
                    )}
                </div>

                {/* Search + filter row */}
                <div className="clubs-toolbar">
                    <input
                        className="form-input"
                        style={{ width: '260px' }}
                        placeholder="Search clubs…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="chip-row">
                        {GENRE_FILTERS.map(g => (
                            <button
                                key={g}
                                onClick={() => setGenreFilter(g)}
                                className={`query-chip ${genreFilter === g ? 'query-chip-active' : ''}`}
                            >
                                {GENRE_EMOJIS[g] || '✨'} {g}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Create Club Modal */}
                {showCreate && (
                    <div className="club-modal-overlay" onClick={closeCreateForm} role="presentation">
                        <div
                            className="club-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="club-modal-title"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="club-modal-header">
                                <h3 id="club-modal-title">Create a New Club</h3>
                                <button type="button" className="club-modal-close" onClick={closeCreateForm} aria-label="Close">×</button>
                            </div>

                            {error && <div className="alert alert-error club-modal-error">{error}</div>}

                            <form onSubmit={handleCreate} className="club-modal-form">
                                <div className="club-modal-section">
                                    <div className="club-modal-field-row">
                                        <div className="form-group club-modal-field">
                                            <label className="form-label club-label-required">
                                                Club Name <span className="form-required">*</span>
                                            </label>
                                            <input
                                                className="form-input club-modal-input"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                placeholder="e.g. Sci-Fi Lovers"
                                                required
                                            />
                                        </div>
                                        <div className="form-group club-modal-field">
                                            <label className="form-label">Genre / Theme</label>
                                            <CustomSelect
                                                className="club-modal-custom-select"
                                                value={form.genre}
                                                onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                                                options={CLUB_GENRE_OPTIONS}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="club-modal-section">
                                    <div className="form-group club-modal-field">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-textarea club-modal-input club-modal-desc"
                                            rows={2}
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                            placeholder="What's this club about?"
                                        />
                                    </div>
                                </div>

                                <div className="club-modal-section club-modal-section-banner">
                                    <label className="form-label club-label-required">
                                        Banner Image <span className="form-required">*</span>
                                    </label>
                                    <MediaTabs mode={bannerMode} onChange={setBannerMode} />
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="club-file-input"
                                        onChange={handleBannerChange}
                                    />
                                    <div
                                        className={`club-banner-dropzone ${bannerPreview ? 'has-image' : ''}`}
                                        onClick={() => { if (bannerMode === 'file') bannerInputRef.current?.click(); }}
                                        onKeyDown={(e) => { if (bannerMode === 'file' && e.key === 'Enter') bannerInputRef.current?.click(); }}
                                        role={bannerMode === 'file' ? 'button' : undefined}
                                        tabIndex={bannerMode === 'file' ? 0 : undefined}
                                    >
                                        {bannerMode === 'url' ? (
                                            <div className="club-banner-url-inner" onClick={(e) => e.stopPropagation()}>
                                                {bannerPreview ? (
                                                    <>
                                                        <img
                                                            src={bannerPreview}
                                                            alt="Banner preview"
                                                            className="club-banner-dropzone-img"
                                                            onError={() => {
                                                                setBannerPreview('');
                                                                setError('Could not load banner image. Check the URL or file.');
                                                            }}
                                                        />
                                                        <span className="club-media-change-hint">Paste a new URL below to replace</span>
                                                    </>
                                                ) : null}
                                                <div className="club-url-row">
                                                    <input
                                                        className="form-input club-modal-input"
                                                        type="url"
                                                        value={bannerUrlInput}
                                                        onChange={e => setBannerUrlInput(e.target.value)}
                                                        placeholder="https://example.com/banner.jpg"
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyBannerUrl(); } }}
                                                    />
                                                    <button type="button" className="club-url-apply" onClick={applyBannerUrl}>
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        ) : bannerPreview ? (
                                            <>
                                                <img
                                                    src={bannerPreview}
                                                    alt="Banner preview"
                                                    className="club-banner-dropzone-img"
                                                    onError={() => {
                                                        setBannerPreview('');
                                                        setError('Could not load banner image. Check the URL or file.');
                                                    }}
                                                />
                                                <span className="club-media-change-hint">Click to change banner</span>
                                            </>
                                        ) : (
                                            <div className="club-banner-empty">
                                                <span className="club-banner-empty-icon" aria-hidden="true">🖼</span>
                                                <span className="club-banner-empty-text">Click to upload banner image</span>
                                                {bannerFileName && <span className="club-banner-filename">{bannerFileName}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="club-modal-section club-modal-section-logo">
                                    <label className="form-label">
                                        Logo Image <span className="club-upload-optional">(Optional)</span>
                                    </label>
                                    <MediaTabs mode={logoMode} onChange={setLogoMode} />
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="club-file-input"
                                        onChange={handleLogoChange}
                                    />
                                    <div className="club-logo-block">
                                        <div
                                            className={`club-logo-circle ${logoPreview ? 'has-image' : ''}`}
                                            onClick={() => logoMode === 'file' && logoInputRef.current?.click()}
                                            onKeyDown={(e) => { if (logoMode === 'file' && e.key === 'Enter') logoInputRef.current?.click(); }}
                                            role={logoMode === 'file' ? 'button' : undefined}
                                            tabIndex={logoMode === 'file' ? 0 : undefined}
                                            title={logoMode === 'file' ? 'Upload logo image' : undefined}
                                        >
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo preview"
                                                    onError={() => {
                                                        setLogoPreview('');
                                                        setError('Could not load logo image. Check the URL or file.');
                                                    }}
                                                />
                                            ) : (
                                                <span className="club-logo-placeholder-icon" aria-hidden="true">🎬</span>
                                            )}
                                        </div>
                                        {logoMode === 'file' && !logoPreview && (
                                            <p className="club-logo-hint">Click the circle to upload</p>
                                        )}
                                        {logoMode === 'url' && (
                                            <div className="club-logo-url-wrap">
                                                <div className="club-url-row">
                                                    <input
                                                        className="form-input club-modal-input"
                                                        type="url"
                                                        value={logoUrlInput}
                                                        onChange={e => setLogoUrlInput(e.target.value)}
                                                        placeholder="https://example.com/logo.png"
                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLogoUrl(); } }}
                                                    />
                                                    <button type="button" className="club-url-apply" onClick={applyLogoUrl}>
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {logoPreview && (
                                            <button type="button" className="club-upload-clear" onClick={clearLogo}>
                                                Remove logo
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="club-modal-footer">
                                    <button type="button" className="club-modal-btn-cancel" onClick={closeCreateForm}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="club-modal-btn-create"
                                        disabled={creating || !bannerPreview}
                                    >
                                        {creating ? 'Creating…' : 'Create Club'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading && <Loader />}
                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="icon">🏛️</div>
                        <p>No clubs found. {isAuthenticated ? 'Create one above!' : 'Login to create the first club!'}</p>
                    </div>
                )}
                <div className="clubs-grid">
                    {filtered.map(c => <ClubCard key={c._id} club={c} onJoin={handleJoin} />)}
                </div>
            </div>

            <style>{`
                .clubs-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2.5rem;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }
                .clubs-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }
                .clubs-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
                    gap: 1.5rem;
                }
                .club-card {
                    background: var(--clr-surface-low);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    overflow: hidden;
                    cursor: pointer;
                    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
                    display: flex;
                    flex-direction: column;
                }
                .club-card:hover {
                    border-color: var(--clr-primary-container);
                    transform: translateY(-3px);
                    box-shadow: 0 0 20px rgba(192,57,43,0.12);
                }
                .club-card-icon {
                    aspect-ratio: 16/9;
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }
                .club-card-icon::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.7) 100%);
                }
                .club-emoji-badge {
                    position: absolute;
                    bottom: 0.75rem;
                    left: 0.75rem;
                    font-size: 1.5rem;
                    z-index: 2;
                    background: rgba(15,15,15,0.8);
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(89,65,61,0.3);
                    border-radius: var(--radius-sm);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
                .query-chip {
                    padding: 0.3rem 0.85rem; border-radius: var(--radius-full);
                    border: 1.5px solid rgba(89,65,61,0.3);
                    background: var(--clr-surface-container);
                    color: var(--clr-secondary); font-size: 0.78rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s; white-space: nowrap;
                }
                .query-chip:hover { border-color: var(--clr-primary-container); color: var(--clr-primary); }
                .query-chip-active { border-color: var(--clr-primary-container) !important; color: var(--clr-primary) !important; background: rgba(192,57,43,0.1) !important; }

                .club-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    background: rgba(0, 0, 0, 0.78);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                }
                .club-modal {
                    background: linear-gradient(165deg, #141414 0%, #0f0f0f 55%, #0c0c0c 100%);
                    border: 1px solid rgba(89, 65, 61, 0.32);
                    border-radius: calc(var(--radius) + 2px);
                    width: 100%;
                    max-width: 720px;
                    min-width: min(100%, 700px);
                    max-height: min(90vh, 820px);
                    overflow-y: auto;
                    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(192, 57, 43, 0.06) inset;
                }
                @media (max-width: 740px) {
                    .club-modal { min-width: unset; max-width: 100%; }
                }
                .club-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.5rem 2rem 1.25rem;
                    border-bottom: 1px solid rgba(89, 65, 61, 0.22);
                }
                .club-modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    color: var(--clr-on-surface);
                }
                .club-modal-close {
                    background: none;
                    border: none;
                    color: var(--clr-secondary);
                    font-size: 1.6rem;
                    line-height: 1;
                    cursor: pointer;
                    padding: 0.2rem 0.45rem;
                    border-radius: 4px;
                }
                .club-modal-close:hover { color: var(--clr-on-surface); }
                .club-modal-error { margin: 1rem 2rem 0; }
                .club-modal-form { padding: 1.5rem 2rem 2rem; }
                .club-modal-section { margin-bottom: 1.75rem; }
                .club-modal-section:last-of-type { margin-bottom: 0; }
                .club-modal-section-banner .form-label,
                .club-modal-section-logo .form-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.85rem;
                }
                .club-modal-section-logo {
                    padding-top: 1.75rem;
                    border-top: 1px solid rgba(89, 65, 61, 0.2);
                }
                .club-modal-field-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.25rem;
                }
                @media (max-width: 560px) {
                    .club-modal-field-row { grid-template-columns: 1fr; }
                    .club-modal-form, .club-modal-header { padding-left: 1.25rem; padding-right: 1.25rem; }
                }
                .club-modal-field { margin-bottom: 0; }
                .club-modal-field .form-label {
                    margin-bottom: 0.45rem;
                    font-size: 0.85rem;
                }
                .club-modal-input { font-size: 0.9rem; padding: 0.55rem 0.75rem; }
                .club-modal-custom-select .custom-select-trigger {
                    padding: 0.55rem 0.75rem;
                    font-size: 0.9rem;
                    border: 1px solid rgba(89,65,61,0.4);
                    border-radius: var(--radius-sm);
                    background: #0a0a0a;
                    color: var(--clr-on-surface);
                    box-sizing: border-box;
                    width: 100%;
                }
                .club-modal-custom-select .custom-select-trigger:hover:not(:disabled) {
                    border-color: var(--clr-primary-container);
                    box-shadow: 0 0 0 1px var(--clr-primary-container);
                }
                .club-modal-desc {
                    min-height: 52px;
                    max-height: 68px;
                    resize: vertical;
                    line-height: 1.45;
                }
                .club-label-required .form-required { color: #C0392B; }
                .form-required { color: #C0392B; font-weight: 700; }
                .club-upload-optional {
                    color: var(--clr-secondary);
                    font-weight: 400;
                    font-size: 0.8rem;
                }
                .club-media-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    border-bottom: 1px solid rgba(89, 65, 61, 0.22);
                }
                .club-media-tab {
                    padding: 0.45rem 0.75rem;
                    margin-bottom: -1px;
                    border: none;
                    background: none;
                    color: var(--clr-secondary);
                    font-size: 0.8rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: color 0.15s, border-color 0.15s;
                }
                .club-media-tab:hover { color: var(--clr-on-surface); }
                .club-media-tab-active {
                    color: var(--clr-on-surface);
                    border-bottom-color: #C0392B;
                }
                .club-file-input { display: none; }
                .club-banner-dropzone {
                    position: relative;
                    width: 100%;
                    min-height: 120px;
                    border: 1.5px dashed rgba(192, 57, 43, 0.5);
                    border-radius: var(--radius);
                    background: rgba(192, 57, 43, 0.05);
                    overflow: hidden;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: border-color 0.2s, background 0.2s;
                }
                .club-banner-dropzone:not(.has-image):hover {
                    border-color: #C0392B;
                    background: rgba(192, 57, 43, 0.09);
                }
                .club-banner-dropzone.has-image { cursor: pointer; border-style: solid; border-color: rgba(89, 65, 61, 0.35); }
                .club-banner-dropzone-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .club-media-change-hint {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 0.4rem;
                    font-size: 0.72rem;
                    font-weight: 600;
                    text-align: center;
                    color: #fff;
                    background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
                    z-index: 1;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .club-banner-dropzone.has-image:hover .club-media-change-hint { opacity: 1; }
                .club-banner-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 1rem;
                    text-align: center;
                }
                .club-banner-empty-icon { font-size: 1.5rem; opacity: 0.5; }
                .club-banner-empty-text { font-size: 0.85rem; color: var(--clr-secondary); }
                .club-banner-filename { font-size: 0.75rem; color: #C0392B; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .club-banner-url-inner {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 0.75rem;
                    justify-content: center;
                    min-height: 120px;
                    z-index: 2;
                }
                .club-banner-url-inner .club-url-row { position: relative; z-index: 2; }
                .club-url-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    width: 100%;
                }
                .club-url-row .club-modal-input { flex: 1; min-width: 0; }
                .club-url-apply {
                    flex-shrink: 0;
                    padding: 0.5rem 0.85rem;
                    border: none;
                    border-radius: var(--radius-sm);
                    background: rgba(192, 57, 43, 0.22);
                    color: #C0392B;
                    font-size: 0.8rem;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                }
                .club-url-apply:hover { background: rgba(192, 57, 43, 0.35); }
                .club-logo-block {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.85rem;
                    padding-top: 0.5rem;
                }
                .club-logo-circle {
                    width: 112px;
                    height: 112px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px dashed rgba(192, 57, 43, 0.55);
                    background: #161616;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    cursor: pointer;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
                }
                .club-logo-circle.has-image {
                    border-style: solid;
                    border-color: rgba(89, 65, 61, 0.45);
                    cursor: pointer;
                }
                .club-logo-circle:not(.has-image):hover {
                    border-color: #C0392B;
                    box-shadow: 0 4px 24px rgba(192, 57, 43, 0.15);
                }
                .club-logo-circle img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .club-logo-placeholder-icon { font-size: 2.25rem; opacity: 0.4; }
                .club-logo-hint {
                    margin: 0;
                    font-size: 0.8rem;
                    color: var(--clr-secondary);
                }
                .club-logo-url-wrap {
                    width: 100%;
                    max-width: 360px;
                }
                .club-upload-clear {
                    padding: 0.25rem 0;
                    border: none;
                    background: none;
                    color: var(--clr-secondary);
                    font-size: 0.8rem;
                    font-family: inherit;
                    cursor: pointer;
                }
                .club-upload-clear:hover { color: #C0392B; }
                .club-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 2.25rem;
                    padding-top: 1.35rem;
                    border-top: 1px solid rgba(89, 65, 61, 0.22);
                }
                .club-modal-btn-cancel {
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-sm);
                    border: 1px solid rgba(89, 65, 61, 0.35);
                    background: rgba(89, 65, 61, 0.2);
                    color: rgba(168, 138, 133, 0.95);
                    font-size: 0.85rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                }
                .club-modal-btn-cancel:hover {
                    background: rgba(89, 65, 61, 0.32);
                    color: var(--clr-on-surface);
                }
                .club-modal-btn-create {
                    padding: 0.5rem 1.1rem;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: #C0392B;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                }
                .club-modal-btn-create:hover:not(:disabled) { background: #a93226; }
                .club-modal-btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
                .club-logo-badge {
                    position: absolute;
                    bottom: 0.75rem;
                    left: 0.75rem;
                    z-index: 2;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(15,15,15,0.9);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                }
            `}</style>
        </main>
    );
}
