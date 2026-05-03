import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('wm_token'));

  const loadUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem('wm_token');
      localStorage.removeItem('wm_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('wm_token', data.token);
    localStorage.setItem('wm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem('wm_token', data.token);
    localStorage.setItem('wm_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('wm_token');
    localStorage.removeItem('wm_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  const deleteAccount = async () => {
    const { data } = await authAPI.deleteAccount();

    // Always logout after delete
    logout();

    return data;
  };

  const forgotPassword = async (email) => {
    const { data } = await authAPI.forgotPassword(email);
    return data;
  };

  const verifyOTP = async (email, otp) => {
    const { data } = await authAPI.verifyOTP(email, otp);
    return data;
  };

  const resetPassword = async (email, newPassword) => {
    const { data } = await authAPI.resetPassword(email, newPassword);

    // Auto-login after successful reset
    if (data.token) {
      localStorage.setItem('wm_token', data.token);
      localStorage.setItem('wm_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, deleteAccount, updateUser, forgotPassword, verifyOTP, resetPassword, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
