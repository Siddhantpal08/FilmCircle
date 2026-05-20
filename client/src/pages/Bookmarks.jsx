import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookmarkService } from '../services';
import MovieCard from '../components/movie/MovieCard';
import SkeletonCard from '../components/common/SkeletonCard';

export default function Bookmarks() {
    const [bookmarks, setBookmarks] = useState(null); // null = loading

    useEffect(() => {
        // Small tick so skeleton flashes briefly (feels intentional, not broken)
        const t = setTimeout(() => {
            setBookmarks(bookmarkService.getAll());
        }, 200);
        return () => clearTimeout(t);
    }, []);

    return (
        <main className="page bookmarks-page">
            <div className="container">
                {/* Header */}
                <div className="bookmarks-hero">
                    <div>
                        <h1 className="text-headline-md" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.4rem' }}>
                            🔖 My Bookmarks
                        </h1>
                        <p style={{ color: 'var(--clr-secondary)', fontSize: '0.95rem' }}>
                            Your personal watchlist — films you've saved to revisit.
                        </p>
                    </div>
                    {bookmarks && bookmarks.length > 0 && (
                        <span className="badge badge-primary" style={{ alignSelf: 'flex-start', fontSize: '0.85rem', padding: '0.35rem 1rem' }}>
                            {bookmarks.length} saved
                        </span>
                    )}
                </div>

                <div className="divider" style={{ margin: '1.5rem 0 2rem' }} />

                {/* Loading */}
                {bookmarks === null && (
                    <div className="grid-movies-6x2">
                        {Array(12).fill().map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* Empty state */}
                {bookmarks !== null && bookmarks.length === 0 && (
                    <div className="empty-state" style={{ paddingTop: '6rem' }}>
                        <div className="icon">🍿</div>
                        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                            No bookmarks yet. Start exploring and save films you love!
                        </p>
                        <Link to="/" className="btn btn-primary">Browse Films →</Link>
                    </div>
                )}

                {/* Grid */}
                {bookmarks !== null && bookmarks.length > 0 && (
                    <div className="grid-movies-6x2">
                        {bookmarks.map(m => (
                            <MovieCard key={m.imdbID || m._id} movie={m} indie={m.isIndependent} />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .bookmarks-page {
                    background: radial-gradient(circle at 50% 0%, rgba(192,57,43,0.07) 0%, transparent 65%), var(--clr-bg);
                }
                .bookmarks-hero {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 1rem;
                    flex-wrap: wrap;
                    padding-top: 0.5rem;
                }
                /* Reuse the same 6-col grid from Home */
                .grid-movies-6x2 {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 1.25rem;
                    margin-bottom: 2.5rem;
                }
                @media (max-width: 1200px) { .grid-movies-6x2 { grid-template-columns: repeat(4, 1fr); } }
                @media (max-width: 768px)  { .grid-movies-6x2 { grid-template-columns: repeat(3, 1fr); } }
                @media (max-width: 480px)  { .grid-movies-6x2 { grid-template-columns: repeat(2, 1fr); } }
            `}</style>
        </main>
    );
}
