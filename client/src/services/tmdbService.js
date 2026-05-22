// TMDB integration — local test only, do not commit yet

/**
 * tmdbService.js
 * ──────────────
 * All TMDB API calls for the FilmCircle homepage (discovery / trending).
 * OMDB is NOT touched here. TMDB is used ONLY for homepage listing/discovery.
 */

const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.tmdb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const COMMON_PARAMS = `api_key=${TMDB_KEY}&language=en-US&region=IN`;

/** Converts a TMDB movie object into a shape TmdbMovieCard can consume */
export function normalizeTmdbMovie(m) {
    return {
        tmdbId: m.id,
        Title: m.title || m.name || 'Untitled',
        Poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
        Year: m.release_date ? m.release_date.slice(0, 4) : '',
        Genre: '',          // genre_ids are numbers; we skip label lookup to stay lean
        Rating: m.vote_average ? m.vote_average.toFixed(1) : null,
        Overview: m.overview || '',
    };
}

/**
 * Fetches TMDB data and returns an array of normalized movies (up to `limit`).
 * On failure, logs the error and returns an empty array — callers never crash.
 *
 * @param {string} endpoint    - e.g. '/trending/movie/week'
 * @param {string} extraParams - additional query params (without leading '&')
 * @param {number} limit       - number of results to keep (default 12)
 */
export async function fetchTmdb(endpoint, extraParams = '', limit = 12) {
    const sep = extraParams ? '&' : '';
    const url = `${TMDB_BASE}${endpoint}?${COMMON_PARAMS}${sep}${extraParams}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`TMDB ${res.status}: ${res.statusText} — ${url}`);
        }
        const data = await res.json();
        const results = data.results || [];
        // Deduplicate by TMDB id before slicing
        const seen = new Set();
        const unique = results.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });
        return unique.slice(0, limit).map(normalizeTmdbMovie);
    } catch (err) {
        console.error('[TMDB] Fetch error:', err);
        return [];   // graceful empty — UI shows "Could not load" message
    }
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Fetches 3 parallel slices (Hollywood/international, Bollywood, Tollywood)
 * for a given TMDB endpoint+params, merges them, deduplicates by id, shuffles,
 * and returns up to 12 normalized movies.
 *
 * @param {string} endpoint    - TMDB path, e.g. '/discover/movie'
 * @param {string} extraParams - genre/sort params shared by all 3 fetches
 */
async function fetchMultilingual(endpoint, extraParams = '') {
    const sep = extraParams ? '&' : '';

    // Raw fetch (no normalization yet) so we can deduplicate by raw id
    const rawFetch = async (langParam) => {
        const langSep = langParam ? '&' : '';
        const url = `${TMDB_BASE}${endpoint}?${COMMON_PARAMS}${sep}${extraParams}${langSep}${langParam}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`TMDB ${res.status}`);
            const data = await res.json();
            return data.results || [];
        } catch (err) {
            console.error('[TMDB] multilingual fetch error:', err);
            return [];
        }
    };

    // Fetch 1: no language filter → top 6 (international/Hollywood)
    // Fetch 2: Hindi (Bollywood) → top 3
    // Fetch 3: Telugu (Tollywood) → top 3
    const [intl, hindi, telugu] = await Promise.all([
        rawFetch(''),
        rawFetch('with_original_language=hi'),
        rawFetch('with_original_language=te'),
    ]);

    const seen = new Set();
    const intlUnique = [];
    const hindiUnique = [];
    const teluguUnique = [];

    // 1. Get up to 6 unique international (Hollywood)
    for (const m of intl) {
        if (!seen.has(m.id)) {
            seen.add(m.id);
            intlUnique.push(m);
            if (intlUnique.length === 6) break;
        }
    }

    // 2. Get up to 3 unique Hindi (Bollywood)
    for (const m of hindi) {
        if (!seen.has(m.id)) {
            seen.add(m.id);
            hindiUnique.push(m);
            if (hindiUnique.length === 3) break;
        }
    }

    // 3. Get up to 3 unique Telugu (Tollywood)
    for (const m of telugu) {
        if (!seen.has(m.id)) {
            seen.add(m.id);
            teluguUnique.push(m);
            if (teluguUnique.length === 3) break;
        }
    }

    const merged = [...intlUnique, ...hindiUnique, ...teluguUnique];

    // Fallback: If we didn't get enough unique Hindi or Telugu movies,
    // backfill from the international array to guarantee exactly 12 results
    if (merged.length < 12) {
        for (const m of intl) {
            if (!seen.has(m.id)) {
                seen.add(m.id);
                merged.push(m);
                if (merged.length === 12) break;
            }
        }
    }

    // Shuffle so industries are interleaved naturally, map, and return exactly 12
    return shuffle(merged).map(normalizeTmdbMovie);
}

