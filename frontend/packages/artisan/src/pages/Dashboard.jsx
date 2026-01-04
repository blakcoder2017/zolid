// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// // import { formatCurrency } from '@zolid/shared/utils';
// // import { useAuth } from '@zolid/shared/hooks';
// // import apiClient from '@zolid/shared/utils/apiClient';
// // import logo from '../assets/logos/logo.png';

// // const Dashboard = () => {
// //   const navigate = useNavigate();
// //   const [balance, setBalance] = React.useState(0);
// //   const [activeJobs, setActiveJobs] = React.useState([]);
// //   const [matchedJobs, setMatchedJobs] = React.useState([]);
// //   const [pendingQuotes, setPendingQuotes] = React.useState([]);
// //   const [availableJobs, setAvailableJobs] = React.useState([]);
// //   const [profile, setProfile] = React.useState(null);
// //   const [verificationStatus, setVerificationStatus] = React.useState(null);
// //   const [loading, setLoading] = React.useState(true);

// //   React.useEffect(() => {
// //     fetchDashboardData();
// //   }, []);

// //   const fetchDashboardData = async () => {
// //     try {
// //       setLoading(true);
      
// //       // Fetch profile FIRST to check verification status
// //       let canSeeGigs = false;
// //       try {
// //         const profileResponse = await apiClient.get('/profile/profile');
// //         setProfile(profileResponse.data.profile);
        
// //         // Calculate verification completeness based on MVP requirements
// //         const profileData = profileResponse.data.profile;
// //         if (profileData) {
// //           // Use is_identity_verified from database (set to true when profile is completed)
// //           const completeness = {
// //             momo_verified: profileData.is_momo_verified || false,
// //             identity_verified: profileData.is_identity_verified || false, // Use database value
// //             location_set: !!profileData.home_gps_address,
// //           };
          
// //           const totalChecks = 3;
// //           const completedChecks = Object.values(completeness).filter(Boolean).length;
// //           const percentage = Math.round((completedChecks / totalChecks) * 100);
          
// //           // Profile is complete when all three checks are done (recipient code is handled separately)
// //           const profileComplete = completeness.momo_verified && 
// //                                  completeness.identity_verified && 
// //                                  completeness.location_set;
          
// //           // Can see gigs requires: profile complete AND paystack_recipient_code
// //           canSeeGigs = profileComplete && !!profileData.paystack_recipient_code;
          
// //           setVerificationStatus({
// //             ...completeness,
// //             percentage,
// //             canSeeGigs,
// //             profileComplete, // Use this to determine if profile completion card should show
// //             needsRecipientCode: !profileData.paystack_recipient_code,
// //           });
// //         }
// //       } catch (error) {
// //         console.error('Failed to fetch profile:', error);
// //       }

// //       // Fetch wallet balance
// //       try {
// //         const balanceResponse = await apiClient.get('/finance/balance');
// //         setBalance(balanceResponse.data.balance_pesewas || 0);
// //       } catch (error) {
// //         console.error('Failed to fetch balance:', error);
// //         setBalance(0);
// //       }

// //       // Fetch available jobs (OPEN_FOR_QUOTES) - PRIORITY SECTION
// //       if (canSeeGigs) {
// //         try {
// //           const availableJobsResponse = await apiClient.get('/jobs/available');
// //           const allAvailableJobs = availableJobsResponse.data.jobs || [];
          
// //           // Also fetch artisan's quotes to show status
// //           try {
// //             const quotesResponse = await apiClient.get('/jobs/my-quotes');
// //             const myQuotes = quotesResponse.data.quotes || [];
            
// //             // Add quote info to jobs
// //             const jobsWithQuotes = allAvailableJobs.map(job => {
// //               const myQuote = myQuotes.find(q => q.job_id === job.id && q.status === 'PENDING');
// //               return {
// //                 ...job,
// //                 has_quoted: !!myQuote,
// //                 my_quote: myQuote
// //               };
// //             });
            
// //             setAvailableJobs(jobsWithQuotes);
// //           } catch (quotesError) {
// //             // If quotes fetch fails, still show available jobs
// //             setAvailableJobs(allAvailableJobs);
// //           }
// //         } catch (error) {
// //           // If 403, user needs to complete verification (already handled by verification status card)
// //           // Otherwise, just log and show empty
// //           if (error.status !== 403 && error.response?.status !== 403) {
// //             console.error('Failed to fetch available jobs:', error);
// //           }
// //           setAvailableJobs([]);
// //         }
// //       } else {
// //         setAvailableJobs([]);
// //       }

// //       // Fetch in-process jobs (jobs currently being worked on: ESCROW_HELD, STARTED, IN_PROGRESS)
// //       // Also include matched jobs awaiting payment (MATCHED, AWAITING_PAYMENT)
// //       try {
// //         const jobsResponse = await apiClient.get('/jobs/my-jobs?filter=active');
// //         const allActiveJobs = jobsResponse.data.jobs || [];
        
// //         // Separate into in-process and matched/awaiting payment
// //         const inProcessJobs = allActiveJobs.filter(job => 
// //           ['ESCROW_HELD', 'STARTED', 'IN_PROGRESS', 'COMPLETED_PENDING'].includes(job.current_state)
// //         );
// //         const matchedAwaitingPayment = allActiveJobs.filter(job =>
// //           ['MATCHED', 'AWAITING_PAYMENT'].includes(job.current_state)
// //         );
        
// //         // Set active jobs (in-process)
// //         setActiveJobs(inProcessJobs);
        
