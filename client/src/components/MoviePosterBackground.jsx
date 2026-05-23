import { useState, useEffect } from 'react';

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const TMDB_BASE = 'https://api.tmdb.org/3';

/**
 * Fetches up to `limit` poster paths from a TMDB endpoint.
 * Returns an array of full image URLs. Never throws — returns [] on failure.
 */
async function fetchPosters(endpoint, extraParams = '', limit = 10) {
    if (!TMDB_KEY) return [];
    const sep = extraParams ? '&' : '';
    const url = `${TMDB_BASE}${endpoint}?api_key=${TMDB_KEY}&language=en-US${sep}${extraParams}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (data.results || [])
            .slice(0, limit)
            .filter(m => m.poster_path)
            .map(m => `${TMDB_IMG}${m.poster_path}`);
    } catch (err) {
        console.warn('[MoviePosterBackground] fetch failed:', err.message);
        return [];
    }
}

/**
 * Renders 4 horizontally-scrolling rows of TMDB movie posters as a
 * full-screen background. A dark + blur overlay sits on top.
 *
 * Usage: drop inside `.auth-page` before the card content.
 */
export default function MoviePosterBackground() {
    const [rows, setRows] = useState([[], [], [], []]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [popular, topRated, trending, bollywood] = await Promise.all([
                fetchPosters('/movie/popular'),
                fetchPosters('/movie/top_rated'),
                fetchPosters('/trending/movie/week'),
                fetchPosters('/discover/movie', 'with_original_language=hi&sort_by=popularity.desc'),
            ]);
            if (!cancelled && (popular.length || topRated.length || trending.length || bollywood.length)) {
                setRows([popular, topRated, trending, bollywood]);
                setReady(true);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    if (!ready) return null;

    // Config per row: direction (left = negative translate) and duration
    const rowConfig = [
        { dir: 'left',  duration: '40s' },
        { dir: 'right', duration: '38s' },
        { dir: 'left',  duration: '32s' },
        { dir: 'right', duration: '30s' },
    ];

    return (
        <>
            <div className="mpb-root" aria-hidden="true">
                {rows.map((posters, i) => {
                    if (!posters.length) return null;
                    // Duplicate for seamless loop
                    const doubled = [...posters, ...posters];
                    const { dir, duration } = rowConfig[i];
                    return (
                        <div
                            key={i}
                            className="mpb-row"
                            style={{
                                animationName: dir === 'left' ? 'mpbScrollLeft' : 'mpbScrollRight',
                                animationDuration: duration,
                                // Stagger rows vertically slightly so they don't perfectly align
                                marginTop: i === 0 ? '0' : '-6px',
                            }}
                        >
                            {doubled.map((src, j) => (
                                <img
                                    key={j}
                                    src={src}
                                    alt=""
                                    className="mpb-poster"
                                    loading="lazy"
                                    draggable="false"
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
            {/* Dark + blur overlay */}
            <div className="mpb-overlay" aria-hidden="true" />

            <style>{`
                .mpb-root {
                    position: fixed;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    pointer-events: none;
                    /* Stretch rows to fill height evenly */
                    align-items: stretch;
                }
                .mpb-row {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    /* Each row takes exactly 25vh so 4 rows fill 100vh */
                    height: 25vh;
                    min-height: 150px;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform;
                    /* Width must be >100% to contain doubled posters */
                    width: max-content;
                }
                .mpb-poster {
                    width: 120px;
                    height: 100%;
                    object-fit: cover;
                    flex-shrink: 0;
                    display: block;
                    /* No gap between posters */
                    margin: 0;
                    padding: 0;
                    border: none;
                    filter: brightness(0.85);
                }
                .mpb-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(3px);
                    -webkit-backdrop-filter: blur(3px);
                    pointer-events: none;
                }
                @keyframes mpbScrollLeft {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes mpbScrollRight {
                    0%   { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
            `}</style>
        </>
    );
}
