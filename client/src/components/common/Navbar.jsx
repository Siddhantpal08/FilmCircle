import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { movieService } from '../../services';
import './Navbar.css';

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'%3E%3Crect width='40' height='60' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' fill='%237c5cfc' font-size='20'%3E🎬%3C/text%3E%3C/svg%3E";

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [activeSug, setActiveSug] = useState(-1);
    const debounceRef = useRef(null);
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);

    // Debounced autosuggest
    const fetchSuggestions = useCallback((q) => {
        clearTimeout(debounceRef.current);
        if (q.trim().length < 2) { setSuggestions([]); setSuggestOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setSuggestLoading(true);
            try {
                const res = await movieService.suggest(q.trim());
                setSuggestions(res.data || []);
                setSuggestOpen((res.data || []).length > 0);
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        }, 300);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSuggestOpen(false);
                setActiveSug(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setActiveSug(-1);
        fetchSuggestions(val);
    };

    const commitSearch = (q) => {
        if (!q.trim()) return;
        setSuggestOpen(false);
        setSuggestions([]);
        setQuery('');
        navigate(`/?q=${encodeURIComponent(q.trim())}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        commitSearch(query);
    };

    const handleKeyDown = (e) => {
        if (!suggestOpen || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSug(i => Math.min(i + 1, suggestions.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSug(i => Math.max(i - 1, -1)); }
        else if (e.key === 'Enter' && activeSug >= 0) {
            e.preventDefault();
            const chosen = suggestions[activeSug];
            setSuggestOpen(false);
            navigate(`/movie/${chosen.imdbID}`);
            setQuery('');
        }
        else if (e.key === 'Escape') { setSuggestOpen(false); setActiveSug(-1); }
    };

    const handleLogout = () => { logout(); navigate('/'); };
    const isActive = (path) => location.pathname === path;

    return (
        <header className="navbar">
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <span className="logo-circle">🎬</span>
                    <span className="logo-text">FilmCircle</span>
                </Link>

                {/* Search with Autosuggest */}
                <div className="navbar-search-wrap" ref={searchRef}>
                    <form className="navbar-search" onSubmit={handleSearch}>
                        <input
                            id="search-input"
                            className="search-input"
                            type="text"
                            placeholder="Search movies…"
                            value={query}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                            autoComplete="off"
                        />
                        {suggestLoading
                            ? <span className="search-spinner" />
                            : <button type="submit" className="search-btn" aria-label="Search">🔍</button>
                        }
                    </form>

                    {/* Dropdown */}
                    {suggestOpen && suggestions.length > 0 && (
                        <div className="suggest-dropdown" ref={dropdownRef}>
                            {suggestions.map((s, i) => (
                                <div
                                    key={s.imdbID}
                                    className={`suggest-item ${activeSug === i ? 'suggest-active' : ''}`}
                                    onMouseDown={() => { navigate(`/movie/${s.imdbID}`); setSuggestOpen(false); setQuery(''); }}
                                    onMouseEnter={() => setActiveSug(i)}
                                >
                                    <img
                                        src={s.poster || FALLBACK_POSTER}
                                        alt={s.title}
                                        className="suggest-poster"
                                        onError={e => { e.target.src = FALLBACK_POSTER; }}
                                    />
                                    <div className="suggest-info">
                                        <span className="suggest-title">{s.title}</span>
                                        {s.year && <span className="suggest-year">{s.year}</span>}
                                    </div>
                                </div>
                            ))}
                            <div
                                className="suggest-footer"
                                onMouseDown={() => commitSearch(query)}
                            >
                                See all results for "<strong>{query}</strong>" →
                            </div>
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                    <Link to="/community" className={isActive('/community') ? 'nav-link active' : 'nav-link'}>Community</Link>
                    <Link to="/clubs" className={isActive('/clubs') ? 'nav-link active' : 'nav-link'}>Clubs</Link>
                    {isAuthenticated && <Link to="/upload" className={isActive('/upload') ? 'nav-link active' : 'nav-link'}>Upload Film</Link>}
                    <div className="nav-divider" />
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="navbar-avatar" title={user?.username}>
                                {user?.avatarUrl
                                    ? <img src={user.avatarUrl} alt={user.username} className="avatar-img" />
                                    : <div className="avatar-placeholder">{user?.username?.[0]?.toUpperCase()}</div>
                                }
                            </Link>
                            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                        </>
                    )}
                </nav>

                {/* Hamburger */}
                <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                    <span /><span /><span />
                </button>
            </div>
        </header>
    );
}
