import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripAPI, aiAPI } from '../services/api';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import './CreateTrip.css';

const STEPS = ['Basics', 'Destination', 'Partners', 'Budget & Prefs'];
const TRAVEL_STYLES = ['Adventure', 'Luxury', 'Budget', 'Cultural', 'Beach', 'Mountain', 'City', 'Nature'];
const INTERESTS = ['Hiking', 'Food & Cuisine', 'History', 'Nightlife', 'Art & Museums', 'Shopping', 'Beaches', 'Photography', 'Wildlife', 'Architecture'];
const ACCOMMODATION = ['Budget Hostel', 'Mid-range Hotel', 'Luxury Resort', 'Airbnb/Vacation Rental'];

const POPULAR_DESTINATIONS = [
  { name: 'Paris', country: 'France', emoji: '🗼' },
  { name: 'Bali', country: 'Indonesia', emoji: '🌴' },
  { name: 'Tokyo', country: 'Japan', emoji: '⛩️' },
  { name: 'New York', country: 'USA', emoji: '🗽' },
  { name: 'Santorini', country: 'Greece', emoji: '🏛️' },
  { name: 'Dubai', country: 'UAE', emoji: '🌆' },
  { name: 'Maldives', country: 'Maldives', emoji: '🌊' },
  { name: 'Barcelona', country: 'Spain', emoji: '⛪' },
];

