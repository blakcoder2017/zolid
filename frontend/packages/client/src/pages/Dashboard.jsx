// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';
// import { 
//   PlusCircle, 
//   Briefcase, 
//   Wallet, // Import Wallet Icon
//   Clock, 
//   CheckCircle 
// } from 'lucide-react';

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [loading, setLoading] = React.useState(true);
//   const [summary, setSummary] = React.useState({
//     total_jobs_posted: 0,
//     funds_in_escrow: 0,
//     total_spent: 0,
//   });
//   const [recentJobs, setRecentJobs] = React.useState([]);
//   const [profileName, setProfileName] = React.useState('');

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'My Jobs', icon: '📋' },
//     { path: '/post-job', label: 'Post Job', icon: '➕' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     if (user?.id) {
//       fetchDashboardData();
//     }
//   }, [user?.id]);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch financial summary
//       const summaryResponse = await apiClient.get('/finance/balance');
//       setSummary(summaryResponse.data.summary || {
//         total_jobs_posted: 0,
//         funds_in_escrow: 0,
//         total_spent: 0,
//       });

//       // Fetch recent jobs
//       if (user?.id) {
//         try {
//           const jobsResponse = await apiClient.get(`/jobs/client/${user.id}`);
//           const jobs = jobsResponse.data.jobs || [];
          
//           // For jobs open for quotes, fetch quote counts
//           const jobsWithQuoteCounts = await Promise.all(
//             jobs.slice(0, 5).map(async (job) => {
//               if (['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state)) {
//                 try {
//                   const quotesResponse = await apiClient.get(`/jobs/${job.id}/quotes`);
//                   return {
//                     ...job,
//                     quote_count: quotesResponse.data.quotes?.length || 0
//                   };
//                 } catch (error) {
//                   console.error(`Failed to fetch quotes for job ${job.id}:`, error);
//                   return { ...job, quote_count: 0 };
//                 }
//               }
//               return job;
//             })
//           );
          
//           setRecentJobs(jobsWithQuoteCounts);
//           console.log('Dashboard - Fetched jobs with quote counts:', jobsWithQuoteCounts); // Debug log
//         } catch (jobsError) {
//           console.error('Failed to fetch jobs for dashboard:', jobsError);
//           setRecentJobs([]);
//         }

//         // Fetch profile to get name
//         try {
//           const profileResponse = await apiClient.get('/profile/profile');
//           setProfileName(profileResponse.data.profile?.full_name || '');
//         } catch (error) {
//           console.error('Failed to fetch profile:', error);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getJobStatusBadge = (state) => {
//     const statusMap = {
//       'DRAFT': { label: 'Draft', color: 'bg-grey-200 text-grey-700' },
//       'OPEN_FOR_QUOTES': { label: 'Open for Quotes', color: 'bg-indigo-100 text-indigo-700' },
//       'QUOTED': { label: 'Quotes Received', color: 'bg-purple-100 text-purple-700' },
//       'MATCHED': { label: 'Quote Accepted', color: 'bg-blue-100 text-blue-700' },
//       'AWAITING_PAYMENT': { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-700' },
//       'ESCROW_PENDING': { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-700' },
//       'ESCROW_HELD': { label: 'In Escrow', color: 'bg-indigo-100 text-indigo-700' },
//       'IN_PROGRESS': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
//       'STARTED': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
//       'COMPLETED_PENDING': { label: 'Awaiting Review', color: 'bg-purple-100 text-purple-700' },
//       'PAYOUT_SUCCESS': { label: 'Completed', color: 'bg-mint-100 text-mint-700' },
//       'DISPUTED': { label: 'Disputed', color: 'bg-coral-100 text-coral-700' },
//       'CANCELLED': { label: 'Cancelled', color: 'bg-grey-200 text-grey-700' },
//     };
//     const status = statusMap[state] || { label: state, color: 'bg-grey-200 text-grey-700' };
//     return (
//       <span className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>
//         {status.label}
//       </span>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       {/* Top Navigation */}
//       <nav className="bg-navy-900 text-white px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center">
//             <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
//           </div>
//         </div>
//       </nav>

//       {/* Dashboard Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-2">
//           Welcome Back{profileName ? `, ${profileName.split(' ')[0]}` : ''}
//         </h1>

//         {loading ? (
//           <Card className="mt-6">
//             <p className="text-navy-600 text-center py-8">Loading dashboard...</p>
//           </Card>
//         ) : (
//           <>
//             {/* Financial Summary */}
//             <div className="grid md:grid-cols-3 gap-4 mb-8 mt-6">
//               <Card>
//                 <p className="text-navy-500 text-sm mb-2">Jobs Posted</p>
//                 <p className="text-3xl font-semibold tabular-nums">{summary.total_jobs_posted}</p>
//               </Card>
//               <Card>
//                 <p className="text-navy-500 text-sm mb-2">In Escrow</p>
//                 <p className="text-3xl font-semibold tabular-nums text-coral-600">
//                   {formatCurrency(summary.funds_in_escrow)}
//                 </p>
//               </Card>
//               <Card>
//                 <p className="text-navy-500 text-sm mb-2">Total Spent</p>
//                 <p className="text-3xl font-semibold tabular-nums">
//                   {formatCurrency(summary.total_spent)}
//                 </p>
//               </Card>
//             </div>

