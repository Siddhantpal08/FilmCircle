import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, movieService } from '../services';
import Loader from '../components/common/Loader';
import MovieCard from '../components/movie/MovieCard';

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23201f1f'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23c0392b' font-size='40'%3E🎬%3C/text%3E%3C/svg%3E";

const TABS = ['Reviews', 'Uploaded Films', 'Clubs'];

export default function Profile() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const avatarFileRef = useRef(null);
    const [uploadedFilms, setUploadedFilms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Uploaded Films');

    const [editProfile, setEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', avatarUrl: '' });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [filmToDeleteId, setFilmToDeleteId] = useState(null);
    const [deletingFilm, setDeletingFilm] = useState(false);

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
        setAvatarPreview(user.avatarUrl || '');
        setSaveMsg('');
        setEditProfile(true);
    };

    const handleAvatarFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const b64 = ev.target.result;
            setAvatarPreview(b64);
            setEditForm(f => ({ ...f, avatarUrl: b64 }));
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await authService.updateProfile({
                username: editForm.username.trim(),
                bio: editForm.bio,
                avatarUrl: editForm.avatarUrl,
            });
            updateUser({ username: res.data.username, bio: res.data.bio, avatarUrl: res.data.avatarUrl });
            setSaveMsg('Profile saved!');
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

    const handleDeleteFilm = (id) => {
        setFilmToDeleteId(id);
    };

    const confirmDeleteFilm = async () => {
        if (!filmToDeleteId) return;
        setDeletingFilm(true);
        try {
            await movieService.delete(filmToDeleteId);
            setUploadedFilms(f => f.filter(m => m._id !== filmToDeleteId));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingFilm(false);
            setFilmToDeleteId(null);
        }
    };

    if (!user) return null;
    const avatarSrc = user.avatarUrl?.trim();
    const displayUsername = user.username;

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* Profile Header */}
                {!editProfile ? (
                    <section className="profile-header-section">
                        {/* Avatar */}
                        <div className="profile-avatar-wrap">
                            {avatarSrc ? (
                                <img src={avatarSrc} alt={displayUsername} className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-placeholder">{displayUsername?.[0]?.toUpperCase()}</div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{displayUsername}</h1>
                                <p style={{ fontSize: '0.875rem', color: 'var(--clr-secondary)', margin: 0 }}>@{displayUsername?.toLowerCase()}</p>
                            </div>

                            <div className="profile-stats">
                                <div className="profile-stat">
                                    <span className="profile-stat-num">{uploadedFilms.length}</span>
                                    <span className="profile-stat-label">Films</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-num">{user.joinedClubs?.length || 0}</span>
                                    <span className="profile-stat-label">Clubs</span>
                                </div>
                                <div className="profile-stat">
                                    <span className="profile-stat-num">—</span>
                                    <span className="profile-stat-label">Reviews</span>
                                </div>
                            </div>

                            {user.bio && (
                                <p style={{ color: 'var(--clr-on-surface)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 520, marginTop: '0.75rem' }}>{user.bio}</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                            <button className="btn btn-outline btn-sm" onClick={openEdit}>Edit Profile</button>
                            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
                            <button className="btn btn-danger btn-sm" onClick={() => { setDeleteInput(''); setShowDeleteConfirm(true); }}>Delete Account</button>
                        </div>
                    </section>
                ) : (
                    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--clr-on-surface)' }}>Edit Profile</h3>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {/* Avatar upload */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <div className="avatar-upload-ring" onClick={() => avatarFileRef.current.click()} title="Click to change avatar">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="profile-avatar-placeholder" style={{ fontSize: '1.5rem', width: '100%', height: '100%', borderRadius: 0 }}>
                                            {(editForm.username?.[0] || user.username?.[0])?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="avatar-upload-overlay">📷</div>
                                </div>
                                <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>Click to upload</span>
                            </div>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <div className="form-group">
                                    <label className="form-label">Display Name</label>
                                    <input className="form-input" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} maxLength={30} placeholder="Username (3-30 chars)" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Avatar URL <span style={{ color: 'var(--clr-secondary)', fontWeight: 400 }}>(or upload above)</span></label>
                                    <input className="form-input" type="text" value={editForm.avatarUrl.startsWith('data:') ? '' : editForm.avatarUrl} onChange={e => { setEditForm(f => ({ ...f, avatarUrl: e.target.value })); setAvatarPreview(e.target.value); }} placeholder="https://example.com/avatar.jpg" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bio <span style={{ color: 'var(--clr-secondary)', fontWeight: 400 }}>(optional)</span></label>
                                    <textarea className="form-textarea" rows={2} value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} maxLength={200} placeholder="Tell the circle about yourself..." />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-secondary)', textAlign: 'right' }}>{editForm.bio.length}/200</div>
                                </div>
                            </div>
                        </div>
                        {saveMsg && (
                            <div className={`alert ${saveMsg.startsWith('Profile') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '0.75rem' }}>{saveMsg}</div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => setEditProfile(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                        </div>
                    </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ padding: '2rem', maxWidth: '440px', width: '90%' }}>
                            <h3 style={{ color: 'var(--clr-error)', marginBottom: '0.75rem' }}>Delete Account</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--clr-secondary)', marginBottom: '1rem' }}>
                                This will permanently delete your account, all reviews, uploaded films, and posts. <strong style={{ color: 'var(--clr-on-surface)' }}>This cannot be undone.</strong>
                            </p>
                            <label className="form-label">Type <strong>DELETE</strong> to confirm:</label>
                            <input className="form-input" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE" style={{ marginTop: '0.4rem', marginBottom: '1rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                                <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE' || deleting}>
                                    {deleting ? 'Deleting...' : 'Delete My Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Film Modal */}
                {filmToDeleteId && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                        onClick={() => setFilmToDeleteId(null)}
                    >
                        <div
                            style={{ background: '#1a1a1a', border: '1px solid rgba(89,65,61,0.25)', borderRadius: 'var(--radius)', padding: '1.75rem', maxWidth: '400px', width: '90%', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Delete Film?</h3>
                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#8c8c8c', lineHeight: 1.5 }}>This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    style={{ background: '#333333', color: '#ffffff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                                    onClick={() => setFilmToDeleteId(null)}
                                    disabled={deletingFilm}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    style={{ background: '#C0392B', color: '#ffffff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}
                                    onClick={confirmDeleteFilm}
                                    disabled={deletingFilm}
                                >
                                    {deletingFilm ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="profile-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`profile-tab ${activeTab === tab ? 'profile-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'Uploaded Films' && (
                    <section className="section">
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                            <h2 className="text-headline-md">Your Films</h2>
                            <Link to="/upload" className="btn btn-primary btn-sm">+ Upload Film</Link>
                        </div>
                        {loading && <Loader />}
                        {!loading && uploadedFilms.length === 0 && (
                            <div className="empty-state"><div className="icon">🎥</div><p>No films uploaded yet.</p></div>
                        )}
                        <div className="grid-movies" style={{ justifyItems: 'start' }}>
                            {uploadedFilms.map(m => (
                                <div key={m._id} style={{ position: 'relative' }}>
                                    <MovieCard
                                        movie={{ Title: m.title, Poster: m.posterUrl, Year: m.year || '', imdbID: m._id, Genre: m.genre || '' }}
                                        indie
                                    />
                                    <button
                                        className="btn btn-danger btn-sm"
                                        style={{ width: '100%', marginTop: '0.5rem', borderRadius: 'var(--radius-sm)', padding: '0.3rem' }}
                                        onClick={() => handleDeleteFilm(m._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'Clubs' && (
                    <section className="section">
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                            <h2 className="text-headline-md">Joined Clubs</h2>
                            <Link to="/clubs" className="btn btn-outline btn-sm">Browse Clubs</Link>
                        </div>
                        {user.joinedClubs?.length === 0 && (
                            <div className="empty-state"><div className="icon">🏛</div><p>Not in any clubs yet.</p></div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {(user.joinedClubs || []).map(c => (
                                <Link key={c._id || c} to={`/clubs/${c._id || c}`} className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
                                    {c.name || 'Club'}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'Reviews' && (
                    <div className="empty-state">
                        <div className="icon">⭐</div>
                        <p>Your reviews will appear here.</p>
                    </div>
                )}
            </div>

            <style>{`
                .profile-header-section {
                    display: flex;
                    gap: 2rem;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    padding: 2rem;
                    background: var(--clr-surface-low);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    flex-wrap: wrap;
                }
                .profile-avatar-wrap { flex-shrink: 0; }
                .profile-avatar-img {
                    width: 128px; height: 128px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--clr-primary-container);
                    box-shadow: 0 0 24px rgba(192,57,43,0.25);
                }
                .profile-avatar-placeholder {
                    width: 128px; height: 128px;
                    border-radius: 50%;
                    background: var(--clr-primary-container);
                    color: var(--clr-on-primary-container);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 2.5rem; font-weight: 800;
                    border: 2px solid rgba(192,57,43,0.4);
                }
                .profile-stats {
                    display: flex;
                    gap: 2rem;
                    padding: 1rem 0;
                    border-top: 1px solid rgba(89,65,61,0.2);
                    border-bottom: 1px solid rgba(89,65,61,0.2);
                }
                .profile-stat { text-align: left; }
                .profile-stat-num { display: block; font-size: 1.25rem; font-weight: 700; color: var(--clr-on-surface); }
                .profile-stat-label { font-size: 0.75rem; color: var(--clr-on-surface-variant); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }

                .profile-tabs {
                    display: flex;
                    border-bottom: 1px solid rgba(89,65,61,0.2);
                    margin-bottom: 2rem;
                    overflow-x: auto;
                    gap: 0;
                }
                .profile-tab {
                    padding: 0.85rem 1.5rem;
                    font-size: 0.78rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--clr-secondary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: color 0.2s;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                }
                .profile-tab:hover { color: var(--clr-on-surface); }
                .profile-tab-active {
                    color: var(--clr-primary);
                    border-bottom-color: var(--clr-primary-container);
                }

                .btn-danger { background: var(--clr-error-container); color: var(--clr-error); border: none; }
                .btn-danger:hover { opacity: 0.85; }
                .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

                .avatar-upload-ring {
                    width: 88px; height: 88px; border-radius: 50%; overflow: hidden;
                    border: 2px solid var(--clr-primary-container); position: relative; cursor: pointer; flex-shrink: 0;
                    background: var(--clr-surface-container);
                }
                .avatar-upload-overlay {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.4rem; opacity: 0; transition: opacity 0.2s;
                }
                .avatar-upload-ring:hover .avatar-upload-overlay { opacity: 1; }
            `}</style>
        </main>
    );
}
