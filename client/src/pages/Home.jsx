// TMDB integration — local test only, do not commit yet

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { movieService } from '../services';
import MovieCard from '../components/movie/MovieCard';
import TmdbMovieCard from '../components/movie/TmdbMovieCard';
import SkeletonCard from '../components/common/SkeletonCard';
import { tmdbService } from '../services/tmdbService';
import { useAuth } from '../context/AuthContext';

// ── OMDB-based genre chips (search bar — untouched) ──────────────────────────
const QUERY_CHIPS = [
    { label: 'Action', q: 'Action' },
    { label: 'Romance', q: 'Romance' },
    { label: 'Thriller', q: 'Thriller' },
    { label: 'Horror', q: 'Horror' },
    { label: 'Sci-Fi', q: 'Sci-Fi' },
    { label: 'Drama', q: 'Drama' },
    { label: 'Comedy', q: 'Comedy' },
    { label: 'Noir', q: 'Noir' },
];

// ── TMDB category rows config ─────────────────────────────────────────────────
const TMDB_CATEGORIES = [
    { key: 'action', label: 'Action & Thriller', fetcher: () => tmdbService.getActionThriller() },
    { key: 'comedy', label: 'Comedy', fetcher: () => tmdbService.getComedy() },
    { key: 'drama', label: 'Drama', fetcher: () => tmdbService.getDrama() },
    { key: 'scifi', label: 'Sci-Fi & Fantasy', fetcher: () => tmdbService.getSciFiFantasy() },
    { key: 'animation', label: 'Animation', fetcher: () => tmdbService.getAnimation() },
];

