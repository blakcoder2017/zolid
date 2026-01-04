import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// 1. UPDATE IMPORT: Import AuthProvider along with useAuth
// Note: Ensure your shared package exports both from its index.js
import { useAuth, AuthProvider } from '@zolid/shared'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import MyJobsPage from './pages/MyJobsPage';
import ActiveJobsPage from './pages/ActiveJobsPage';
import PastJobsPage from './pages/PastJobsPage';
import PendingJobsPage from './pages/PendingJobsPage';
import ApproveJobPage from './pages/ApproveJobPage';
import ViewQuotesPage from './pages/ViewQuotesPage';
import NegotiateQuotePage from './pages/NegotiateQuotePage';
import PostJobPage from './pages/PostJobPage';
import ProfilePage from './pages/ProfilePage';
import VerifyTransactionPage from './pages/VerifyTransactionPage';
import ProtectedRoute from './components/ProtectedRoute';
import ClientDisputePage from './pages/ClientDisputePage';
import JobDetailsPage from './pages/JobDetailsPage';
import ClientWalletPage from './pages/ClientWalletPage';



function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-navy-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <ClientWalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <ProtectedRoute>
            <MyJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/active-jobs"
        element={
          <ProtectedRoute>
            <ActiveJobsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetailsPage /></ProtectedRoute>} />
      {/* NEW: Dispute Resolution Route */}
      <Route 
          path="/disputes/:disputeId" 
          element={
            <ProtectedRoute>
              <ClientDisputePage />
            </ProtectedRoute>
          } 
        />
      <Route
        path="/past-jobs"
        element={
          <ProtectedRoute>
            <PastJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-jobs"
        element={
          <ProtectedRoute>
            <PendingJobsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs/:jobId/approve"
        element={
          <ProtectedRoute>
            <ApproveJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/jobs/:jobId/quotes"
        element={
          <ProtectedRoute>
            <ViewQuotesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotes/:quoteId/negotiate"
        element={
          <ProtectedRoute>
            <NegotiateQuotePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/post-job"
        element={
          <ProtectedRoute>
            <PostJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      {/* --- PAYMENT VERIFICATION ROUTE --- */}
      <Route path="/paystack/verify-transaction" element={
        <ProtectedRoute>
          <VerifyTransactionPage />
        </ProtectedRoute>
      } />
      
      {/* Default route - redirect to login or dashboard */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
      />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      {/* 2. WRAP WITH PROVIDER: This makes the context available to useAuth inside AppRoutes */}
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;