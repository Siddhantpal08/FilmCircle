import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { movieService } from '../services';
import MovieCard from '../components/movie/MovieCard';
import SkeletonCard from '../components/common/SkeletonCard';

const CATEGORY_ROWS = ['Action', 'Romance', 'Thriller', 'Horror', 'Comedy'];

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

export default function Home() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const [results, setResults] = useState([]);
    const [indie, setIndie] = useState([]);
    const [trending, setTrending] = useState([]);
    const [categoryRows, setCategoryRows] = useState({});
    const [loading, setLoading] = useState(false);
    const [homeLoading, setHomeLoading] = useState(true);
    const [error, setError] = useState('');
    const [trendingError, setTrendingError] = useState('');

    const [interestingMovies, setInterestingMovies] = useState([]);

    // Fetch indie + trending on mount
    useEffect(() => {
        setHomeLoading(true);
        Promise.allSettled([
            movieService.getIndependent(),
            movieService.getTrending(),
            ...CATEGORY_ROWS.map(cat => movieService.search(cat))
        ]).then((results) => {
            const [indieRes, trendingRes, ...catRes] = results;
            if (indieRes.status === 'fulfilled') setIndie(indieRes.value.data);
            if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data);
            if (trendingRes.status === 'rejected') {
                const status = trendingRes.reason?.response?.status;
                if (status === 503) setTrendingError('OMDB API key not configured — trending movies unavailable.');
                else setTrendingError('Could not load trending movies.');
            }
            const cats = {};
            catRes.forEach((res, index) => {
                if (res.status === 'fulfilled' && res.value.data?.results) {
                    cats[CATEGORY_ROWS[index]] = res.value.data.results;
                }
            });
            setCategoryRows(cats);
        }).finally(() => setHomeLoading(false));
    }, []);

    // Load Most Interesting from localStorage
    useEffect(() => {
        const interestingMap = JSON.parse(localStorage.getItem('filmcircle_interesting') || '{}');
        setInterestingMovies(Object.values(interestingMap));
    }, [query]);

    // Search when query changes
    useEffect(() => {
        if (!query) return;
        setLoading(true);
        setError('');
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

    return (
        <main className="page home-page-gradient">
            <div className="container home-layout">
                {/* ── Left Main Content ── */}
                <div className="home-main">
                    {/* Search Results */}
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
                                {results.slice(0, 12).map(m => <MovieCard key={m.imdbID || m._id} movie={m} />)}
                            </div>
                        </section>
                    )}

                    {/* Home content */}
                    {!query && (
                        <>
                            {homeLoading ? (
                                <section className="section">
                                    <div className="skeleton" style={{ height: '1.5rem', width: '200px', marginBottom: '1.5rem' }} />
                                    <div className="grid-movies-6x2">
                                        {Array(12).fill().map((_, i) => (
                                            <SkeletonCard key={i} />
                                        ))}
                                    </div>
                                </section>
                            ) : (
                                <>
                                    {/* Trending Section */}
                                    {trending.length > 0 && (
                                        <section className="section">
                                            <div className="section-header">
                                                <h2 className="text-headline-md" style={{ borderLeft: '4px solid var(--clr-primary-container)', paddingLeft: '1rem' }}>Trending Now</h2>
                                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/?q=trending')}>View All →</button>
                                            </div>
                                            <div className="grid-movies-6x2">
                                                {trending.slice(0, 12).map(m => (
                                                    <MovieCard key={m.imdbID} movie={m} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    {trendingError && !trending.length && (
                                        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{trendingError}</div>
                                    )}

                                    {/* Independent Films Section */}
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

                                    {/* Category Rows */}
                                    {CATEGORY_ROWS.map(cat => {
                                        const movies = categoryRows[cat];
                                        if (!movies || movies.length === 0) return null;
                                        return (
                                            <section key={cat} className="section">
                                                <div className="section-header">
                                                    <h2 className="text-headline-md" style={{ borderLeft: '4px solid var(--clr-primary-container)', paddingLeft: '1rem' }}>{cat}</h2>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/?q=${encodeURIComponent(cat)}`)}>View All →</button>
                                                </div>
                                                <div className="grid-movies-6x2">
                                                    {movies.slice(0, 12).map(m => (
                                                        <MovieCard key={m.imdbID} movie={m} />
                                                    ))}
                                                </div>
                                            </section>
                                        );
                                    })}

                                    {trending.length === 0 && indie.length === 0 && (
                                        <div className="empty-state">
                                            <div className="icon">🍿</div>
                                            <p style={{ fontSize: '1.1rem' }}>Search for any movie above to get started!</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <aside className="home-sidebar">
                    {/* Most Interesting Widget */}
                    {interestingMovies.length > 0 && (
                        <div className="home-sidebar-card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem' }}>
                                <span style={{ color: 'var(--clr-primary-container)' }}>⭐</span> Most Interesting
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {interestingMovies.slice(0, 5).map((m, i) => (
                                    <div key={m.imdbID || m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                                        onClick={() => window.location.href = `/movie/${m.imdbID || m._id}`}>
                                        <img
                                            src={m.Poster || m.posterUrl}
                                            alt={m.Title || m.title}
                                            style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(89,65,61,0.3)' }}
                                            onError={e => { e.target.style.background = 'var(--clr-surface-high)'; e.target.src = ''; }}
                                        />
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--clr-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {m.Title || m.title}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--clr-secondary)' }}>{m.Year || m.year || ''}</p>
                                        </div>
                                        {i < Math.min(interestingMovies.length - 1, 4) && (
                                            <div style={{ position: 'absolute' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending Discussions */}
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

                    {/* Active Clubs */}
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
                                            width: 44,
                                            height: 44,
                                            borderRadius: 8,
                                            backgroundImage: `url(/banners/${genres[idx]}.png)`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            border: '1px solid rgba(192,57,43,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--clr-surface-high)',
                                        }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--clr-on-surface)' }}>{club}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--clr-secondary)' }}>Active now</p>
                                        </div>
                                    </div>
                                    <button style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-primary-container)', background: 'none', border: 'none', cursor: 'pointer' }}>Join</button>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>

            <style>{`
                .home-page-gradient {
                    background: radial-gradient(circle at 50% 0%, rgba(192, 57, 43, 0.08) 0%, rgba(15, 15, 15, 0) 70%), var(--clr-bg);
                }

                /* ── Two-column layout: main + sidebar ── */
                .home-layout {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 2.5rem;
                    align-items: start;
                    padding-top: 1.5rem;
                }
                .home-main {
                    min-width: 0; /* prevents grid blowout */
                }
                .home-sidebar {
                    position: sticky;
                    top: 90px;
                    display: flex;
                    flex-direction: column;
                    gap: 0; /* cards handle their own bottom margin */
                }

                /* Hide sidebar on smaller screens */
                @media (max-width: 1023px) {
                    .home-layout {
                        grid-template-columns: 1fr;
                    }
                    .home-sidebar {
                        display: none;
                    }
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

                /* 6×2 movie grid */
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
            `}</style>
        </main>
    );
}
