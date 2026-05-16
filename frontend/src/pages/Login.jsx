import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import axios from 'axios';
import './Auth.css';

// Stages:
// 'login'        → normal sign-in form
// 'forgot-email' → enter email to receive OTP
// 'otp'          → enter 4-digit OTP  (verified SERVER-SIDE here)
// 'new-password' → set new password   (OTP already verified, just send email+newPassword)

const Login = () => {
  const [stage, setStage] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [fpEmail, setFpEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [otpError, setOtpError] = useState(false); // shake boxes on wrong OTP

  const { login, forgotPassword, verifyOTP, resetPassword } = useAuth();
  const navigate = useNavigate();

  const panelRef = useRef(null);
  const particlesRef = useRef(null);
  const stageRef = useRef(null);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // ── Entrance ──────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { y: 40, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
    );
    const ctx = gsap.context(() => {
      particlesRef.current?.querySelectorAll('.particle').forEach(p => {
        gsap.to(p, {
          x: 'random(-100, 100)', y: 'random(-100, 100)',
          duration: 'random(10, 20)', repeat: -1, yoyo: true, ease: 'sine.inOut',
        });
      });
    });
    return () => ctx.revert();
  }, []);

  // ── Animated stage transition ─────────────────────────────────
  const animateStage = useCallback((newStage) => {
    if (!stageRef.current) { setStage(newStage); return; }
    gsap.to(stageRef.current, {
      opacity: 0, y: -16, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        setStage(newStage);
        gsap.fromTo(stageRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out' }
        );
      },
    });
  }, []);

  // ── OTP countdown ─────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setOtpTimer(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── OTP box helpers ───────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    setOtpError(false);
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 3) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      otpRefs.current[3]?.focus();
      e.preventDefault();
    }
  };

  const shakeOtpBoxes = () => {
    setOtpError(true);
    gsap.fromTo('.otp-box',
      { x: 0 },
      {
        x: 6, duration: 0.07, repeat: 5, yoyo: true, ease: 'power1.inOut',
        onComplete: () => setOtpError(false)
      }
    );
  };

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🌍');
      // If user came from an invitation link, send them back to accept it
      const pendingInvite = localStorage.getItem('wm_pending_invite');
      if (pendingInvite) {
        localStorage.removeItem('wm_pending_invite');
        navigate(`/join/${pendingInvite}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP ──────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    if (!fpEmail.trim()) return toast.error('Enter your email address');
    setLoading(true);
    try {
      // await axios.post('/api/auth/forgot-password', { email: fpEmail.trim() });
      await forgotPassword(fpEmail.trim());
      toast.success('OTP sent! Check your inbox 📬');
      setOtp(['', '', '', '']);
      startTimer();
      animateStage('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 400);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (otpTimer > 0 || resending) return;
    setResending(true);
    try {
      // await axios.post('/api/auth/forgot-password', { email: fpEmail.trim() });
      await forgotPassword(fpEmail.trim());
      toast.success('New OTP sent!');
      setOtp(['', '', '', '']);
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // ── Verify OTP — hits server, moves to password stage only if correct ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) return toast.error('Enter the complete 4-digit OTP');

    setLoading(true);
    try {
      // Server checks OTP and marks it verified — no deletion yet
      // await axios.post('/api/auth/verify-otp', {
      //   email: fpEmail.trim(),
      //   otp: code,
      // });
      await verifyOTP(fpEmail.trim(), code);
      toast.success('OTP verified ✅');
      animateStage('new-password');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
      shakeOtpBoxes();
      // clear boxes so user re-enters
      setOtp(['', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password — OTP already verified on server ───────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return toast.error('Enter a new password');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      // resetPassword in AuthContext already returns data (the unwrapped response)
      // so we DON'T destructure { data } from it — we use it directly
      const data = await resetPassword(fpEmail.trim(), newPassword);

      // AuthContext.resetPassword does NOT auto-login, so we do it manually
      if (data.token) {
        localStorage.setItem('wm_token', data.token);
        localStorage.setItem('wm_user', JSON.stringify(data.user));
      }

      toast.success('Password reset! Welcome back 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('verified')) {
        setOtp(['', '', '', '']);
        animateStage('otp');
        setTimeout(() => otpRefs.current[0]?.focus(), 400);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Meta ──────────────────────────────────────────────────────
  const STAGE_META = {
    'login': { title: 'Welcome back', sub: 'Sign in to continue your adventures' },
    'forgot-email': { title: 'Reset password', sub: "Enter your email and we'll send a code" },
    'otp': { title: 'Check your inbox', sub: `We sent a 4-digit code to ${fpEmail}` },
    'new-password': { title: 'Create new password', sub: 'Almost there — choose a strong password' },
  };

  const meta = STAGE_META[stage];
  const otpFilled = otp.every(d => d !== '');

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-gradient-orb orb-1" />
        <div className="auth-gradient-orb orb-2" />
        <div className="auth-gradient-orb orb-3" />
        <div className="auth-grid" />
      </div>

      <div className="particles" ref={particlesRef}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            width: Math.random() * 5 + 2 + 'px',
            height: Math.random() * 5 + 2 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
            opacity: Math.random() * 0.5 + 0.2,
          }} />
        ))}
      </div>

      <div className="auth-panel" ref={panelRef}>
        {/* ── Left branding (unchanged) ── */}
        <div className="auth-brand">
          <Link to="/" className="auth-logo">🌍 WanderMind</Link>
          <h2>Plan Group Trips with AI</h2>
          <p>Join 50,000+ travelers who use WanderMind to create unforgettable group adventures.</p>
          <div className="auth-features">
            {[
              { icon: '🤖', text: 'AI-generated itineraries' },
              { icon: '👥', text: 'Invite friends instantly' },
              { icon: '💰', text: 'Smart budget planner' },
              { icon: '🗺️', text: 'Interactive trip maps' },
            ].map(f => (
              <div key={f.text} className="auth-feature-item">
                <span>{f.icon}</span><span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="auth-testimonial">
            <p>"WanderMind made planning our 10-person Euro trip absolutely seamless. The AI itinerary was perfect!"</p>
            <div className="auth-testimonial-author">
              <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>SC</div>
              <div><strong>Sarah Chen</strong><span>Travel Blogger</span></div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-form-panel">

          {/* Progress dots — only visible during forgot-password flow */}
          {stage !== 'login' && (
            <div className="fp-progress">
              {['forgot-email', 'otp', 'new-password'].map((s, i) => {
                const stageOrder = ['forgot-email', 'otp', 'new-password'];
                const currentIdx = stageOrder.indexOf(stage);
                return (
                  <div key={s} className={`fp-dot ${i === currentIdx ? 'fp-dot--active' : i < currentIdx ? 'fp-dot--done' : ''
                    }`} />
                );
              })}
              <div className="fp-progress-line">
                <div className="fp-progress-fill" style={{
                  width: stage === 'forgot-email' ? '0%' : stage === 'otp' ? '50%' : '100%',
                }} />
              </div>
            </div>
          )}

          <div className="auth-form-header">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>

          <div ref={stageRef}>

            {/* ───── LOGIN ───── */}
            {stage === 'login' && (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="login-email" type="email"
                      className="form-input input-with-icon"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="fp-label-row">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <button type="button" className="fp-link" onClick={() => {
                      setFpEmail(form.email);
                      animateStage('forgot-email');
                    }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      className="form-input input-with-icon input-with-toggle"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                    />
                    <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? <><div className="spinner" /> Signing in…</> : 'Sign In →'}
                </button>
              </form>
            )}

            {/* ───── FORGOT — EMAIL ───── */}
            {stage === 'forgot-email' && (
              <form className="auth-form" onSubmit={handleSendOTP}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fp-email">Email Address</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="fp-email" type="email"
                      className="form-input input-with-icon"
                      placeholder="you@example.com"
                      value={fpEmail}
                      onChange={e => setFpEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading
                    ? <><div className="spinner" /> Sending code…</>
                    : <>Send OTP <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 4 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>
                  }
                </button>
                <button type="button" className="btn btn-secondary w-full" onClick={() => animateStage('login')}>
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ───── OTP ───── */}
            {stage === 'otp' && (
              <form className="auth-form" onSubmit={handleVerifyOTP}>
                <div className="otp-section">
                  <p className="otp-hint">
                    Sent to <strong>{fpEmail}</strong>
                    <button type="button" className="fp-link otp-change-email" onClick={() => animateStage('forgot-email')}>
                      Change
                    </button>
                  </p>

                  {/* 4 digit boxes */}
                  <div className="otp-boxes" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`otp-box ${digit ? 'otp-box--filled' : ''} ${otpError ? 'otp-box--error' : ''}`}
                        value={digit}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKeyDown(e, idx)}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <div className="otp-resend-row">
                    {otpTimer > 0 ? (
                      <span className="otp-timer">
                        Resend in <strong>{otpTimer}s</strong>
                      </span>
                    ) : (
                      <button type="button" className="fp-link" onClick={handleResendOTP} disabled={resending}>
                        {resending ? 'Sending…' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary w-full btn-lg otp-verify-btn ${otpFilled ? 'otp-verify-btn--ready' : ''}`}
                  disabled={!otpFilled || loading}
                >
                  {loading
                    ? <><div className="spinner" /> Verifying…</>
                    : 'Verify Code →'
                  }
                </button>
                <button type="button" className="btn btn-secondary w-full" onClick={() => animateStage('forgot-email')}>
                  ← Back
                </button>
              </form>
            )}

            {/* ───── NEW PASSWORD ───── */}
            {stage === 'new-password' && (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-pass">New Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="new-pass"
                      type={showNewPass ? 'text' : 'password'}
                      className="form-input input-with-icon input-with-toggle"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      autoFocus
                    />
                    <button type="button" className="toggle-pass" onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="pass-strength">
                      <div className="pass-strength-track">
                        <div className="pass-strength-fill" style={{
                          width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                          background: newPassword.length < 6 ? '#EF4444' : newPassword.length < 10 ? '#F59E0B' : 'var(--accent-green)',
                        }} />
                      </div>
                      <span className="pass-strength-label" style={{
                        color: newPassword.length < 6 ? '#EF4444' : newPassword.length < 10 ? '#F59E0B' : 'var(--accent-green)',
                      }}>
                        {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <input
                      id="confirm-pass"
                      type="password"
                      className={`form-input input-with-icon ${confirmPassword && newPassword !== confirmPassword ? 'input-error' :
                        confirmPassword && newPassword === confirmPassword ? 'input-success' : ''
                        }`}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && (
                      <span className="input-match-icon">
                        {newPassword === confirmPassword ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? <><div className="spinner" /> Resetting…</> : '🔐 Reset Password'}
                </button>
              </form>
            )}
          </div>

          {stage === 'login' && (
            <>
              <div className="auth-divider"><span>or</span></div>
              <p className="auth-switch">
                Don't have an account? <Link to="/signup">Create one free</Link>
              </p>
            </>
          )}

          {stage !== 'login' && (
            <p className="auth-switch" style={{ marginTop: 8 }}>
              Remembered it?{' '}
              <button type="button" className="fp-link" onClick={() => animateStage('login')}>
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;