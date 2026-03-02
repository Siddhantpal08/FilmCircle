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
        <main className="page flex-center">
            <div className="auth-card card">
                <div className="auth-header">
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                    <h2>Welcome back</h2>
                    <p>Sign in to your FilmCircle account</p>
                </div>
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign up</Link>
                </p>
            </div>
            <style>{`.auth-card { max-width: 420px; width: 100%; margin: 0 auto; padding: 2.5rem; } .auth-header { text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; } .auth-header p { color: var(--clr-text-muted); }`}</style>
        </main>
    );
}
