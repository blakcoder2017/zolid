import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@zolid/shared/hooks';

/**
 * ProtectedRoute Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Memoize the loading state to prevent unnecessary re-renders
  const isLoading = useMemo(() => loading, [loading]);
  const authStatus = useMemo(() => isAuthenticated, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-navy-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authStatus) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
