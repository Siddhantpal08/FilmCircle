import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const GENRE_FILTERS = ['All', 'Drama', 'Horror', 'Sci-Fi', 'Action', 'Independent', 'Bollywood', 'General'];
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
    const banner = getClubBanner(club.genre);

    return (
        <div className="club-card" onClick={() => navigate(`/clubs/${club._id}`)}>
            <div className="club-card-icon" style={{ backgroundImage: `url(${banner})` }}>
                <span className="club-emoji-badge">{emoji}</span>
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

export default function Clubs() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', genre: '' });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [genreFilter, setGenreFilter] = useState('All');

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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Club name is required'); return; }
        setCreating(true); setError('');
        try {
            const res = await clubService.create(form);
            setShowCreate(false);
            setForm({ name: '', description: '', genre: '' });
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
                        <button className="btn btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }} onClick={() => setShowCreate(s => !s)}>
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

                {/* Create Club Form */}
                {showCreate && (
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--clr-on-surface)' }}>Create a New Club</h3>
                        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                        <form onSubmit={handleCreate}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Club Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sci-Fi Lovers" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Genre / Theme</label>
                                    <select className="form-select" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
                                        <option value="">Select genre…</option>
                                        {GENRE_FILTERS.filter(g => g !== 'All').map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's this club about?" />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating…' : 'Create Club'}</button>
                            </div>
                        </form>
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
            `}</style>
        </main>
    );
}