// //         // Set matched jobs (awaiting payment)
// //         setMatchedJobs(matchedAwaitingPayment);
// //       } catch (error) {
// //         console.error('Failed to fetch in-process jobs:', error);
// //         // Fallback to fetching all jobs and filtering
// //         try {
// //           const fallbackResponse = await apiClient.get('/jobs/my-jobs');
// //           const allJobs = fallbackResponse.data.jobs || [];
// //           const active = allJobs.filter(job => 
// //             job.artisan_id && (
// //               job.current_state === 'ESCROW_HELD' ||    // Paid, ready to start work
// //               job.current_state === 'STARTED' ||        // Work in progress
// //               job.current_state === 'IN_PROGRESS' ||    // Work in progress (quote system)
// //               job.current_state === 'MATCHED' ||        // Quote accepted, waiting for payment
// //               job.current_state === 'AWAITING_PAYMENT'  // Payment link generated
// //             )
// //           );
// //           setActiveJobs(active);
// //         } catch (fallbackError) {
// //           console.error('Failed to fetch jobs (fallback):', fallbackError);
// //           setActiveJobs([]);
// //         }
// //       }

// //       // NEW: Fetch pending quotes (check for negotiations)
// //       try {
// //         const quotesResponse = await apiClient.get('/jobs/my-quotes');
// //         const allQuotes = quotesResponse.data.quotes || [];
        
// //         // For each pending quote, check if there's an active negotiation
// //         const quotesWithNegotiations = await Promise.all(
// //           allQuotes.filter(q => q.status === 'PENDING').map(async (quote) => {
// //             try {
// //               const negResponse = await apiClient.get(`/jobs/quotes/${quote.id}/negotiations`);
// //               const negotiations = negResponse.data.negotiations || [];
// //               const pendingNegotiation = negotiations.find(n => n.status === 'PENDING' && n.offered_by === 'client');
// //               return {
// //                 ...quote,
// //                 has_pending_negotiation: !!pendingNegotiation,
// //                 pending_negotiation: pendingNegotiation
// //               };
// //             } catch (error) {
// //               return { ...quote, has_pending_negotiation: false };
// //             }
// //           })
// //         );
        
// //         setPendingQuotes(quotesWithNegotiations);
// //       } catch (error) {
// //         console.error('Failed to fetch pending quotes:', error);
// //         setPendingQuotes([]);
// //       }

// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const navItems = [
// //     { path: '/dashboard', label: 'Home', icon: '🏠' },
// //     { path: '/jobs', label: 'Available', icon: '💼' },
// //     { path: '/my-jobs?filter=all', label: 'My Jobs', icon: '📋' },
// //     { path: '/wallet', label: 'Wallet', icon: '💰' },
// //     { path: '/profile', label: 'Profile', icon: '👤' },
// //   ];


// //   return (
// //     <div className="min-h-screen bg-grey-50 pb-20">
// //       {/* Top Navigation */}
// //       <TopNavigation profile={profile} logo={logo} />

// //       {/* Dashboard Content */}
// //       <div className="max-w-7xl mx-auto px-6 py-8">
// //         <h1 className="font-condensed font-bold text-4xl mb-6">
// //           Welcome Back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
// //         </h1>

// //         {loading ? (
// //           <Card>
// //             <p className="text-navy-600 text-center py-8">Loading dashboard...</p>
// //           </Card>
// //         ) : (
// //           <>
// //             {/* Profile Verification Status */}
// //             {verificationStatus && !verificationStatus.profileComplete && (
// //               <Card className="mb-6 border-2 border-coral-300 bg-coral-50">
// //                 <div className="flex items-start justify-between">
// //                   <div className="flex-1">
// //                     <h3 className="font-condensed font-bold text-lg text-navy-900 mb-2">
// //                       Complete Your Profile
// //                     </h3>
// //                     <p className="text-sm text-navy-600 mb-4">
// //                       Complete verification to access jobs and start earning.
// //                     </p>
                    
// //                     {/* Progress Bar */}
// //                     <div className="mb-4">
// //                       <div className="flex justify-between text-xs text-navy-600 mb-1">
// //                         <span>Profile Completeness</span>
// //                         <span className="font-semibold">{verificationStatus.percentage}%</span>
// //                       </div>
// //                       <div className="w-full bg-grey-200 rounded-full h-2">
// //                         <div 
// //                           className="bg-coral-500 h-2 rounded-full transition-all"
// //                           style={{ width: `${verificationStatus.percentage}%` }}
// //                         />
// //                       </div>
// //                     </div>

// //                     {/* Checklist */}
// //                     <ul className="space-y-2 text-sm mb-4">
// //                       <li className={verificationStatus.momo_verified ? 'text-mint-700' : 'text-coral-600'}>
// //                         {verificationStatus.momo_verified ? '✅' : '❌'} MoMo Verified
// //                       </li>
// //                       <li className={verificationStatus.identity_verified ? 'text-mint-700' : 'text-coral-600'}>
// //                         {verificationStatus.identity_verified ? '✅' : '❌'} Identity Info Complete (Ghana Card & Details)
// //                       </li>
// //                       <li className={verificationStatus.location_set ? 'text-mint-700' : 'text-coral-600'}>
// //                         {verificationStatus.location_set ? '✅' : '❌'} Location Set (GPS Address Required)
// //                       </li>
// //                     </ul>
                    
// //                     {verificationStatus.needsRecipientCode && (
// //                       <p className="text-xs text-navy-600 mb-2">
// //                         Note: Payment setup pending. This will be completed automatically.
// //                       </p>
// //                     )}

// //                     <Button
// //                       variant="primary"
// //                       size="sm"
// //                       onClick={() => navigate('/complete-profile')}
// //                     >
// //                       Complete Verification
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </Card>
// //             )}

