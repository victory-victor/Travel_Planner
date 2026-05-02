import './Loader.css';

const Loader = () => (
  <div className="loader-overlay">
    <div className="loader-content">
      <div className="loader-logo">🌍</div>
      <div className="loader-bars">
        {[0,1,2,3,4].map(i => <div key={i} className="loader-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
      </div>
      <p className="loader-text">WanderMind</p>
    </div>
  </div>
);

export default Loader;