export default function Home() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isHomePage = pathname === '/';
    const { isAuthenticated } = useAuth();

    // ── OMDB state (search + indie — untouched logic) ─────────────────────────
    const [results, setResults] = useState([]);
    const [indie, setIndie] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── TMDB Trending state ───────────────────────────────────────────────────
    const [tmdbTrending, setTmdbTrending] = useState([]);
    const [tmdbTrendingError, setTmdbTrendingError] = useState('');
    const [tmdbTrendingLoading, setTmdbTrendingLoading] = useState(true);

    // ── TMDB category rows state: { [key]: { movies, error, loading } } ───────
    const [categoryRows, setCategoryRows] = useState(
        Object.fromEntries(TMDB_CATEGORIES.map(c => [c.key, { movies: [], error: false, loading: true }]))
    );

    // ── Sidebar: Community "Most Interesting" leaderboard ────────────────────────
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);

    // ── Sidebar: Recommended For You ─────────────────────────────────────────────
    const [recommended, setRecommended] = useState([]);
    const [recommendedVisible, setRecommendedVisible] = useState(false);


    // ── Fetch OMDB indie films on mount ───────────────────────────────────────
    useEffect(() => {
        movieService.getIndependent()
            .then(res => setIndie(res.data))
            .catch(err => console.error('[OMDB] indie fetch error:', err));
    }, []);

    // ── Fetch TMDB Trending Now on mount ──────────────────────────────────────
    useEffect(() => {
        setTmdbTrendingLoading(true);
        tmdbService.getTrending()
            .then(movies => {
                if (movies.length === 0) {
                    setTmdbTrendingError('Could not load trending movies.');
                } else {
                    setTmdbTrending(movies);
                }
            })
            .catch(err => {
                console.error('[TMDB] trending fetch error:', err);
                setTmdbTrendingError('Could not load trending movies.');
            })
            .finally(() => setTmdbTrendingLoading(false));
    }, []);


    // ── Fetch TMDB category rows on mount ─────────────────────────────────────
    useEffect(() => {
        TMDB_CATEGORIES.forEach(({ key, fetcher }) => {
            fetcher()
                .then(movies => {
                    setCategoryRows(prev => ({
                        ...prev,
                        [key]: { movies, error: movies.length === 0, loading: false },
                    }));
                })
                .catch(err => {
                    console.error(`[TMDB] category "${key}" fetch error:`, err);
                    setCategoryRows(prev => ({
                        ...prev,
                        [key]: { movies: [], error: true, loading: false },
                    }));
                });
        });
    }, []);

    // ── Fetch community "Most Interesting" leaderboard on mount ─────────────────────
    useEffect(() => {
        setLeaderboardLoading(true);
        movieService.getInterestingLeaderboard()
            .then(res => setLeaderboard(res.data || []))
            .catch(err => console.error('[Leaderboard] fetch error:', err))
            .finally(() => setLeaderboardLoading(false));
    }, []);

    // ── Fetch Recommended For You on mount ────────────────────────────────────────
    useEffect(() => {
        const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const TMDB_BASE = 'https://api.tmdb.org/3';
        const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
        const twoWeeksAgo = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 14);
            return d.toISOString().slice(0, 10);
        })();

        const tmdbGet = (path) =>
            fetch(`${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_KEY}&language=en-US`)
                .then(r => { if (!r.ok) throw new Error(`TMDB ${r.status}`); return r.json(); })
                .then(d => d.results || [])
                .catch(() => []);

        Promise.all([
            tmdbGet('/trending/movie/week'),
            tmdbGet('/movie/top_rated'),
            tmdbGet('/discover/movie?with_original_language=hi&sort_by=popularity.desc&region=IN'),
            tmdbGet(`/discover/movie?primary_release_date.gte=${twoWeeksAgo}&sort_by=popularity.desc`),
        ]).then(([trending, topRated, indian, newRelease]) => {
            const toEntry = (m, tag) => ({
                tmdbId: m.id,
                title: m.title || m.name || 'Untitled',
                year: m.release_date ? m.release_date.slice(0, 4) : '',
                poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
                tag,
            });

            const raw = [
                ...trending.slice(0, 2).map(m => toEntry(m, '🔥 Trending')),
                ...topRated.slice(0, 1).map(m => toEntry(m, '⭐ Top Rated')),
                ...indian.slice(0, 1).map(m => toEntry(m, '🎬 Popular in India')),
                ...newRelease.slice(0, 1).map(m => toEntry(m, '🆕 New Release')),
            ];

            // Deduplicate by tmdbId
            const seen = new Set();
            const unique = raw.filter(m => {
                if (seen.has(m.tmdbId)) return false;
                seen.add(m.tmdbId);
                return true;
            });

            // Light shuffle: swap a couple of adjacent pairs so order feels natural
            if (unique.length >= 4) { [unique[1], unique[2]] = [unique[2], unique[1]]; }

            const final = unique.slice(0, 5);
            if (final.length > 0) {
                setRecommended(final);
                setRecommendedVisible(true);
            }
        }).catch(() => { /* silently hide on error */ });
    }, []);

    // ── OMDB search when query changes (untouched logic) ──────────────────────
    useEffect(() => {
        if (!query) return;
        setLoading(true);
        setError('');
        setResults([]);
        movieService.search(query)
            .then(res => setResults(res.data.results))
            .catch(err => {
                if (err.response?.status === 503) {
                    setError('🔑 OMDB API key not configured. Get a free key at omdbapi.com/apikey.aspx and add OMDB_API_KEY to your server .env file.');
                } else {
                    setError('Failed to search. Please try again.');
                }
            })
            .finally(() => setLoading(false));
    }, [query]);

    const homeContentLoading = tmdbTrendingLoading;

    return (
        <main className="page home-page-gradient">
            <div className="container">
                <div className="home-layout">

                    {/* ── Left Main Content ── */}
                    <div className="home-main">

                        {/* ── OMDB Search Results (shown only when there is a query) ── */}
                        {query && (
                            <section className="section">
                                <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <h2>
                                        Results for "<span style={{ color: 'var(--clr-primary)' }}>{query}</span>"
                                    </h2>
                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>✕ Clear</button>
                                </div>

                                {/* Genre filter chips */}
                                <div className="chip-row" style={{ marginBottom: '1.5rem' }}>
                                    {QUERY_CHIPS.map(({ label, q: cq }) => (
                                        <button
                                            key={cq}
                                            className={`query-chip ${query === cq ? 'query-chip-active' : ''}`}
                                            onClick={() => navigate(`/?q=${encodeURIComponent(cq)}`)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {loading && (
                                    <div className="grid-movies-6x2">
                                        {Array(12).fill().map((_, i) => <SkeletonCard key={i} />)}
                                    </div>
                                )}
                                {error && <div className="alert alert-error">{error}</div>}
                                {!loading && results.length === 0 && !error && (
                                    <div className="empty-state">
                                        <div className="icon">🎬</div>
                                        <p>No movies found for "{query}"</p>
                                    </div>
                                )}
                                <div className="grid-movies-6x2">
                                    {results.slice(0, 18).map(m =>
                                        m.source === 'tmdb' || m.tmdbId
                                            ? <TmdbMovieCard key={m.tmdbId || m.imdbID} movie={m} />
                                            : <MovieCard key={m.imdbID || m._id} movie={m} />
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ── Home content (no active search query) ── */}
                        {!query && (
                            <>
                                {/* ── 1. Trending Now (TMDB) ── */}
                                <section className="section">
                                    <h2 className="text-headline-md" style={{ borderLeft: '4px solid var(--clr-primary-container)', paddingLeft: '1rem', marginBottom: '15px' }}>
                                        Trending Now
                                    </h2>

                                    {tmdbTrendingLoading && (
                                        <div className="grid-movies-6x2">
                                            {Array(12).fill().map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    )}
                                    {tmdbTrendingError && !tmdbTrendingLoading && (
                                        <div className="tmdb-error-msg">⚠ {tmdbTrendingError}</div>
                                    )}
                                    {!tmdbTrendingLoading && tmdbTrending.length > 0 && (
                                        <div className="grid-movies-6x2">
                                            {tmdbTrending.map(m => (
                                                <TmdbMovieCard key={m.tmdbId} movie={m} />
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* ── 2. Independent Films (OMDB — user-uploaded) ── */}
                                {indie.length > 0 && (
                                    <section className="section">
                                        <div className="section-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <h2 className="text-headline-md" style={{ borderLeft: '4px solid var(--clr-primary-container)', paddingLeft: '1rem' }}>Independent Films</h2>
                                                <span className="badge badge-tertiary">Indie</span>
                                            </div>
                                            <Link to="/upload" className="btn btn-ghost btn-sm">Upload Yours →</Link>
                                        </div>
                                        <div className="grid-movies-6x2">
                                            {indie.slice(0, 12).map(m => (
                                                <MovieCard
                                                    key={m._id}
                                                    movie={{ Title: m.title, Poster: m.posterUrl, Year: m.year || '', imdbID: m._id, Genre: m.genre || '' }}
                                                    indie
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ── 3–7. TMDB Category Rows ── */}
                                {TMDB_CATEGORIES.map(({ key, label }) => {
                                    const row = categoryRows[key];
                                    return (
                                        <section key={key} className="section">
                                            <h2 className="text-headline-md" style={{ borderLeft: '4px solid var(--clr-primary-container)', paddingLeft: '1rem', marginBottom: '15px' }}>
                                                {label}
                                            </h2>

                                            {row.loading && (
                                                <div className="grid-movies-6x2">
                                                    {Array(12).fill().map((_, i) => <SkeletonCard key={i} />)}
                                                </div>
                                            )}
                                            {row.error && !row.loading && (
                                                <div className="tmdb-error-msg">⚠ Could not load {label} movies.</div>
                                            )}
                                            {!row.loading && row.movies.length > 0 && (
                                                <div className="grid-movies-6x2">
                                                    {row.movies.map(m => (
                                                        <TmdbMovieCard key={m.tmdbId} movie={m} />
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })}

                                {/* Empty state — only if everything failed */}
                                {tmdbTrending.length === 0 && indie.length === 0 && !homeContentLoading && (
                                    <div className="empty-state">
                                        <div className="icon">🍿</div>
                                        <p style={{ fontSize: '1.1rem' }}>Search for any movie above to get started!</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Right Sidebar (restored fully — untouched) ── */}
                    <aside className="home-sidebar">

                        {/* 0. Recommended For You (TMDB) */}
                        {recommendedVisible && (
                            <div className="home-sidebar-card">
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: 0 }}>
                                        Recommended For You
                                    </h3>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--clr-secondary)', letterSpacing: '0.02em' }}>
                                        Based on trends &amp; popularity
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {recommended.map((m) => (
                                        <div
                                            key={m.tmdbId}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                                            onClick={() => navigate(`/movie/${m.tmdbId}?title=${encodeURIComponent(m.title)}&year=${encodeURIComponent(m.year)}&poster=${encodeURIComponent(m.poster || '')}`)}
                                        >
                                            {m.poster ? (
                                                <img
                                                    src={m.poster}
                                                    alt={m.title}
                                                    style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(89,65,61,0.3)' }}
                                                    onError={e => { e.target.style.background = 'var(--clr-surface-high)'; e.target.src = ''; }}
                                                />
                                            ) : (
                                                <div style={{ width: 40, height: 56, borderRadius: 6, flexShrink: 0, background: 'var(--clr-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--clr-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {m.title}
                                                </p>
                                                <p style={{ margin: '0.15rem 0 0.3rem', fontSize: '0.72rem', color: 'var(--clr-secondary)' }}>{m.year}</p>
                                                <span style={{
                                                    display: 'inline-block',
                                                    fontSize: '0.64rem',
                                                    fontWeight: 700,
                                                    color: 'var(--clr-primary-container)',
                                                    background: 'rgba(192,57,43,0.08)',
                                                    border: '1px solid rgba(192,57,43,0.2)',
                                                    borderRadius: 'var(--radius-full)',
                                                    padding: '0.08rem 0.4rem',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {m.tag}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 1. Community "Most Interesting" Leaderboard */}
                        <div className="home-sidebar-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                                <span style={{ color: 'var(--clr-primary-container)' }}>⭐</span> Most Interesting
                                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--clr-secondary)', fontWeight: 400, letterSpacing: '0.04em' }}>platform-wide</span>
                            </h3>

                            {leaderboardLoading && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {Array(5).fill().map((_, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: 40, height: 56, borderRadius: 6, background: 'var(--clr-surface-container)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ height: 10, borderRadius: 4, background: 'var(--clr-surface-container)', marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
                                                <div style={{ height: 8, width: '60%', borderRadius: 4, background: 'var(--clr-surface-container)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!leaderboardLoading && leaderboard.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'var(--clr-secondary)', lineHeight: 1.6, margin: 0 }}>
                                    No votes yet — be the first to mark a film as interesting!
                                </p>
                            )}

                            {!leaderboardLoading && leaderboard.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {leaderboard.map((m) => (
                                        <div
                                            key={m._id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                                            onClick={() => window.location.href = `/movie/${m.imdbID || m._id}`}
                                        >
                                            <img
                                                src={m.posterUrl}
                                                alt={m.title}
                                                style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(89,65,61,0.3)' }}
                                                onError={e => { e.target.style.background = 'var(--clr-surface-high)'; e.target.src = ''; }}
                                            />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--clr-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {m.title}
                                                </p>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: 'var(--clr-secondary)' }}>{m.year || ''}</p>
                                            </div>
                                            <span style={{
                                                flexShrink: 0,
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                color: 'var(--clr-primary-container)',
                                                background: 'rgba(192,57,43,0.08)',
                                                border: '1px solid rgba(192,57,43,0.2)',
                                                borderRadius: 'var(--radius-full)',
                                                padding: '0.1rem 0.45rem',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                ★ {m.interestingCount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Trending Discussions — hidden on homepage */}
                        {!isHomePage && (
                            <div className="home-sidebar-card">
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
                        )}

                        {/* 3. Active Clubs — hidden on homepage */}
                        {!isHomePage && (
                            <div className="home-sidebar-card">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                                    <span style={{ color: 'var(--clr-primary-container)' }}>👥</span> Active Clubs
                                </h3>
                                {['35mm Society', 'Lynchian Dreams', 'Neo-Noir Collective'].map((club, idx) => {
                                    const genres = ['drama', 'indie', 'default'];
                                    return (
                                        <div key={club} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 8,
                                                    backgroundImage: `url(/banners/${genres[idx]}.png)`,
                                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                                    border: '1px solid rgba(192,57,43,0.3)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'var(--clr-surface-high)',
                                                }} />
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-on-surface)' }}>{club}</p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>Active now</p>
                                                </div>
                                            </div>
                                            {isAuthenticated && (
                                                <button style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-primary-container)', background: 'none', border: 'none', cursor: 'pointer' }}>Join</button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <style>{`
                .home-page-gradient {
                    background: radial-gradient(circle at 50% 0%, rgba(192, 57, 43, 0.08) 0%, rgba(15, 15, 15, 0) 70%), var(--clr-bg);
                }

                /* ── Two-column layout: main + sidebar ── */
                .home-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 280px;
                    gap: 3.5rem;
                    align-items: start;
                    padding-top: 1.5rem;
                    width: 100%;
                }
                .home-main {
                    min-width: 0;
                    overflow: hidden;
                }
                .home-sidebar {
                    width: 280px;
                    min-width: 0;
                    position: sticky;
                    top: 80px;
                    align-self: start;
                    max-height: calc(100vh - 80px);
                    overflow-y: auto;
                    overflow-x: hidden;
                    display: flex;
                    flex-direction: column;
                    /* align top with the first poster row (below the Trending Now heading) */
                    padding-top: 2.9rem;
                    /* hide scrollbar visually but keep it functional */
                    scrollbar-width: none;
                }
                .home-sidebar::-webkit-scrollbar { display: none; }

                /* Tablet: collapse to single column, hide sidebar */
                @media (max-width: 1024px) {
                    .home-layout { grid-template-columns: 1fr; }
                    .home-sidebar { display: none; }
                }
                /* Mobile */
                @media (max-width: 767px) {
                    .home-layout { display: block; padding-top: 1rem; }
                }

                .home-sidebar-card {
                    background: var(--clr-surface-high);
                    border: 1px solid rgba(89,65,61,0.15);
                    border-radius: var(--radius);
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                }

                /* Section header */
                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.25rem;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                /* Query Chips */
                .chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .query-chip {
                    padding: 0.35rem 1rem;
                    border-radius: var(--radius-full);
                    border: 1.5px solid rgba(89,65,61,0.3);
                    background: var(--clr-surface-container);
                    color: var(--clr-secondary);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    letter-spacing: 0.03em;
                }
                .query-chip:hover { border-color: var(--clr-primary-container); color: var(--clr-primary); background: rgba(192,57,43,0.08); transform: translateY(-1px); }
                .query-chip-active { border-color: var(--clr-primary-container) !important; color: var(--clr-primary) !important; background: rgba(192,57,43,0.12) !important; }

                /* ── 6×2 movie grid — used for ALL sections (search, trending, indie, categories) ── */
                .grid-movies-6x2 {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 1.25rem;
                    margin-bottom: 2.5rem;
                }
                @media (max-width: 1400px) { .grid-movies-6x2 { grid-template-columns: repeat(5, 1fr); } }
                @media (max-width: 1100px) { .grid-movies-6x2 { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 768px)  { .grid-movies-6x2 { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 480px)  { .grid-movies-6x2 { grid-template-columns: repeat(2, 1fr); } }

                /* TMDB error message */
                .tmdb-error-msg {
                    font-size: 0.85rem;
                    color: var(--clr-secondary);
                    background: rgba(192,57,43,0.06);
                    border: 1px solid rgba(192,57,43,0.15);
                    border-radius: var(--radius);
                    padding: 0.75rem 1rem;
                    margin-bottom: 1.5rem;
                }

                /* TMDB source badge next to section title */
                .tmdb-source-badge {
                    display: inline-block;
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                    color: rgba(192,57,43,0.7);
                    border: 1px solid rgba(192,57,43,0.25);
                    border-radius: var(--radius-full);
                    padding: 0.1rem 0.45rem;
                    margin-left: 0.6rem;
                    vertical-align: middle;
                    position: relative;
                    top: -2px;
                }

                /* INDIE pill badge — shown next to Independent Films heading */
                .indie-pill-badge {
                    display: inline-flex;
                    align-items: center;
                    font-size: 0.62rem;
                    font-weight: 800;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #fff;
                    background: linear-gradient(135deg, rgba(192,57,43,0.85) 0%, rgba(142,35,25,0.9) 100%);
                    border: 1px solid rgba(192,57,43,0.5);
                    border-radius: var(--radius-full);
                    padding: 0.18rem 0.6rem;
                    flex-shrink: 0;
                    box-shadow: 0 1px 4px rgba(192,57,43,0.25);
                }
            `}</style>
        </main>
    );
}
