import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { movieService } from '../services';
import MovieCard from '../components/movie/MovieCard';
import Loader from '../components/common/Loader';
import SkeletonCard from '../components/common/SkeletonCard';

export default function Home() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const [results, setResults] = useState([]);
    const [indie, setIndie] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [homeLoading, setHomeLoading] = useState(true); // home content not ready yet
    const [error, setError] = useState('');
    const [trendingError, setTrendingError] = useState('');

    // Fetch indie + trending on mount (in parallel)
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

                {/* Search Results */}
                {query && (
                    <section className="section">
                        <h2 style={{ marginBottom: '1.5rem' }}>
                            Results for "<span style={{ color: 'var(--clr-primary)' }}>{query}</span>"
                        </h2>
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
                            /* Full home skeleton loader */
                            <section className="section">
                                <div style={{ height: '1.5rem', width: '200px', background: 'var(--clr-surface-2)', borderRadius: '6px', marginBottom: '1.5rem' }} />
                                <div className="grid-auto">
                                    {Array(12).fill().map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            </section>
                        ) : (
                            <>
                                {/* Trending Section */}
                                {trending.length > 0 && (
                                    <section className="section">
                                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                            <h2>🔥 Trending Now</h2>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>Curated picks</span>
                                        </div>
                                        <div className="grid-auto">
                                            {trending.map(m => <MovieCard key={m.imdbID} movie={m} />)}
                                        </div>
                                    </section>
                                )}
                                {trendingError && !trending.length && (
                                    <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{trendingError}</div>
                                )}

                                {/* Independent Films Section */}
                                {indie.length > 0 && (
                                    <section className="section">
                                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
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

                                {/* CTA when nothing loaded yet */}
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
        .hero { padding: 3rem 0 1rem; }
        .opinion-legend { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.5rem; }
        .legend-tag { padding: 0.35rem 1rem; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; background: var(--clr-surface-2); }
        .op-skip { color: var(--op-skip); }
        .op-considerable { color: var(--op-considerable); }
        .op-goForIt { color: var(--op-goforit); }
        .op-excellent { color: var(--op-excellent); }
      `}</style>
        </main>
    );
}
