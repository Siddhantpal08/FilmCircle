import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, movieService } from '../services';
import Loader from '../components/common/Loader';

export default function Profile() {
    const { user, logout } = useAuth();
    const [uploadedFilms, setUploadedFilms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editBio, setEditBio] = useState(false);
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        movieService.getIndependent()
            .then(res => {
                const userId = user?._id || user?.id;
                setUploadedFilms(res.data.filter(m => m.uploadedBy?._id === userId || m.uploadedBy === userId));
            })
            .finally(() => setLoading(false));
    }, [user]);

    const handleSaveBio = async () => {
        setSaving(true);
        try { await authService.updateProfile({ bio }); setEditBio(false); } catch { }
        setSaving(false);
    };

    const handleDeleteFilm = async (id) => {
        if (!window.confirm('Delete this film listing?')) return;
        try { await movieService.delete(id); setUploadedFilms(f => f.filter(m => m._id !== id)); } catch { }
    };

    if (!user) return null;

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '800px' }}>
                {/* Profile Header */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ marginBottom: '0.25rem' }}>{user.username}</h2>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>{user.email}</p>
                        {editBio ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <textarea className="form-textarea" style={{ flex: 1, minWidth: '200px', rows: 2 }} value={bio} onChange={e => setBio(e.target.value)} maxLength={200} />
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveBio} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                                    <button className="btn btn-outline btn-sm" onClick={() => setEditBio(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <p style={{ margin: 0 }}>{bio || <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>No bio yet</span>}</p>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditBio(true)}>✏️ Edit Bio</button>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={logout} style={{ flexShrink: 0 }}>Logout</button>
                </div>

                {/* Uploaded Films */}
                <section className="section">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2>🎬 Your Uploaded Films</h2>
                        <Link to="/upload" className="btn btn-primary btn-sm">+ Upload</Link>
                    </div>
                    {loading && <Loader />}
                    {!loading && uploadedFilms.length === 0 && (
                        <div className="empty-state"><div className="icon">🎥</div><p>No films uploaded yet.</p></div>
                    )}
                    <div className="grid-auto">
                        {uploadedFilms.map(m => (
                            <div key={m._id} className="card" style={{ overflow: 'hidden' }}>
                                <Link to={`/movie/${m._id}`}>
                                    <img src={m.posterUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23131322'/%3E%3Ctext x='50%25' y='46%25' text-anchor='middle' fill='%237c5cfc' font-size='40'%3E🎬%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%237c5cfc' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E"} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} onError={e => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23131322'/%3E%3Ctext x='50%25' y='46%25' text-anchor='middle' fill='%237c5cfc' font-size='40'%3E🎬%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%237c5cfc' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E"; }} />
                                </Link>
                                <div style={{ padding: '0.75rem' }}>
                                    <Link to={`/movie/${m._id}`}><h3 style={{ fontSize: '0.9rem', color: 'var(--clr-text)' }}>{m.title}</h3></Link>
                                    {m.genre && <p style={{ fontSize: '0.78rem', margin: '0.25rem 0 0.5rem' }}>{m.genre}</p>}
                                    <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => handleDeleteFilm(m._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Joined Clubs */}
                <section className="section">
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <h2>🏛️ Joined Clubs</h2>
                        <Link to="/clubs" className="btn btn-outline btn-sm">Browse Clubs</Link>
                    </div>
                    {user.joinedClubs?.length === 0 && (
                        <div className="empty-state"><div className="icon">🏛️</div><p>Not in any clubs yet.</p></div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(user.joinedClubs || []).map(c => (
                            <Link key={c._id || c} to={`/clubs/${c._id || c}`} className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                                {c.name || 'Club'}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