//             {/* Primary CTA */}
//             <Button 
//               variant="primary" 
//               size="lg" 
//               fullWidth 
//               className="mb-8"
//               onClick={() => navigate('/post-job')}
//             >
//               CREATE NEW JOB
//             </Button>

//             {/* Recent Jobs */}
//             <div>
//               <h2 className="font-condensed font-bold text-2xl mb-4">
//                 Recent Jobs
//               </h2>
//               {recentJobs.length === 0 ? (
//                 <Card>
//                   <p className="text-navy-600 text-center py-8">No jobs yet. Create your first job to get started!</p>
//                 </Card>
//               ) : (
//                 <div className="space-y-4">
//                   {recentJobs.map((job) => {
//                     // Determine navigation based on job state
//                     const isQuoteJob = ['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state);
//                     const needsApproval = job.current_state === 'COMPLETED_PENDING';
//                     const isInProgress = ['IN_PROGRESS', 'STARTED', 'ESCROW_HELD'].includes(job.current_state);
                    
//                     const jobClickHandler = () => {
//                       if (isQuoteJob) {
//                         navigate(`/jobs/${job.id}/quotes`);
//                       } else if (needsApproval) {
//                         // Navigate to approval page for jobs awaiting review
//                         navigate(`/jobs/${job.id}/approve`);
//                       } else if (isInProgress) {
//                         // Navigate to approval page (job details) for in-progress jobs
//                         navigate(`/jobs/${job.id}/approve`);
//                       } else {
//                         // Default: navigate to My Jobs page for other states
//                         navigate('/jobs');
//                       }
//                     };

