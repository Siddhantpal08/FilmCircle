import { useState, useEffect, useRef } from 'react';
import { communityService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const FIVE_MIN = 5 * 60 * 1000;

function useEditTimer(createdAt) {
    const [canEdit, setCanEdit] = useState(Date.now() - new Date(createdAt).getTime() < FIVE_MIN);
    const [secsLeft, setSecsLeft] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        const elapsed = Date.now() - new Date(createdAt).getTime();
        if (elapsed >= FIVE_MIN) { setCanEdit(false); return; }
        const remaining = FIVE_MIN - elapsed;
        setSecsLeft(Math.ceil(remaining / 1000));
        intervalRef.current = setInterval(() => {
            const r = FIVE_MIN - (Date.now() - new Date(createdAt).getTime());
            if (r <= 0) { setCanEdit(false); clearInterval(intervalRef.current); }
            else setSecsLeft(Math.ceil(r / 1000));
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [createdAt]);

    return { canEdit, secsLeft };
}

function PostCard({ post, onLike, onDelete, onUpdate, currentUserId }) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localComments, setLocalComments] = useState(post.comments || []);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(post.content);
    const [saving, setSaving] = useState(false);
    const [localContent, setLocalContent] = useState(post.content);
    const [isEdited, setIsEdited] = useState(!!post.editedAt);

    const isOwner = currentUserId && (post.author?._id === currentUserId || post.author?.id === currentUserId);
    const liked = post.likes?.some(id => id === currentUserId);
    const { canEdit, secsLeft } = useEditTimer(post.createdAt);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const res = await communityService.addComment(post._id, commentText.trim());
            setLocalComments(c => [...c, res.data]);
            setCommentText('');
        } catch { }
        setSubmitting(false);
    };

    const handleSaveEdit = async () => {
        if (!editText.trim()) return;
        setSaving(true);
        try {
            await communityService.updatePost(post._id, editText.trim());
            setLocalContent(editText.trim());
            setIsEdited(true);
            setEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not save edit.');
        }
        setSaving(false);
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="comm-post-card">
            <div className="comm-post-header">
                <div className="comm-post-avatar">{post.author?.username?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                    <strong style={{ color: 'var(--clr-on-surface)', fontSize: '0.9rem' }}>{post.author?.username || 'Unknown'}</strong>
                    <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--clr-secondary)' }}>
                        {timeAgo(post.createdAt)}
                        {isEdited && <span style={{ marginLeft: '0.4rem', fontStyle: 'italic', opacity: 0.7 }}>· edited</span>}
                    </p>
                </div>
                {isOwner && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {canEdit && !editing && (
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                onClick={() => setEditing(true)}
                                title={`Edit (${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')} left)`}>
                                ✏️
                            </button>
                        )}
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clr-error)', padding: '0.2rem 0.5rem' }} onClick={() => onDelete(post._id)}>🗑</button>
                    </div>
                )}
            </div>

            {editing ? (
                <div style={{ marginBottom: '0.75rem' }}>
                    <textarea className="form-textarea" value={editText} onChange={e => setEditText(e.target.value)} rows={3} maxLength={500} autoFocus style={{ fontSize: '0.9rem' }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setEditText(localContent); }}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={saving || !editText.trim()}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="comm-post-content" onClick={() => setShowComments(c => !c)}>
                    <p style={{ margin: 0, color: 'var(--clr-on-surface)', lineHeight: 1.6 }}>{localContent}</p>
                </div>
            )}

            <div className="comm-post-actions">
                <button className={`comm-action-btn ${liked ? 'comm-action-liked' : ''}`} onClick={() => onLike(post._id)}>
                    ♥ <span>{post.likes?.length || 0}</span>
                </button>
                <button className="comm-action-btn" onClick={() => setShowComments(c => !c)}>
                    💬 <span>{localComments.length}</span>
                </button>
                <button className="comm-action-btn">
                    ↗ <span>Share</span>
                </button>
            </div>

            {showComments && (
                <div className="comm-comments">
                    {localComments.map((c, i) => (
                        <div key={i} className="comm-comment-item">
                            <div className="comm-comment-avatar">{c.author?.username?.[0]?.toUpperCase()}</div>
                            <div>
                                <span className="comm-comment-author">{c.author?.username || 'User'}</span>
                                <span className="comm-comment-text">{c.text}</span>
                            </div>
                        </div>
                    ))}
                    {currentUserId && (
                        <form onSubmit={handleComment} className="comm-comment-form">
                            <input className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" />
                            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>Post</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Community() {
    const { isAuthenticated, user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    const loadPosts = async (p = 1) => {
        setLoading(true);
        try {
            const res = await communityService.getPosts(p, 10);
            const { posts: data, pages } = res.data;
            setPosts(prev => p === 1 ? data : [...prev, ...data]);
            setHasMore(p < pages);
            setPage(p);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { loadPosts(1); }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        setPosting(true);
        try {
            await communityService.createPost({ content: newPost.trim() });
            setNewPost('');
            loadPosts(1);
        } catch { }
        setPosting(false);
    };

    const handleLike = async (id) => {
        if (!isAuthenticated) return;
        try { await communityService.toggleLike(id); } catch { }
        loadPosts(1);
    };

    const handleDelete = async (id) => {
        try { await communityService.deletePost(id); } catch { }
        loadPosts(1);
    };

    const currentUserId = user?._id || user?.id;

    return (
        <main className="page">
            <div className="comm-layout container">
                {/* Left Feed */}
                <div className="comm-feed">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 className="text-headline-md">Community</h1>
                        <p style={{ color: 'var(--clr-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Connect with the cinema elite.</p>
                    </div>

                    {/* Create post */}
                    {isAuthenticated && (
                        <form className="comm-compose" onSubmit={handleCreatePost}>
                            <div className="comm-compose-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                            <div style={{ flex: 1 }}>
                                <textarea
                                    className="comm-compose-textarea"
                                    placeholder="What are you watching?"
                                    value={newPost}
                                    onChange={e => setNewPost(e.target.value)}
                                    maxLength={500}
                                    rows={2}
                                />
                                <div className="comm-compose-footer">
                                    <span style={{ fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>{newPost.length}/500</span>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !newPost.trim()}>
                                        {posting ? 'Posting…' : 'Post'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {loading && posts.length === 0 && <Loader />}
                    {posts.length === 0 && !loading && (
                        <div className="empty-state"><div className="icon">💬</div><p>No posts yet — be the first!</p></div>
                    )}
                    {posts.map(p => (
                        <PostCard key={p._id} post={p} onLike={handleLike} onDelete={handleDelete} onUpdate={() => loadPosts(1)} currentUserId={currentUserId} />
                    ))}
                    {hasMore && (
                        <div className="flex-center" style={{ marginTop: '1.5rem' }}>
                            <button className="btn btn-outline" onClick={() => loadPosts(page + 1)} disabled={loading}>
                                {loading ? 'Loading…' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="comm-sidebar">
                    <div className="comm-sidebar-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                            <span style={{ color: 'var(--clr-primary-container)' }}>↑</span> Trending Discussions
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {['Poor Things', 'Oppenheimer', 'A24 Season', 'Cannes 2024', 'Kubrick Retro'].map((topic, i) => (
                                <li key={topic} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--clr-on-surface)', fontWeight: 500 }}>{topic}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>{[2400, 1800, 950, 820, 540][i]} posts</span>
                                    </div>
                                    {i < 4 && <div style={{ height: '1px', background: 'rgba(89,65,61,0.2)', marginTop: '0.75rem' }} />}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="comm-sidebar-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                            <span style={{ color: 'var(--clr-primary-container)' }}>👥</span> Active Clubs
                        </h3>
                        {['35mm Society', 'Lynchian Dreams', 'Neo-Noir Collective'].map(club => (
                            <div key={club} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🎬</div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-on-surface)' }}>{club}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>Active now</p>
                                    </div>
                                </div>
                                <button style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-primary-container)', background: 'none', border: 'none', cursor: 'pointer' }}>Join</button>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            <style>{`
                .comm-layout {
                    display: flex;
                    gap: 2rem;
                    align-items: flex-start;
                }
                .comm-feed { flex: 1; max-width: 700px; }
                .comm-sidebar { width: 300px; flex-shrink: 0; display: none; }
                @media (min-width: 1024px) { .comm-sidebar { display: block; } }

                .comm-sidebar-card {
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1.25rem;
                }

                .comm-compose {
                    display: flex;
                    gap: 1rem;
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1.25rem;
                }
                .comm-compose-avatar {
                    width: 44px; height: 44px;
                    border-radius: 50%;
                    background: var(--clr-primary-container);
                    color: var(--clr-on-primary-container);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 1rem;
                    flex-shrink: 0;
                }
                .comm-compose-textarea {
                    width: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--clr-on-surface);
                    font-size: 0.95rem;
                    resize: none;
                    font-family: inherit;
                    min-height: 50px;
                }
                .comm-compose-textarea::placeholder { color: rgba(168,138,133,0.5); }
                .comm-compose-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(89,65,61,0.2);
                }

                .comm-post-card {
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.12);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    transition: border-color 0.2s;
                }
                .comm-post-card:hover { border-color: rgba(89,65,61,0.3); }
                .comm-post-header {
                    display: flex; align-items: center; gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .comm-post-avatar {
                    width: 38px; height: 38px; border-radius: 50%;
                    background: var(--clr-primary-container);
                    color: var(--clr-on-primary-container);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 0.9rem;
                    flex-shrink: 0;
                }
                .comm-post-content { cursor: pointer; margin-bottom: 1rem; }
                .comm-post-actions {
                    display: flex; gap: 1.5rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(89,65,61,0.12);
                    margin-top: 0.5rem;
                }
                .comm-action-btn {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.875rem; font-weight: 500;
                    color: var(--clr-secondary);
                    background: none; border: none; cursor: pointer;
                    transition: color 0.2s;
                    padding: 0.25rem 0;
                }
                .comm-action-btn:hover { color: var(--clr-primary-container); }
                .comm-action-liked { color: #e05050 !important; }

                .comm-comments {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(89,65,61,0.15);
                }
                .comm-comment-item {
                    display: flex; gap: 0.6rem; align-items: flex-start;
                    margin-bottom: 0.6rem;
                }
                .comm-comment-avatar {
                    width: 28px; height: 28px; border-radius: 50%;
                    background: var(--clr-surface-highest);
                    color: var(--clr-secondary);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
                }
                .comm-comment-author { font-size: 0.82rem; font-weight: 700; color: var(--clr-on-surface); margin-right: 0.4rem; }
                .comm-comment-text { font-size: 0.85rem; color: var(--clr-on-surface-variant); }
                .comm-comment-form { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
            `}</style>
        </main>
    );
}
