import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.username.length < 3) { setError('Username must be at least 3 characters'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            const res = await authService.register(form);
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
        <main className="page flex-center">
            <div className="auth-card card">
                <div className="auth-header">
                    <span style={{ fontSize: '2rem' }}>🎬</span>
                    <h2>Join FilmCircle</h2>
                    <p>Create your account — it's free</p>
                </div>
                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <input id="username" name="username" type="text" className="form-input" placeholder="cinephile42" value={form.username} onChange={handleChange} required minLength={3} maxLength={30} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
            <style>{`.auth-card { max-width: 420px; width: 100%; margin: 0 auto; padding: 2.5rem; } .auth-header { text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; } .auth-header p { color: var(--clr-text-muted); }`}</style>
        </main>
    );
}