// //             {/* Available Jobs Section - PRIORITY */}
// //             <div className="mb-8">
// //               <div className="flex items-center justify-between mb-4">
// //                 <h2 className="font-condensed font-bold text-2xl">
// //                   Available Jobs
// //                 </h2>
// //                 {availableJobs.length > 0 && (
// //                   <span className="text-sm text-navy-600 bg-indigo-100 px-3 py-1 rounded-full font-semibold">
// //                     {availableJobs.length} {availableJobs.length === 1 ? 'Job' : 'Jobs'}
// //                   </span>
// //                 )}
// //               </div>
              
// //               {availableJobs.length === 0 ? (
// //                 <Card>
// //                   <div className="text-center py-6">
// //                     <p className="text-navy-600 mb-4">No jobs available at the moment</p>
// //                     <Button
// //                       variant="primary"
// //                       size="sm"
// //                       onClick={() => navigate('/jobs')}
// //                     >
// //                       Check All Jobs
// //                     </Button>
// //                   </div>
// //                 </Card>
// //               ) : (
// //                 <div className="space-y-4 mb-4">
// //                   {availableJobs.slice(0, 3).map((job) => (
// //                     <Card 
// //                       key={job.id} 
// //                       className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200"
// //                       onClick={() => navigate(`/jobs/${job.id}`)}
// //                     >
// //                       <div className="flex justify-between items-start">
// //                         <div className="flex-1">
// //                           <div className="flex items-center gap-2 mb-2">
// //                             <h3 className="font-condensed font-bold text-lg text-navy-900">
// //                               {job.client_name || 'Client'}
// //                             </h3>
// //                             {job.has_quoted && (
// //                               <span className="inline-flex items-center px-2 py-1 rounded-full bg-mint-100 text-mint-700 text-xs font-semibold">
// //                                 ✓ Quote Submitted
// //                               </span>
// //                             )}
// //                           </div>
// //                           {job.job_description && (
// //                             <p className="text-navy-600 text-sm line-clamp-2 mb-2">
// //                               {job.job_description}
// //                             </p>
// //                           )}
// //                           {job.location_gps_address && (
// //                             <p className="text-navy-500 text-xs mb-2">
// //                               📍 {job.location_gps_address}
// //                             </p>
// //                           )}
// //                           {job.price_range_min_pesewas && job.price_range_max_pesewas && (
// //                             <p className="text-sm text-navy-700 font-semibold">
// //                               Budget: {formatCurrency(job.price_range_min_pesewas)} - {formatCurrency(job.price_range_max_pesewas)}
// //                             </p>
// //                           )}
// //                         </div>
// //                       </div>
// //                       <div className="mt-3 pt-3 border-t border-navy-200">
// //                         <Button
// //                           variant="primary"
// //                           size="sm"
// //                           fullWidth
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             navigate(job.has_quoted ? `/jobs/${job.id}` : `/jobs/${job.id}/submit-quote`);
// //                           }}
// //                         >
// //                           {job.has_quoted ? 'View Quote Status' : 'Submit Quote'}
// //                         </Button>
// //                       </div>
// //                     </Card>
// //                   ))}
// //                 </div>
// //               )}
              
// //               {availableJobs.length > 3 && (
// //                 <Button
// //                   variant="primary"
// //                   size="md"
// //                   fullWidth
// //                   onClick={() => navigate('/jobs')}
// //                 >
// //                   View All Available Jobs ({availableJobs.length})
// //                 </Button>
// //               )}
// //             </div>

// //             {/* Wallet Balance - Less Prominent */}
// //             <div className="grid md:grid-cols-2 gap-4 mb-8">
// //               <Card className="bg-navy-900 text-white">
// //                 <p className="text-grey-300 text-sm mb-1">Wallet Balance</p>
// //                 <p className="text-3xl font-semibold tabular-nums">
// //                   {formatCurrency(balance)}
// //                 </p>
// //                 <Button
// //                   variant="secondary"
// //                   size="sm"
// //                   className="mt-3"
// //                   onClick={() => navigate('/wallet')}
// //                 >
// //                   View Wallet
// //                 </Button>
// //               </Card>
// //               <Card className="bg-grey-100 border-2 border-grey-300">
// //                 <p className="text-navy-600 text-sm mb-1">Quick Actions</p>
// //                 <div className="space-y-2 mt-3">
// //                   <Button
// //                     variant="secondary"
// //                     size="sm"
// //                     fullWidth
// //                     onClick={() => navigate('/jobs')}
// //                   >
// //                     Browse All Jobs
// //                   </Button>
// //                   <Button
// //                     variant="secondary"
// //                     size="sm"
// //                     fullWidth
// //                     onClick={() => navigate('/profile')}
// //                   >
// //                     View Profile
// //                   </Button>
// //                 </div>
// //               </Card>
// //             </div>

