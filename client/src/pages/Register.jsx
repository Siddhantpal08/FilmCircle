import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import MoviePosterBackground from '../components/MoviePosterBackground';
import logoImg from '../../LOGO/logo.png';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.username.length < 3) { setError('Username must be at least 3 characters'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        setLoading(true);
        try {
            const res = await authService.register({
                username: form.username,
                email: form.email,
                password: form.password,
            });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors?.length) {
                setError(serverErrors.map(e => e.message).join(', '));
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            {/* Animated movie poster background */}
            <MoviePosterBackground />

            <div className="auth-shell">
                {/* Back to home */}
                <Link to="/" className="auth-back-btn" id="register-back-home">
                    ← Home
                </Link>

                {/* Brand */}
                <div className="auth-brand">
                    <img src={logoImg} alt="FilmCircle" className="auth-brand-logo" />
                    <h1 className="auth-brand-name">FilmCircle</h1>
                    <p className="auth-brand-sub">Your cinema, your circle.</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="register-username">Full Name</label>
                        <input
                            id="register-username" name="username" type="text"
                            className="form-input" placeholder="John Doe"
                            value={form.username} onChange={handleChange}
                            required minLength={3} maxLength={30} disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="register-email">Email</label>
                        <input
                            id="register-email" name="email" type="email"
                            className="form-input" placeholder="john@example.com"
                            value={form.email} onChange={handleChange}
                            required disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="register-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="register-password" name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input" placeholder="Min. 6 characters"
                                value={form.password} onChange={handleChange}
                                required minLength={6} disabled={loading}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--clr-outline)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    zIndex: 5
                                }}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="register-confirmPassword">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="register-confirmPassword" name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="form-input" placeholder="Re-enter your password"
                                value={form.confirmPassword} onChange={handleChange}
                                required minLength={6} disabled={loading}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--clr-outline)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px',
                                    zIndex: 5
                                }}
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                </div>

                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-footer-link">Log In</Link>
                </p>
            </div>

            <div className="auth-accent-line" />

            <style>{`
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem var(--px-mobile);
                    background: #0f0f13;
                    position: relative;
                }
                .auth-shell {
                    width: 100%;
                    max-width: 440px;
                    background: rgba(18, 12, 12, 0.92);
                    border: 1px solid rgba(192,57,43,0.25);
                    border-radius: var(--radius);
                    padding: 2.5rem 2rem;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04);
                    position: relative;
                    z-index: 2;
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                }
                .auth-brand { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 2rem; }
                .auth-brand-logo {
                    height: 72px;
                    width: auto;
                    background: transparent;
                    margin-bottom: 0.75rem;
                }
                .auth-brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: var(--clr-on-surface); margin-bottom: 0.25rem; }
                .auth-brand-sub { font-size: 0.875rem; color: var(--clr-on-surface-variant); }
                .auth-form { display: flex; flex-direction: column; }
                .auth-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--clr-on-surface-variant);
                    text-decoration: none;
                    letter-spacing: 0.03em;
                    margin-bottom: 1.5rem;
                    transition: color 0.15s;
                    width: fit-content;
                }
                .auth-back-btn:hover { color: var(--clr-on-surface); }
                .auth-divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
                .auth-divider-line { flex: 1; height: 1px; background: rgba(89,65,61,0.3); }
                .auth-divider-text { font-size: 0.75rem; color: var(--clr-on-surface-variant); }
                .auth-footer-text { text-align: center; font-size: 0.875rem; color: var(--clr-on-surface-variant); margin-top: 0; }
                .auth-footer-link { color: var(--clr-primary); font-weight: 700; text-decoration: none; margin-left: 0.25rem; }
                .auth-footer-link:hover { text-decoration: underline; }
                .auth-accent-line {
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 2px;
                    background: linear-gradient(to right, var(--clr-primary-container), transparent, var(--clr-primary-container));
                    opacity: 0.4;
                    z-index: 3;
                }
            `}</style>
        </main>
    );
}
