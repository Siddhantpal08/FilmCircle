import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { communityService, clubService } from '../services';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import ConfirmModal from '../components/common/ConfirmModal';

const FIVE_MIN = 5 * 60 * 1000;
const TABS = ['All Posts', 'Your Posts', 'Your Comments', 'Your Likes'];

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

// ── SVG Icons ────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#C0392B' : 'none'}
        stroke={filled ? '#C0392B' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const BubbleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const PencilIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const TrashIcon = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
    </svg>
);

function userLikedPost(likes, userId) {
    if (!userId) return false;
    return (likes || []).some(id => String(id) === String(userId));
}

function PostCard({ post, onLikeChange, onDelete, onUpdate, currentUserId, highlightComment, isCommentsTab }) {
    const [showComments, setShowComments] = useState(!!highlightComment);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [localComments, setLocalComments] = useState(post.comments || []);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(post.content);
    const [saving, setSaving] = useState(false);
    const [localContent, setLocalContent] = useState(post.content);
    const [isEdited, setIsEdited] = useState(!!post.editedAt);

    // ── Optimistic like state (synced with parent posts for "Your Likes" tab) ───
    const [localLiked, setLocalLiked] = useState(() => userLikedPost(post.likes, currentUserId));
    const [localLikeCount, setLocalLikeCount] = useState(post.likes?.length || 0);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [deletingComment, setDeletingComment] = useState(false);

    useEffect(() => {
        setLocalLiked(userLikedPost(post.likes, currentUserId));
        setLocalLikeCount(post.likes?.length || 0);
    }, [post.likes, currentUserId]);

    const isOwner = currentUserId && (post.author?._id === currentUserId || post.author?.id === currentUserId);
    const { canEdit, secsLeft } = useEditTimer(post.createdAt);

    const handleOptimisticLike = async () => {
        if (!currentUserId) return;
        const prevLiked = localLiked;
        const prevCount = localLikeCount;
        const nextLiked = !prevLiked;
        setLocalLiked(nextLiked);
        setLocalLikeCount(nextLiked ? prevCount + 1 : prevCount - 1);
        onLikeChange?.(post._id, nextLiked);
        try {
            await communityService.toggleLike(post._id);
        } catch {
            setLocalLiked(prevLiked);
            setLocalLikeCount(prevCount);
            onLikeChange?.(post._id, prevLiked);
        }
    };

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

    const handleDeleteComment = (commentId) => {
        setCommentToDelete(commentId);
    };

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;
        const commentId = commentToDelete;
        setDeletingComment(true);
        const prev = localComments;
        setLocalComments(c => c.filter(x => (x._id || x.id) !== commentId));
        try {
            await communityService.deleteComment(post._id, commentId);
            setCommentToDelete(null);
        } catch {
            setLocalComments(prev);
        }
        setDeletingComment(false);
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

    // ── "Your Comments" tab: Twitter-style reply view ─────────────────────────
    if (isCommentsTab) {
        const myComments = localComments.filter(
            c => c.author?._id === currentUserId || c.author?.id === currentUserId
        );
        return (
            <>
            <div className="comm-post-card">
                {/* Quoted post preview — small, muted */}
                <div className="comm-reply-context">
                    <span className="comm-reply-context-author">↳ {post.author?.username || 'Unknown'}</span>
                    <p className="comm-reply-context-text">{localContent}</p>
                </div>

                {/* User's comments — primary content */}
                {myComments.map((c) => {
                    const cid = c._id || c.id;
                    return (
                        <div key={cid} className="comm-reply-comment">
                            <div className="comm-post-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', flexShrink: 0 }}>
                                {c.author?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                    <strong style={{ fontSize: '0.88rem', color: 'var(--clr-on-surface)' }}>
                                        {c.author?.username || 'You'}
                                    </strong>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-secondary)' }}>
                                        {c.createdAt ? timeAgo(c.createdAt) : ''}
                                    </span>
                                    <button
                                        className="comm-comment-delete-btn"
                                        onClick={() => handleDeleteComment(cid)}
                                        title="Delete comment"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--clr-on-surface)', lineHeight: 1.5 }}>
                                    {c.text}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ConfirmModal
                open={!!commentToDelete}
                title="Delete Comment?"
                message="This action cannot be undone."
                onConfirm={confirmDeleteComment}
                onCancel={() => setCommentToDelete(null)}
                confirming={deletingComment}
            />
            </>
        );
    }

    // ── Default post card view ─────────────────────────────────────────────────
    return (
        <>
        <div className="comm-post-card">
            <div className="comm-post-header">
                <div className="comm-post-avatar">{post.author?.username?.[0]?.toUpperCase() || '?'}</div>
                <div style={{ flex: 1 }}>
                    <strong style={{ color: 'var(--clr-on-surface)', fontSize: '0.9rem' }}>
                        {post.author?.username || 'Unknown'}
                    </strong>
                    <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--clr-secondary)' }}>
                        {timeAgo(post.createdAt)}
                        {isEdited && <span style={{ marginLeft: '0.4rem', fontStyle: 'italic', opacity: 0.7 }}>· edited</span>}
                    </p>
                </div>
                {isOwner && (
                    <div className="comm-post-actions-group">
                        {canEdit && !editing && (
                            <button
                                type="button"
                                className="comm-post-action-btn comm-post-action-edit"
                                onClick={() => setEditing(true)}
                                title={`Edit (${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')} left)`}
                                aria-label="Edit post"
                            >
                                <PencilIcon />
                            </button>
                        )}
                        <button
                            type="button"
                            className="comm-post-action-btn comm-post-action-delete"
                            onClick={() => onDelete(post._id)}
                            title="Delete post"
                            aria-label="Delete post"
                        >
                            <TrashIcon size={16} />
                        </button>
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
                <button
                    className={`comm-action-btn ${localLiked ? 'comm-action-liked' : ''}`}
                    onClick={handleOptimisticLike}
                >
                    <HeartIcon filled={localLiked} />
                    <span>{localLikeCount}</span>
                </button>
                <button className="comm-action-btn" onClick={() => setShowComments(c => !c)}>
                    <BubbleIcon />
                    <span>{localComments.length}</span>
                </button>
            </div>

            {showComments && (
                <div className="comm-comments">
                    {localComments.map((c, i) => {
                        const cid = c._id || c.id || i;
                        const isMyComment = c.author?._id === currentUserId || c.author?.id === currentUserId;
                        return (
                            <div key={cid} className={`comm-comment-item ${highlightComment && isMyComment ? 'comm-comment-highlighted' : ''}`}>
                                <div className="comm-comment-avatar">{c.author?.username?.[0]?.toUpperCase() || '?'}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span className="comm-comment-author">{c.author?.username || 'User'}</span>
                                    <span className="comm-comment-text">{c.text}</span>
                                </div>
                                {isMyComment && (
                                    <button
                                        className="comm-comment-delete-btn"
                                        onClick={() => handleDeleteComment(cid)}
                                        title="Delete comment"
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {currentUserId && (
                        <form onSubmit={handleComment} className="comm-comment-form">
                            <input className="form-input" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" />
                            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>Post</button>
                        </form>
                    )}
                </div>
            )}
        </div>
        <ConfirmModal
            open={!!commentToDelete}
            title="Delete Comment?"
            message="This action cannot be undone."
            onConfirm={confirmDeleteComment}
            onCancel={() => setCommentToDelete(null)}
            confirming={deletingComment}
        />
        </>
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
    const [activeTab, setActiveTab] = useState('All Posts');

    // Sidebar state
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [activeClubs, setActiveClubs] = useState([]);
    const [sidebarLoading, setSidebarLoading] = useState(true);
    const [failedImageClubIds, setFailedImageClubIds] = useState([]);

    const currentUserId = user?._id || user?.id;

    const loadPosts = async (p = 1) => {
        setLoading(true);
        try {
            const res = await communityService.getPosts(p, 50); // fetch more for client-side filtering
            const { posts: data, pages } = res.data;
            setPosts(prev => p === 1 ? data : [...prev, ...data]);
            setHasMore(p < pages);
            setPage(p);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { loadPosts(1); }, []);

    // Load sidebar data
    useEffect(() => {
        setSidebarLoading(true);
        communityService.getSidebar()
            .then(res => {
                setTrendingPosts(res.data.trendingPosts || []);
                setActiveClubs(res.data.activeClubs || []);
            })
            .catch(err => console.error('[Sidebar] fetch error:', err))
            .finally(() => setSidebarLoading(false));
    }, [posts.length]); // refresh sidebar when posts change

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

    const handleLikeChange = useCallback((postId, liked) => {
        if (!currentUserId) return;
        setPosts(prev => prev.map(p => {
            if (String(p._id) !== String(postId)) return p;
            const likes = [...(p.likes || [])];
            const already = userLikedPost(likes, currentUserId);
            if (liked && !already) {
                return { ...p, likes: [...likes, currentUserId] };
            }
            if (!liked && already) {
                return { ...p, likes: likes.filter(id => String(id) !== String(currentUserId)) };
            }
            return p;
        }));
    }, [currentUserId]);

    const handleDelete = async (id) => {
        try { await communityService.deletePost(id); } catch { }
        loadPosts(1);
    };

    // ── Client-side filtering ───────────────────────────────────────────────────
    const filteredPosts = (() => {
        if (activeTab === 'Your Posts') {
            return posts.filter(p => p.author?._id === currentUserId || p.author?.id === currentUserId);
        }
        if (activeTab === 'Your Comments') {
            return posts.filter(p =>
                p.comments?.some(c => c.author?._id === currentUserId || c.author?.id === currentUserId)
            );
        }
        if (activeTab === 'Your Likes') {
            return posts.filter(p => userLikedPost(p.likes, currentUserId));
        }
        return posts;
    })();

    const emptyMessages = {
        'Your Posts': "You haven't posted anything yet.",
        'Your Comments': "You haven't commented on any posts yet.",
        'Your Likes': "You haven't liked anything yet.",
    };

    const handleJoinClub = async (clubId) => {
        if (!isAuthenticated || !currentUserId) return;

        const club = activeClubs.find(c => c._id === clubId);
        if (!club) return;

        const isCurrentlyMember = club.members?.some(mId => String(mId) === String(currentUserId));

        // Optimistic UI updates
        // 1. Update activeClubs member list and memberCount
        const updatedClubs = activeClubs.map(c => {
            if (c._id === clubId) {
                const members = c.members || [];
                const newMembers = isCurrentlyMember
                    ? members.filter(mId => String(mId) !== String(currentUserId))
                    : [...members, currentUserId];
                return {
                    ...c,
                    members: newMembers,
                    memberCount: newMembers.length
                };
            }
            return c;
        });
        setActiveClubs(updatedClubs);

        // 2. Update user context joinedClubs
        if (user) {
            const joinedClubs = user.joinedClubs || [];
            const newJoinedClubs = isCurrentlyMember
                ? joinedClubs.filter(c => String(c._id || c) !== String(clubId))
                : [...joinedClubs, club];
            updateUser({ joinedClubs: newJoinedClubs });
        }

        try {
            if (isCurrentlyMember) {
                await clubService.leave(clubId);
            } else {
                await clubService.join(clubId);
            }
        } catch (err) {
            // Revert state on error
            setActiveClubs(activeClubs);
            if (user) {
                updateUser({ joinedClubs: user.joinedClubs });
            }
        }
    };

    const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : str;

    return (
        <main className="page">
            <div className="comm-layout container">
                <div className="comm-page-header">
                    <h1 className="text-headline-md">Community</h1>
                    <p style={{ color: 'var(--clr-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Connect with the cinema elite.</p>
                </div>

                <div className="comm-body">
                {/* ── Left Feed ── */}
                <div className="comm-feed">
                    {/* Compose box */}
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

                    {/* ── Gated content: show lock screen for logged-out users ── */}
                    {!isAuthenticated ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', padding: '4rem 2rem', gap: '1rem',
                            background: 'var(--clr-surface-high)', border: '1px solid rgba(89,65,61,0.15)',
                            borderRadius: 'var(--radius)',
                        }}>
                            <div style={{ fontSize: '3rem', lineHeight: 1 }}>🔒</div>
                            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--clr-on-surface)' }}>
                                Join the conversation
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--clr-secondary)', maxWidth: '340px', lineHeight: 1.6 }}>
                                Login or create an account to read and post in the FilmCircle community
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <Link to="/login" className="btn btn-primary">Log In</Link>
                                <Link to="/register" className="btn btn-outline">Sign Up</Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ── Filter Tabs ── */}
                            <div className="comm-tabs">
                                {TABS.map(tab => {
                                    // Hide user-specific tabs when not logged in
                                    if (!isAuthenticated && tab !== 'All Posts') return null;
                                    return (
                                        <button
                                            key={tab}
                                            className={`comm-tab ${activeTab === tab ? 'comm-tab-active' : ''}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Feed */}
                            {loading && posts.length === 0 && <Loader />}

                            {!loading && filteredPosts.length === 0 && (
                                <div className="empty-state">
                                    <div className="icon">💬</div>
                                    <p>{activeTab === 'All Posts' ? 'No posts yet — be the first!' : emptyMessages[activeTab]}</p>
                                </div>
                            )}

                            {filteredPosts.map(p => (
                                <PostCard
                                    key={p._id}
                                    post={p}
                                    onLikeChange={handleLikeChange}
                                    onDelete={handleDelete}
                                    onUpdate={() => loadPosts(1)}
                                    currentUserId={currentUserId}
                                    highlightComment={activeTab === 'Your Comments'}
                                    isCommentsTab={activeTab === 'Your Comments'}
                                />
                            ))}

                            {activeTab === 'All Posts' && hasMore && (
                                <div className="flex-center" style={{ marginTop: '1.5rem' }}>
                                    <button className="btn btn-outline" onClick={() => loadPosts(page + 1)} disabled={loading}>
                                        {loading ? 'Loading…' : 'Load More'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <aside className="comm-sidebar">

                    {/* Trending Discussions */}
                    <div className="comm-sidebar-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                            <span style={{ color: 'var(--clr-primary-container)' }}>↑</span> Trending Discussions
                        </h3>
                        {sidebarLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Array(3).fill().map((_, i) => (
                                    <div key={i} style={{ height: 14, borderRadius: 4, background: 'var(--clr-surface-container)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                                ))}
                            </div>
                        ) : trendingPosts.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)', margin: 0 }}>No discussions yet — start one!</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {trendingPosts.map((post, i) => (
                                    <li key={post._id} style={{ cursor: 'default' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.825rem', color: 'var(--clr-on-surface)', fontWeight: 500, lineHeight: 1.4 }}>
                                                {truncate(post.content, 55)}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--clr-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                💬 {post.commentCount}
                                            </span>
                                        </div>
                                        {i < trendingPosts.length - 1 && <div style={{ height: '1px', background: 'rgba(89,65,61,0.2)', marginTop: '0.75rem' }} />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Active Clubs */}
                    <div className="comm-sidebar-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                            <span style={{ color: 'var(--clr-primary-container)' }}>👥</span> Active Clubs
                        </h3>
                        {sidebarLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {Array(3).fill().map((_, i) => (
                                    <div key={i} style={{ height: 36, borderRadius: 6, background: 'var(--clr-surface-container)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                                ))}
                            </div>
                        ) : activeClubs.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)', margin: 0 }}>No clubs yet — create one!</p>
                        ) : (
                            activeClubs.map(club => {
                                const isMember = club.members?.some(mId => String(mId) === String(currentUserId));
                                const hasImage = !failedImageClubIds.includes(club._id) && (club.logoUrl || club.bannerUrl);
                                return (
                                    <div key={club._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {hasImage ? (
                                                <img
                                                    src={club.logoUrl || club.bannerUrl}
                                                    alt={club.name}
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 8,
                                                        objectFit: 'cover',
                                                        flexShrink: 0,
                                                        border: '1px solid rgba(192,57,43,0.3)'
                                                    }}
                                                    onError={() => {
                                                        setFailedImageClubIds(prev => [...prev, club._id]);
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 8,
                                                    background: '#C0392B',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    flexShrink: 0
                                                }}>
                                                    {club.name?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-on-surface)' }}>{club.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--clr-secondary)' }}>
                                                    {club.recentPostCount > 0 ? `${club.recentPostCount} post${club.recentPostCount !== 1 ? 's' : ''} this week` : 'Quiet this week'}
                                                    {' · '}{club.memberCount} member{club.memberCount !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {isAuthenticated && (
                                        <button
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                color: isMember ? '#8c8c8c' : 'var(--clr-primary-container)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleJoinClub(club._id)}
                                        >
                                            {isMember ? 'Joined' : 'Join'}
                                        </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>
                </div>
            </div>

            <style>{`
                .comm-layout {
                    padding-top: 1.5rem;
                }
                .comm-page-header {
                    margin-bottom: 1.5rem;
                }
                .comm-body {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 280px;
                    gap: 3.5rem;
                    align-items: start;
                    width: 100%;
                }
                .comm-feed { min-width: 0; }
                .comm-sidebar {
                    width: 280px;
                    min-width: 0;
                    position: sticky;
                    top: 90px;
                    align-self: start;
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 1024px) {
                    .comm-body { grid-template-columns: 1fr; }
                    .comm-sidebar { display: none; }
                }

                .comm-sidebar-card {
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                }

                .confirm-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.72);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .confirm-modal {
                    background: #0f0f0f;
                    border: 1px solid rgba(89, 65, 61, 0.25);
                    border-radius: var(--radius);
                    padding: 1.75rem;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
                }
                .confirm-modal-title {
                    margin: 0 0 0.5rem;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: var(--clr-on-surface);
                }
                .confirm-modal-message {
                    margin: 0 0 1.5rem;
                    font-size: 0.9rem;
                    color: var(--clr-secondary);
                    line-height: 1.5;
                }
                .confirm-modal-actions {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: flex-end;
                }
                .confirm-modal-cancel {
                    padding: 0.55rem 1.1rem;
                    border-radius: var(--radius-sm);
                    border: 1px solid rgba(89, 65, 61, 0.35);
                    background: rgba(89, 65, 61, 0.2);
                    color: rgba(168, 138, 133, 0.95);
                    font-size: 0.875rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: background 0.15s, color 0.15s;
                }
                .confirm-modal-cancel:hover:not(:disabled) {
                    background: rgba(89, 65, 61, 0.32);
                    color: var(--clr-on-surface);
                }
                .confirm-modal-delete {
                    padding: 0.55rem 1.1rem;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: #C0392B;
                    color: #fff;
                    font-size: 0.875rem;
                    font-weight: 700;
                    font-family: inherit;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .confirm-modal-delete:hover:not(:disabled) { background: #a93226; }
                .confirm-modal-cancel:disabled,
                .confirm-modal-delete:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Filter tabs */
                .comm-tabs {
                    display: flex;
                    gap: 0.25rem;
                    margin-bottom: 1.25rem;
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 0.35rem;
                    flex-wrap: wrap;
                }
                .comm-tab {
                    flex: 1;
                    min-width: max-content;
                    padding: 0.45rem 0.85rem;
                    border-radius: calc(var(--radius) - 2px);
                    border: none;
                    background: transparent;
                    color: var(--clr-secondary);
                    font-size: 0.82rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.18s;
                    white-space: nowrap;
                }
                .comm-tab:hover { color: var(--clr-on-surface); background: rgba(89,65,61,0.08); }
                .comm-tab-active {
                    background: var(--clr-primary-container) !important;
                    color: var(--clr-on-primary-container) !important;
                    box-shadow: 0 1px 4px rgba(192,57,43,0.25);
                }

                .comm-compose {
                    display: flex; gap: 1rem;
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1.25rem;
                }
                .comm-compose-avatar {
                    width: 44px; height: 44px; border-radius: 50%;
                    background: var(--clr-primary-container);
                    color: var(--clr-on-primary-container);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 1rem; flex-shrink: 0;
                }
                .comm-compose-textarea {
                    width: 100%; background: transparent; border: none; outline: none;
                    color: var(--clr-on-surface); font-size: 0.95rem; resize: none;
                    font-family: inherit; min-height: 50px;
                }
                .comm-compose-textarea::placeholder { color: rgba(168,138,133,0.5); }
                .comm-compose-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-top: 0.75rem; padding-top: 0.75rem;
                    border-top: 1px solid rgba(89,65,61,0.2);
                }

                .comm-post-card {
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.12);
                    border-radius: var(--radius);
                    padding: 1.25rem; margin-bottom: 1rem;
                    transition: border-color 0.2s;
                }
                .comm-post-card:hover { border-color: rgba(89,65,61,0.3); }
                .comm-post-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
                .comm-post-actions-group {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    flex-shrink: 0;
                }
                .comm-post-action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.35rem;
                    background: none;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    color: var(--clr-secondary);
                    opacity: 0.85;
                    transition: color 0.15s, opacity 0.15s;
                }
                .comm-post-action-btn:hover { opacity: 1; }
                .comm-post-action-edit:hover { color: #C0392B; }
                .comm-post-action-delete:hover { color: #e74c3c; }
                .comm-post-avatar {
                    width: 38px; height: 38px; border-radius: 50%;
                    background: var(--clr-primary-container);
                    color: var(--clr-on-primary-container);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 0.9rem; flex-shrink: 0;
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
                    transition: color 0.2s; padding: 0.25rem 0;
                }
                .comm-action-btn:hover { color: var(--clr-primary-container); }
                .comm-action-liked { color: #C0392B !important; }
                .comm-action-liked svg { stroke: #C0392B; }

                /* Comment delete button — shows on comment hover */
                .comm-comment-delete-btn {
                    background: none; border: none; cursor: pointer;
                    color: var(--clr-secondary); opacity: 0;
                    padding: 0.2rem; border-radius: 4px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    transition: opacity 0.15s, color 0.15s;
                }
                .comm-comment-item:hover .comm-comment-delete-btn,
                .comm-reply-comment:hover .comm-comment-delete-btn { opacity: 1; }
                .comm-comment-delete-btn:hover { color: var(--clr-error); }

                /* Twitter-style reply view */
                .comm-reply-context {
                    background: var(--clr-surface-container);
                    border: 1px solid rgba(89,65,61,0.18);
                    border-radius: var(--radius-sm);
                    padding: 0.6rem 0.85rem;
                    margin-bottom: 1rem;
                    border-left: 3px solid rgba(89,65,61,0.35);
                }
                .comm-reply-context-author {
                    font-size: 0.72rem; font-weight: 700;
                    color: var(--clr-secondary); display: block;
                    margin-bottom: 0.2rem;
                }
                .comm-reply-context-text {
                    margin: 0; font-size: 0.8rem;
                    color: var(--clr-secondary); line-height: 1.5;
                    display: -webkit-box; -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical; overflow: hidden;
                }
                .comm-reply-comment {
                    display: flex; gap: 0.75rem; align-items: flex-start;
                    padding: 0.5rem 0;
                }
                .comm-reply-comment + .comm-reply-comment {
                    border-top: 1px solid rgba(89,65,61,0.1);
                    margin-top: 0.5rem;
                }

                @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

                .comm-comments {
                    margin-top: 1rem; padding-top: 1rem;
                    border-top: 1px solid rgba(89,65,61,0.15);
                }
                .comm-comment-item { display: flex; gap: 0.6rem; align-items: flex-start; margin-bottom: 0.6rem; }
                .comm-comment-highlighted {
                    background: rgba(192,57,43,0.07);
                    border-radius: var(--radius-sm);
                    padding: 0.3rem 0.5rem;
                    margin-left: -0.5rem;
                    border-left: 3px solid var(--clr-primary-container);
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

                @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
            `}</style>
        </main>
    );
}
