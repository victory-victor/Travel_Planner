import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tripAPI, inviteAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plane, Car, Bike, Bus, Train, Footprints, Ticket, ExternalLink } from 'lucide-react';
import './TripDetails.css';

gsap.registerPlugin(ScrollTrigger);

const STATUS_OPTS = ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'];
const COLORS = ['#6C63FF', '#FF6584', '#43E97B', '#FAAD14', '#1890FF', '#722ED1', '#EB2F96', '#52C41A'];

const STATUS_CONFIG = {
  planning: { color: 'var(--primary)', bg: 'rgba(108,99,255,0.12)', label: '📋 Planning' },
  confirmed: { color: 'var(--accent-green)', bg: 'rgba(67,233,123,0.12)', label: '✅ Confirmed' },
  ongoing: { color: 'var(--accent-orange)', bg: 'rgba(250,130,49,0.12)', label: '✈️ Ongoing' },
  completed: { color: 'var(--text-muted)', bg: 'rgba(90,90,122,0.12)', label: '🏁 Completed' },
  cancelled: { color: '#FF4757', bg: 'rgba(255,71,87,0.12)', label: '❌ Cancelled' },
};

const TRANSPORT_OPTIONS = [
  { type: 'Flight', icon: Plane, fallbackTime: 'Check live routes', fallbackCost: 'Check fares' },
  { type: 'Car', icon: Car, fallbackTime: 'Route dependent', fallbackCost: 'Fuel/tolls' },
  { type: 'Bike', icon: Bike, fallbackTime: 'Route dependent', fallbackCost: 'Fuel varies' },
  { type: 'Bus', icon: Bus, fallbackTime: 'Check operators', fallbackCost: 'Check fares' },
  { type: 'Train', icon: Train, fallbackTime: 'Check schedules', fallbackCost: 'Check fares' },
  { type: 'Walk', icon: Footprints, fallbackTime: 'For local routes', fallbackCost: 'Free' },
];

const BOOKABLE_TRANSPORTS = new Set(['flight', 'train', 'bus']);

const TABS = [
  { id: 'itinerary', label: 'Itinerary', icon: '🗓️' },
  { id: 'map', label: 'Travel', icon: '✈️' },
  { id: 'members', label: 'Members', icon: '👥' },
  { id: 'chat', label: 'AI Assistant', icon: '🤖' },
  { id: 'packing', label: 'Packing', icon: '🎒' },
  { id: 'budget', label: 'Budget', icon: '💰' },
];

const TripDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const headerRef = useRef(null);
  const heroGlowRef = useRef(null);
  const tabsRef = useRef(null);
  const contentRef = useRef(null);
  const chatEndRef = useRef(null);
  const particlesRef = useRef(null);

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', content: "Hi! I'm your AI travel assistant. Ask me anything about this trip." }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [packingList, setPackingList] = useState(null);
  const [packingLoading, setPackingLoading] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => { loadTrip(); }, [id]);

  useEffect(() => {
    if (!loading && headerRef.current) {
      // Staggered hero entrance
      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(headerRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
      )
        .fromTo('.td-breadcrumb',
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.5'
        )
        .fromTo('.td-hero-badge',
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.3'
        )
        .fromTo('.td-title',
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.25'
        )
        .fromTo('.td-meta-chip',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' }, '-=0.3'
        )
        .fromTo('.td-quick-actions .btn',
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }, '-=0.4'
        )
        .fromTo(tabsRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2'
        );

      // Floating particles animation
      if (particlesRef.current) {
        particlesRef.current.querySelectorAll('.td-particle').forEach((p) => {
          gsap.to(p, {
            y: `${-20 - Math.random() * 30}px`,
            x: `${(Math.random() - 0.5) * 20}px`,
            opacity: Math.random() * 0.4 + 0.1,
            duration: 3 + Math.random() * 4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 3,
          });
        });
      }
    }
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {

    // Animate tab content in
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  const loadTrip = async () => {
    try {
      const { data } = await tripAPI.getOne(id);
      setTrip(data.trip);
      setPackingList(data.trip.packingList || null);
    } catch {
      toast.error('Failed to load trip');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const tripDays = trip
    ? Math.max(differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1, 1)
    : 0;
  const isCreator = trip?.creator?._id === user?._id || trip?.creator === user?._id;
  const isAdmin = trip?.members?.some(m => (m.user?._id === user?._id || m.user === user?._id) && m.role === 'admin');
  const canInvite = isCreator || isAdmin;
  const destinationName = trip?.destination?.name || '';
  const fromCity = user?.city || '';
  const statusCfg = STATUS_CONFIG[trip?.status] || STATUS_CONFIG.planning;

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return toast.error('Enter an email address');
    setInviting(true);
    try {
      await inviteAPI.send(id, inviteEmail.trim());
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !trip) return;
    const userMsg = { role: 'user', content: chatInput };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(m => [...m, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const { data } = await aiAPI.chat(nextMessages.slice(1), {
        destination: trip.destination, startDate: trip.startDate,
        endDate: trip.endDate, budget: trip.budget,
        preferences: trip.preferences, itinerary: trip.itinerary,
      });
      setChatMessages(m => [...m, { role: 'ai', content: data.reply }]);
    } catch {
      toast.error('AI chat failed');
    } finally {
      setChatLoading(false);
    }
  };

  const generatePacking = async () => {
    if (!trip) return;
    setPackingLoading(true);
    try {
      const { data } = await aiAPI.getPackingList({
        destination: destinationName, duration: tripDays,
        activities: trip.preferences?.interests || [], season: 'variable',
      });
      const { data: updateData } = await tripAPI.savePackingList(id, data.data);
      setTrip(updateData.trip);
      setPackingList(updateData.trip.packingList);
      toast.success('Packing list saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate packing list');
    } finally {
      setPackingLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      const { data } = await tripAPI.update(id, { status });
      setTrip(data.trip);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${trip.inviteToken}`);
    toast.success('Invite link copied');
  };

  const handleWhatsAppInvite = () => {
    if (!whatsappNumber.trim()) return toast.error('Please enter a WhatsApp number');
    const link = `${window.location.origin}/join/${trip.inviteToken}`;
    const message = `Hey! I am planning a trip to ${destinationName} on WanderMind and I would love for you to join: ${link}`;
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    setWhatsappNumber('');
  };

  const handleDeleteTrip = async () => {
    try {
      await tripAPI.delete(id);
      toast.success('Trip deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete trip');
    }
  };

  const handleGenerateItinerary = async () => {
    if (!trip) return;
    if (tripDays > 5) return toast.error('AI Itinerary works only for trips under 5 days');
    setItineraryLoading(true);
    try {
      const { data: aiData } = await aiAPI.generateItinerary({
        destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate,
        budget: trip.budget, memberCount: trip.members?.length, preferences: trip.preferences,
      });
      const { data: updateData } = await tripAPI.saveItinerary(id, aiData.data);
      setTrip(updateData.trip);
      toast.success('AI itinerary generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate itinerary. Try again later.');
    } finally {
      setItineraryLoading(false);
    }
  };

  const getTransportMethods = () => {
    return TRANSPORT_OPTIONS;
  };

  const buildBookingUrl = (type) => {
    const start = trip?.startDate ? format(new Date(trip.startDate), 'yyyy-MM-dd') : '';
    const query = encodeURIComponent(`${type} tickets from ${fromCity || 'my location'} to ${destinationName} ${start}`);
    if (type.toLowerCase() === 'flight') return `https://www.google.com/travel/flights?q=${query}`;
    if (type.toLowerCase() === 'bus') return `https://www.redbus.in/search?fromCityName=${encodeURIComponent(fromCity)}&toCityName=${encodeURIComponent(destinationName)}`;
    return `https://www.google.com/search?q=${query}`;
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return toast.error('Fill all fields');
    try {
      const { data } = await tripAPI.addExpense(id, expenseForm);
      setTrip(data.trip);
      setExpenseForm({ description: '', amount: '' });
      toast.success('Expense added');
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  /* ── Loading ── */
  if (loading) return (
    <div className="td-loading-screen">
      <div className="td-loading-inner">
        <div className="td-loading-ring">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
        <p>Loading your adventure…</p>
      </div>
    </div>
  );

  if (!trip) return null;

  const totalSpent = trip.expenses?.reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0;
  const budgetPct = trip.budget?.total ? Math.min((totalSpent / trip.budget.total) * 100, 100) : 0;

  return (
    <div className="trip-details page-enter">

      {/* ── Background ── */}
      <div className="td-bg">
        <div className="td-orb td-orb-1" style={{ background: statusCfg.color }} />
        <div className="td-orb td-orb-2" />
        <div className="td-grid-overlay" />
      </div>

      {/* ── Floating particles ── */}
      <div className="td-particles" ref={particlesRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="td-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
            background: i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--secondary)' : 'var(--accent-green)',
          }} />
        ))}
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div className="td-header" ref={headerRef}>

          {/* Breadcrumb */}
          <div className="td-breadcrumb">
            <Link to="/dashboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Dashboard
            </Link>
            <span className="td-bc-sep">/</span>
            <span className="td-bc-current">{trip.title}</span>
          </div>

          {/* Hero card */}
          <div className="td-hero-card">
            {/* Card glow accent */}
            <div className="td-hero-accent" style={{ background: statusCfg.color }} />

            <div className="td-hero-inner">
              <div className="td-hero-left">
                {/* Destination orb */}
                {/* <div className="td-dest-orb">
                  <span style={{display:'inline-block'}} className="td-dest-emoji"><img style={{height:'100%', width:'100%', objectFit:'cover', borderRadius: '10px'}} src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6dW1TrMBqcakSl1OMjsdxJBAejb5UAzVngQ&s" alt="" /></span>
                </div> */}

                <div className="td-hero-text">
                  {/* Badges row */}
                  <div className="td-badges-row">
                    <div className="td-hero-badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
                      {statusCfg.label}
                    </div>
                    {trip.aiGenerated && (
                      <span className="badge badge-primary td-ai-badge">🤖 AI Planned</span>
                    )}
                    {isCreator && (
                      <select
                        className="status-select"
                        value={trip.status}
                        onChange={e => updateStatus(e.target.value)}
                      >
                        {STATUS_OPTS.map(s => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <h1 className="td-title">{trip.title}</h1>

                  {/* Meta chips */}
                  <div className="td-meta-chips">
                    <div className="td-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      {destinationName}{trip.destination?.country ? `, ${trip.destination.country}` : ''}
                    </div>
                    <div className="td-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
                    </div>
                    <div className="td-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {tripDays} day{tripDays !== 1 ? 's' : ''}
                    </div>
                    <div className="td-meta-chip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      {trip.members?.length || 0} travelers
                    </div>
                    {trip.budget?.total > 0 && (
                      <div className="td-meta-chip td-meta-chip--budget">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                        Rs {trip.budget.total.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {trip.description && (
                    <p className="td-desc">{trip.description}</p>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              {isCreator && (
                <div className="td-quick-actions">
                  <button className="btn btn-secondary btn-sm" onClick={copyInviteLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </svg>
                    Copy Invite Link
                  </button>
                  <button
                    className="btn btn-sm td-delete-btn"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                    Delete Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="td-tabs-wrap" ref={tabsRef}>
          <div className="td-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`td-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="td-tab-icon">{t.icon}</span>
                <span className="td-tab-label">{t.label}</span>
                {activeTab === t.id && <span className="td-tab-indicator" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="td-tab-content" ref={contentRef}>

          {/* ───── ITINERARY ───── */}
          {activeTab === 'itinerary' && (
            <div className="tab-panel">
              {trip.itinerary?.length > 0 ? (
                <div className="itinerary-list">
                  {trip.itinerary.map((day, di) => (
                    <div key={day.day} className="itin-day card">
                      <div className="itin-day-head">
                        <div className="itin-day-badge">Day {day.day}</div>
                        <h3>{day.title}</h3>
                        {day.date && (
                          <span className="itin-day-date">
                            {format(new Date(day.date), 'EEEE, MMM d')}
                          </span>
                        )}
                      </div>
                      <div className="itin-timeline">
                        {day.activities?.map((act, i) => (
                          <div key={i} className="timeline-item">
                            <div className="timeline-time">{act.time}</div>
                            <div className="timeline-node">
                              <div className="timeline-dot" />
                              {i < day.activities.length - 1 && <div className="timeline-line" />}
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-activity-header">
                                <h4>{act.activity}</h4>
                                {act.estimatedCost > 0 && (
                                  <span className="timeline-cost">Rs {act.estimatedCost}</span>
                                )}
                              </div>
                              {act.location && (
                                <p className="timeline-location">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                                  </svg>
                                  {act.location}
                                </p>
                              )}
                              {act.description && (
                                <p className="timeline-desc">{act.description}</p>
                              )}
                              {act.category && (
                                <span className="timeline-category">{act.category}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tab-empty">
                  <div className="tab-empty-orb">
                    <span className="tab-empty-icon">🤖</span>
                  </div>
                  <h3>No itinerary yet</h3>
                  <p>Let AI craft a detailed day-by-day plan tailored to your group</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleGenerateItinerary}
                    disabled={itineraryLoading}
                  >
                    {itineraryLoading
                      ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
                      : '✨ Generate AI Itinerary'
                    }
                  </button>
                  {tripDays > 5 && (
                    <p className="error-note">⚠️ AI Itinerary is only available for trips up to 5 days.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ───── MAP / TRAVEL ───── */}
          {activeTab === 'map' && (
            <div className="tab-panel">
              <div className="map-section-header">
                <h3>Travel Options</h3>
                <p>from <strong>{fromCity || 'your location'}</strong> to <strong>{destinationName}</strong></p>
              </div>

              <div className="map-estimates-grid">
                 {getTransportMethods().map(method => {
                    const Icon = method.icon;
                    const canBook = BOOKABLE_TRANSPORTS.has(method.type.toLowerCase());
                    return (
                      <div key={method.type} className="estimate-card card">
                        <div className="estimate-icon-wrap">
                          <Icon size={22} strokeWidth={2.2} />
                        </div>
                        <div className="estimate-type">{method.type}</div>
                        {canBook ? (
                          <button
                            className="estimate-book-btn"
                            onClick={() => window.open(buildBookingUrl(method.type), '_blank', 'noopener,noreferrer')}
                          >
                            <Ticket size={13} />
                            Book
                            <ExternalLink size={12} />
                          </button>
                        ) : (
                          <div className="estimate-note">Route preview only</div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="map-embed-wrap card">
                <div className="map-embed-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Route Map
                </div>
                <iframe
                  title="Destination Map"
                  width="100%"
                  height="380"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?saddr=${encodeURIComponent(fromCity || 'My Location')}&daddr=${encodeURIComponent(destinationName)}&output=embed`}
                />
              </div>
            </div>
          )}

          {/* ───── MEMBERS ───── */}
          {activeTab === 'members' && (
            <div className="tab-panel">
              <div className="members-layout">

                {canInvite && (
                  <div className="invite-card card">
                    <div className="invite-card-header">
                      <div className="invite-card-icon">✉️</div>
                      <div>
                        <h3>Invite Friends</h3>
                        <p>Send an invitation or share the trip link</p>
                      </div>
                    </div>

                    <div className="invite-field-group">
                      <label className="invite-label">Email Invitation</label>
                      <div className="invite-row">
                        <input
                          type="email"
                          className="form-input"
                          placeholder="friend@email.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendInvite()}
                        />
                        <button className="btn btn-primary" onClick={sendInvite} disabled={inviting}>
                          {inviting ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Send'}
                        </button>
                      </div>
                    </div>

                    <div className="invite-field-group">
                      <label className="invite-label">WhatsApp</label>
                      <div className="invite-row">
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+91 90000 00000"
                          value={whatsappNumber}
                          onChange={e => setWhatsappNumber(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleWhatsAppInvite()}
                        />
                        <button className="btn td-wa-btn" onClick={handleWhatsAppInvite}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    <div className="invite-field-group">
                      <label className="invite-label">Share Link</label>
                      <div className="invite-row">
                        <input
                          type="text"
                          className="form-input"
                          readOnly
                          value={`${window.location.origin}/join/${trip.inviteToken}`}
                        />
                        <button className="btn btn-secondary" onClick={copyInviteLink}>Copy</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="members-list-section">
                  <div className="members-list-header">
                    <h3>Members</h3>
                    <span className="members-count-badge">{trip.members?.length || 0}</span>
                  </div>

                  <div className="members-list">
                    {trip.members?.map((m, i) => (
                      <div key={i} className="member-row card">
                        <div
                          className="member-avatar"
                          style={{ background: `hsl(${i * 60 + 240}, 70%, 50%)` }}
                        >
                          {getInitials(m.user?.name)}
                        </div>
                        <div className="member-info">
                          <strong>{m.user?.name}</strong>
                          <span>{m.user?.email}</span>
                        </div>
                        <div className="member-badges">
                          {m.role === 'admin' && <span className="badge badge-primary">Admin</span>}
                          {(m.user?._id === user?._id || m.user === user?._id) && (
                            <span className="badge badge-green">You</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {trip.pendingInvites?.length > 0 && (
                    <div className="pending-section">
                      <div className="members-list-header">
                        <h4>Pending</h4>
                        <span className="members-count-badge" style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500' }}>
                          {trip.pendingInvites.length}
                        </span>
                      </div>
                      <div className="members-list">
                        {trip.pendingInvites.map((email, i) => (
                          <div key={i} className="member-row card member-row--pending">
                            <div className="member-avatar member-avatar--pending">
                              {email.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="member-info">
                              <strong>{email}</strong>
                              <span>Invitation sent</span>
                            </div>
                            <span className="pending-badge">Pending</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ───── AI CHAT ───── */}
          {activeTab === 'chat' && (
            <div className="tab-panel">
              <div className="ai-chat-section">
                <div className="ai-chat-header">
                  <div className="ai-chat-avatar">
                    <span>🤖</span>
                  </div>
                  <div>
                    <h4>AI Travel Assistant</h4>
                    <p>Ask anything about your trip</p>
                  </div>
                  <div className="ai-live-badge">
                    <span className="glow-dot" />
                    Live
                  </div>
                </div>

                <div className="chat-messages-list">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                      {msg.role === 'ai' && <span className="bubble-label">🤖 AI</span>}
                      <p>{msg.content}</p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble ai-bubble">
                      <span className="bubble-label">🤖 AI</span>
                      <div className="typing-dots"><span /><span /><span /></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-bottom">
                  <div className="chat-suggestions">
                    {['Best restaurants?', 'Local transport tips', 'What to pack?', 'Safety tips'].map(s => (
                      <button key={s} className="chat-suggest-tag" onClick={() => setChatInput(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="chat-input-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ask about this trip…"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()}
                    />
                    <button
                      className="btn btn-primary chat-send-btn"
                      onClick={sendChat}
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      {chatLoading
                        ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───── PACKING ───── */}
          {activeTab === 'packing' && (
            <div className="tab-panel">
              {!packingList ? (
                <div className="tab-empty">
                  <div className="tab-empty-orb">
                    <span className="tab-empty-icon">🎒</span>
                  </div>
                  <h3>Smart Packing List</h3>
                  <p>AI generates a custom list based on your destination, trip duration, and activities.</p>
                  <button
                    className="btn btn-primary"
                    onClick={generatePacking}
                    disabled={packingLoading}
                  >
                    {packingLoading
                      ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
                      : '✨ Generate Packing List'
                    }
                  </button>
                </div>
              ) : (
                <div className="packing-grid">
                  {packingList.categories?.map(cat => (
                    <div key={cat.name} className="packing-category card">
                      <div className="packing-cat-header">
                        <h4>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</h4>
                        <span className="packing-count">{cat.items?.length}</span>
                      </div>
                      <ul>
                        {cat.items?.map(item => (
                          <li key={item}>
                            <input type="checkbox" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───── BUDGET ───── */}
          {activeTab === 'budget' && (
            <div className="tab-panel">
              <div className="budget-section">

                {/* Overview cards */}
                <div className="budget-overview">
                  <div className="budget-stat-card card">
                    <p className="budget-label">Total Budget</p>
                    <h2 className="gradient-text">Rs {(trip.budget?.total || 0).toLocaleString()}</h2>
                  </div>
                  <div className="budget-stat-card card">
                    <p className="budget-label">Spent So Far</p>
                    <h2 style={{ color: 'var(--secondary)', margin: 0 }}>
                      Rs {totalSpent.toLocaleString()}
                    </h2>
                  </div>
                  <div className="budget-stat-card card">
                    <p className="budget-label">Remaining</p>
                    <h2 style={{ color: 'var(--accent-green)', margin: 0 }}>
                      Rs {((trip.budget?.total || 0) - totalSpent).toLocaleString()}
                    </h2>
                  </div>
                  <div className="budget-stat-card card">
                    <p className="budget-label">Currency</p>
                    <h2 style={{ margin: 0 }}>{trip.budget?.currency || 'INR'}</h2>
                  </div>
                </div>

                {/* Progress bar */}
                {trip.budget?.total > 0 && (
                  <div className="budget-progress-card card">
                    <div className="budget-progress-header">
                      <span>Budget used</span>
                      <span style={{ color: budgetPct > 80 ? 'var(--secondary)' : 'var(--accent-green)' }}>
                        {Math.round(budgetPct)}%
                      </span>
                    </div>
                    <div className="budget-progress-track">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${budgetPct}%`,
                          background: budgetPct > 80
                            ? 'linear-gradient(90deg,var(--accent-orange),var(--secondary))'
                            : 'linear-gradient(90deg,var(--primary),var(--accent-green))',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Add expense */}
                <div className="expense-tracker card">
                  <div className="expense-tracker-header">
                    <h3>Add Expense</h3>
                  </div>
                  <div className="expense-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="What did you pay for? (e.g. Dinner, Taxi)"
                      value={expenseForm.description}
                      onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Amount (Rs)"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    />
                    <button className="btn btn-primary" onClick={handleAddExpense}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      Add
                    </button>
                  </div>

                  <div className="expense-list">
                    <p className="expense-list-label">Recent Expenses</p>
                    {trip.expenses?.length > 0
                      ? [...trip.expenses].reverse().map((exp, i) => (
                        <div key={i} className="expense-item">
                          <div className="expense-icon">
                            {exp.description?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="expense-info">
                            <strong>{exp.description}</strong>
                            <span>
                              {exp.paidBy?.name || 'Group Member'} · {format(new Date(exp.date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="expense-amount">Rs {Number(exp.amount || 0).toLocaleString()}</div>
                        </div>
                      ))
                      : (
                        <p className="expense-empty">No expenses logged yet. Start tracking!</p>
                      )
                    }
                  </div>
                </div>

                {/* Pie chart */}
                {trip.expenses?.length > 0 && (
                  <div className="card payer-chart-card">
                    <h3>Expense Split by Payer</h3>
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.values(trip.expenses.reduce((acc, exp) => {
                              const name = exp.paidBy?.name || 'Unknown';
                              if (!acc[name]) acc[name] = { name, value: 0 };
                              acc[name].value += Number(exp.amount || 0);
                              return acc;
                            }, {}))}
                            cx="50%" cy="50%"
                            innerRadius={55} outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {Object.keys(trip.expenses.reduce((acc, exp) => {
                              acc[exp.paidBy?.name || 'Unknown'] = true;
                              return acc;
                            }, {})).map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                            formatter={v => `Rs ${v.toLocaleString()}`}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div className="td-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="td-modal card" onClick={e => e.stopPropagation()}>
            <div className="td-modal-icon">🗑️</div>
            <h3>Delete Trip?</h3>
            <p>
              Are you sure you want to delete <strong>{trip.title}</strong>?
              This action cannot be undone.
            </p>
            <div className="td-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn td-modal-delete-btn" onClick={handleDeleteTrip}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;