// //             {/* Pending Quotes & Negotiations */}
// //             {pendingQuotes.length > 0 && (
// //               <div className="mb-8">
// //                 <h2 className="font-condensed font-bold text-2xl mb-4">
// //                   My Pending Quotes
// //                 </h2>
// //                 <div className="space-y-4">
// //                   {pendingQuotes.map((quote) => (
// //                     <Card 
// //                       key={quote.id} 
// //                       className={`cursor-pointer hover:shadow-lg transition-shadow ${
// //                         quote.has_pending_negotiation ? 'border-2 border-indigo-500' : ''
// //                       }`}
// //                       onClick={() => {
// //                         if (quote.has_pending_negotiation) {
// //                           navigate(`/quotes/${quote.id}/negotiation`);
// //                         }
// //                       }}
// //                     >
// //                       <div className="flex justify-between items-start">
// //                         <div className="flex-1">
// //                           <div className="flex items-center gap-2 mb-2">
// //                             <h3 className="font-condensed font-bold text-lg text-navy-900">
// //                               {quote.client_name || 'Client'}
// //                             </h3>
// //                             {quote.has_pending_negotiation && (
// //                               <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold animate-pulse">
// //                                 💬 New Counter-Offer!
// //                               </span>
// //                             )}
// //                           </div>
// //                           {quote.job_description && (
// //                             <p className="text-sm text-navy-600 mb-2 line-clamp-2">
// //                               {quote.job_description}
// //                             </p>
// //                           )}
// //                           <p className="text-sm text-navy-500">
// //                             Your Quote: <span className="font-semibold">{formatCurrency(quote.quoted_fee_pesewas)}</span>
// //                           </p>
// //                           {quote.has_pending_negotiation && quote.pending_negotiation && (
// //                             <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-200">
// //                               <p className="text-sm text-indigo-900 font-semibold">
// //                                 Client Offer: GHS {(quote.pending_negotiation.offered_amount_pesewas / 100).toFixed(2)}
// //                               </p>
// //                               {quote.pending_negotiation.message && (
// //                                 <p className="text-xs text-indigo-700 italic mt-1">
// //                                   "{quote.pending_negotiation.message}"
// //                                 </p>
// //                               )}
// //                             </div>
// //                           )}
// //                         </div>
// //                       </div>
// //                       {quote.has_pending_negotiation && (
// //                         <Button
// //                           variant="primary"
// //                           size="sm"
// //                           fullWidth
// //                           className="mt-3"
// //                           onClick={() => navigate(`/quotes/${quote.id}/negotiation`)}
// //                         >
// //                           💬 View & Respond
// //                         </Button>
// //                       )}
// //                     </Card>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}

// //             {/* In-Process Jobs */}
// //             <div>
// //               <h2 className="font-condensed font-bold text-2xl mb-4">
// //                 Jobs In Progress
// //               </h2>
// //               {activeJobs.length === 0 ? (
// //                 <Card>
// //                   <p className="text-navy-600 text-center py-4">No jobs in progress</p>
// //                   <Button
// //                     variant="secondary"
// //                     size="sm"
// //                     fullWidth
// //                     onClick={() => navigate('/my-jobs?filter=active')}
// //                     className="mt-2"
// //                   >
// //                     View My Active Jobs
// //                   </Button>
// //                 </Card>
// //               ) : (
// //                 <div className="space-y-4">
// //                   {activeJobs.slice(0, 3).map((job) => {
// //                     const getStatusLabel = (state) => {
// //                       if (state === 'STARTED') return { text: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-50' };
// //                       if (state === 'IN_PROGRESS') return { text: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-50' };
// //                       if (state === 'ESCROW_HELD') return { text: 'Payment Secured - Start Work', color: 'text-mint-600', bg: 'bg-mint-50' };
// //                       if (state === 'COMPLETED_PENDING') return { text: 'Awaiting Client Approval', color: 'text-purple-600', bg: 'bg-purple-50' };
// //                       return { text: state, color: 'text-navy-600', bg: 'bg-grey-50' };
// //                     };
// //                     const status = getStatusLabel(job.current_state);
                    
// //                     return (
// //                       <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
// //                         <div className="flex justify-between items-start mb-3">
// //                           <div className="flex-1">
// //                             <h3 className="font-condensed font-bold text-lg text-navy-900 mb-1">
// //                               {job.client_name || 'Client'}
// //                             </h3>
// //                             {job.job_description && (
// //                               <p className="text-navy-600 text-sm line-clamp-2 mb-2">
// //                                 {job.job_description}
// //                               </p>
// //                             )}
// //                             <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.color}`}>
// //                               {status.text}
// //                             </span>
// //                           </div>
// //                           {job.artisan_payout_pesewas && (
// //                             <div className="text-right ml-4">
// //                               <p className="text-navy-500 text-xs mb-1">You'll Earn</p>
// //                               <p className="font-semibold text-xl text-mint-600">
// //                                 {formatCurrency(job.artisan_payout_pesewas)}
// //                               </p>
// //                             </div>
// //                           )}
// //                         </div>
// //                         <Button
// //                           variant="secondary"
// //                           size="sm"
// //                           fullWidth
// //                           onClick={(e) => {
// //                             e.stopPropagation();
// //                             navigate(`/jobs/${job.id}`);
// //                           }}
// //                         >
// //                           View Details
// //                         </Button>
// //                       </Card>
// //                     );
// //                   })}
// //                   {activeJobs.length > 3 && (
// //                     <Button
// //                       variant="secondary"
// //                       size="sm"
// //                       fullWidth
// //                       onClick={() => navigate('/jobs')}
// //                     >
// //                       View All Jobs ({activeJobs.length})
// //                     </Button>
// //                   )}
// //                 </div>
// //               )}
// //             </div>
// //           </>
// //         )}
// //       </div>

// //       {/* Bottom Navigation */}
// //       <BottomNavigation items={navItems} />
// //     </div>
// //   );
// // };

// // export default Dashboard;
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation, TopNavigation, Badge } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [balance, setBalance] = React.useState(0);
//   const [activeJobs, setActiveJobs] = React.useState([]);
//   const [availableJobs, setAvailableJobs] = React.useState([]);
//   const [pendingQuotes, setPendingQuotes] = React.useState([]);
//   const [profile, setProfile] = React.useState(null);
//   const [verificationStatus, setVerificationStatus] = React.useState(null);
//   const [riviaStatus, setRiviaStatus] = React.useState('PENDING'); // Default to PENDING
//   const [loading, setLoading] = React.useState(true);

//   React.useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
      
//       // 1. Fetch Profile & Verification (Core Identity)
//       let canSeeGigs = false;
//       try {
//         const profileResponse = await apiClient.get('/profile/profile');
//         const profileData = profileResponse.data.profile;
//         setProfile(profileData);
        
