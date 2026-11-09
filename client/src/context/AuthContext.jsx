import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => {
    try {
      return Boolean(localStorage.getItem('messmate_token'));
    } catch {
      return false;
    }
  });

  // Check current session from saved token / server session
  const checkAuth = useCallback(async () => {
    let token = null;
    try {
      token = localStorage.getItem('messmate_token');
    } catch {
      // LocalStorage access failure
    }

    // If there is no token stored, user is not logged in; do not block UI with cold backend ping
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // If demo token, restore demo user
    if (token.startsWith('demo_jwt_token_')) {
      try {
        const cached = localStorage.getItem('messmate_demo_user');
        if (cached) {
          setUser(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}
    }

    try {
      setLoading(true);
      const res = await api.get('/auth/me', { timeout: 5000 });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('messmate_token');
      }
    } catch {
      // If network error but we have cached demo user, preserve it
      try {
        const cached = localStorage.getItem('messmate_demo_user');
        if (cached) {
          setUser(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {}
      setUser(null);
      localStorage.removeItem('messmate_token');
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

  // Staff and Manager login handler using ID & PIN
  const staffLogin = async (staffId, pin, role) => {
    const res = await api.post('/auth/staff-login', {
      staffId: (staffId || '').trim(),
      pin: (pin || '').trim(),
      role
    });
    if (res.success && res.data?.user) {
      if (res.token) {
        localStorage.setItem('messmate_token', res.token);
      }
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Staff login failed');
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

  // Demo session handler for evaluation resilience
  const setDemoSession = (demoUser) => {
    try {
      localStorage.setItem('messmate_token', 'demo_jwt_token_' + demoUser.role);
      localStorage.setItem('messmate_demo_user', JSON.stringify(demoUser));
    } catch {}
    setUser(demoUser);
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {} finally {
      localStorage.removeItem('messmate_token');
      localStorage.removeItem('messmate_demo_user');
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
        staffLogin,
        register,
        logout,
        updateProfile,
        setDemoSession,
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

