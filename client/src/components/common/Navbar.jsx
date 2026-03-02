import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [query, setQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
        }
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

                {/* Search */}
                <form className="navbar-search" onSubmit={handleSearch}>
                    <input
                        id="search-input"
                        className="search-input"
                        type="text"
                        placeholder="Search movies…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button type="submit" className="search-btn" aria-label="Search">🔍</button>
                </form>

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
