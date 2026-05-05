import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { movieService } from '../services';
import MovieCard from '../components/movie/MovieCard';
import Loader from '../components/common/Loader';
import SkeletonCard from '../components/common/SkeletonCard';

const QUERY_CHIPS = [
    { label: '🎬 Hollywood', q: 'Hollywood' },
    { label: '🎭 Bollywood', q: 'Bollywood' },
    { label: '🤖 Sci-Fi', q: 'Science Fiction' },
    { label: '👻 Horror', q: 'Horror' },
    { label: '😂 Comedy', q: 'Comedy' },
    { label: '💥 Action', q: 'Action' },
    { label: '💘 Romance', q: 'Romance' },
    { label: '🕵️ Thriller', q: 'Thriller' },
    { label: '🎥 Drama', q: 'Drama' },
    { label: '📽️ Animation', q: 'Animation' },
    { label: '📚 Documentary', q: 'Documentary' },
    { label: '🌍 International', q: 'International' },
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
        if (el) el.scrollBy({ left: dir * 480, behavior: 'smooth' });
    };

    return (
        <div style={{ position: 'relative' }}>
            {canLeft && (
                <button className="hscroll-arrow hscroll-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
            )}
            <div className="hscroll-track" ref={ref}>
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
        ]).then(([indieRes, trendingRes]) => {
            if (indieRes.status === 'fulfilled') setIndie(indieRes.value.data);
            if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data);
            if (trendingRes.status === 'rejected') {
                const status = trendingRes.reason?.response?.status;
                if (status === 503) setTrendingError('OMDB API key not configured — trending movies unavailable.');
                else setTrendingError('Could not load trending movies.');
            }
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
                    <div className="hero section">
                        <div className="hero-text">
                            <h1>Where cinephiles <span style={{ color: 'var(--clr-primary)' }}>connect</span>.</h1>
                            <p style={{ fontSize: '1.1rem', marginTop: '0.75rem', maxWidth: '520px' }}>
                                Discover films. Share your opinion. Join the circle. No star ratings — just honest, clear sentiment.
                            </p>
                            <div className="opinion-legend">
                                {[['⏭️', 'Skip', 'skip'], ['🤔', 'Considerable', 'considerable'], ['✅', 'Go For It', 'goForIt'], ['⭐', 'Excellent', 'excellent']].map(([e, l, k]) => (
                                    <span key={k} className={`legend-tag op-${k}`}>{e} {l}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Popular Query Chips */}
                {!query && (
                    <section className="section" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Browse by Category
                        </h3>
                        <div className="chip-row">
                            {QUERY_CHIPS.map(({ label, q }) => (
                                <button
                                    key={q}
                                    className="query-chip"
                                    onClick={() => navigate(`/?q=${encodeURIComponent(q)}`)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </section>
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

                        {/* Quick filter chips while viewing search */}
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
                            <div className="grid-auto">
                                {Array(8).fill().map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        )}
                        {error && <div className="alert alert-error">{error}</div>}
                        {!loading && results.length === 0 && !error && (
                            <div className="empty-state">
                                <div className="icon">🎬</div>
                                <p>No movies found for "{query}"</p>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Try a different spelling or browse a category above.</p>
                            </div>
                        )}
                        <div className="grid-auto">
                            {results.map(m => <MovieCard key={m.imdbID} movie={m} />)}
                        </div>
                    </section>
                )}

                {/* Home content (trending + indie) */}
                {!query && (
                    <>
                        {homeLoading ? (
                            <section className="section">
                                <div style={{ height: '1.5rem', width: '200px', background: 'var(--clr-surface-2)', borderRadius: '6px', marginBottom: '1.5rem' }} />
                                <div className="hscroll-track">
                                    {Array(8).fill().map((_, i) => (
                                        <div key={i} style={{ minWidth: '180px' }}><SkeletonCard /></div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <>
                                {/* Trending Section — horizontal scroll */}
                                {trending.length > 0 && (
                                    <section className="section">
                                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                            <h2>🔥 Trending Now</h2>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>Scroll to explore →</span>
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
                                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                                            <h2>🎥 Independent Films</h2>
                                            <Link to="/upload" className="btn btn-outline btn-sm">Upload Yours →</Link>
                                        </div>
                                        <div className="grid-auto">
                                            {indie.map(m => (
                                                <MovieCard
                                                    key={m._id}
                                                    movie={{ Title: m.title, Poster: m.posterUrl, Year: m.year || '', imdbID: m._id, Genre: m.genre || '' }}
                                                    indie
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* CTA when nothing loaded */}
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
        .hero { padding: 3rem 0 1rem; }
        .opinion-legend { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.5rem; }
        .legend-tag { padding: 0.35rem 1rem; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; background: var(--clr-surface-2); }
        .op-skip { color: var(--op-skip); }
        .op-considerable { color: var(--op-considerable); }
        .op-goForIt { color: var(--op-goforit); }
        .op-excellent { color: var(--op-excellent); }

        /* Query Chips */
        .chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .query-chip {
            padding: 0.4rem 1rem;
            border-radius: var(--radius-full);
            border: 1.5px solid var(--clr-border);
            background: var(--clr-surface-2);
            color: var(--clr-text-muted);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .query-chip:hover { border-color: var(--clr-primary); color: var(--clr-primary); background: rgba(124,92,252,0.1); transform: translateY(-1px); }
        .query-chip-active { border-color: var(--clr-primary) !important; color: var(--clr-primary) !important; background: rgba(124,92,252,0.15) !important; }

        /* Horizontal Scroll Track */
        .hscroll-track {
            display: flex;
            gap: 1.25rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: var(--clr-border) transparent;
        }
        .hscroll-track::-webkit-scrollbar { height: 4px; }
        .hscroll-track::-webkit-scrollbar-track { background: transparent; }
        .hscroll-track::-webkit-scrollbar-thumb { background: var(--clr-border); border-radius: 2px; }
        .hscroll-item {
            flex: 0 0 200px;
            scroll-snap-align: start;
        }

        /* Arrow Buttons */
        .hscroll-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            width: 40px; height: 40px;
            border-radius: 50%;
            border: 1.5px solid var(--clr-border);
            background: var(--clr-surface);
            color: var(--clr-text);
            font-size: 1.5rem;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }
        .hscroll-arrow:hover { border-color: var(--clr-primary); color: var(--clr-primary); background: rgba(124,92,252,0.1); }
        .hscroll-arrow-left { left: -20px; }
        .hscroll-arrow-right { right: -20px; }
      `}</style>
        </main>
    );
}
