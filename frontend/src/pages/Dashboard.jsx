import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripAPI } from '../services/api';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import './Dashboard.css';

gsap.registerPlugin(ScrollTrigger);

const STATUS_COLORS = {
  planning: { color: 'var(--primary)', bg: 'rgba(108,99,255,0.12)', label: '📋 Planning' },
  confirmed: { color: 'var(--accent-green)', bg: 'rgba(67,233,123,0.12)', label: '✅ Confirmed' },
  ongoing: { color: 'var(--accent-orange)', bg: 'rgba(250,130,49,0.12)', label: '✈️ Ongoing' },
  completed: { color: 'var(--text-muted)', bg: 'rgba(90,90,122,0.12)', label: '🏁 Completed' },
  cancelled: { color: '#FF4757', bg: 'rgba(255,71,87,0.12)', label: '❌ Cancelled' },
};

const DEST_EMOJIS = {
  beach: '🏖️', mountain: '🏔️', city: '🏙️',
  europe: '🏰', asia: '🗼', default: '🌍',
};

const DEST_GRADIENTS = [
  'linear-gradient(135deg,#6C63FF22,#FF658422)',
  'linear-gradient(135deg,#43E97B22,#38F9D722)',
  'linear-gradient(135deg,#FA823122,#F9CA2422)',
  'linear-gradient(135deg,#FF658422,#FD756322)',
  'linear-gradient(135deg,#38F9D722,#6C63FF22)',
  'linear-gradient(135deg,#F9CA2422,#43E97B22)',
];

