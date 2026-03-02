import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

function ClubCard({ club, onJoin }) {
    const { isAuthenticated } = useAuth();
    return (
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <Link to={`/clubs/${club._id}`}><h3 style={{ color: 'var(--clr-text)', lineHeight: 1.2 }}>{club.name}</h3></Link>
                <span className="badge badge-primary">{club.genre || 'General'}</span>
            </div>
            {club.description && <p style={{ fontSize: '0.85rem', WebkitLineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>{club.description}</p>}
            <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>👥 {club.memberCount} member{club.memberCount !== 1 ? 's' : ''}</span>
                {isAuthenticated && <button className="btn btn-outline btn-sm" onClick={() => onJoin(club._id)}>Join</button>}
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

    const load = () => { setLoading(true); clubService.getAll().then(r => setClubs(r.data)).finally(() => setLoading(false)); };
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
            setShowCreate(false); setForm({ name: '', description: '', genre: '' });
            navigate(`/clubs/${res.data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create club');
        } finally { setCreating(false); }
    };

    const filtered = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.genre || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <main className="page">
            <div className="container">
                <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1>🏛️ Clubs</h1>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input className="form-input" style={{ width: '220px' }} placeholder="Search clubs…" value={search} onChange={e => setSearch(e.target.value)} />
                        {isAuthenticated && <button className="btn btn-primary" onClick={() => setShowCreate(s => !s)}>+ Create Club</button>}
                    </div>
                </div>

                {showCreate && (
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>New Club</h3>
                        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                        <form onSubmit={handleCreate}>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Club Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sci-Fi Lovers" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Genre/Theme</label>
                                    <input className="form-input" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} placeholder="e.g. Horror, Drama, Indie…" />
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
                    <div className="empty-state"><div className="icon">🏛️</div><p>No clubs found. {isAuthenticated ? 'Create one!' : 'Login to create the first club!'}</p></div>
                )}
                <div className="grid-auto">
                    {filtered.map(c => <ClubCard key={c._id} club={c} onJoin={handleJoin} />)}
                </div>
            </div>
        </main>
    );
}