//         // Mocking RiviaCo status if not in DB yet (A-06 requirement)
//         // In real impl, this comes from profileData.riviaco_status or /benefits endpoint
//         setRiviaStatus(profileData.riviaco_policy_id ? 'ACTIVE' : 'PENDING');

//         // Verification Logic (Tier 1 vs Tier 2)
//         const completeness = {
//           momo_verified: profileData.is_momo_verified || false,
//           identity_verified: profileData.is_identity_verified || false,
//           location_set: !!profileData.home_gps_address,
//         };
//         const totalChecks = 3;
//         const completedChecks = Object.values(completeness).filter(Boolean).length;
//         const percentage = Math.round((completedChecks / totalChecks) * 100);
//         const profileComplete = completeness.momo_verified && 
//                                completeness.identity_verified && 
//                                completeness.location_set;
        
//         canSeeGigs = profileComplete && !!profileData.paystack_recipient_code;
        
//         setVerificationStatus({
//           ...completeness,
//           percentage,
//           canSeeGigs,
//           profileComplete,
//           needsRecipientCode: !profileData.paystack_recipient_code,
//         });
//       } catch (error) {
//         console.error('Failed to fetch profile:', error);
//       }

//       // 2. Fetch Wallet Balance (A-06 Card 1)
//       try {
//         const balanceResponse = await apiClient.get('/finance/balance');
//         setBalance(balanceResponse.data.balance_pesewas || 0);
//       } catch (error) {
//         setBalance(0);
//       }

//       // 3. Fetch Jobs (Quote System Evolution)
//       if (canSeeGigs) {
//         // ... (Existing logic for Available Jobs & Quotes preserved)
//         try {
//           const availableResponse = await apiClient.get('/jobs/available');
//           const allAvailable = availableResponse.data.jobs || [];
          
//           try {
//             const quotesResponse = await apiClient.get('/jobs/my-quotes');
//             const myQuotes = quotesResponse.data.quotes || [];
            
//             // Map quotes to available jobs
//             const jobsWithQuotes = allAvailable.map(job => {
//               const myQuote = myQuotes.find(q => q.job_id === job.id && q.status === 'PENDING');
//               return { ...job, has_quoted: !!myQuote, my_quote: myQuote };
//             });
//             setAvailableJobs(jobsWithQuotes);

//             // Handle Pending Quotes with Negotiations
//             const quotesWithNegotiations = await Promise.all(
//               myQuotes.filter(q => q.status === 'PENDING').map(async (quote) => {
//                 try {
//                   const negResponse = await apiClient.get(`/jobs/quotes/${quote.id}/negotiations`);
//                   const negotiations = negResponse.data.negotiations || [];
//                   const pendingNeg = negotiations.find(n => n.status === 'PENDING' && n.offered_by === 'client');
//                   return { ...quote, has_pending_negotiation: !!pendingNeg, pending_negotiation: pendingNeg };
//                 } catch {
//                   return { ...quote, has_pending_negotiation: false };
//                 }
//               })
//             );
//             setPendingQuotes(quotesWithNegotiations);

//           } catch (e) {
//             setAvailableJobs(allAvailable);
//           }
//         } catch (e) {
//           setAvailableJobs([]);
//         }
//       }

//       // 4. Fetch Active Jobs
//       try {
//         const activeResponse = await apiClient.get('/jobs/my-jobs?filter=active');
//         const allActive = activeResponse.data.jobs || [];
//         setActiveJobs(allActive.filter(job => 
//           ['ESCROW_HELD', 'STARTED', 'IN_PROGRESS', 'COMPLETED_PENDING', 'MATCHED', 'AWAITING_PAYMENT'].includes(job.current_state)
//         ));
//       } catch (e) {
//         setActiveJobs([]);
//       }

//     } finally {
//       setLoading(false);
//     }
//   };

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Gigs', icon: '💼' }, // "Jobs" -> "Gigs" for clarity
//     { path: '/my-jobs?filter=active', label: 'Active', icon: '⚡' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   return (
//     <div className="min-h-screen bg-grey-50 pb-24">
//       <TopNavigation profile={profile} logo={logo} />

//       <div className="max-w-7xl mx-auto px-6 py-6">
//         {/* WELCOME SECTION */}
//         <div className="mb-6">
//           <h1 className="font-condensed font-bold text-3xl text-navy-900">
//             Welcome, {profile?.full_name?.split(' ')[0] || 'Artisan'}
//           </h1>
//           <p className="text-navy-500 text-sm">Ready to secure your next job?</p>
//         </div>

//         {/* A-06 HEADER STATS (NEW: Tier & Reputation) */}
//         {!loading && profile && (
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <div className="bg-white p-3 rounded-lg border border-navy-100 shadow-sm flex flex-col items-center justify-center">
//               <span className="text-navy-400 text-xs font-semibold uppercase tracking-wider">Tier Level</span>
//               <div className="flex items-baseline gap-1">
//                 <span className="text-2xl font-bold text-navy-900">{profile.tier_level || 1}</span>
//                 <span className="text-xs text-navy-400">/ 3</span>
//               </div>
//             </div>
//             <div className="bg-white p-3 rounded-lg border border-navy-100 shadow-sm flex flex-col items-center justify-center">
//               <span className="text-navy-400 text-xs font-semibold uppercase tracking-wider">Reputation</span>
//               <div className="flex items-center gap-1">
//                 <span className="text-2xl font-bold text-navy-900">{profile.reputation_score || '0.0'}</span>
//                 <span className="text-amber-400 text-sm">★</span>
//               </div>
//             </div>
//           </div>
//         )}

