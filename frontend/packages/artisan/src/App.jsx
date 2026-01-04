// // import React from 'react';
// // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import { useAuth } from '@zolid/shared/hooks';
// // import LoginPage from './pages/LoginPage';
// // import RegisterPage from './pages/RegisterPage';
// // import Dashboard from './pages/Dashboard';
// // import JobsPage from './pages/JobsPage';
// // import JobDetailsPage from './pages/JobDetailsPage';
// // import SubmitQuotePage from './pages/SubmitQuotePage';
// // import NegotiationResponsePage from './pages/NegotiationResponsePage';
// // import WalletPage from './pages/WalletPage';
// // import PastJobsPage from './pages/PastJobsPage';
// // import MyJobsPage from './pages/MyJobsPage';
// // import ProfilePage from './pages/ProfilePage';
// // import IdCardPage from './pages/IdCardPage';
// // import CompleteProfilePage from './pages/CompleteProfilePage';
// // import BenefitsPage from './pages/BenefitsPage';
// // import ProtectedRoute from './components/ProtectedRoute';

// // function AppRoutes() {
// //   const { isAuthenticated, loading } = useAuth();

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen bg-grey-50 flex items-center justify-center">
// //         <div className="text-center">
// //           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
// //           <p className="mt-4 text-navy-600">Loading...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <Routes>
// //       {/* Public routes */}
// //       <Route 
// //         path="/login" 
// //         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
// //       />
// //       <Route 
// //         path="/register" 
// //         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
// //       />
      
// //       {/* Protected routes */}
// //       <Route
// //         path="/dashboard"
// //         element={
// //           <ProtectedRoute>
// //             <Dashboard />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/jobs"
// //         element={
// //           <ProtectedRoute>
// //             <JobsPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/jobs/:jobId"
// //         element={
// //           <ProtectedRoute>
// //             <JobDetailsPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/jobs/:jobId/submit-quote"
// //         element={
// //           <ProtectedRoute>
// //             <SubmitQuotePage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/jobs/:jobId/edit-quote"
// //         element={
// //           <ProtectedRoute>
// //             <SubmitQuotePage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/quotes/:quoteId/negotiation"
// //         element={
// //           <ProtectedRoute>
// //             <NegotiationResponsePage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/wallet"
// //         element={
// //           <ProtectedRoute>
// //             <WalletPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/past-jobs"
// //         element={
// //           <ProtectedRoute>
// //             <PastJobsPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/my-jobs"
// //         element={
// //           <ProtectedRoute>
// //             <MyJobsPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/profile"
// //         element={
// //           <ProtectedRoute>
// //             <ProfilePage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/id-card"
// //         element={
// //           <ProtectedRoute>
// //             <IdCardPage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/complete-profile"
// //         element={
// //           <ProtectedRoute>
// //             <CompleteProfilePage />
// //           </ProtectedRoute>
// //         }
// //       />
// //       <Route
// //         path="/benefits"
// //         element={
// //           <ProtectedRoute>
// //             <BenefitsPage />
// //           </ProtectedRoute>
// //         }
// //       />
      
// //       {/* Default route - redirect to login or dashboard */}
// //       <Route 
// //         path="/" 
// //         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
// //       />
      
// //       {/* Catch all - redirect to login */}
// //       <Route path="*" element={<Navigate to="/login" replace />} />
// //     </Routes>
// //   );
// // }

// // function App() {
// //   return (
// //     <Router>
// //       <AppRoutes />
// //     </Router>
// //   );
// // }

// // export default App;
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // 1. Update import to include AuthProvider (ensure your shared/index.js exports this!)
// import { useAuth, AuthProvider } from '@zolid/shared'; 
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import Dashboard from './pages/Dashboard';
// import JobsPage from './pages/JobsPage';
// import JobDetailsPage from './pages/JobDetailsPage';
// import SubmitQuotePage from './pages/SubmitQuotePage';
// import NegotiationResponsePage from './pages/NegotiationResponsePage';
// import WalletPage from './pages/WalletPage';
// import PastJobsPage from './pages/PastJobsPage';
// import MyJobsPage from './pages/MyJobsPage';
// import ProfilePage from './pages/ProfilePage';
// import IdCardPage from './pages/IdCardPage';
// import CompleteProfilePage from './pages/CompleteProfilePage';
// import BenefitsPage from './pages/BenefitsPage';
// import ProtectedRoute from './components/ProtectedRoute';
// import DisputesPage from './pages/DisputePage';
// import DisputeDetailsPage from './pages/DisputeDetailsPage';



