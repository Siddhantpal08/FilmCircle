import { useState, useEffect } from 'react';
import { communityService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

function PostCard({ post, onLike, onDelete, currentUserId }) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localComments, setLocalComments] = useState(post.comments || []);
    const isOwner = currentUserId && post.author?._id === currentUserId;
    const liked = post.likes?.some(id => id === currentUserId);

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

    return (
        <div className="card post-card">
            <div className="post-header">
                <div className="post-avatar">{post.author?.username?.[0]?.toUpperCase()}</div>
                <div>
                    <strong>{post.author?.username || 'Unknown'}</strong>
                    <p style={{ fontSize: '0.78rem', margin: 0 }}>{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                {isOwner && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--clr-error)' }} onClick={() => onDelete(post._id)}>🗑</button>}
            </div>
            <p className="post-content">{post.content}</p>
            <div className="post-actions">
                <button className={`btn btn-ghost btn-sm ${liked ? 'liked' : ''}`} onClick={() => onLike(post._id)}>
                    ♥ {post.likes?.length || 0}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowComments(c => !c)}>
                    💬 {localComments.length}
                </button>
            </div>
            {showComments && (
                <div className="comments-section">
                    {localComments.map((c, i) => (
                        <div key={i} className="comment-item">
                            <strong>{c.author?.username || 'User'}</strong>: {c.text}
                        </div>
                    ))}
                    {currentUserId && (
                        <form onSubmit={handleComment} className="comment-form">
                            <input className="form-input" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" />
                            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>Post</button>
                        </form>
                    )}
                </div>
            )}
            <style>{`
        .post-card { padding: 1.25rem; margin-bottom: 1rem; }
        .post-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .post-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--clr-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; flex-shrink: 0; }
        .post-content { color: var(--clr-text); margin-bottom: 0.75rem; line-height: 1.6; }
        .post-actions { display: flex; gap: 0.5rem; }
        .liked { color: #e84545 !important; }
        .comments-section { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--clr-border); }
        .comment-item { font-size: 0.85rem; color: var(--clr-text-muted); margin-bottom: 0.4rem; }
        .comment-form { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
      `}</style>
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
        await communityService.toggleLike(id);
        loadPosts(1);
    };

    const handleDelete = async (id) => {
        await communityService.deletePost(id);
        loadPosts(1);
    };

    return (
        <main className="page">
            <div className="container" style={{ maxWidth: '720px' }}>
                <h1 style={{ marginBottom: '2rem' }}>🗣️ Community</h1>

                {isAuthenticated && (
                    <form className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }} onSubmit={handleCreatePost}>
                        <textarea className="form-textarea" style={{ marginBottom: '0.75rem' }} placeholder="Share your thoughts about a movie…" value={newPost} onChange={e => setNewPost(e.target.value)} maxLength={500} rows={3} />
                        <div className="flex-between">
                            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>{newPost.length}/500</span>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !newPost.trim()}>
                                {posting ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    </form>
                )}

                {loading && posts.length === 0 && <Loader />}
                {posts.length === 0 && !loading && (
                    <div className="empty-state"><div className="icon">💬</div><p>No posts yet — be the first to start the conversation!</p></div>
                )}
                {posts.map(p => (
                    <PostCard key={p._id} post={p} onLike={handleLike} onDelete={handleDelete} currentUserId={user?._id || user?.id} />
                ))}
                {hasMore && (
                    <div className="flex-center" style={{ marginTop: '1.5rem' }}>
                        <button className="btn btn-outline" onClick={() => loadPosts(page + 1)} disabled={loading}>
                            {loading ? 'Loading…' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
