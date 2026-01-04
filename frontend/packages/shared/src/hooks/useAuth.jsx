// import { useState, useEffect } from 'react';
// import apiClient from '../utils/apiClient';

// /**
//  * useAuth Hook
//  * Manages authentication state and provides auth methods
//  */
// export const useAuth = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Check if user is authenticated - also check on storage events for cross-tab sync
//   useEffect(() => {
//     let isMounted = true;

//     const checkAuth = () => {
//       const token = localStorage.getItem('authToken');
//       const userId = localStorage.getItem('userId');
//       const userRole = localStorage.getItem('userRole');

//       const newUser = (token && userId && userRole) ? {
//         id: userId,
//         role: userRole,
//         token,
//       } : null;

//       if (!isMounted) return;

//       // Only update state if values have changed to prevent infinite loops
//       setUser(prevUser => {
//         // Compare user objects to avoid unnecessary updates
//         if (!prevUser && !newUser) return prevUser; // Both null
//         if (!prevUser || !newUser) return newUser; // One is null, other is not
//         if (prevUser.id === newUser.id && prevUser.role === newUser.role && prevUser.token === newUser.token) {
//           return prevUser; // Same values, return previous object to avoid re-render
//         }
//         return newUser; // Different values, update
//       });

//       // Only set loading to false once on initial mount
//       if (loading) {
//         setLoading(false);
//       }
//     };

//     // Initial check
//     checkAuth();

//     // Listen for storage changes (logout from other tabs)
//     const handleStorageChange = (e) => {
//       if (e.key === 'authToken' || e.key === 'userId' || e.key === 'userRole') {
//         checkAuth(); // Only update user, not loading
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);
    
//     return () => {
//       isMounted = false;
//       window.removeEventListener('storage', handleStorageChange);
//     };
//   }, []); // Empty deps - only run once on mount

//   /**
//    * Login function
//    * @param {string} phone - Phone number
//    * @param {string} password - Password
//    * @param {string} role - 'artisan' or 'client'
//    */
//   const login = async (phone, password, role = 'artisan') => {
//     try {
//       setLoading(true);
//       setError(null);

//       const endpoint = role === 'artisan' 
//         ? '/identity/artisan/login' 
//         : '/identity/client/login';

//       const response = await apiClient.post(endpoint, {
//         phone_primary: phone,
//         password,
//       });

//       const { token, artisan_id, client_id, can_see_gigs } = response.data;
//       const userId = artisan_id || client_id;

//       // Store auth data
//       localStorage.setItem('authToken', token);
//       localStorage.setItem('userId', userId);
//       localStorage.setItem('userRole', role);

//       setUser({
//         id: userId,
//         role,
//         token,
//         can_see_gigs, // For artisans
//       });

//       return { success: true, user: { id: userId, role } };
//     } catch (err) {
//       // Extract error message from backend response (message field) or fallback to err.message
//       const errorMsg = err.response?.data?.message || 
//                        err.response?.data?.error || 
//                        err.message || 
//                        'Login failed';
//       setError(errorMsg);
//       return { success: false, error: errorMsg };
//     } finally {
//       setLoading(false);
//     }
//   };

//   /**
//    * Logout function
//    * @param {Function} navigateCallback - Optional callback to navigate after logout (e.g., navigate('/login'))
//    */
//   const logout = (navigateCallback) => {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('userRole');
//     setUser(null);
    
//     // Navigate to login if callback provided
//     if (navigateCallback && typeof navigateCallback === 'function') {
//       navigateCallback('/login');
//     }
//   };

//   /**
//    * Check if user is authenticated
//    */
//   const isAuthenticated = !!user;

//   return {
//     user,
//     loading,
//     error,
//     login,
//     logout,
//     isAuthenticated,
//   };
// };

// export default useAuth;
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

// 1. Create the Context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application to provide authentication state globally
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated - also check on storage events for cross-tab sync
  useEffect(() => {
    let isMounted = true;

    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');

      // Basic validation to ensure we have all parts
      const newUser = (token && userId && userRole) ? {
        id: userId,
        role: userRole,
        token,
      } : null;

      if (!isMounted) return;

      // Only update state if values have changed to prevent infinite loops
      setUser(prevUser => {
        if (!prevUser && !newUser) return prevUser; 
        if (!prevUser || !newUser) return newUser; 
        if (prevUser.id === newUser.id && prevUser.role === newUser.role && prevUser.token === newUser.token) {
          return prevUser; 
        }
        return newUser; 
      });

      if (loading) {
        setLoading(false);
      }
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'userId' || e.key === 'userRole') {
        checkAuth(); 
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // loading removed from deps to avoid re-triggering logic

  /**
   * Login function
   */
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

      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userRole', role);

      setUser({
        id: userId,
        role,
        token,
        can_see_gigs, 
      });

      return { success: true, user: { id: userId, role } };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   */
  const logout = (navigateCallback) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setUser(null);
    
    if (navigateCallback && typeof navigateCallback === 'function') {
      navigateCallback('/login');
    }
  };

  const isAuthenticated = !!user;

  // The value object that will be accessible to any component calling useAuth()
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Consumes the AuthContext to provide access to auth state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;