//         {loading ? (
//           <Card><p className="text-navy-600 text-center py-8">Loading ZOLID...</p></Card>
//         ) : (
//           <>
//             {/* PROFILE VERIFICATION (Evolution Feature: Enforces Tier 2) */}
//             {verificationStatus && !verificationStatus.profileComplete && (
//               <Card className="mb-6 border-l-4 border-coral-500 bg-white shadow-sm">
//                 <div className="flex justify-between items-start mb-2">
//                   <h3 className="font-condensed font-bold text-lg text-navy-900">Complete Verification</h3>
//                   <span className="text-coral-600 font-bold text-sm">{verificationStatus.percentage}%</span>
//                 </div>
//                 <div className="w-full bg-grey-200 rounded-full h-1.5 mb-3">
//                   <div className="bg-coral-500 h-1.5 rounded-full" style={{ width: `${verificationStatus.percentage}%` }} />
//                 </div>
//                 <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/complete-profile')}>
//                   Finish Setup to See Jobs
//                 </Button>
//               </Card>
//             )}

//             {/* FINANCIAL OVERVIEW (A-06 Cards 1 & 2) */}
//             <div className="grid grid-cols-2 gap-4 mb-8">
//               {/* Card 1: Wallet (Existing) */}
//               <Card className="bg-navy-900 text-white border-none shadow-md" onClick={() => navigate('/wallet')}>
//                 <div className="flex flex-col h-full justify-between">
//                   <p className="text-navy-300 text-xs uppercase tracking-wider mb-1">Wallet Balance</p>
//                   <p className="text-2xl font-bold tabular-nums truncate">{formatCurrency(balance)}</p>
//                 </div>
//               </Card>

//               {/* Card 2: RiviaCo Status (NEW A-06 Requirement) */}
//               <Card 
//                 className={`border-2 cursor-pointer shadow-sm ${riviaStatus === 'ACTIVE' ? 'bg-mint-50 border-mint-200' : 'bg-grey-50 border-grey-200'}`}
//                 onClick={() => navigate('/benefits')}
//               >
//                 <div className="flex flex-col h-full justify-between">
//                   <div className="flex justify-between items-start">
//                     <p className="text-navy-600 text-xs uppercase tracking-wider mb-1">RiviaCo Health</p>
//                     {riviaStatus === 'ACTIVE' ? (
//                       <span className="h-2 w-2 rounded-full bg-mint-500 animate-pulse"></span>
//                     ) : (
//                       <span className="h-2 w-2 rounded-full bg-grey-400"></span>
//                     )}
//                   </div>
//                   <p className={`text-lg font-condensed font-bold ${riviaStatus === 'ACTIVE' ? 'text-mint-700' : 'text-navy-500'}`}>
//                     {riviaStatus}
//                   </p>
//                 </div>
//               </Card>
//             </div>

//             {/* PRIORITY FEED: Available Jobs (Quote System Evolution) */}
//             <div className="mb-8">
//               <div className="flex items-center justify-between mb-3">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900">Open for Quotes</h2>
//                 {availableJobs.length > 0 && (
//                   <Badge variant="neutral">{availableJobs.length}</Badge>
//                 )}
//               </div>
              
//               {availableJobs.length === 0 ? (
//                 <div className="bg-grey-100 rounded-lg p-6 text-center border border-dashed border-grey-300">
//                   <p className="text-navy-500 text-sm mb-2">No jobs available right now.</p>
//                   <Button variant="ghost" size="sm" onClick={() => fetchDashboardData()}>Refresh Feed</Button>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {availableJobs.slice(0, 3).map((job) => (
//                     <Card 
//                       key={job.id} 
//                       className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer"
//                       onClick={() => navigate(job.has_quoted ? `/jobs/${job.id}` : `/jobs/${job.id}/submit-quote`)}
//                     >
//                       <div className="flex justify-between items-start mb-2">
//                         <div>
//                           <h3 className="font-bold text-navy-900">{job.client_name || 'Verified Client'}</h3>
//                           <p className="text-xs text-navy-500">📍 {job.location_gps_address || 'Accra'}</p>
//                         </div>
//                         {job.has_quoted && <Badge variant="success">Quoted</Badge>}
//                       </div>
//                       <p className="text-sm text-navy-700 line-clamp-2 mb-3">{job.job_description}</p>
                      
//                       {!job.has_quoted ? (
//                          <Button variant="primary" size="sm" fullWidth>Submit Quote</Button>
//                       ) : (
//                          <div className="text-center text-xs text-indigo-600 font-medium">View Status</div>
//                       )}
//                     </Card>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* SECONDARY FEED: Pending Negotiations */}
//             {pendingQuotes.length > 0 && (
//               <div className="mb-8">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900 mb-3">Negotiations</h2>
//                 <div className="space-y-3">
//                   {pendingQuotes.map((quote) => (
//                     <Card 
//                       key={quote.id}
//                       className="border border-indigo-100 bg-indigo-50 cursor-pointer"
//                       onClick={() => quote.has_pending_negotiation && navigate(`/quotes/${quote.id}/negotiation`)}
//                     >
//                       <div className="flex justify-between items-center mb-1">
//                         <span className="text-xs font-bold text-indigo-800 uppercase">Action Required</span>
//                         <span className="text-xs text-navy-500">{new Date(quote.created_at).toLocaleDateString()}</span>
//                       </div>
//                       <p className="text-sm font-medium text-navy-900 mb-2">
//                         Client countered your quote for <span className="font-bold">{quote.job_description?.substring(0, 20)}...</span>
//                       </p>
//                       <Button variant="secondary" size="sm" fullWidth>Respond to Offer</Button>
//                     </Card>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* ACTIVE JOBS (Work In Progress) */}
//             {activeJobs.length > 0 && (
//               <div>
//                 <h2 className="font-condensed font-bold text-xl text-navy-900 mb-3">In Progress</h2>
//                 {activeJobs.slice(0, 2).map(job => (
//                   <Card key={job.id} className="mb-3 border-l-4 border-l-mint-500" onClick={() => navigate(`/jobs/${job.id}`)}>
//                     <div className="flex justify-between">
//                       <h3 className="font-bold text-navy-900">{job.client_name}</h3>
//                       <span className="text-xs font-bold text-mint-600 px-2 py-1 bg-mint-50 rounded-full">
//                         {job.current_state.replace('_', ' ')}
//                       </span>
//                     </div>
//                     <p className="text-xs text-navy-500 mt-1">Payout: {formatCurrency(job.artisan_payout_pesewas)}</p>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default Dashboard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, TopNavigation, Badge } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
// 1. Import the service
import { getAddressFromMapbox } from '../utils/MapboxService';