const CreateTrip = () => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [trip, setTrip] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  const [form, setForm] = useState({
    title: '', description: '',
    startDate: '', endDate: '',
    destination: { name: '', country: '' },
    budget: { total: 0, currency: 'INR', perPerson: 0 },
    preferences: { travelStyle: [], accommodation: 'mid-range', interests: [], dietaryRestrictions: [] },
    memberCount: 2,
  });

  const wrapperRef = useRef(null);
  const particlesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(wrapperRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });

    // Particle animation (matching Home/Dashboard)
    if (particlesRef.current) {
      const ctx = gsap.context(() => {
        particlesRef.current.querySelectorAll('.particle').forEach((p) => {
          gsap.to(p, {
            y: `${(Math.random() - 0.5) * 100}px`,
            x: `${(Math.random() - 0.5) * 100}px`,
            opacity: Math.random() * 0.4 + 0.1,
            duration: 5 + Math.random() * 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 5,
          });
        });
      }, particlesRef);
      return () => ctx.revert();
    }
  }, []);

  const animateStep = () => {
    gsap.fromTo('.step-form', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
  };

  const next = () => { animateStep(); setStep(s => s + 1); };
  const prev = () => { animateStep(); setStep(s => s - 1); };

  const toggleArr = (key, val) => {
    setForm(f => ({
      ...f,
      preferences: {
        ...f.preferences,
        [key]: f.preferences[key].includes(val)
          ? f.preferences[key].filter(x => x !== val)
          : [...f.preferences[key], val]
      }
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return toast.error('Trip name is required');
      if (!form.startDate) return toast.error('Start date required');
      if (!form.endDate) return toast.error('End date required');
      if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error('End date must be after start date');
    }
    if (step === 1 && !form.destination.name.trim()) return toast.error('Please select a destination');
    return true;
  };

  const handleNext = () => { if (validateStep() === true) next(); };

  const handleCreateTrip = async () => {
    setSaving(true);
    try {
      const { data } = await tripAPI.create({ 
        ...form, 
        inviteEmails: inviteEmails.filter(Boolean)
      });
      setTrip(data.trip);
      toast.success('Trip created! 🎉');
      navigate(`/trips/${data.trip._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trip');
    } finally { setSaving(false); }
  };

  const handleGenerateAI = async () => {
    if (days > 5) {
      return toast.error('AI Itinerary works only for trips under 5 days');
    }
    setGenerating(true);
    try {
      const payload = {
        destination: `${form.destination.name}, ${form.destination.country}`,
        startDate: form.startDate, endDate: form.endDate,
        budget: form.budget, preferences: form.preferences,
        memberCount: form.memberCount,
      };
      const { data } = await aiAPI.generateItinerary(payload);
      setAiResult(data.data);
      if (trip) {
        await tripAPI.saveItinerary(trip._id, data.data.itinerary);
      }
      toast.success('AI itinerary generated! 🤖');
    } catch (err) {
      toast.error('AI generation failed. Check your API key.');
    } finally { setGenerating(false); }
  };

  const days = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)))
    : 0;

  const addInviteEmail = (email) => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    
    // Check limit (memberCount includes the creator, so limit is memberCount - 1)
    if (inviteEmails.filter(Boolean).length >= form.memberCount - 1) {
      toast.error(`You selected ${form.memberCount} travelers. You can only invite ${form.memberCount - 1} partner${form.memberCount - 1 !== 1 ? 's' : ''}.`);
      return;
    }
    
    if (inviteEmails.includes(cleanEmail)) {
      toast.error('This email is already added');
      return;
    }
    
    setInviteEmails(prev => [...prev.filter(Boolean), cleanEmail]);
    setInviteEmail('');
  };

  return (
    <div className="create-trip-page page-enter">
      {/* Background (matches Home Hero) */}
      <div className="ct-bg">
        <div className="ct-orb ct-orb-1" />
        <div className="ct-orb ct-orb-2" />
        <div className="ct-orb ct-orb-3" />
        <div className="ct-grid-overlay" />
      </div>

      {/* Particles layer */}
      <div className="ct-particles" ref={particlesRef}>
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
        <div className="ct-wrapper" ref={wrapperRef}>
          {/* Header */}
          <div className="ct-header">
            <h1>Plan a New Trip <span className="gradient-text">✈️</span></h1>
            <p>Let's create your perfect group adventure step by step</p>
          </div>

          {/* Progress Steps */}
          <div className="ct-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`ct-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="ct-step-circle">
                  {i < step ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <span className="ct-step-label">{s}</span>
                {i < STEPS.length - 1 && <div className={`ct-step-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Form Panel */}
          <div className="ct-panel card step-form">

            {/* STEP 0 — Basics */}
            {step === 0 && (
              <div className="step-content">
                <div className="step-title-row">
                  <div className="step-icon">📝</div>
                  <div><h2>Trip Basics</h2><p>What's your trip all about?</p></div>
                </div>
                <div className="ct-form-grid">
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Trip Name *</label>
                    <input id="trip-title" type="text" className="form-input" placeholder="Summer in Santorini 🏛️"
                      value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={3} placeholder="Tell your travel buddies what this trip is about..."
                      value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input id="trip-start" type="date" className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                      value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input id="trip-end" type="date" className="form-input"
                      min={form.startDate || new Date().toISOString().split('T')[0]}
                      value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number of Travelers</label>
                    <div className="counter-input">
                      <button type="button" onClick={() => setForm(f => ({ ...f, memberCount: Math.max(1, f.memberCount - 1) }))}>−</button>
                      <span>{form.memberCount}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, memberCount: f.memberCount + 1 }))}>+</button>
                    </div>
                  </div>
                  {days > 0 && (
                    <div className="trip-duration-badge">
                      <span>🗓️</span>
                      <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                      <span>planned</span>
                    </div>
                  )}
                </div>
                <div className="ct-actions">
                  <button className="btn btn-primary" onClick={handleNext}>Next: Destination →</button>
                </div>
              </div>
            )}

            {/* STEP 1 — Destination */}
            {step === 1 && (
              <div className="step-content">
                <div className="step-title-row">
                  <div className="step-icon">📍</div>
                  <div><h2>Choose Destination</h2><p>Where are you headed?</p></div>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination *</label>
                  <div className="dest-input-row">
                    <input id="trip-dest" type="text" className="form-input" placeholder="City or Country..."
                      value={form.destination.name}
                      onChange={e => setForm({ ...form, destination: { ...form.destination, name: e.target.value } })} />
                    <input type="text" className="form-input" placeholder="Country"
                      value={form.destination.country}
                      onChange={e => setForm({ ...form, destination: { ...form.destination, country: e.target.value } })} />
                  </div>
                </div>

                <div className="popular-dest-grid">
                  <p className="form-label">Popular Destinations</p>
                  {POPULAR_DESTINATIONS.map(d => (
                    <button key={d.name} type="button"
                      className={`dest-chip ${form.destination.name === d.name ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, destination: { name: d.name, country: d.country } })}>
                      <span>{d.emoji}</span>
                      <div><strong>{d.name}</strong><span>{d.country}</span></div>
                    </button>
                  ))}
                </div>

                <div className="ct-actions">
                  <button className="btn btn-secondary" onClick={prev}>← Back</button>
                  <button className="btn btn-primary" onClick={handleNext}>Next: Partners →</button>
                </div>
              </div>
            )}

            {/* STEP 2 — Partners */}
            {step === 2 && (
              <div className="step-content">
                <div className="step-title-row">
                  <div className="step-icon">👥</div>
                  <div><h2>Invite Travel Partners</h2><p>Add emails — they'll get a beautiful invite</p></div>
                </div>
                <div className="invite-section">
                  <div className="invite-input-row">
                    <input type="email" className="form-input" placeholder="friend@email.com"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInviteEmail(inviteEmail)} />
                    <button type="button" className="btn btn-primary" onClick={() => addInviteEmail(inviteEmail)}>Add Email</button>
                  </div>

                  <p className="invite-hint">Partners will be notified when the trip is created.</p>


                  {inviteEmails.length > 0 && (
                    <div className="invite-list">
                      {inviteEmails.map((email, i) => (
                        <div key={`e-${i}`} className="invite-chip">
                          <span>✉️</span>
                          <span>{email}</span>
                          <button onClick={() => setInviteEmails(prev => prev.filter((_, j) => j !== i))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="invite-info card">
                    {/* <div className="invite-info-icon">📧</div> */}
                    <div>
                      <strong>Signup required for guests</strong>
                      <p>Invited friends will receive a beautiful email with a unique link to view and join your trip — user account needed!</p>
                    </div>
                  </div>
                </div>

                <div className="ct-actions">
                  <button className="btn btn-secondary" onClick={prev}>← Back</button>
                  <button className="btn btn-primary" onClick={handleNext}>Next: Budget →</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Budget & Prefs */}
            {step === 3 && (
              <div className="step-content">
                <div className="step-title-row">
                  <div className="step-icon">💰</div>
                  <div><h2>Budget & Preferences</h2><p>Help AI personalize your itinerary</p></div>
                </div>
                <div className="ct-form-grid">
                  <div className="form-group">
                    <label className="form-label">Total Budget (INR)</label>
                    <input type="number" className="form-input" placeholder="e.g. 50000"
                      value={form.budget.total || ''} onChange={e => setForm(f => ({ ...f, budget: { ...f.budget, total: Number(e.target.value), perPerson: Math.round(Number(e.target.value) / f.memberCount) } }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Per Person (auto)</label>
                    <input type="number" className="form-input" readOnly
                      value={form.budget.perPerson || ''} style={{ opacity: 0.6 }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Accommodation Type</label>
                  <div className="pref-chips">
                    {ACCOMMODATION.map(a => {
                      const val = a.toLowerCase().replace(/[^a-z]/g, '-').replace(/-+/g, '-');
                      const mapped = { 'budget-hostel': 'budget', 'mid-range-hotel': 'mid-range', 'luxury-resort': 'luxury', 'airbnbvacation-rental': 'airbnb' }[val] || 'mid-range';
                      return (
                        <button key={a} type="button"
                          className={`pref-chip ${form.preferences.accommodation === mapped ? 'active' : ''}`}
                          onClick={() => setForm(f => ({ ...f, preferences: { ...f.preferences, accommodation: mapped } }))}>
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Travel Style</label>
                  <div className="pref-chips">
                    {TRAVEL_STYLES.map(s => (
                      <button key={s} type="button"
                        className={`pref-chip ${form.preferences.travelStyle.includes(s.toLowerCase()) ? 'active' : ''}`}
                        onClick={() => toggleArr('travelStyle', s.toLowerCase())}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Interests</label>
                  <div className="pref-chips">
                    {INTERESTS.map(i => (
                      <button key={i} type="button"
                        className={`pref-chip ${form.preferences.interests.includes(i) ? 'active' : ''}`}
                        onClick={() => toggleArr('interests', i)}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ct-actions">
                  <button className="btn btn-secondary" onClick={prev}>← Back</button>
                  <button id="create-trip-btn" className="btn btn-primary" onClick={handleCreateTrip} disabled={saving}>
                    {saving ? <><div className="spinner" /> Creating...</> : '🚀 Create & View Dashboard'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTrip;
