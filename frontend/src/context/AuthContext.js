import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/users/me');
        setUser(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Error loading user:', err.response?.data?.message || err.message);
        setError(err.response?.data?.message || 'Failed to authenticate');
        // Clear invalid token
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/users/login', { email, password });
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.post('/api/users/register', userData);
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.put('/api/users/updatedetails', userData);
      setUser(res.data.data);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      const res = await axios.put('/api/users/updatepassword', passwordData);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    updatePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};