// ── Pre-built fetchers (used by Home.jsx) ─────────────────────────────────────

export const tmdbService = {
    /**
     * Trending Now — 8 Indian (4 Hindi + 4 Telugu) + 4 International films
     * released in the last 2 weeks. Falls back to 4 weeks if <12 results.
     * Date window is calculated dynamically — no hardcoded dates.
     */
    getTrending: async () => {
        /** Returns a date string "YYYY-MM-DD" for N days ago */
        const daysAgo = (n) => {
            const d = new Date();
            d.setDate(d.getDate() - n);
            return d.toISOString().slice(0, 10);
        };

        /** Single raw TMDB /discover/movie fetch with a given date floor */
        const discoverRaw = async (extraParams) => {
            const url = `${TMDB_BASE}/discover/movie?${COMMON_PARAMS}&sort_by=popularity.desc&${extraParams}`;
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`TMDB ${res.status}`);
                const data = await res.json();
                return data.results || [];
            } catch (err) {
                console.error('[TMDB] trending discover error:', err);
                return [];
            }
        };

        /**
         * Attempts to build a 12-film grid with the given date floor.
         * Split: 6 Hindi (Bollywood) + 2 Telugu (Tollywood) + 4 International
         */
        const tryFetch = async (dateFloor) => {
            const dateParam = `primary_release_date.gte=${dateFloor}`;

            const [hindi, telugu, intl] = await Promise.all([
                discoverRaw(`with_original_language=hi&${dateParam}`),
                discoverRaw(`with_original_language=te&${dateParam}`),
                discoverRaw(`${dateParam}`),
            ]);

            const seen = new Set();
            const pick = (arr, n) => {
                const out = [];
                for (const m of arr) {
                    if (!seen.has(m.id)) {
                        seen.add(m.id);
                        out.push(m);
                        if (out.length === n) break;
                    }
                }
                return out;
            };

            const hindiPicked  = pick(hindi,  6);
            const teluguPicked = pick(telugu, 2);
            const intlPicked   = pick(intl,   4);
            const merged = [...hindiPicked, ...teluguPicked, ...intlPicked];

            // Backfill from intl if Indian films were scarce
            if (merged.length < 12) {
                for (const m of intl) {
                    if (!seen.has(m.id)) {
                        seen.add(m.id);
                        merged.push(m);
                        if (merged.length === 12) break;
                    }
                }
            }

            return merged;
        };

        // Primary attempt: 2-week window
        let merged = await tryFetch(daysAgo(14));

        // Fallback: extend to 4-week window if we got fewer than 12
        if (merged.length < 12) {
            merged = await tryFetch(daysAgo(28));
        }

        return shuffle(merged).slice(0, 12).map(normalizeTmdbMovie);
    },

    /** Action & Thriller (genre IDs 28, 53) */
    getActionThriller: () =>
        fetchMultilingual('/discover/movie', 'with_genres=28,53&sort_by=popularity.desc'),

    /** Comedy (genre ID 35) */
    getComedy: () =>
        fetchMultilingual('/discover/movie', 'with_genres=35&sort_by=popularity.desc'),

    /** Drama — top-rated (genre ID 18) */
    getDrama: () =>
        fetchMultilingual('/discover/movie', 'with_genres=18&sort_by=vote_average.desc&vote_count.gte=1000'),

    /** Sci-Fi & Fantasy (genre IDs 878, 14) */
    getSciFiFantasy: () =>
        fetchMultilingual('/discover/movie', 'with_genres=878,14&sort_by=popularity.desc'),

    /** Animation (genre ID 16) */
    getAnimation: () =>
        fetchMultilingual('/discover/movie', 'with_genres=16&sort_by=popularity.desc'),
};
