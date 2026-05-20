import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            <div className="auth-bg-glow" />

            <div className="auth-shell">
                {/* Brand */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">🎬</div>
                    <h1 className="auth-brand-name">FilmCircle</h1>
                    <p className="auth-brand-sub">Your cinema, your circle.</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Full Name</label>
                        <input
                            id="username" name="username" type="text"
                            className="form-input" placeholder="John Doe"
                            value={form.username} onChange={handleChange}
                            required minLength={3} maxLength={30} disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email" name="email" type="email"
                            className="form-input" placeholder="john@example.com"
                            value={form.email} onChange={handleChange}
                            required disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password" name="password" type="password"
                            className="form-input" placeholder="Min. 6 characters"
                            value={form.password} onChange={handleChange}
                            required minLength={6} disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword" name="confirmPassword" type="password"
                            className="form-input" placeholder="Re-enter your password"
                            value={form.confirmPassword} onChange={handleChange}
                            required minLength={6} disabled={loading}
                        />
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
                .auth-brand { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 2rem; }
                .auth-brand-icon {
                    width: 52px; height: 52px;
                    background: var(--clr-primary-container);
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 0 20px rgba(192,57,43,0.4);
                }
                .auth-brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em; color: var(--clr-on-surface); margin-bottom: 0.25rem; }
                .auth-brand-sub { font-size: 0.875rem; color: var(--clr-on-surface-variant); }
                .auth-form { display: flex; flex-direction: column; }
                .auth-divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
                .auth-divider-line { flex: 1; height: 1px; background: rgba(89,65,61,0.3); }
                .auth-divider-text { font-size: 0.75rem; color: var(--clr-on-surface-variant); }
                .auth-footer-text { text-align: center; font-size: 0.875rem; color: var(--clr-on-surface-variant); margin-top: 0; }
                .auth-footer-link { color: var(--clr-primary); font-weight: 700; text-decoration: none; margin-left: 0.25rem; }
                .auth-footer-link:hover { text-decoration: underline; }
                .auth-accent-line { position: fixed; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(to right, var(--clr-primary-container), transparent, var(--clr-primary-container)); opacity: 0.3; }
            `}</style>
        </main>
    );
}
