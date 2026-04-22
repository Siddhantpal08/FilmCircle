import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, movieService } from '../services';
import Loader from '../components/common/Loader';

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23131322'/%3E%3Ctext x='50%25' y='46%25' text-anchor='middle' fill='%237c5cfc' font-size='40'%3E🎬%3C/text%3E%3Ctext x='50%25' y='60%25' text-anchor='middle' fill='%237c5cfc' font-size='14'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function Profile() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [uploadedFilms, setUploadedFilms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit profile state
    const [editProfile, setEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', avatarUrl: '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        movieService.getIndependent()
            .then(res => {
                const userId = user?._id || user?.id;
                setUploadedFilms(res.data.filter(m => m.uploadedBy?._id === userId || m.uploadedBy === userId));
            })
            .finally(() => setLoading(false));
    }, [user]);

    const openEdit = () => {
        setEditForm({ username: user.username || '', bio: user.bio || '', avatarUrl: user.avatarUrl || '' });
        setSaveMsg('');
        setEditProfile(true);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await authService.updateProfile({
                username: editForm.username.trim(),
                bio: editForm.bio,
                avatarUrl: editForm.avatarUrl.trim(),
            });
            updateUser({ username: res.data.username, bio: res.data.bio, avatarUrl: res.data.avatarUrl });
            setSaveMsg('✓ Profile saved!');
            setTimeout(() => { setSaveMsg(''); setEditProfile(false); }, 1200);
        } catch (err) {
            setSaveMsg(err.response?.data?.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'DELETE') return;
        setDeleting(true);
        try {
            await authService.deleteAccount();
            logout();
            navigate('/');
        } catch {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteFilm = async (id) => {
        if (!window.confirm('Delete this film listing?')) return;
        try { await movieService.delete(id); setUploadedFilms(f => f.filter(m => m._id !== id)); } catch { }
    };

    if (!user) return null;

    const avatarSrc = user.avatarUrl?.trim();
    const displayUsername = user.username;

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '800px' }}>

                {/* Profile Header */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    {!editProfile ? (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Avatar */}
                            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--clr-primary)' }}>
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={displayUsername} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div style={{ width: '100%', height: '100%', background: 'var(--clr-primary)', display: avatarSrc ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                                    {displayUsername?.[0]?.toUpperCase()}
                                </div>
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <h2 style={{ marginBottom: '0.2rem' }}>{displayUsername}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.75rem' }}>{user.email}</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                                    {user.bio || <span style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>No bio yet</span>}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                                <button className="btn btn-outline btn-sm" onClick={openEdit}>✏️ Edit Profile</button>
                                <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setDeleteInput(''); setShowDeleteConfirm(true); }}>🗑 Delete Account</button>
                            </div>
                        </div>
                    ) : (
                        /* Edit Mode */
                        <div>
                            <h3 style={{ marginBottom: '1.25rem' }}>Edit Profile</h3>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {/* Avatar preview */}
                                <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--clr-primary)', position: 'relative' }}>
                                    {editForm.avatarUrl?.trim() ? (
                                        <img src={editForm.avatarUrl.trim()} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                                            {(editForm.username?.[0] || user.username?.[0])?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                        <label className="form-label">Display Name</label>
                                        <input
                                            className="form-input"
                                            value={editForm.username}
                                            onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                                            maxLength={30}
                                            placeholder="Username (3–30 chars)"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                        <label className="form-label">Avatar URL</label>
                                        <input
                                            className="form-input"
                                            type="url"
                                            value={editForm.avatarUrl}
                                            onChange={e => setEditForm(f => ({ ...f, avatarUrl: e.target.value }))}
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bio <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                        <textarea
                                            className="form-textarea"
                                            rows={2}
                                            value={editForm.bio}
                                            onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                            maxLength={200}
                                            placeholder="Tell the circle about yourself…"
                                        />
                                        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textAlign: 'right' }}>{editForm.bio.length}/200</div>
                                    </div>
                                </div>
                            </div>
                            {saveMsg && (
                                <div className={`alert ${saveMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '0.75rem' }}>
                                    {saveMsg}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setEditProfile(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Delete Account Confirmation Modal */}
                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ padding: '2rem', maxWidth: '440px', width: '90%' }}>
                            <h3 style={{ color: '#e84545', marginBottom: '0.75rem' }}>⚠️ Delete Account</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                                This will permanently delete your account, all your reviews, uploaded films, community posts, and comments. <strong>This cannot be undone.</strong>
                            </p>
                            <label className="form-label">Type <strong>DELETE</strong> to confirm:</label>
                            <input
                                className="form-input"
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                placeholder="DELETE"
                                style={{ marginTop: '0.4rem', marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleDeleteAccount}
                                    disabled={deleteInput !== 'DELETE' || deleting}
                                >
                                    {deleting ? 'Deleting…' : 'Delete My Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <img src={m.posterUrl || FALLBACK_POSTER} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} onError={e => { e.target.src = FALLBACK_POSTER; }} />
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

            <style>{`
                .btn-danger { background: #e84545; color: #fff; border: none; }
                .btn-danger:hover { background: #cf3030; }
                .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </main>
    );
}
