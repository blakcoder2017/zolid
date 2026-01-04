import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const WalletPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = React.useState({ totalJobs: 0, completedJobs: 0, activeJobs: 0, completionRate: 0 });
  const [pendingPayouts, setPendingPayouts] = React.useState(0);
  const [totalEarned, setTotalEarned] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    fetchWalletData();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceResponse, jobsResponse] = await Promise.all([
        apiClient.get('/finance/balance'),
        apiClient.get('/jobs/my-jobs')
      ]);
      
      const balanceData = balanceResponse.data.balances || {};
      const allJobs = jobsResponse.data.jobs || [];
      
      // Calculate analytics
      const totalJobs = allJobs.length;
      const completedJobs = allJobs.filter(job => job.current_state === 'PAYOUT_SUCCESS').length;
      const activeJobs = allJobs.filter(job => 
        ['MATCHED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'STARTED', 'COMPLETED_PENDING'].includes(job.current_state)
      ).length;
      const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      
      setTotalEarned(balanceData.total_earned || 0);
      setPendingPayouts(balanceData.pending_job_payouts || 0);
      
      // Store analytics
      setAnalytics({ totalJobs, completedJobs, activeJobs, completionRate });
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setAnalytics({ totalJobs: 0, completedJobs: 0, activeJobs: 0, completionRate: 0 });
      setPendingPayouts(0);
      setTotalEarned(0);
    } finally {
      setLoading(false);
    }
  };
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];


  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <TopNavigation profile={profile} logo={logo} />

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-condensed font-bold text-4xl mb-6">
          Wallet
        </h1>

        {loading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading wallet data...</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Total Earned */}
            <Card variant="navy">
              <p className="text-grey-300 text-sm mb-2">Total Earned (All Time)</p>
              <p className="text-4xl font-semibold tabular-nums">
                {formatCurrency(totalEarned)}
              </p>
              <p className="text-grey-400 text-xs mt-2">
                Payments go directly to your MoMo wallet
              </p>
            </Card>

            {/* Analytics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <p className="text-navy-500 text-sm mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-navy-900">
                  {analytics.totalJobs}
                </p>
              </Card>
              
              <Card>
                <p className="text-navy-500 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-mint-600">
                  {analytics.completedJobs}
                </p>
              </Card>
              
              <Card>
                <p className="text-navy-500 text-sm mb-1">Active Jobs</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {analytics.activeJobs}
                </p>
              </Card>
              
              <Card>
                <p className="text-navy-500 text-sm mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-navy-900">
                  {analytics.completionRate}%
                </p>
              </Card>
            </div>

            {/* Pending Payouts */}
            {pendingPayouts > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <p className="text-navy-900 text-sm mb-2 font-semibold">Pending Payouts</p>
                <p className="text-2xl font-semibold tabular-nums text-yellow-700">
                  {formatCurrency(pendingPayouts)}
                </p>
                <p className="text-navy-600 text-xs mt-2">
                  ⏳ Waiting for client approval
                </p>
              </Card>
            )}

            {/* Link to Past Jobs */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/past-jobs')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-navy-900 font-semibold">View Past Jobs</p>
                  <p className="text-navy-500 text-sm">See your completed work history</p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default WalletPage;