// function AppRoutes() {
//   // This hook call requires <AuthProvider> to be a parent in the tree
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-grey-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
//           <p className="mt-4 text-navy-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       {/* Public routes */}
//       <Route 
//         path="/login" 
//         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
//       />
//       <Route 
//         path="/register" 
//         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
//       />
      
//       {/* Protected routes */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <Dashboard />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/jobs"
//         element={
//           <ProtectedRoute>
//             <JobsPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/jobs/:jobId"
//         element={
//           <ProtectedRoute>
//             <JobDetailsPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/jobs/:jobId/submit-quote"
//         element={
//           <ProtectedRoute>
//             <SubmitQuotePage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/jobs/:jobId/edit-quote"
//         element={
//           <ProtectedRoute>
//             <SubmitQuotePage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/quotes/:quoteId/negotiation"
//         element={
//           <ProtectedRoute>
//             <NegotiationResponsePage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/wallet"
//         element={
//           <ProtectedRoute>
//             <WalletPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route path="/id-card" element={<ProtectedRoute><IdCardPage /></ProtectedRoute>} />
//       <Route
//         path="/past-jobs"
//         element={
//           <ProtectedRoute>
//             <PastJobsPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/my-jobs"
//         element={
//           <ProtectedRoute>
//             <MyJobsPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/profile"
//         element={
//           <ProtectedRoute>
//             <ProfilePage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/id-card"
//         element={
//           <ProtectedRoute>
//             <IdCardPage />
//           </ProtectedRoute>
//         }
//       />
//       <Route
//         path="/complete-profile"
//         element={
//           <ProtectedRoute>
//             <CompleteProfilePage />
//           </ProtectedRoute>
//         }
//       />
//       <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
//       <Route path="/disputes/:jobId" element={<ProtectedRoute><DisputeDetailsPage /></ProtectedRoute>} />
//       <Route
//         path="/benefits"
//         element={
//           <ProtectedRoute>
//             <BenefitsPage />
//           </ProtectedRoute>
//         }
//       />
      
//       {/* Default route - redirect to login or dashboard */}
//       <Route 
//         path="/" 
//         element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
//       />
      
//       {/* Catch all - redirect to login */}
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <Router>
//       {/* 2. WRAP AppRoutes HERE */}
//       <AuthProvider>
//         <AppRoutes />
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from '@zolid/shared'; 
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/JobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import SubmitQuotePage from './pages/SubmitQuotePage';
import NegotiationResponsePage from './pages/NegotiationResponsePage';
import WalletPage from './pages/WalletPage';
import PastJobsPage from './pages/PastJobsPage';
import MyJobsPage from './pages/MyJobsPage';
import ProfilePage from './pages/ProfilePage';
import IdCardPage from './pages/IdCardPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import BenefitsPage from './pages/BenefitsPage';
import ProtectedRoute from './components/ProtectedRoute';
import DisputesPage from './pages/DisputePage';
import DisputeDetailsPage from './pages/DisputeDetailsPage';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
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
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
      <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetailsPage /></ProtectedRoute>} />
      <Route path="/jobs/:jobId/submit-quote" element={<ProtectedRoute><SubmitQuotePage /></ProtectedRoute>} />
      <Route path="/jobs/:jobId/edit-quote" element={<ProtectedRoute><SubmitQuotePage /></ProtectedRoute>} />
      <Route path="/quotes/:quoteId/negotiation" element={<ProtectedRoute><NegotiationResponsePage /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/past-jobs" element={<ProtectedRoute><PastJobsPage /></ProtectedRoute>} />
      <Route path="/my-jobs" element={<ProtectedRoute><MyJobsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/id-card" element={<ProtectedRoute><IdCardPage /></ProtectedRoute>} />
      <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
      <Route path="/benefits" element={<ProtectedRoute><BenefitsPage /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><DisputesPage /></ProtectedRoute>} />
      <Route path="/disputes/:jobId" element={<ProtectedRoute><DisputeDetailsPage /></ProtectedRoute>} />
      
      {/* Default route */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    // FIX APPLIED HERE: Added future flags to silence warnings
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;