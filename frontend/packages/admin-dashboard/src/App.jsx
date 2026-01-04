// import { Routes, Route, Navigate } from 'react-router-dom';
// import RouterWithFutureFlags from './components/RouterWithFutureFlags';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import LoginPage from './pages/LoginPage';
// import DashboardLayout from './layout/DashboardLayout';
// import DashboardHome from './pages/DashboardHome';
// import ArtisansPage from './pages/ArtisansPage';
// import ArtisanDetailPage from './pages/ArtisanDetailPage';
// import ArtisanEditPage from './pages/ArtisanEditPage';
// import ArtisanApprovalPage from './pages/ArtisanApprovalPage';
// import ArtisanStatisticsPage from './pages/ArtisanStatisticsPage';
// import ClientsPage from './pages/ClientsPage';
// import ClientStatisticsPage from './pages/ClientStatisticsPage';
// import ClientDetailPage from './pages/ClientDetailPage';
// import FinancialLedgerPage from './pages/FinancialLedgerPage';
// import MarketplaceOperationsPage from './pages/MarketplaceOperationsPage';
// import InvestorRelationsPage from './pages/InvestorRelationsPage';
// import DisputesPage from './pages/DisputesPage';
// import SettingsPage from './pages/SettingsPage';
// import RiviaCoPage from './pages/RiviaCoPage'



// // Protected Route Wrapper
// const ProtectedRoute = ({ children }) => {
//     const { user, loading } = useAuth();
//     if (loading) return null; // Or a spinner
//     if (!user) return <Navigate to="/login" replace />;
//     return children;
// };

// function App() {
//     return (
//         <AuthProvider>
//             <RouterWithFutureFlags>
//                 <Routes>
//                     <Route path="/login" element={<LoginPage />} />
                    
//                     {/* Protected Routes */}
//                     <Route path="/" element={
//                         <ProtectedRoute>
//                             <DashboardLayout />
//                         </ProtectedRoute>
//                     }>
//                         <Route index element={<DashboardHome />} />
//                         <Route path="marketplace" element={<MarketplaceOperationsPage />} />
//                         <Route path="investor-relations" element={<InvestorRelationsPage />} />
//                         <Route path="artisans" element={<ArtisansPage />} />
//                         <Route path="artisans/statistics" element={<ArtisanStatisticsPage />} />
//                         <Route path="artisans/:id" element={<ArtisanDetailPage />} />
//                         <Route path="artisans/:id/edit" element={<ArtisanEditPage />} />
//                         <Route path="artisans/:id/approve" element={<ArtisanApprovalPage />} />
//                         <Route path="clients" element={<ClientsPage/>} />
//                         <Route path="clients/:id" element={<ClientDetailPage/>} />
//                         <Route path="clients/statistics" element={<ClientStatisticsPage/>} />
//                         <Route path="finance/ledger" element={<FinancialLedgerPage/>} />
//                         <Route path="riviaco" element={<RiviaCoPage />} />
//                         <Route path="finance" element={<Navigate to="/finance/ledger" replace />} />
//                         <Route path="disputes" element={<DisputesPage />} />
//                         <Route path="settings" element={<SettingsPage />} />
//                     </Route>
//                 </Routes>
//             </RouterWithFutureFlags>
//         </AuthProvider>
//     );
// }

// export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import RouterWithFutureFlags from './components/RouterWithFutureFlags';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ArtisansPage from './pages/ArtisansPage';
import ArtisanDetailPage from './pages/ArtisanDetailPage';
import ArtisanEditPage from './pages/ArtisanEditPage';
import ArtisanApprovalPage from './pages/ArtisanApprovalPage';
import ArtisanStatisticsPage from './pages/ArtisanStatisticsPage';
import ClientsPage from './pages/ClientsPage';
import ClientStatisticsPage from './pages/ClientStatisticsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import FinancialLedgerPage from './pages/FinancialLedgerPage';
import MarketplaceOperationsPage from './pages/MarketplaceOperationsPage';
import InvestorRelationsPage from './pages/InvestorRelationsPage';
import DisputesPage from './pages/DisputesPage';
import SettingsPage from './pages/SettingsPage';
import RiviaCoPage from './pages/RiviaCoPage'; // Import the Rivia page
import CreditRiskPage from './pages/CreditRiskPage';
import DataProductsPage from './pages/DataProductsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import OnboardArtisanPage from './pages/OnboardArtisanPage';


// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null; // Or a spinner
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <RouterWithFutureFlags>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* Protected Routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        {/* FIX: Redirect root to /dashboard so the sidebar link matches */}
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardHome />} />
                        <Route path="/withdrawals" element={<WithdrawalsPage />} />
                        <Route path="marketplace" element={<MarketplaceOperationsPage />} />
                        <Route path="investor-relations" element={<InvestorRelationsPage />} />
                        <Route path="artisans" element={<ArtisansPage />} />
                        <Route path="artisans/statistics" element={<ArtisanStatisticsPage />} />
                        <Route path="artisans/:id" element={<ArtisanDetailPage />} />
                        <Route path="artisans/:id/edit" element={<ArtisanEditPage />} />
                        <Route path="artisans/:id/approve" element={<ArtisanApprovalPage />} />
                        <Route path="onboarding/manual" element={<OnboardArtisanPage />} />
                        <Route path="clients" element={<ClientsPage/>} />
                        <Route path="clients/:id" element={<ClientDetailPage/>} />
                        <Route path="analytics/risk" element={<CreditRiskPage />} />
                        <Route path="analytics/products" element={<DataProductsPage />} />
                        <Route path="clients/statistics" element={<ClientStatisticsPage/>} />
                        <Route path="finance/ledger" element={<FinancialLedgerPage/>} />
                        <Route path="finance" element={<Navigate to="/finance/ledger" replace />} />
                        
                        <Route path="disputes" element={<DisputesPage />} />
                        
                        {/* Add RiviaCo Route */}
                        <Route path="riviaco" element={<RiviaCoPage />} />
                        
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </RouterWithFutureFlags>
        </AuthProvider>
    );
}

export default App;