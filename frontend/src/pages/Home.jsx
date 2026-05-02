import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

const DESTINATIONS = [
  { name: 'Santorini', country: 'Greece', emoji: '🏛️', tag: 'Romantic' },
  { name: 'Bali', country: 'Indonesia', emoji: '🌴', tag: 'Exotic' },
  { name: 'Tokyo', country: 'Japan', emoji: '🗼', tag: 'Urban' },
  { name: 'Patagonia', country: 'Argentina', emoji: '🏔️', tag: 'Adventure' },
  { name: 'Marrakech', country: 'Morocco', emoji: '🕌', tag: 'Cultural' },
  { name: 'Maldives', country: 'Maldives', emoji: '🌊', tag: 'Luxury' },
];

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI-Powered Planning',
    desc: 'Advanced AI generates personalized day-by-day itineraries tailored to your group\'s unique preferences, budget, and travel style.',
    color: '#6C63FF',
  },
  {
    icon: '👥',
    title: 'Group Collaboration',
    desc: 'Invite friends instantly via email — no signup required. Collaborate in real-time on every detail of your trip.',
    color: '#FF6584',
  },
  {
    icon: '💰',
    title: 'Smart Budget Optimizer',
    desc: 'AI analyzes your budget and suggests the best allocation across accommodation, food, transport, and activities.',
    color: '#43E97B',
  },
  {
    icon: '🗺️',
    title: 'Interactive Maps',
    desc: 'Visualize your entire trip on interactive maps. See distances, routes, and discover hidden gems along the way.',
    color: '#FA8231',
  },
  {
    icon: '✈️',
    title: 'Smart Packing Lists',
    desc: 'AI generates destination-specific packing lists based on weather, activities, and trip duration.',
    color: '#38F9D7',
  },
  {
    icon: '📧',
    title: 'Instant Invitations',
    desc: 'Beautiful email invitations sent in seconds. Guests can view trip details and join without creating an account.',
    color: '#F9CA24',
  },
];

const STEPS = [
  { num: '01', title: 'Create Your Trip', desc: 'Set your destination, dates, budget and preferences in our guided wizard.' },
  { num: '02', title: 'Invite Your Crew', desc: 'Send beautiful email invites to friends. They can join instantly.' },
  { num: '03', title: 'Let AI Plan', desc: 'Our Advanced AI generates a complete day-by-day itinerary tailored to your group.' },
  { num: '04', title: 'Travel Together', desc: 'Follow your AI itinerary, track expenses, and create unforgettable memories.' },
];

