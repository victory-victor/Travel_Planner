import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import CustomCursor from './components/common/CustomCursor';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import TripDetails from './pages/TripDetails';
import JoinTrip from './pages/JoinTrip';
import Analytics from './pages/Analytics';
import Loader from './components/common/Loader';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Lenis from 'lenis';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isJoinPage = location.pathname.startsWith('/join');

  return (
    <>
      <ScrollToTop />
      <CustomCursor />
      {/* <Navbar /> */}
    {!isJoinPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:token" element={<JoinTrip />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create-trip" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
        <Route path="/trips/:id" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/join/:token" element={<JoinTrip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A38',
              color: '#E8E8FF',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#43E97B', secondary: '#0A0A1A' } },
            error: { iconTheme: { primary: '#FF6584', secondary: '#0A0A1A' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