function TripCard({ trip, index }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const days = differenceInDays(new Date(trip.endDate), new Date(trip.startDate));
  const status = STATUS_COLORS[trip.status] || STATUS_COLORS.planning;
  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const gradient = DEST_GRADIENTS[index % DEST_GRADIENTS.length];

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      y: -8,
      scale: 1.02,
      duration: 0.35,
      ease: 'power2.out',
    });
    gsap.to(cardRef.current.querySelector('.trip-card-glow'), {
      opacity: 1,
      duration: 0.35,
    });
  };

  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: 'power2.inOut',
    });
    gsap.to(cardRef.current.querySelector('.trip-card-glow'), {
      opacity: 0,
      duration: 0.4,
    });
  };

  return (
    <div
      ref={cardRef}
      className="trip-card card"
      onClick={() => navigate(`/trips/${trip._id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow overlay */}
      <div className="trip-card-glow" style={{ background: gradient }} />

      {/* Top accent line */}
      <div className="trip-card-accent" style={{ background: status.color }} />

      <div className="trip-card-inner">
        {/* Header */}
        <div className="trip-card-header">
          <div className="trip-destination-badge">
            {/* <div className="trip-dest-emoji-wrap" style={{ background: gradient }}>
              <span className="trip-dest-emoji">{DEST_EMOJIS.default}</span>
            </div> */}
            <div className="trip-title-block">
              <h4 className="trip-title">{trip.title}</h4>
              <p className="trip-dest">{trip.destination?.name}</p>
            </div>
          </div>
          <div className="trip-status" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </div>
        </div>

        {/* Divider */}
        <div className="trip-card-divider" />

        {/* Meta */}
        <div className="trip-meta">
          <div className="trip-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              {format(new Date(trip.startDate), 'MMM d')} –{' '}
              {format(new Date(trip.endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="trip-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{days} day{days !== 1 ? 's' : ''}</span>
          </div>
          {trip.budget?.total > 0 && (
            <div className="trip-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>₹{trip.budget.total.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="trip-card-footer">
          <div className="trip-avatars">
            {trip.members?.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="avatar avatar-sm trip-avatar"
                style={{
                  zIndex: 4 - i,
                  background: `hsl(${(i * 60) + 240}, 70%, 50%)`,
                  border: '2px solid var(--bg-card)',
                }}
              >
                {getInitials(m.user?.name)}
              </div>
            ))}
            {trip.members?.length > 4 && (
              <div className="avatar avatar-sm trip-avatar trip-avatar-more">
                +{trip.members.length - 4}
              </div>
            )}
          </div>
          <span className="trip-member-count">
            {trip.members?.length} traveler{trip.members?.length !== 1 ? 's' : ''}
          </span>
          {trip.aiGenerated && (
            <span className="badge badge-primary ai-badge">🤖 AI Planned</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated counter ──────────────────────────── */
function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          gsap.to({ val: 0 }, {
            val: target,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: function () {
              setCount(Math.round(this.targets()[0].val));
            },
          });
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}</span>;
}

/* ─── Main component ────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const gridRef = useRef(null);
  const particlesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Header entrance
    gsap.fromTo(
      headerRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );

    // Particles animation
    const ctx = gsap.context(() => {
      const particles = particlesRef.current?.querySelectorAll('.particle');
      particles?.forEach(p => {
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

    loadTrips();
    return () => ctx.revert();
  }, []);

  // Stats counter entrance
  useEffect(() => {
    if (!loading && statsRef.current) {
      gsap.fromTo(
        statsRef.current.querySelectorAll('.dash-stat-card'),
        { y: 30, opacity: 0, scale: 0.9 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: 'back.out(1.4)',
          delay: 0.2,
        }
      );
    }
  }, [loading]);

  const loadTrips = async () => {
    try {
      const { data } = await tripAPI.getAll();
      setTrips(data.trips);
    } catch {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  // Cards animation on filter change
  useEffect(() => {
    if (!loading && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.trip-card, .trip-add-card');
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: 'power2.out',
        }
      );
    }
  }, [loading, filter]);

  const filtered = filter === 'all' ? trips : trips.filter((t) => t.status === filter);
  const upcoming = trips.filter((t) => new Date(t.startDate) > new Date()).length;
  const completed = trips.filter((t) => t.status === 'completed').length;
  const totalPeople = trips.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const STATS = [
    { icon: '🗺️', value: trips.length, label: 'Total Trips', color: 'var(--primary)', bg: 'rgba(108,99,255,0.1)' },
    { icon: '✈️', value: upcoming, label: 'Upcoming', color: 'var(--accent-green)', bg: 'rgba(67,233,123,0.1)' },
    { icon: '🏁', value: completed, label: 'Completed', color: 'var(--accent-orange)', bg: 'rgba(250,130,49,0.1)' },
    { icon: '👥', value: totalPeople, label: 'Fellow Travelers', color: 'var(--secondary)', bg: 'rgba(255,101,132,0.1)' },
  ];

  return (
    <div className="dashboard page-enter">
      {/* Background (matches Home Hero) */}
      <div className="dash-bg">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
        <div className="dash-orb dash-orb-3" />
        <div className="dash-grid-overlay" />
      </div>

      {/* Particles layer */}
      <div className="dash-particles" ref={particlesRef}>
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 5 + 2 + 'px',
              height: Math.random() * 5 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
              opacity: Math.random() * 0.4 + 0.1
            }}
          />
        ))}
      </div>

      <div className="container">
        {/* ── Header ─────────────────────────────── */}
        <div style={{ padding: '40px 0px' }} className="dash-header" ref={headerRef}>
          <div className="dash-greeting">
            {/* <div className="dash-greeting-badge">
              <span className="glow-dot" />
              <span>Your Travel Hub</span>
            </div> */}
            <h1>
              {getGreeting()},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]} ✈️</span>
            </h1>
            <p>Ready to plan your next adventure?</p>
          </div>
          <div className="dash-header-actions">
            <Link to="/analytics" className="btn btn-secondary btn-lg dash-analytics-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Analytics
            </Link>
            <Link to="/create-trip" className="btn btn-primary btn-lg dash-create-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              New Trip
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────── */}
        <div className="dash-stats" ref={statsRef}>
          {STATS.map((s) => (
            <div key={s.label} className="dash-stat-card card">
              <div className="dash-stat-icon-wrap" style={{ background: s.bg, color: s.color }}>
                <span className="dash-stat-icon">{s.icon}</span>
              </div>
              <div className="dash-stat-text">
                <h3 className="dash-stat-value" style={{ color: s.color }}>
                  <AnimatedCounter target={s.value} />
                </h3>
                <p className="dash-stat-label">{s.label}</p>
              </div>
              <div className="dash-stat-shine" />
            </div>
          ))}
        </div>

        {/* ── Filter Row ─────────────────────────── */}
        <div className="dash-filters-premium">
          <div className="filter-header">
            <div className="filter-title-group">
              <h2>Your Trips</h2>
              <div className="trip-count-chip">{filtered.length}</div>
            </div>
          </div>

          <div className="filter-segments">
            {['all', 'planning', 'confirmed', 'ongoing', 'completed'].map((f) => (
              <button
                key={f}
                className={`segment-item ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                <span className="segment-label">{f}</span>
                {filter === f && <div className="segment-indicator" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ───────────────────────────────── */}
        {loading ? (
          <div className="dash-loading">
            <div className="dash-loading-ring">
              <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
            <p>Loading your adventures…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">🌍</div>
            <h3>{filter === 'all' ? 'No trips yet' : `No ${filter} trips`}</h3>
            <p>
              {filter === 'all'
                ? 'Start planning your first group adventure!'
                : `You don't have any ${filter} trips.`}
            </p>
            {filter === 'all' && (
              <Link to="/create-trip" className="btn btn-primary">
                Plan Your First Trip 🚀
              </Link>
            )}
          </div>
        ) : (
          <div className="trips-grid" ref={gridRef}>
            {filtered.map((trip, i) => (
              <TripCard key={trip._id} trip={trip} index={i} />
            ))}
            <div
              className="trip-add-card card"
              onClick={() => navigate('/create-trip')}
            >
              <div className="trip-add-inner">
                <div className="trip-add-ring">
                  <div className="trip-add-icon">+</div>
                </div>
                <p>Plan a New Trip</p>
                <span className="trip-add-hint">Click to get started</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;