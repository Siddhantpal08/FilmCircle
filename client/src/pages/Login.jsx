import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import MoviePosterBackground from '../components/MoviePosterBackground';
import logoImg from '../../LOGO/logo.png';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── Forgot password panel state ──────────────────────────────────────────
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) { setError('All fields are required'); return; }
        setLoading(true);
        try {
            const res = await authService.login(form);
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotOpen = () => {
        setShowForgot(true);
        setForgotEmail(form.email || '');
        setForgotError('');
        setForgotSuccess(false);
    };

    const handleForgotClose = () => {
        setShowForgot(false);
        setForgotEmail('');
        setForgotError('');
        setForgotSuccess(false);
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail) { setForgotError('Please enter your email address.'); return; }
        setForgotError('');
        setForgotLoading(true);
        try {
            await authService.forgotPassword(forgotEmail);
            setForgotSuccess(true);
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <main className="auth-page">
            {/* Animated movie poster background */}
            <MoviePosterBackground />

            <div className="auth-shell">
                {/* Back to home */}
                <Link to="/" className="auth-back-btn" id="login-back-home">
                    ← Home
                </Link>

                {/* Brand */}
                <div className="auth-brand">
                    <img src={logoImg} alt="FilmCircle" className="auth-brand-logo" />
                    <h1 className="auth-brand-name">FilmCircle</h1>
                    <p className="auth-brand-sub">Your cinema, your circle.</p>
                </div>

                {/* Error */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="cinephile@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                            <button
                                type="button"
                                id="forgot-password-btn"
                                className="forgot-link"
                                onClick={handleForgotOpen}
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                disabled={loading}
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

                    {/* ── Forgot Password inline panel ── */}
                    {showForgot && (
                        <div className="forgot-panel" role="region" aria-label="Reset password">
                            {forgotSuccess ? (
                                <>
                                    <p className="forgot-success-msg">
                                        ✅ Password reset link sent! Check your inbox.
                                    </p>
                                    <button type="button" className="forgot-back-link" onClick={handleForgotClose}>
                                        ← Back to Login
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="forgot-panel-title">Reset your password</p>
                                    <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                        <label className="form-label" htmlFor="forgot-email-input" style={{ fontSize: '0.8rem' }}>
                                            Your account email
                                        </label>
                                        <input
                                            id="forgot-email-input"
                                            type="email"
                                            className="form-input"
                                            placeholder="cinephile@example.com"
                                            value={forgotEmail}
                                            onChange={e => setForgotEmail(e.target.value)}
                                            disabled={forgotLoading}
                                            required
                                        />
                                    </div>
                                    {forgotError && (
                                        <p className="forgot-error-msg">{forgotError}</p>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            id="send-reset-link-btn"
                                            className="btn btn-primary forgot-submit-btn"
                                            onClick={handleForgotSubmit}
                                            disabled={forgotLoading}
                                        >
                                            {forgotLoading ? (
                                                <><span className="btn-spinner" />Sending…</>
                                            ) : 'Send Reset Link'}
                                        </button>
                                        <button type="button" className="forgot-back-link" onClick={handleForgotClose}>
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Log In'}
                    </button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                </div>

                {/* Footer link */}
                <p className="auth-footer-text">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-footer-link">Sign Up</Link>
                </p>
            </div>

            {/* Bottom accent line */}
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
                .auth-brand {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .auth-brand-logo {
                    height: 72px;
                    width: auto;
                    background: transparent;
                    margin-bottom: 0.75rem;
                }
                .auth-brand-name {
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.01em;
                    color: var(--clr-on-surface);
                    margin-bottom: 0.25rem;
                }
                .auth-brand-sub {
                    font-size: 0.875rem;
                    color: var(--clr-on-surface-variant);
                }
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
                .auth-form { display: flex; flex-direction: column; gap: 0; }
                .forgot-link {
                    background: none;
                    border: none;
                    padding: 0;
                    font-size: 0.78rem;
                    color: var(--clr-outline);
                    cursor: pointer;
                    transition: color 0.15s;
                    font-family: inherit;
                }
                .forgot-link:hover { color: var(--clr-primary); text-decoration: underline; }

                /* ── Forgot password inline panel ── */
                .forgot-panel {
                    background: rgba(192,57,43,0.07);
                    border: 1px solid rgba(192,57,43,0.25);
                    border-radius: var(--radius-sm);
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    margin-top: 0.75rem;
                    animation: fpSlideDown 0.2s ease;
                }
                @keyframes fpSlideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .forgot-panel-title {
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: var(--clr-on-surface);
                    margin: 0 0 0.75rem;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                }
                .forgot-success-msg {
                    font-size: 0.875rem;
                    color: #4ade80;
                    margin: 0 0 0.75rem;
                    line-height: 1.5;
                }
                .forgot-error-msg {
                    font-size: 0.82rem;
                    color: #f87171;
                    margin: 0.25rem 0 0;
                }
                .forgot-submit-btn {
                    padding: 0.55rem 1.1rem;
                    font-size: 0.85rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    border-radius: var(--radius-sm);
                }
                .btn-spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .forgot-back-link {
                    background: none;
                    border: none;
                    padding: 0;
                    font-size: 0.8rem;
                    color: var(--clr-on-surface-variant);
                    cursor: pointer;
                    font-family: inherit;
                    transition: color 0.15s;
                }
                .forgot-back-link:hover { color: var(--clr-on-surface); text-decoration: underline; }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }
                .auth-divider-line { flex: 1; height: 1px; background: rgba(89,65,61,0.3); }
                .auth-divider-text {
                    font-size: 0.75rem;
                    color: var(--clr-on-surface-variant);
                    text-transform: lowercase;
                    letter-spacing: 0.05em;
                }
                .auth-footer-text {
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--clr-on-surface-variant);
                    margin-top: 1.5rem;
                }
                .auth-footer-link {
                    color: var(--clr-primary);
                    font-weight: 700;
                    text-decoration: none;
                    margin-left: 0.25rem;
                }
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
