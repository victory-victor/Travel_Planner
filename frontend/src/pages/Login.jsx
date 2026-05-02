import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🌍');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="auth-testimonial">
            <p>"WanderMind made planning our 10-person Euro trip absolutely seamless. The AI itinerary was perfect!"</p>
            <div className="auth-testimonial-author">
              <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700 }}>SC</div>
              <div>
                <strong>Sarah Chen</strong>
                <span>Travel Blogger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue your adventures</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  className="form-input input-with-icon"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input input-with-icon input-with-toggle"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  autoComplete="current-password"
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button type="submit" id="login-submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