// 2. Internal Helper Component for Text-Only Location
const JobLocation = ({ lat, lng, fallback }) => {
  const [locationName, setLocationName] = React.useState(fallback || "Locating...");

  React.useEffect(() => {
    let isMounted = true;
    if (lat && lng) {
      getAddressFromMapbox(lat, lng).then(fullAddress => {
        if (isMounted && fullAddress) {
          // Extract just the neighborhood/city (first part before the comma)
          // e.g., "Sakasaka, Tamale..." becomes "Sakasaka"
          setLocationName(fullAddress.split(',')[0]);
        }
      }).catch(() => {
        if (isMounted) setLocationName(fallback || "Location unavailable");
      });
    } else {
      setLocationName(fallback || "No GPS set");
    }
    return () => { isMounted = false; };
  }, [lat, lng, fallback]);

  return <span className="text-xs text-navy-500">📍 {locationName}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = React.useState(0);
  const [activeJobs, setActiveJobs] = React.useState([]);
  const [availableJobs, setAvailableJobs] = React.useState([]);
  const [pendingQuotes, setPendingQuotes] = React.useState([]);
  const [profile, setProfile] = React.useState(null);
  const [verificationStatus, setVerificationStatus] = React.useState(null);
  const [riviaStatus, setRiviaStatus] = React.useState('PENDING'); 
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Profile & Verification
      let canSeeGigs = false;
      try {
        const profileResponse = await apiClient.get('/profile/profile');
        const profileData = profileResponse.data.profile;
        setProfile(profileData);
        
        setRiviaStatus(profileData.riviaco_policy_id ? 'ACTIVE' : 'PENDING');

        const completeness = {
          momo_verified: profileData.is_momo_verified || false,
          identity_verified: profileData.is_identity_verified || false,
          location_set: !!profileData.home_gps_address,
        };
        const totalChecks = 3;
        const completedChecks = Object.values(completeness).filter(Boolean).length;
        const percentage = Math.round((completedChecks / totalChecks) * 100);
        const profileComplete = completeness.momo_verified && 
                               completeness.identity_verified && 
                               completeness.location_set;
        
        canSeeGigs = profileComplete && !!profileData.paystack_recipient_code;
        
        setVerificationStatus({
          ...completeness,
          percentage,
          canSeeGigs,
          profileComplete,
          needsRecipientCode: !profileData.paystack_recipient_code,
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }

      // 2. Fetch Wallet Balance
      try {
        const balanceResponse = await apiClient.get('/finance/balance');
        setBalance(balanceResponse.data.balance_pesewas || 0);
      } catch (error) {
        setBalance(0);
      }

      // 3. Fetch Jobs
      if (canSeeGigs) {
        try {
          const availableResponse = await apiClient.get('/jobs/available');
          const allAvailable = availableResponse.data.jobs || [];
          
          try {
            const quotesResponse = await apiClient.get('/jobs/my-quotes');
            const myQuotes = quotesResponse.data.quotes || [];
            
            const jobsWithQuotes = allAvailable.map(job => {
              const myQuote = myQuotes.find(q => q.job_id === job.id && q.status === 'PENDING');
              return { ...job, has_quoted: !!myQuote, my_quote: myQuote };
            });
            setAvailableJobs(jobsWithQuotes);

            const quotesWithNegotiations = await Promise.all(
              myQuotes.filter(q => q.status === 'PENDING').map(async (quote) => {
                try {
                  const negResponse = await apiClient.get(`/jobs/quotes/${quote.id}/negotiations`);
                  const negotiations = negResponse.data.negotiations || [];
                  const pendingNeg = negotiations.find(n => n.status === 'PENDING' && n.offered_by === 'client');
                  return { ...quote, has_pending_negotiation: !!pendingNeg, pending_negotiation: pendingNeg };
                } catch {
                  return { ...quote, has_pending_negotiation: false };
                }
              })
            );
            setPendingQuotes(quotesWithNegotiations);

          } catch (e) {
            setAvailableJobs(allAvailable);
          }
        } catch (e) {
          setAvailableJobs([]);
        }
      }

      // 4. Fetch Active Jobs
      try {
        const activeResponse = await apiClient.get('/jobs/my-jobs?filter=active');
        const allActive = activeResponse.data.jobs || [];
        setActiveJobs(allActive.filter(job => 
          ['ESCROW_HELD', 'STARTED', 'IN_PROGRESS', 'COMPLETED_PENDING', 'MATCHED', 'AWAITING_PAYMENT'].includes(job.current_state)
        ));
      } catch (e) {
        setActiveJobs([]);
      }

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
    <div className="min-h-screen bg-grey-50 pb-24">
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* WELCOME SECTION */}
        <div className="mb-6">
          <h1 className="font-condensed font-bold text-3xl text-navy-900">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Artisan'}
          </h1>
          <p className="text-navy-500 text-sm">Ready to secure your next job?</p>
        </div>

        {/* HEADER STATS */}
        {!loading && profile && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-3 rounded-lg border border-navy-100 shadow-sm flex flex-col items-center justify-center">
              <span className="text-navy-400 text-xs font-semibold uppercase tracking-wider">Tier Level</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-navy-900">{profile.tier_level || 1}</span>
                <span className="text-xs text-navy-400">/ 3</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-navy-100 shadow-sm flex flex-col items-center justify-center">
              <span className="text-navy-400 text-xs font-semibold uppercase tracking-wider">Reputation</span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-navy-900">{profile.reputation_score || '0.0'}</span>
                <span className="text-amber-400 text-sm">★</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <Card><p className="text-navy-600 text-center py-8">Loading ZOLID...</p></Card>
        ) : (
          <>
            {/* PROFILE VERIFICATION */}
            {verificationStatus && !verificationStatus.profileComplete && (
              <Card className="mb-6 border-l-4 border-coral-500 bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-condensed font-bold text-lg text-navy-900">Complete Verification</h3>
                  <span className="text-coral-600 font-bold text-sm">{verificationStatus.percentage}%</span>
                </div>
                <div className="w-full bg-grey-200 rounded-full h-1.5 mb-3">
                  <div className="bg-coral-500 h-1.5 rounded-full" style={{ width: `${verificationStatus.percentage}%` }} />
                </div>
                <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/complete-profile')}>
                  Finish Setup to See Jobs
                </Button>
              </Card>
            )}

            {/* FINANCIAL OVERVIEW */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="bg-navy-900 text-white border-none shadow-md" onClick={() => navigate('/wallet')}>
                <div className="flex flex-col h-full justify-between">
                  <p className="text-navy-300 text-xs uppercase tracking-wider mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold tabular-nums truncate">{formatCurrency(balance)}</p>
                </div>
              </Card>

              <Card 
                className={`border-2 cursor-pointer shadow-sm ${riviaStatus === 'ACTIVE' ? 'bg-mint-50 border-mint-200' : 'bg-grey-50 border-grey-200'}`}
                onClick={() => navigate('/benefits')}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-navy-600 text-xs uppercase tracking-wider mb-1">RiviaCo Health</p>
                    {riviaStatus === 'ACTIVE' ? (
                      <span className="h-2 w-2 rounded-full bg-mint-500 animate-pulse"></span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-grey-400"></span>
                    )}
                  </div>
                  <p className={`text-lg font-condensed font-bold ${riviaStatus === 'ACTIVE' ? 'text-mint-700' : 'text-navy-500'}`}>
                    {riviaStatus}
                  </p>
                </div>
              </Card>
            </div>

            {/* PRIORITY FEED: Available Jobs */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-condensed font-bold text-xl text-navy-900">Open for Quotes</h2>
                {availableJobs.length > 0 && (
                  <Badge variant="neutral">{availableJobs.length}</Badge>
                )}
              </div>
              
              {availableJobs.length === 0 ? (
                <div className="bg-grey-100 rounded-lg p-6 text-center border border-dashed border-grey-300">
                  <p className="text-navy-500 text-sm mb-2">No jobs available right now.</p>
                  <Button variant="ghost" size="sm" onClick={() => fetchDashboardData()}>Refresh Feed</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableJobs.slice(0, 3).map((job) => (
                    <Card 
                      key={job.id} 
                      className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(job.has_quoted ? `/jobs/${job.id}` : `/jobs/${job.id}/submit-quote`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-navy-900">{job.client_name || 'Verified Client'}</h3>
                          
                          {/* ------------------------------------------- */}
                          {/* 3. Updated Location Display (Text Only) */}
                          <JobLocation 
                             lat={job.location_lat} 
                             lng={job.location_lon} 
                             fallback={job.location_gps_address || 'Accra'}
                          />
                          {/* ------------------------------------------- */}

                        </div>
                        {job.has_quoted && <Badge variant="success">Quoted</Badge>}
                      </div>
                      <p className="text-sm text-navy-700 line-clamp-2 mb-3">{job.job_description}</p>
                      
                      {!job.has_quoted ? (
                         <Button variant="primary" size="sm" fullWidth>Submit Quote</Button>
                      ) : (
                         <div className="text-center text-xs text-indigo-600 font-medium">View Status</div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* SECONDARY FEED: Pending Negotiations */}
            {pendingQuotes.length > 0 && (
              <div className="mb-8">
                <h2 className="font-condensed font-bold text-xl text-navy-900 mb-3">Negotiations</h2>
                <div className="space-y-3">
                  {pendingQuotes.map((quote) => (
                    <Card 
                      key={quote.id}
                      className="border border-indigo-100 bg-indigo-50 cursor-pointer"
                      onClick={() => quote.has_pending_negotiation && navigate(`/quotes/${quote.id}/negotiation`)}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-800 uppercase">Action Required</span>
                        <span className="text-xs text-navy-500">{new Date(quote.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium text-navy-900 mb-2">
                        Client countered your quote for <span className="font-bold">{quote.job_description?.substring(0, 20)}...</span>
                      </p>
                      <Button variant="secondary" size="sm" fullWidth>Respond to Offer</Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIVE JOBS */}
            {activeJobs.length > 0 && (
              <div>
                <h2 className="font-condensed font-bold text-xl text-navy-900 mb-3">In Progress</h2>
                {activeJobs.slice(0, 2).map(job => (
                  <Card key={job.id} className="mb-3 border-l-4 border-l-mint-500" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <div className="flex justify-between">
                      <h3 className="font-bold text-navy-900">{job.client_name}</h3>
                      <span className="text-xs font-bold text-mint-600 px-2 py-1 bg-mint-50 rounded-full">
                        {job.current_state.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-navy-500 mt-1">Payout: {formatCurrency(job.artisan_payout_pesewas)}</p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default Dashboard;