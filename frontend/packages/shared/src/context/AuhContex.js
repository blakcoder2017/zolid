import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '@zolid/shared/utils/apiClient';

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. INITIAL AUTH CHECK (Runs Once on App Load) ---
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');

      if (token && userId && userRole) {
        // Optional: Verify token with backend here if needed
        setUser({
          id: userId,
          role: userRole,
          token,
        });
      }
      setLoading(false); // Done checking
    };

    initAuth();
  }, []);

  // --- 2. LOGIN ACTION ---
  const login = async (phone, password, role = 'artisan') => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = role === 'artisan' 
        ? '/identity/artisan/login' 
        : '/identity/client/login';

      const response = await apiClient.post(endpoint, {
        phone_primary: phone,
        password,
      });

      const { token, artisan_id, client_id, can_see_gigs } = response.data;
      const userId = artisan_id || client_id;

      // Update LocalStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', role);

      // Update State
      setUser({
        id: userId,
        role,
        token,
        can_see_gigs,
      });

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // --- 3. LOGOUT ACTION ---
  const logout = (navigateCallback) => {
    localStorage.clear();
    setUser(null);
    if (navigateCallback) navigateCallback('/login');
  };

  // The value passed to all components
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};