//                     return (
//                       <Card key={job.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={jobClickHandler}>
//                         <div className="flex justify-between items-start">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 mb-2 flex-wrap">
//                               <h3 className="font-semibold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
//                               {getJobStatusBadge(job.current_state)}
//                               {isQuoteJob && job.quote_count !== undefined && (
//                                 <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
//                                   💬 {job.quote_count} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
//                                 </span>
//                               )}
//                             </div>
//                             {job.job_description && (
//                               <p className="text-sm text-navy-600 mb-2 line-clamp-2">
//                                 {job.job_description}
//                               </p>
//                             )}
//                             {job.artisan_name && (
//                               <p className="text-sm text-navy-600 mb-1">
//                                 Artisan: <span className="font-medium">{job.artisan_name}</span>
//                               </p>
//                             )}
//                             {job.gross_fee_pesewas > 0 ? (
//                               <p className="text-lg font-semibold text-navy-900">
//                                 {formatCurrency(job.gross_fee_pesewas)}
//                               </p>
//                             ) : isQuoteJob ? (
//                               <p className="text-sm text-indigo-600 font-semibold">
//                                 💬 Waiting for quotes
//                               </p>
//                             ) : null}
//                             <p className="text-xs text-navy-500 mt-2">
//                               {new Date(job.created_at).toLocaleDateString()}
//                             </p>
//                           </div>
//                         </div>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default Dashboard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import { 
  PlusCircle, 
  Briefcase, 
  Wallet, // Import Wallet Icon
  Clock, 
  CheckCircle 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState({
    total_jobs_posted: 0,
    funds_in_escrow: 0,
    total_spent: 0,
  });
  const [walletBalance, setWalletBalance] = React.useState(0); // New State
  const [recentJobs, setRecentJobs] = React.useState([]);
  const [profileName, setProfileName] = React.useState('');

  // Updated Navigation Items
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' }, // Wallet Link Added
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  React.useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Financial Data (Summary & Wallet)
      const [summaryRes, walletRes] = await Promise.all([
        apiClient.get('/finance/balance'),
        apiClient.get('/finance/wallet/balance')
      ]);

      setSummary(summaryRes.data.summary || {
        total_jobs_posted: 0,
        funds_in_escrow: 0,
        total_spent: 0,
      });
      
      setWalletBalance(walletRes.data.data?.balance || 0);

      // 2. Fetch Profile Name
      try {
        const profileResponse = await apiClient.get('/profile/profile');
        setProfileName(profileResponse.data.profile?.full_name || '');
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }

      // 3. Fetch Recent Jobs
      if (user?.id) {
        try {
          // Fetch all jobs to show recent ones
          const jobsResponse = await apiClient.get(`/jobs/client/${user.id}?filter=all`);
          const jobs = jobsResponse.data.jobs || [];
          
          // For jobs open for quotes, fetch quote counts
          const jobsWithQuoteCounts = await Promise.all(
            jobs.slice(0, 5).map(async (job) => {
              if (['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state)) {
                try {
                  const quotesResponse = await apiClient.get(`/jobs/${job.id}/quotes`);
                  return {
                    ...job,
                    quote_count: quotesResponse.data.quotes?.length || 0
                  };
                } catch (error) {
                  return { ...job, quote_count: 0 };
                }
              }
              return job;
            })
          );
          
          setRecentJobs(jobsWithQuoteCounts);
        } catch (jobsError) {
          console.error('Failed to fetch jobs for dashboard:', jobsError);
          setRecentJobs([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (state) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'bg-grey-200 text-grey-700' },
      'OPEN_FOR_QUOTES': { label: 'Open for Quotes', color: 'bg-indigo-100 text-indigo-700' },
      'QUOTED': { label: 'Quotes Received', color: 'bg-purple-100 text-purple-700' },
      'MATCHED': { label: 'Quote Accepted', color: 'bg-blue-100 text-blue-700' },
      'MATCHED_PENDING_PAYMENT': { label: 'Pay Now', color: 'bg-yellow-100 text-yellow-800' },
      'AWAITING_PAYMENT': { label: 'Payment Pending', color: 'bg-yellow-100 text-yellow-700' },
      'ESCROW_HELD': { label: 'In Escrow', color: 'bg-indigo-100 text-indigo-700' },
      'STARTED': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      'IN_PROGRESS': { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      'COMPLETED_PENDING': { label: 'Review Needed', color: 'bg-purple-100 text-purple-700' },
      'PAYOUT_SUCCESS': { label: 'Completed', color: 'bg-green-100 text-green-700' },
      'DISPUTED': { label: 'Disputed', color: 'bg-red-100 text-red-700' },
      'CANCELLED_REFUNDED': { label: 'Refunded', color: 'bg-grey-200 text-grey-700' },
    };
    const status = statusMap[state] || { label: state, color: 'bg-grey-200 text-grey-700' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          </div>
          <div className="text-sm font-medium opacity-90">
             {profileName ? `Hi, ${profileName.split(' ')[0]}` : ''}
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="font-condensed font-bold text-3xl mb-4 text-navy-900">
          Dashboard
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* --- NEW WALLET CARD --- */}
            <div 
              onClick={() => navigate('/wallet')}
              className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg cursor-pointer transform transition-transform hover:scale-[1.01] mb-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Wallet Balance</p>
                  <h2 className="text-3xl font-bold">
                    {formatCurrency(walletBalance)}
                  </h2>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-100">
                <Clock className="w-3 h-3" />
                <span>Withdrawals settle in T+5 days</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4">
                <p className="text-navy-500 text-xs uppercase font-bold mb-1">Jobs Posted</p>
                <p className="text-2xl font-bold text-navy-900">{summary.total_jobs_posted}</p>
              </Card>
              <Card className="p-4">
                <p className="text-navy-500 text-xs uppercase font-bold mb-1">In Escrow</p>
                <p className="text-2xl font-bold text-coral-600">
                  {formatCurrency(summary.funds_in_escrow)}
                </p>
              </Card>
              <Card className="p-4 col-span-2 md:col-span-1">
                <p className="text-navy-500 text-xs uppercase font-bold mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-navy-900">
                  {formatCurrency(summary.total_spent)}
                </p>
              </Card>
            </div>

            {/* Primary CTA */}
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              className="mb-8 shadow-md"
              onClick={() => navigate('/post-job')}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              CREATE NEW JOB
            </Button>

            {/* Recent Jobs */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-condensed font-bold text-xl text-navy-900">
                  Recent Jobs
                </h2>
                <button 
                  onClick={() => navigate('/jobs')}
                  className="text-sm text-indigo-600 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              {recentJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No jobs yet.</p>
                  <p className="text-sm text-gray-400">Post a job to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentJobs.map((job) => {
                    // Smart Navigation Logic
                    const jobClickHandler = () => {
                      if (['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state)) {
                        navigate(`/jobs/${job.id}/quotes`);
                      } else if (['COMPLETED_PENDING'].includes(job.current_state)) {
                        navigate(`/jobs/${job.id}/approve`);
                      } else if (['MATCHED_PENDING_PAYMENT'].includes(job.current_state)) {
                        navigate(`/jobs/${job.id}/payment`); // Assuming you have a payment route or handling
                      } else {
                        navigate(`/jobs/${job.id}`);
                      }
                    };

                    return (
                      <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={jobClickHandler}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-bold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
                              {getJobStatusBadge(job.current_state)}
                            </div>
                            
                            <p className="text-lg font-bold text-navy-900 mb-1">
                              {formatCurrency(job.gross_fee_pesewas)}
                            </p>

                            {job.job_description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                {job.job_description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2">
                                {job.artisan_name ? (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    👷 {job.artisan_name}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No artisan yet</span>
                                )}
                                <span className="text-xs text-gray-400">
                                  • {new Date(job.created_at).toLocaleDateString()}
                                </span>
                            </div>
                          </div>
                          
                          {/* Quote Counter Badge */}
                          {['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state) && job.quote_count > 0 && (
                            <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex flex-col items-center">
                              <span className="text-lg">{job.quote_count}</span>
                              <span>Quotes</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default Dashboard;