const STATS = [
  { value: 50000, suffix: '+', label: 'Trips Planned' },
  { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  { value: 120, suffix: '+', label: 'Countries Covered' },
  { value: 2, suffix: 'M+', label: 'Travelers Served' },
];

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const Home = () => {
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroBtnsRef = useRef(null);
  const heroCardsRef = useRef(null);
  const particlesRef = useRef(null);
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const statsRef = useRef(null);

  // Animate particles
  useEffect(() => {
    if (!particlesRef.current) return;
    const particles = particlesRef.current.querySelectorAll('.particle');
    particles.forEach((p, i) => {
      gsap.to(p, {
        y: `${-30 - Math.random() * 40}px`,
        x: `${(Math.random() - 0.5) * 30}px`,
        opacity: Math.random() * 0.5 + 0.2,
        duration: 3 + Math.random() * 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 3,
      });
    });
  }, []);

  // Hero entrance animation
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(heroTitleRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' })
      .fromTo(heroSubRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .fromTo(heroBtnsRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .fromTo('.hero-dest-card', { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.2');
  }, []);

  // Scroll-triggered animations
  useEffect(() => {
    gsap.fromTo('.feature-card',
      { y: 80, opacity: 0, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power4.out',
        scrollTrigger: { trigger: featuresRef.current, start: 'top 75%', once: true }
      }
    );
    gsap.fromTo('.step-item',
      { x: -60, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: stepsRef.current, start: 'top 75%', once: true }
      }
    );
    gsap.fromTo('.stat-card',
      { y: 40, opacity: 0, scale: 0.8 },
      {
        y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, ease: 'back.out(1.5)',
        scrollTrigger: { trigger: statsRef.current, start: 'top 85%', once: true }
      }
    );
    gsap.fromTo('.hero-dest-card',
      { y: 60, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.5)', delay: 1 }
    );
  }, []);

  return (
    <div className="home">
      {/* ── SHARED PAGE BACKGROUND ─────────────────────────── */}
      <div className="hero-bg">
        <div className="hero-gradient-orb orb-1" />
        <div className="hero-gradient-orb orb-2" />
        <div className="hero-gradient-orb orb-3" />
        <div className="hero-grid" />
      </div>

      {/* Floating Particles */}
      <div className="particles" ref={particlesRef}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            background: i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--secondary)' : 'var(--accent-green)',
          }} />
        ))}
      </div>

      {/* ── HERO ─────────────────────────────── */}
      <section className="hero" ref={heroRef}>

        <div className="container">
          <div className="hero-content">
            {/* Badge */}
            <div className="hero-badge">
              <span className="glow-dot" />
              <span>Powered by Advanced AI</span>
            </div>

            {/* Title */}
            <h1 ref={heroTitleRef} className="hero-title">
              Plan Group Travel<br />
              <span className="gradient-text">Like Never Before</span>
            </h1>

            {/* Subtitle */}
            <p ref={heroSubRef} className="hero-subtitle">
              WanderMind's AI creates personalized itineraries, manages group budgets,
              and sends instant invitations — making group travel effortless and unforgettable.
            </p>

            {/* Buttons */}
            <div ref={heroBtnsRef} className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg hero-cta">
                <span>Start Planning Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">See Demo</Link>
            </div>

            {/* Social Proof */}
            <div className="hero-proof">
              <div className="hero-avatars">
                {['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰'].map((e, i) => (
                  <div key={i} className="proof-avatar" style={{ zIndex: 5 - i }}>{e}</div>
                ))}
              </div>
              <p><strong>50,000+</strong> travelers planning their next adventure</p>
            </div>
          </div>

          {/* Destination Cards */}
          <div className="hero-destinations" ref={heroCardsRef}>
            <p className="hero-dest-label">✨ Popular Destinations</p>
            <div className="hero-dest-grid">
              {DESTINATIONS.map((d) => (
                <div key={d.name} className="hero-dest-card card">
                  <span className="dest-emoji">{d.emoji}</span>
                  <div>
                    <p className="dest-name">{d.name}</p>
                    <p className="dest-country">{d.country}</p>
                  </div>
                  <span className="badge badge-primary dest-tag">{d.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-dot" />
          </div>
          <p>Scroll to explore</p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────── */}
      <section className="stats-section" ref={statsRef}>
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card card">
                <h3 className="stat-value gradient-text">
                  <Counter target={s.value} suffix={s.suffix} />
                </h3>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────── */}
      <section className="features-section section" ref={featuresRef}>
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Why WanderMind</span>
            <h2>Everything Your Group <span className="gradient-text">Needs to Travel</span></h2>
            <p>From AI planning to real-time collaboration — we've built everything so you can focus on the adventure.</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card card">
                <div className="feature-icon" style={{ background: `rgba(255,255,255,0.05)`, color: f.color, borderColor: `${f.color}30` }}>
                  {f.icon}
                </div>
                <div className="feature-content">
                  <h4 className="feature-title">{f.title}</h4>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section className="how-section section" ref={stepsRef}>
        <div className="container">
          <div className="how-inner">
            <div className="section-header">
              <span className="section-tag">How It Works</span>
              <h2>From Idea to <span className="gradient-text">Adventure</span></h2>
              <p>Our AI-powered workflow makes planning a group trip as easy as 1-2-3-4.</p>
            </div>

            <div className="steps-list">
              {STEPS.map((s) => (
                <div key={s.num} className="step-item">
                  <div className="step-num gradient-text">{s.num}</div>
                  <div className="step-line" />
                  <div className="step-content">
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI SHOWCASE ──────────────────────── */}
      <section className="ai-section section">
        <div className="container">
          <div className="ai-inner">
            <div className="ai-text">
              <span className="section-tag">AI Intelligence</span>
              <h2>Your Personal <span className="gradient-text">AI Travel Expert</span></h2>
              <p>WanderMind's Advanced AI doesn't just plan — it thinks, adapts, and creates experiences tailored to your group's unique personality.</p>
              <ul className="ai-features-list">
                {[
                  '🗓️ Day-by-day personalized itineraries',
                  '💬 Real-time AI chat assistant',
                  '💰 Smart budget optimization',
                  '🎒 Custom packing lists',
                  '🍜 Local food recommendations',
                  '☁️ Weather-aware activity planning',
                ].map(f => <li key={f}>{f}</li>)}
              </ul>
              <Link to="/signup" className="btn btn-primary">Try AI Planning Free →</Link>
            </div>

            <div className="ai-demo">
              <div className="ai-chat-preview">
                <div className="chat-header">
                  <span className="glow-dot" />
                  <span>AI Assistant</span>
                  <span className="badge badge-green">Live</span>
                </div>
                <div className="chat-messages">
                  <div className="chat-msg user-msg">
                    Plan a 5-day trip to Bali for 4 friends with a ₹150,000 budget 🌴
                  </div>
                  <div className="chat-msg ai-msg">
                    <span className="ai-label">🤖 WanderMind AI</span>
                    I'll create the perfect Bali itinerary for your squad! Here's what I suggest:<br /><br />
                    <strong>Day 1:</strong> Arrive → Seminyak beach sunset → Welcome dinner at Potato Head<br />
                    <strong>Day 2:</strong> Ubud rice terraces → Monkey Forest → Cooking class<br />
                    <strong>Day 3:</strong> Mount Batur sunrise hike → Sacred temples tour<br />
                    <strong>Day 4:</strong> Nusa Penida day trip → Crystal Bay snorkeling<br />
                    <strong>Day 5:</strong> Tanah Lot → Sunset at Uluwatu → Kecak fire dance<br /><br />
                    Budget breakdown: ~₹35,000/person including accommodation, food &amp; activities ✅
                  </div>
                  <div className="chat-msg user-msg">
                    Amazing! Can you also suggest budget accommodations?
                  </div>
                  <div className="chat-msg ai-msg typing">
                    <span className="typing-dots"><span /><span /><span /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card card">
            <div className="cta-orbs">
              <div className="cta-orb cta-orb-1" />
              <div className="cta-orb cta-orb-2" />
            </div>
            <div className="cta-content">
              <h2>Ready to Plan Your<br /><span className="gradient-text">Dream Group Trip?</span></h2>
              <p>Join 50,000+ travelers who use WanderMind to create unforgettable group adventures.</p>
              <div className="cta-actions">
                <Link to="/signup" className="btn btn-primary btn-lg">
                  Start Planning Free
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <p className="cta-note">No credit card required · Free forever for small groups</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="navbar-logo">
                <span className="navbar-logo-icon">🌍</span>
                <span className="navbar-logo-text">WanderMind</span>
              </div>
              <p>AI-powered group travel planning for the modern explorer.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h5>Product</h5>
                <Link to="/signup">Get Started</Link>
                <Link to="/">Features</Link>
                <Link to="/">How It Works</Link>
              </div>
              <div className="footer-col">
                <h5>Company</h5>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              <div className="footer-col">
                <h5>Legal</h5>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 WanderMind. Made with ❤️ for adventurers worldwide.</p>
            <p>Powered by Advanced AI Intelligence</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
