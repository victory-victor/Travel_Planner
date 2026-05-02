import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { inviteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './JoinTrip.css';

const JoinTrip = () => {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    loadInvite();
  }, [token]);

  useEffect(() => {
    if (!loading && cardRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(cardRef.current,
        { y: 60, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'expo.out' }
      );

      tl.from(".join-animate", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out'
      }, "-=0.5");
    }
  }, [loading]);

  const loadInvite = async () => {
    try {
      const { data } = await inviteAPI.get(token);
      setInvitation(data.invitation);
    } catch (err) {
      setError(err.response?.data?.message || 'Invitation not found or expired');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('wm_pending_invite', token);
      navigate('/signup');
      return;
    }
    setJoining(true);
    try {
      const { data } = await inviteAPI.accept(token);
      toast.success("Welcome aboard! 🎉");
      navigate(`/trips/${data.tripId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join trip');
    } finally {
      setJoining(false);
    }
  };

  const trip = invitation?.trip;
  const days = trip
    ? Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="join-page">
      <div className="join-ambient-bg">
        <div className="join-blob blob-1" />
        <div className="join-blob blob-2" />
        <div className="join-grid" />
      </div>

      <div className="container">
        <div className="join-container-inner">
          {loading ? (
            <div className="join-loading-state">
              <div className="loading-traveler">✈️</div>
              <p>Fetching your adventure details...</p>
            </div>
          ) : error ? (
            <div className="join-error-card card" ref={cardRef}>
              <div className="error-visual">⚠️</div>
              <h2>Oops! Something went wrong</h2>
              <p>{error}</p>
              <Link to="/" className="btn btn-primary">Return to WanderMind</Link>
            </div>
          ) : (
            <div className="join-main-card card" ref={cardRef}>
              {/* Card Decoration */}
              <div className="card-accent-line" />
              
              <div className="join-content" ref={contentRef}>
                <header className="join-header join-animate">
                  <span className="hub-badge">🌍 Invitation Hub</span>
                  <div className="inviter-meta">
                    <div className="inviter-avatar">
                      {invitation.invitedBy?.name?.charAt(0)}
                    </div>
                    <div className="inviter-text">
                      <p><span>{invitation.invitedBy?.name}</span> invites you to</p>
                      <h3>Start Exploring Together</h3>
                    </div>
                  </div>
                </header>

                <section className="join-trip-highlight join-animate">
                  <div className="trip-banner">
                    <div className="banner-emoji">✈️</div>
                    <div className="banner-content">
                      <h2 className="trip-title">{trip.title}</h2>
                      <p className="trip-location">📍 {trip.destination?.name}</p>
                    </div>
                  </div>

                  <div className="trip-grid-specs">
                    <div className="spec-item">
                      <span className="spec-icon">📅</span>
                      <div className="spec-info">
                        <label>Timeline</label>
                        <p>{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d')}</p>
                      </div>
                    </div>
                    <div className="spec-item">
                      <span className="spec-icon">⏳</span>
                      <div className="spec-info">
                        <label>Duration</label>
                        <p>{days} Days</p>
                      </div>
                    </div>
                    <div className="spec-item">
                      <span className="spec-icon">👥</span>
                      <div className="spec-info">
                        <label>Explorers</label>
                        <p>{trip.members?.length} Traveling</p>
                      </div>
                    </div>
                  </div>

                  {trip.aiGenerated && (
                    <div className="ai-notice join-animate">
                      <div className="ai-glow-icon">🤖</div>
                      <p><strong>AI-Optimized Itinerary:</strong> This trip includes smart scheduling for a seamless experience.</p>
                    </div>
                  )}
                </section>

                <footer className="join-footer join-animate">
                  <button
                    className={`join-btn-premium ${joining ? 'loading' : ''}`}
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? (
                      <span className="join-spinner"></span>
                    ) : (
                      <span className="btn-text">
                        {isAuthenticated ? 'Accept Invitation & Join' : 'Sign Up to Join Trip'}
                      </span>
                    )}
                    <div className="btn-shine" />
                  </button>

                  <div className="footer-meta">
                    {!isAuthenticated && (
                      <p className="login-hint">
                        Already a member? <Link to="/login">Sign in</Link>
                      </p>
                    )}
                    <p className="security-tag">
                      <span className="lock-icon">🔒</span> Secure Invitation • {invitation.expiresAt ? `Expires ${format(new Date(invitation.expiresAt), 'MMM d')}` : 'Limited Time'}
                    </p>
                  </div>
                </footer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinTrip;