import { useState, useEffect, useRef } from 'react';
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

function HorizontalScroll({ children }) {
    const ref = useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);

    const check = () => {
        const el = ref.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        check();
        el.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
    }, [children]);

    const scroll = (dir) => {
        const el = ref.current;
        if (el) el.scrollBy({ left: dir * 500, behavior: 'smooth' });
    };

    return (
        <div style={{ position: 'relative' }}>
            {canLeft && (
                <button className="hscroll-arrow hscroll-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
            )}
            <div className="hscroll-track scroller-mask" ref={ref}>
                {children}
            </div>
            {canRight && (
                <button className="hscroll-arrow hscroll-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
            )}
        </div>
    );
}

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
        <main className="page">
            <div className="container">

                {/* Hero (no query) */}
                {!query && (
                    <div className="home-hero section">
                        <span className="home-hero-label text-label-caps">Premium Cinema Discovery</span>
                        <h1 className="home-hero-title">
                            Where Cinephiles <span className="home-hero-accent">Connect</span>.
                        </h1>
                        <p className="home-hero-sub">
                            Discover films. Share your honest opinion. Join the circle. No star ratings — just clear, human sentiment.
                        </p>
                        <div className="opinion-legend">
                            {[
                                ['#c0392b', 'Perfection'],
                                ['#ffb4a9', 'Go For It'],
                                ['#454747', 'Timepass'],
                                ['#555', 'Skip'],
                            ].map(([color, label]) => (
                                <span key={label} className="legend-tag" style={{ borderColor: color, color }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

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
                            <div className="grid-movies">
                                {Array(8).fill().map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        )}
                        {error && <div className="alert alert-error">{error}</div>}
                        {!loading && results.length === 0 && !error && (
                            <div className="empty-state">
                                <div className="icon">🎬</div>
                                <p>No movies found for "{query}"</p>
                            </div>
                        )}
                        <div className="grid-movies">
                            {results.map(m => <MovieCard key={m.imdbID} movie={m} />)}
                        </div>
                    </section>
                )}

                {/* Home content */}
                {!query && (
                    <>
                        {homeLoading ? (
                            <section className="section">
                                <div className="skeleton" style={{ height: '1.5rem', width: '200px', marginBottom: '1.5rem' }} />
                                <div className="hscroll-track">
                                    {Array(6).fill().map((_, i) => (
                                        <div key={i} style={{ minWidth: '160px' }}><SkeletonCard /></div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <>
                                {/* Trending Section */}
                                {trending.length > 0 && (
                                    <section className="section" style={{ marginTop: '1rem' }}>
                                        <div className="section-header">
                                            <h2 className="text-headline-md">Trending Now</h2>
                                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/?q=trending')}>View All →</button>
                                        </div>
                                        <HorizontalScroll>
                                            {trending.map(m => (
                                                <div key={m.imdbID} className="hscroll-item">
                                                    <MovieCard movie={m} />
                                                </div>
                                            ))}
                                        </HorizontalScroll>
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
                                                <h2 className="text-headline-md">Independent Films</h2>
                                                <span className="badge badge-tertiary">Indie</span>
                                            </div>
                                            <Link to="/upload" className="btn btn-ghost btn-sm">Upload Yours →</Link>
                                        </div>
                                        <HorizontalScroll>
                                            {indie.map(m => (
                                                <div key={m._id} className="hscroll-item">
                                                    <MovieCard
                                                        movie={{ Title: m.title, Poster: m.posterUrl, Year: m.year || '', imdbID: m._id, Genre: m.genre || '' }}
                                                        indie
                                                    />
                                                </div>
                                            ))}
                                        </HorizontalScroll>
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
                                            <HorizontalScroll>
                                                {movies.map(m => (
                                                    <div key={m.imdbID} className="hscroll-item">
                                                        <MovieCard movie={m} />
                                                    </div>
                                                ))}
                                            </HorizontalScroll>
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

            <style>{`
                /* Hero */
                .home-hero { padding: 2.5rem 0 1.5rem; }
                .home-hero-label { color: var(--clr-primary); display: block; margin-bottom: 1rem; }
                .home-hero-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; color: var(--clr-on-surface); margin-bottom: 1rem; }
                .home-hero-accent { color: var(--clr-primary); }
                .home-hero-sub { font-size: 1.05rem; color: var(--clr-secondary); max-width: 520px; line-height: 1.6; }
                .opinion-legend { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem; }
                .legend-tag {
                    padding: 0.3rem 1rem;
                    border-radius: var(--radius-full);
                    font-size: 0.78rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    border: 1.5px solid;
                    background: transparent;
                }

                /* Section header */
                .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem; }

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

                /* Horizontal Scroll */
                .hscroll-track {
                    display: flex;
                    gap: 1.25rem;
                    overflow-x: auto;
                    padding-bottom: 1rem;
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                }
                .hscroll-track::-webkit-scrollbar { height: 3px; }
                .hscroll-track::-webkit-scrollbar-thumb { background: var(--clr-outline-variant); border-radius: 2px; }
                .hscroll-item { flex: 0 0 170px; scroll-snap-align: start; }

                /* Arrow Buttons */
                .hscroll-arrow {
                    position: absolute;
                    top: 40%;
                    transform: translateY(-50%);
                    z-index: 10;
                    width: 38px; height: 38px;
                    border-radius: 50%;
                    border: 1px solid rgba(89,65,61,0.3);
                    background: var(--clr-surface-container);
                    color: var(--clr-on-surface);
                    font-size: 1.5rem;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                }
                .hscroll-arrow:hover { border-color: var(--clr-primary-container); color: var(--clr-primary); background: rgba(192,57,43,0.15); }
                .hscroll-arrow-left { left: -18px; }
                .hscroll-arrow-right { right: -18px; }
            `}</style>
        </main>
    );
}
