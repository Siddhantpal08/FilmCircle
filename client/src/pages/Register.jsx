import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';
import MoviePosterBackground from '../components/MoviePosterBackground';
import logoImg from '../../LOGO/logo.png';

// ── Eye icons ──────────────────────────────────────────────────────────────────
const EyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);
const EyeOn = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// ── Password toggle button ─────────────────────────────────────────────────────
function ToggleBtn({ show, onToggle }) {
    return (
        <button type="button" onClick={onToggle} style={{
            position: 'absolute', right: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', background: 'none', border: 'none',
            color: 'var(--clr-outline)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '4px', zIndex: 5,
        }}>
            {show ? <EyeOff /> : <EyeOn />}
        </button>
    );
}

// ── OTP digit input ────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
    const digits = (value + '      ').slice(0, 6).split('');

    const handleKey = (e, idx) => {
        const key = e.key;
        if (key === 'Backspace') {
            const next = [...value.split('')];
            if (next[idx]) { next[idx] = ''; } else { next[idx - 1] = ''; }
            onChange(next.join('').slice(0, 6));
            if (idx > 0 && !value[idx]) {
                document.getElementById(`otp-digit-${idx - 1}`)?.focus();
            }
            return;
        }
        if (/^\d$/.test(key)) {
            const next = [...value.padEnd(6, ' ').split('')];
            next[idx] = key;
            onChange(next.join('').trim().slice(0, 6));
            if (idx < 5) document.getElementById(`otp-digit-${idx + 1}`)?.focus();
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', margin: '1.5rem 0' }}>
            {digits.map((d, i) => (
                <input
                    key={i}
                    id={`otp-digit-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d.trim()}
                    onChange={() => {}}
                    onKeyDown={(e) => handleKey(e, i)}
                    onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        onChange(pasted);
                        document.getElementById(`otp-digit-${Math.min(pasted.length, 5)}`)?.focus();
                        e.preventDefault();
                    }}
                    style={{
                        width: '3rem', height: '3.5rem', textAlign: 'center',
                        fontSize: '1.5rem', fontWeight: 800,
                        background: 'rgba(255,255,255,0.05)',
                        border: d.trim() ? '2px solid var(--clr-primary)' : '2px solid rgba(89,65,61,0.4)',
                        borderRadius: '10px', color: '#fff', outline: 'none',
                        transition: 'border-color 0.15s',
                        fontFamily: '"Courier New", monospace',
                        letterSpacing: 0,
                    }}
                />
            ))}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    // step: 'form' → 'otp'
    const [step, setStep] = useState('form');

    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [otp, setOtp] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    // ── Step 1: submit form & send OTP ─────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (form.username.length < 3) { setError('Username must be at least 3 characters'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            await authService.sendOtp(form.username, form.email, form.password);
            setStep('otp');
            startCooldown();
        } catch (err) {
            const errs = err.response?.data?.errors;
            setError(errs?.length ? errs.map(e => e.message).join(', ') : err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Cooldown timer (resend button) ─────────────────────────────────────────
    const startCooldown = () => {
        setResendCooldown(60);
        const timer = setInterval(() => {
            setResendCooldown(c => {
                if (c <= 1) { clearInterval(timer); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await authService.sendOtp(form.username, form.email, form.password);
            setOtp('');
            startCooldown();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: verify OTP ─────────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('Please enter all 6 digits'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await authService.verifyOtp(form.email, otp);
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            const errs = err.response?.data?.errors;
            setError(errs?.length ? errs.map(e => e.message).join(', ') : err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <main className="auth-page">
            <MoviePosterBackground />

            <div className="auth-shell">
                {/* Back button */}
                {step === 'form' ? (
                    <Link to="/" className="auth-back-btn" id="register-back-home">← Home</Link>
                ) : (
                    <button className="auth-back-btn" onClick={() => { setStep('form'); setError(''); setOtp(''); }}>
                        ← Back
                    </button>
                )}

                {/* Brand */}
                <div className="auth-brand">
                    <img src={logoImg} alt="FilmCircle" className="auth-brand-logo" />
                    <h1 className="auth-brand-name">FilmCircle</h1>
                    <p className="auth-brand-sub">Your cinema, your circle.</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

                {/* ── Step 1: Registration form ───────────────────────────────── */}
                {step === 'form' && (
                    <form onSubmit={handleSendOtp} className="auth-form">
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
                                <ToggleBtn show={showPassword} onToggle={() => setShowPassword(s => !s)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="register-confirmPassword">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="register-confirmPassword" name="confirmPassword"
                                    type={showConfirm ? 'text' : 'password'}
                                    className="form-input" placeholder="Re-enter your password"
                                    value={form.confirmPassword} onChange={handleChange}
                                    required minLength={6} disabled={loading}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <ToggleBtn show={showConfirm} onToggle={() => setShowConfirm(s => !s)} />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP…' : 'Continue →'}
                        </button>
                    </form>
                )}

                {/* ── Step 2: OTP verification ────────────────────────────────── */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                                background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
                                fontSize: '1.5rem', marginBottom: '0.75rem',
                            }}>✉️</div>
                            <p style={{ color: 'var(--clr-on-surface)', fontWeight: 700, margin: '0 0 0.25rem' }}>Check your inbox</p>
                            <p style={{ color: 'var(--clr-on-surface-variant)', fontSize: '0.875rem', margin: 0 }}>
                                We sent a 6-digit code to<br />
                                <strong style={{ color: 'var(--clr-primary)' }}>{form.email}</strong>
                            </p>
                        </div>

                        <OtpInput value={otp} onChange={setOtp} />

                        <button
                            type="submit"
                            className="btn btn-primary"
                            id="register-verify-otp"
                            style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-sm)', letterSpacing: '0.1em' }}
                            disabled={loading || otp.length < 6}
                        >
                            {loading ? 'Verifying…' : 'Verify & Create Account'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--clr-on-surface-variant)' }}>
                            Didn't receive it?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || loading}
                                style={{
                                    background: 'none', border: 'none', padding: 0,
                                    color: resendCooldown > 0 ? 'var(--clr-outline)' : 'var(--clr-primary)',
                                    fontWeight: 700, cursor: resendCooldown > 0 ? 'default' : 'pointer',
                                    fontSize: 'inherit',
                                }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </form>
                )}

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
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
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
