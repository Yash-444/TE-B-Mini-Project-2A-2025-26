// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // login expects an object: authAPI.login({ email, password })
  const login = async (email, password) => {
    // Note: I'm not adding validation to login here, 
    // as login failure is usually a 401 (credentials mismatch)
    // rather than a 422 (data format error).
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', userData.id);           // or userData.user_id depending on backend
      localStorage.setItem('email', userData.email || '');
      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // register expects an object: authAPI.register({ firstname, lastname, email, password })
  const register = async (firstname, lastname, email, password) => {
    setLoading(true);

    // ===============================================
    // CLIENT-SIDE VALIDATION FOR 422 PREVENTION
    // ===============================================
    if (!firstname || !lastname || !email || !password) {
      toast.error('All fields (First Name, Last Name, Email, Password) are required.');
      setLoading(false);
      return { success: false, error: 'Missing required fields' };
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      setLoading(false);
      return { success: false, error: 'Password too short' };
    }
    // You could add basic email regex check here too if desired, e.g.:
    // if (!/\S+@\S+\.\S+/.test(email)) { ... }


    try {
      const response = await authAPI.register({
        firstname,
        lastname,
        email,
        password,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', userData.id);           // or userData.user_id depending on backend
      localStorage.setItem('email', userData.email || '');

      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Registration successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration error:', error);
      // The backend will often return detailed validation messages in error.response.data.error
      // or similar keys, which are then displayed by toast.error(message);
      const message = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};