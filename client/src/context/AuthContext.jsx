import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session from server HTTP-only cookie
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const res = await api.post('/auth/login', { email: normalizedEmail, password });
    if (res.success && res.data?.user) {
      if (res.token) {
        localStorage.setItem('messmate_token', res.token);
      }
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  // Student registration handler
  const register = async (userData) => {
    const payload = {
      ...userData,
      email: (userData.email || '').trim().toLowerCase()
    };
    const res = await api.post('/auth/register', payload);
    if (res.success && res.data?.user) {
      if (res.token) {
        localStorage.setItem('messmate_token', res.token);
      }
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('messmate_token');
      setUser(null);
    }
  };

  // Profile update handler
  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.success && res.data?.user) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
      return res.data.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

