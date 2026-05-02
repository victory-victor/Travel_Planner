import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import './Auth.css';

const TRAVEL_STYLES = ['Adventure', 'Luxury', 'Budget', 'Cultural', 'Beach', 'Mountain', 'City', 'Nature'];

const Signup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', travelStyle: [] });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { y: 40, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
    );

    // Particles logic
    const ctx = gsap.context(() => {
      const particles = particlesRef.current.querySelectorAll('.particle');
      particles.forEach(p => {
        gsap.to(p, {
          x: 'random(-100, 100)',
          y: 'random(-100, 100)',
          duration: 'random(10, 20)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    });
    return () => ctx.revert();
  }, []);

  const nextStep = () => {
    if (step === 1) {
      if (!form.name.trim()) return toast.error('Please enter your name');
      if (!form.email.trim()) return toast.error('Please enter your email');
      if (!form.password || form.password.length < 6) return toast.error('Password must be at least 6 characters');
      if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    }
    gsap.fromTo('.auth-form-panel',
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
    setStep(s => s + 1);
  };

  const toggleStyle = (style) => {
    setForm(f => ({
      ...f,
      travelStyle: f.travelStyle.includes(style)
        ? f.travelStyle.filter(s => s !== style)
        : [...f.travelStyle, style]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to WanderMind! 🌍');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 5 + 2 + 'px',
              height: Math.random() * 5 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      <div className="auth-panel" ref={panelRef}>
        {/* Left Branding */}
        <div className="auth-brand">
          <Link to="/" className="auth-logo">🌍 WanderMind</Link>
          <h2>Your AI Travel Companion</h2>
          <p>Start planning unforgettable group trips with the power of AI. Free forever for small groups.</p>

          <div className="auth-steps-preview">
            {['Create your trip', 'Invite your squad', 'AI plans everything', 'Travel together'].map((s, i) => (
              <div key={s} className="auth-step-preview">
                <div className="auth-step-num">{i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          <div className="auth-badge-row">
            <span className="badge badge-green">✓ No credit card</span>
            <span className="badge badge-primary">✓ Free to start</span>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-panel">
          {/* Progress */}
          <div className="auth-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(step / 2) * 100}%` }} />
            </div>
            <span className="auth-step-label">Step {step} of 2</span>
          </div>

          <div className="auth-form-header">
            <h1>{step === 1 ? 'Create your account' : 'Your travel style'}</h1>
            <p>{step === 1 ? 'Join 50,000+ travelers on WanderMind' : 'Help AI personalize your trips better'}</p>
          </div>

          <form className="auth-form" onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
            {step === 1 ? (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input id="signup-name" type="text" className="form-input input-with-icon" placeholder="Alex Johnson"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input id="signup-email" type="email" className="form-input input-with-icon" placeholder="alex@example.com"
                      value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input id="signup-password" type={showPass ? 'text' : 'password'} className="form-input input-with-icon input-with-toggle"
                      placeholder="Min. 6 characters"
                      value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input id="signup-confirm" type="password" className="form-input input-with-icon"
                      placeholder="Repeat password"
                      value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                  </div>
                </div>

                <button type="submit" id="signup-next" className="btn btn-primary w-full btn-lg">
                  Continue →
                </button>
              </>
            ) : (
              <>
                <div className="travel-style-grid">
                  {TRAVEL_STYLES.map(style => {
                    const icons = { Adventure: '🏔️', Luxury: '✨', Budget: '💰', Cultural: '🏛️', Beach: '🏖️', Mountain: '⛰️', City: '🏙️', Nature: '🌿' };
                    return (
                      <button key={style} type="button"
                        className={`style-btn ${form.travelStyle.includes(style) ? 'active' : ''}`}
                        onClick={() => toggleStyle(style)}>
                        <span>{icons[style]}</span>
                        <span>{style}</span>
                      </button>
                    );
                  })}
                </div>

                <button type="submit" id="signup-submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                  {loading ? <><div className="spinner" /> Creating Account...</> : '🚀 Start Exploring'}
                </button>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setStep(1)} disabled={loading}>
                  ← Back
                </button>
              </>
            )}
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
