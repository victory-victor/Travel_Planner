import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tripAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, AreaChart, Area, ComposedChart, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { format } from 'date-fns';
import './Analytics.css';

const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

const Analytics = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (!loading && trips.length > 0 && pageRef.current) {
      gsap.fromTo(pageRef.current.querySelectorAll('.card'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }

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
  }, [loading, trips.length]);

  const loadTrips = async () => {
    try {
      const { data } = await tripAPI.getAll();
      setTrips(data.trips);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="analytics-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
    </div>
  );

  if (trips.length === 0) return (
    <div className="analytics-page">
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h1>No Data Yet</h1>
        <p>Create some trips to see your advanced analytics!</p>
        <Link to="/create-trip" className="btn btn-primary" style={{ marginTop: '20px' }}>Plan a Trip</Link>
      </div>
    </div>
  );

  const getPaidById = (paidBy) => {
    if (!paidBy) return '';
    if (typeof paidBy === 'string') return paidBy;
    return paidBy._id || paidBy.id || '';
  };

  const trendMap = {};
  trips.forEach(t => {
    const month = format(new Date(t.startDate), 'MMM yyyy');
    trendMap[month] = (trendMap[month] || 0) + 1;
  });
  const trendData = Object.entries(trendMap).map(([month, count]) => ({ month, trips: count })).slice(-12);

  const statusMap = { planning: 0, confirmed: 0, ongoing: 0, completed: 0, cancelled: 0 };
  trips.forEach(t => {
    if (statusMap[t.status] !== undefined) statusMap[t.status]++;
  });
  const statusData = Object.entries(statusMap).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count
  }));

  const expensesMap = {};
  trips.forEach(t => {
    if (t.expenses && t.expenses.length > 0) {
      t.expenses.forEach(exp => {
        if (getPaidById(exp.paidBy) !== user?._id) return;

        let cat = 'Other';
        const d = exp.description.toLowerCase();
        if (d.includes('food') || d.includes('dinner') || d.includes('meal')) cat = 'Food';
        else if (d.includes('flight') || d.includes('taxi') || d.includes('bus') || d.includes('train')) cat = 'Transport';
        else if (d.includes('hotel') || d.includes('stay') || d.includes('airbnb')) cat = 'Accommodation';
        else if (d.includes('tour') || d.includes('ticket') || d.includes('museum')) cat = 'Activities';

        expensesMap[cat] = (expensesMap[cat] || 0) + Number(exp.amount || 0);
      });
    }
  });
  const expensesData = Object.entries(expensesMap).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Safety check: Ensure date exists and is a valid number/string
      const isValidDate = data.date && !isNaN(new Date(data.date).getTime());

      return (
        <div className="custom-tooltip">
          <p className="label" style={{ marginBottom: '8px', color: 'var(--primary)' }}>
            {data.name || 'Trip Detail'}
          </p>

          {isValidDate ? (
            <p className="desc" style={{ fontSize: '12px' }}>
              Date: {format(new Date(data.date), 'MMM dd, yyyy')}
            </p>
          ) : (
            <p className="desc" style={{ fontSize: '12px' }}>Date: N/A</p>
          )}

          {/* Check if amount exists before calling toLocaleString */}
          <p className="desc" style={{ fontSize: '12px', marginTop: '4px' }}>
            Cost: ₹{data.amount ? data.amount.toLocaleString() : '0'}
          </p>

          {data.explorers && (
            <p className="desc" style={{ fontSize: '12px', opacity: 0.8 }}>
              Group Size: {data.explorers}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const bubbleData = trips
    .filter(t => t.startDate) // Only include trips that actually have a date
    .map(t => ({
      name: t.title || 'Untitled Trip',
      // Ensure this results in a valid number
      date: new Date(t.startDate).getTime(),
      amount: t.expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0,
      explorers: t.members?.length || 1
    }));

  return (
    <div className="analytics-page page-enter" ref={pageRef}>
      {/* Background (matches Home Hero) */}
      <div className="analytics-bg">
        <div className="ana-orb ana-orb-1" />
        <div className="ana-orb ana-orb-2" />
        <div className="ana-orb ana-orb-3" />
        <div className="ana-grid-overlay" />
      </div>

      {/* Particles layer */}
      <div className="analytics-particles" ref={particlesRef}>
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
        <div className="analytics-header">
          <h1>Advanced Analytics</h1>
          <p>Gain insights into your travel patterns and expenditures.</p>
        </div>
        <div className="kpi-row">
          <div className="kpi-card">
            <span className="kpi-label">Total Trips</span>
            <span className="kpi-value">{trips.length}</span>
            <span className="kpi-trend up">+12%</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Expenses</span>
            <span className="kpi-value">₹{expensesData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}</span>
            <span className="kpi-trend">Live</span>
          </div>
        </div>
        <div className="analytics-grid">
          <div className="card analytics-card trend-card">
            <h3>Travel Trends (Last 12 Months)</h3>
            <p>Number of trips planned over time</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }} // Negative left margin pulls Y-axis in
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} // Smaller font for mobile
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card analytics-card">
            <h3>Status Overview</h3>
            <p>Activity distribution across trip phases</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statusData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis
                    dataKey="status"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 'auto']}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Trips"
                    dataKey="count"
                    stroke="var(--secondary)"
                    fill="var(--secondary)"
                    fillOpacity={0.5}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card analytics-card">
            <h3>Trips by Status</h3>
            <p>Overview of all your trip states</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card analytics-card">
            <h3>My Expenditure Breakdown</h3>
            <p>Where your own travel money goes across all trips</p>
            <div className="chart-wrapper">
              {expensesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={window.innerWidth < 480 ? 60 : 80}
                      outerRadius={window.innerWidth < 480 ? 90 : 110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }} itemStyle={{ color: 'var(--text-primary)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart">No expenses recorded by you yet.</div>
              )}
            </div>
          </div>
          <div className="card analytics-card">
            <h3>Trip Intensity Matrix</h3>
            <p>Cost vs. Date (Size = Group Size)</p>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="date"
                    name="Date"
                    domain={['auto', 'auto']}
                    // This function converts the number 170086969 into a readable date
                    tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM dd')}
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="amount"
                    name="Expense"
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                  />
                  <ZAxis type="number" dataKey="explorers" range={[50, 400]} name="Travelers" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                  <Scatter
                    name="Trips"
                    data={bubbleData}
                    fill="var(--primary)"
                    fillOpacity={0.6}
                    stroke="var(--primary)"
                    strokeWidth={2}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
