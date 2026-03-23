import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation', 'General', 'Other'];

export default function ClubDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [postText, setPostText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [memberMsg, setMemberMsg] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', genre: '' });
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        clubService.getById(id).then(r => {
            setClub(r.data);
            setEditForm({ name: r.data.name, description: r.data.description || '', genre: r.data.genre || '' });
        }).catch(() => { }).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [id]);

    if (loading) return <div className="page"><Loader /></div>;
    if (!club) return <div className="page container"><p>Club not found.</p></div>;

    const currentUserId = user?._id || user?.id;
    const isMember = club.members?.some(m => m._id === currentUserId || m.id === currentUserId);
    const isCreator = club.createdBy?._id === currentUserId || club.createdBy?.id === currentUserId;

    const handleJoin = async () => {
        try {
            await clubService.join(id);
            setMemberMsg('You joined the club! 🎉');
            load();
        } catch (err) {
            setMemberMsg(err.response?.data?.message || 'Error');
        }
    };

    const handleLeave = async () => {
        try {
            await clubService.leave(id);
            setMemberMsg('You left the club.');
            load();
        } catch (err) {
            setMemberMsg(err.response?.data?.message || 'Error');
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!postText.trim()) return;
        setPosting(true); setError('');
        try {
            await clubService.post(id, postText.trim());
            setPostText('');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post');
        } finally { setPosting(false); }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await clubService.update(id, editForm);
            setEditMode(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update club');
        } finally { setSaving(false); }
    };

    const handleDeleteClub = async () => {
        if (!window.confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
        try {
            await clubService.delete(id);
            navigate('/clubs');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete club');
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await clubService.deletePost(id, postId);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete post');
        }
    };

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '760px' }}>
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                {/* Header */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    {editMode ? (
                        <form onSubmit={handleSaveEdit}>
                            <h3 style={{ marginBottom: '1rem' }}>Edit Club</h3>
                            <div className="grid-2" style={{ marginBottom: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Club Name *</label>
                                    <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Genre</label>
                                    <select className="form-select" value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}>
                                        {GENRES.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-textarea" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <span className="badge badge-primary" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>{club.genre || 'General'}</span>
                                    <h1 style={{ margin: 0 }}>{club.name}</h1>
                                    {club.description && <p style={{ marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>{club.description}</p>}
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                                        👥 {club.members?.length} members · Created by <strong>{club.createdBy?.username}</strong>
                                    </div>
                                </div>
                                {isCreator && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>
                                        <button className="btn btn-sm" style={{ background: 'rgba(232,69,69,0.15)', color: 'var(--clr-error)', border: '1px solid var(--clr-error)' }} onClick={handleDeleteClub}>🗑 Delete</button>
                                    </div>
                                )}
                            </div>

                            {memberMsg && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{memberMsg}</div>}
                            {isAuthenticated && (
                                <div style={{ marginTop: '1rem' }}>
                                    {isMember
                                        ? <button className="btn btn-outline btn-sm" onClick={handleLeave}>Leave Club</button>
                                        : <button className="btn btn-primary btn-sm" onClick={handleJoin}>Join Club</button>}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Post in Club */}
                {isAuthenticated && isMember && (
                    <form className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }} onSubmit={handlePost}>
                        <textarea className="form-textarea" rows={2} placeholder="Post in this club…" value={postText} onChange={e => setPostText(e.target.value)} maxLength={500} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !postText.trim()}>{posting ? 'Posting…' : 'Post'}</button>
                        </div>
                    </form>
                )}

                {/* Club Posts */}
                <h2 style={{ marginBottom: '1rem' }}>Discussion</h2>
                {(!club.posts || club.posts.length === 0) && (
                    <div className="empty-state"><div className="icon">💬</div><p>{isMember ? 'Start the discussion!' : 'Join to participate.'}</p></div>
                )}
                {[...(club.posts || [])].reverse().map((p) => {
                    const isPostAuthor = p.author?._id === currentUserId || p.author?.id === currentUserId;
                    const canDeletePost = isCreator || isPostAuthor;
                    return (
                        <div key={p._id || p.createdAt} className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                                    {p.author?.username?.[0]?.toUpperCase()}
                                </div>
                                <strong style={{ fontSize: '0.9rem' }}>{p.author?.username}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginLeft: 'auto' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                                {canDeletePost && (
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-error)' }} onClick={() => handleDeletePost(p._id)}>🗑</button>
                                )}
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)', margin: 0 }}>{p.content}</p>
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
