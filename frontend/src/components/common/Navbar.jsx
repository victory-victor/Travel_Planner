import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const overlayRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3 });
      gsap.to(mobileMenuRef.current, { x: 0, duration: 0.4, ease: 'power3.out' });
      gsap.fromTo('.mobile-link',
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
      );
    } else {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3 });
      gsap.to(mobileMenuRef.current, { x: '100%', duration: 0.3, ease: 'power2.in' });
    }
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleDeleteClick = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount(); // from context

      toast.success('Account deleted. Goodbye! 👋');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <nav ref={navRef} className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon">
              <img src="https://cdn-icons-png.freepik.com/512/201/201623.png" alt="WanderMind Logo" />
            </span>
            <span className="navbar-logo-text">WanderMind</span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/create-trip" className={`nav-link ${location.pathname === '/create-trip' ? 'active' : ''}`}>Create Trip</Link>
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <div className="navbar-user-wrapper">
                <div className="navbar-user-circle" onClick={() => setDropOpen(!dropOpen)}>
                  <div className="avatar avatar-md navbar-avatar">{getInitials(user?.name)}</div>
                </div>
                {dropOpen && (
                  <div className="navbar-dropdown">
                    <div className="dropdown-header">
                      <div className="avatar avatar-md" style={{ background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{getInitials(user?.name)}</div>
                      <div>
                        <p className="dropdown-name">{user?.name}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                      Dashboard
                    </Link>
                    <Link to="/create-trip" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                      New Trip
                    </Link>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Sign Out
                    </button>
                    <hr className="dropdown-divider" />
                    <button
                      className="dropdown-item dropdown-delete-account"
                      onClick={() => { setDropOpen(false); setShowDeleteModal(true); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            {/* Hamburger */}
            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className="mobile-overlay" ref={overlayRef} onClick={() => setMenuOpen(false)} />

      {/* Mobile Menu Drawer */}
      <div className="mobile-menu" ref={mobileMenuRef}>
        <div className="mobile-menu-inner">
          <Link to="/" className="mobile-link">Home</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="mobile-link">Dashboard</Link>
              <Link to="/create-trip" className="mobile-link">Create Trip</Link>
              <div className="mobile-user-profile">
                <div className="navbar-user-circle">
                  <div className="avatar avatar-md">{getInitials(user?.name)}</div>
                </div>
                <div className="mobile-user-details">
                  <p className="mobile-user-name">{user?.name}</p>
                  <p className="mobile-user-email">{user?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="mobile-link mobile-logout">Sign Out</button>
              <button
                onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }}
                className="mobile-link mobile-delete-account"
              >
                🗑️ Delete Account
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link">Login</Link>
              <Link to="/signup" className="mobile-link mobile-btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
        >
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h3>Delete Account?</h3>
            <p>
              This will permanently delete your account, all your trips, and all associated data.
              <strong> This cannot be undone.</strong>
            </p>
            <p className="delete-modal-confirm-label">
              Type <strong>DELETE</strong> to confirm
            </p>
            <input
              type="text"
              className="delete-modal-input"
              placeholder="Type DELETE here"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              autoFocus
            />
            <div className="delete-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                Cancel
              </button>
              <button
                className="btn delete-modal-confirm-btn"
                onClick={handleDeleteClick}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              >
                {deleteLoading
                  ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Deleting…</>
                  : '🗑️ Delete Forever'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
