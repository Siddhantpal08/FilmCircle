import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    return (
        <main className="auth-page">
            {/* Atmospheric background */}
            <div className="auth-bg-glow" />

            <div className="auth-shell">
                {/* Brand */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">🎬</div>
                    <h1 className="auth-brand-name">FilmCircle</h1>
                    <p className="auth-brand-sub">Your cinema, your circle.</p>
                </div>

                {/* Error */}
                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="cinephile@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                            <span style={{ fontSize: '0.78rem', color: 'var(--clr-outline)', cursor: 'pointer' }}>Forgot password?</span>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}
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
                    background: radial-gradient(circle at 50% 50%, #1a1a1a 0%, var(--clr-bg) 100%);
                    position: relative;
                }
                .auth-bg-glow {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    background: radial-gradient(ellipse at 50% 0%, rgba(192,57,43,0.08) 0%, transparent 60%);
                }
                .auth-shell {
                    width: 100%;
                    max-width: 440px;
                    background: var(--clr-surface-container);
                    border: 1px solid rgba(89,65,61,0.3);
                    border-radius: var(--radius);
                    padding: 2.5rem 2rem;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.7);
                    position: relative;
                    z-index: 1;
                }
                .auth-brand {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 2rem;
                }
                .auth-brand-icon {
                    width: 52px; height: 52px;
                    background: var(--clr-primary-container);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 0 20px rgba(192,57,43,0.4);
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
                .auth-form { display: flex; flex-direction: column; gap: 0; }
                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }
                .auth-divider-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(89,65,61,0.3);
                }
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
                    opacity: 0.3;
                }
            `}</style>
        </main>
    );
}
