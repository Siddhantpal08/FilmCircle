import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function ClubDetail() {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [postText, setPostText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [memberMsg, setMemberMsg] = useState('');

    const load = () => { clubService.getById(id).then(r => setClub(r.data)).catch(() => { }).finally(() => setLoading(false)); };
    useEffect(() => { load(); }, [id]);

    if (loading) return <div className="page"><Loader /></div>;
    if (!club) return <div className="page container"><p>Club not found.</p></div>;

    const isMember = club.members?.some(m => m._id === (user?._id || user?.id));

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

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '760px' }}>
                {/* Header */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                    <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{club.genre || 'General'}</span>
                    <h1>{club.name}</h1>
                    {club.description && <p style={{ marginTop: '0.5rem' }}>{club.description}</p>}
                    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                        👥 {club.members?.length} members · Created by <strong>{club.createdBy?.username}</strong>
                    </div>
                    {memberMsg && <div className="alert alert-success" style={{ marginTop: '1rem' }}>{memberMsg}</div>}
                    {isAuthenticated && (
                        <div style={{ marginTop: '1rem' }}>
                            {isMember
                                ? <button className="btn btn-outline btn-sm" onClick={handleLeave}>Leave Club</button>
                                : <button className="btn btn-primary btn-sm" onClick={handleJoin}>Join Club</button>}
                        </div>
                    )}
                </div>

                {/* Post in Club */}
                {isAuthenticated && isMember && (
                    <form className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }} onSubmit={handlePost}>
                        {error && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
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
                {[...(club.posts || [])].reverse().map((p, i) => (
                    <div key={i} className="card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.8rem' }}>
                                {p.author?.username?.[0]?.toUpperCase()}
                            </div>
                            <strong style={{ fontSize: '0.9rem' }}>{p.author?.username}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginLeft: 'auto' }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--clr-text)' }}>{p.content}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}
