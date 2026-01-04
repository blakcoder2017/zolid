// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';
// import LocationDisplay from '../components/LocationDisplay'; // Import the new component

// const ViewQuotesPage = () => {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const [job, setJob] = React.useState(null);
//   const [quotes, setQuotes] = React.useState([]);
//   const [loading, setLoading] = React.useState(true);
//   const [accepting, setAccepting] = React.useState(null);

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'All Jobs', icon: '📋' },
//     { path: '/post-job', label: 'Post Job', icon: '➕' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     fetchJobAndQuotes();
//   }, [jobId]);

//   const fetchJobAndQuotes = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch job details
//       const jobResponse = await apiClient.get(`/jobs/${jobId}`);
//       setJob(jobResponse.data.job);
      
//       // Fetch quotes for this job
//       const quotesResponse = await apiClient.get(`/jobs/${jobId}/quotes`);
//       setQuotes(quotesResponse.data.quotes || []);
      
//     } catch (error) {
//       console.error('Failed to fetch job and quotes:', error);
//       alert('Failed to load quotes');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAcceptQuote = async (quoteId) => {
//     if (!window.confirm('Accept this quote? You will be redirected to complete payment.')) {
//       return;
//     }
    
//     try {
//       setAccepting(quoteId);
//       const response = await apiClient.post(`/jobs/${jobId}/accept-quote`, {
//         quote_id: quoteId
//       });
      
//       console.log('Quote acceptance response:', response.data);
      
//       // Redirect to payment link
//       if (response.data.payment_link) {
//         // Payment link is available - redirect immediately
//         console.log('Redirecting to Paystack:', response.data.payment_link);
//         window.location.href = response.data.payment_link;
//       } else if (response.data.retry_payment) {
//         // Quote accepted but payment link generation failed
//         alert(`✅ Quote accepted successfully!\n\nHowever, payment link generation failed: ${response.data.payment_error || 'Unknown error'}\n\nPlease contact support or try again later.`);
//         navigate('/pending-jobs');
//       } else {
//         // Quote accepted but no payment link (shouldn't happen)
//         alert('✅ Quote accepted! However, payment link is not available. Please check your pending jobs.');
//         navigate('/pending-jobs');
//       }
      
//     } catch (error) {
//       console.error('Failed to accept quote:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
//       alert('Failed to accept quote: ' + errorMessage);
//       setAccepting(null);
//     }
//   };

//   const getBestValueBadge = (quote, allQuotes) => {
//     if (allQuotes.length < 2) return null;
    
//     // Calculate score: lower price + higher rating = better value
//     const priceScore = 1 - (quote.quoted_fee_pesewas / Math.max(...allQuotes.map(q => q.quoted_fee_pesewas)));
//     const ratingScore = quote.artisan_rating / 5;
//     const totalScore = (priceScore * 0.6) + (ratingScore * 0.4);
    
//     const bestScore = Math.max(...allQuotes.map(q => {
//       const pScore = 1 - (q.quoted_fee_pesewas / Math.max(...allQuotes.map(qq => qq.quoted_fee_pesewas)));
//       const rScore = q.artisan_rating / 5;
//       return (pScore * 0.6) + (rScore * 0.4);
//     }));
    
//     if (totalScore === bestScore) {
//       return (
//         <span className="inline-block px-3 py-1 bg-mint-500 text-white text-xs font-bold rounded-full">
//           ⭐ BEST VALUE
//         </span>
//       );
//     }
    
//     return null;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <nav className="bg-navy-900 text-white px-6 py-4">
//           <img src={logo} alt="ZOLID" className="h-8 w-auto" />
//         </nav>
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading quotes...</p>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   if (!job) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <nav className="bg-navy-900 text-white px-6 py-4">
//           <img src={logo} alt="ZOLID" className="h-8 w-auto" />
//         </nav>
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <Card>
//             <p className="text-navy-600 text-center py-8">Job not found</p>
//             <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
//               Back to Dashboard
//             </Button>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       {/* Top Navigation */}
//       <nav className="bg-navy-900 text-white px-6 py-4">
//         <div className="flex items-center justify-between">
//           <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
//         </div>
//       </nav>

//       {/* Page Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <Button 
//           variant="ghost" 
//           size="sm" 
//           onClick={() => navigate('/dashboard')}
//           className="mb-4"
//         >
//           ← Back
//         </Button>

//         <h1 className="font-condensed font-bold text-3xl mb-2">
//           Quotes for Your Job
//         </h1>
//         <p className="text-navy-600 mb-6">
//           {quotes.length} artisan{quotes.length !== 1 ? 's have' : ' has'} submitted quote{quotes.length !== 1 ? 's' : ''}
//         </p>

//         {/* Job Details */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Details</h2>
//           <div className="space-y-2">
//             {job.job_description && (
//               <div>
//                 <p className="text-navy-500 text-sm">Description</p>
//                 <p className="text-navy-900">{job.job_description}</p>
//               </div>
//             )}
//             {job.location_gps_address && (
//               <div>
//                 <p className="text-navy-500 text-sm">Location</p>
//                 {/* <p className="text-navy-900">📍 {job.location_gps_address}</p> */}
//                 <LocationDisplay lat={job.location_lat} lng={job.location_lon} />
//               </div>
//             )}
//             {job.quotes_deadline && (
//               <div>
//                 <p className="text-navy-500 text-sm">Quote Deadline</p>
//                 <p className="text-navy-900">
//                   {new Date(job.quotes_deadline).toLocaleDateString()} at{' '}
//                   {new Date(job.quotes_deadline).toLocaleTimeString()}
//                 </p>
//               </div>
//             )}
//           </div>
//         </Card>

//         {/* Quotes List */}
//         {quotes.length === 0 ? (
//           <Card>
//             <div className="text-center py-12">
//               <span className="text-6xl mb-4 block">⏳</span>
//               <p className="text-navy-600 text-xl mb-2">Waiting for Quotes</p>
//               <p className="text-navy-500">
//                 Artisans will submit quotes soon. You'll be notified when quotes arrive.
//               </p>
//             </div>
//           </Card>
//         ) : (
//           <div className="space-y-4">
//             {quotes
//               .sort((a, b) => a.quoted_fee_pesewas - b.quoted_fee_pesewas) // Sort by price: low to high
//               .map((quote, index) => (
//                 <Card key={quote.id} className="hover:shadow-lg transition-shadow">
//                   <div className="flex justify-between items-start mb-4">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         {quote.artisan_picture ? (
//                           <img 
//                             src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${quote.artisan_picture}`}
//                             alt={quote.artisan_name}
//                             className="w-12 h-12 rounded-full object-cover border-2 border-navy-200"
//                           />
//                         ) : (
//                           <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
//                             {quote.artisan_name?.charAt(0) || 'A'}
//                           </div>
//                         )}
//                         <div>
//                           <h3 className="font-condensed font-bold text-lg text-navy-900">
//                             {quote.artisan_name}
//                           </h3>
//                           <div className="flex items-center gap-3 text-sm text-navy-600">
//                             <span>⭐ {parseFloat(quote.artisan_rating || 0).toFixed(1)}/5.0</span>
//                             <span>• {quote.completed_jobs || 0} jobs</span>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {getBestValueBadge(quote, quotes)}
                      
//                       {quote.quote_message && (
//                         <div className="mt-3 p-3 bg-grey-50 rounded-lg">
//                           <p className="text-navy-700 text-sm">{quote.quote_message}</p>
//                         </div>
//                       )}
                      
//                       {quote.estimated_duration_hours && (
//                         <p className="text-sm text-navy-600 mt-2">
//                           ⏱️ Estimated: {quote.estimated_duration_hours} hour{quote.estimated_duration_hours !== 1 ? 's' : ''}
//                         </p>
//                       )}
//                     </div>
                    
//                     <div className="text-right ml-4">
//                       <p className="text-navy-500 text-sm mb-1">Quote</p>
//                       <p className="font-bold text-3xl text-navy-900 mb-1">
//                         {formatCurrency(quote.quoted_fee_pesewas)}
//                       </p>
//                       <p className="text-navy-500 text-xs">+ GHS {(quote.warranty_fee_pesewas / 100).toFixed(2)} warranty</p>
//                       <div className="border-t border-navy-200 mt-2 pt-2">
//                         <p className="text-navy-500 text-xs">You Pay:</p>
//                         <p className="font-semibold text-xl text-indigo-600">
//                           {formatCurrency(quote.total_client_pays_pesewas)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex gap-2 mt-4">
//                     <Button
//                       variant="secondary"
//                       size="sm"
//                       onClick={() => navigate(`/quotes/${quote.id}/negotiate`)}
//                       className="flex-1"
//                     >
//                       💬 Negotiate
//                     </Button>
//                     <Button
//                       variant="primary"
//                       size="sm"
//                       onClick={() => handleAcceptQuote(quote.id)}
//                       disabled={accepting === quote.id}
//                       className="flex-1"
//                     >
//                       {accepting === quote.id ? 'Processing...' : '✅ Accept & Pay'}
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//           </div>
//         )}

//         {quotes.length > 0 && (
//           <Card className="mt-6 bg-navy-50 border-navy-200">
//             <p className="text-sm text-navy-700">
//               <strong>💡 Tip:</strong> Consider both price and artisan rating when selecting a quote. 
//               Higher-rated artisans typically deliver better quality work.
//             </p>
//           </Card>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default ViewQuotesPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import LocationDisplay from '../components/LocationDisplay';
import RaiseDisputeModal from '../components/RaiseDisputeModal';
import { getAddressFromMapbox } from '../utils/MapboxService';

// --- HELPER: Handle Tier Levels gracefully ---
const getTierLabel = (level) => {
  if (!level) return 'Tier 1'; // Default if missing
  const numLevel = parseInt(level);
  if (numLevel === 2) return 'Tier 2 (Pro)';
  if (numLevel === 3) return 'Tier 3 (Elite)';
  return `Tier ${numLevel}`;
};

const ViewQuotesPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [locationName, setLocationName] = useState("...");

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  useEffect(() => { fetchData(); }, [jobId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobResponse = await apiClient.get(`/jobs/${jobId}`);
      setJob(jobResponse.data.job);

      if (jobResponse.data.job.location_lat) {
        getAddressFromMapbox(jobResponse.data.job.location_lat, jobResponse.data.job.location_lon)
          .then(addr => setLocationName(addr.split(',')[0]))
          .catch(() => setLocationName("Site"));
      }

      if (['OPEN_FOR_QUOTES', 'QUOTED'].includes(jobResponse.data.job.current_state)) {
        const quotesResponse = await apiClient.get(`/jobs/${jobId}/quotes`);
        setQuotes(quotesResponse.data.quotes || []);
      }
      
      const profileRes = await apiClient.get('/profile/profile');
      setProfile(profileRes.data.profile);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    if (!window.confirm('Accept this quote? You will be redirected to payment.')) return;
    try {
      setAccepting(quoteId);
      const response = await apiClient.post(`/jobs/${jobId}/accept-quote`, { quote_id: quoteId });
      if (response.data.payment_link) window.location.href = response.data.payment_link;
      else navigate('/dashboard');
    } catch (error) {
      alert('Failed: ' + (error.response?.data?.message || error.message));
      setAccepting(null);
    }
  };

  const handleApproveWork = async () => {
    if (!window.confirm('Approve work and release payment?')) return;
    try {
      setApproving(true);
      await apiClient.post(`/jobs/${jobId}/approve-work`);
      alert('✅ Work approved!');
      fetchData();
    } catch (error) {
      alert('Failed: ' + error.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-navy-600">Loading details...</div>;
  if (!job) return <div className="p-8 text-center text-coral-600">Job not found</div>;

  const isDisputed = job.current_state === 'DISPUTED';
  const isJobActive = ['ESCROW_HELD', 'IN_PROGRESS', 'COMPLETED_PENDING'].includes(job.current_state);
  const showReview = job.current_state === 'COMPLETED_PENDING';

  return (
    <div className="min-h-screen bg-grey-50 pb-24">
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-2 pl-0 hover:bg-transparent text-navy-600">
              ← Back to Dashboard
            </Button>
            <h1 className="font-condensed font-bold text-3xl text-navy-900">Job #{jobId.substring(0,6)}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${job.current_state === 'OPEN_FOR_QUOTES' ? 'bg-green-100 text-green-800' : 
                  job.current_state === 'DISPUTED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {job.current_state.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-navy-500">• {locationName}</span>
            </div>
          </div>
        </div>

        {/* --- ALERTS --- */}
        {isDisputed && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
             <h3 className="font-bold text-red-800 flex items-center gap-2">
               <span className="text-xl">🚨</span> Job Disputed
             </h3>
             <p className="text-sm text-red-700 mt-1">Funds are frozen while Admin reviews the case.</p>
          </div>
        )}

        {/* --- ACTION CARDS --- */}
        {showReview && !isDisputed && (
          <Card className="mb-6 border-l-4 border-l-mint-500 bg-white shadow-md">
            <h2 className="font-bold text-xl mb-2 text-navy-900">Review Work</h2>
            <p className="text-navy-600 mb-4 text-sm">The artisan has marked this job as complete. Please inspect the work.</p>
            <div className="flex flex-col sm:flex-row gap-3">
               <Button variant="primary" onClick={handleApproveWork} disabled={approving} className="w-full sm:w-auto">
                 {approving ? 'Processing...' : '✅ Approve & Release Funds'}
               </Button>
               <Button variant="secondary" className="w-full sm:w-auto border-coral-200 text-coral-600 hover:bg-coral-50" onClick={() => setShowDisputeModal(true)}>
                 Report Issue
               </Button>
            </div>
          </Card>
        )}

        {isJobActive && !showReview && !isDisputed && (
            <Card className="mb-6 bg-white shadow-sm border border-indigo-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-bold text-lg text-navy-900">Work in Progress</h2>
                        <p className="text-sm text-navy-500">Funds are held safely in escrow.</p>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm"
                        className="w-full sm:w-auto border-coral-200 text-coral-600 hover:bg-coral-50"
                        onClick={() => setShowDisputeModal(true)}
                    >
                        🚩 Raise Dispute
                    </Button>
                </div>
            </Card>
        )}

        {/* --- JOB DETAILS --- */}
        <Card className="mb-8 shadow-sm">
             <h2 className="font-condensed font-bold text-xl text-navy-900 mb-3 border-b border-grey-100 pb-2">Job Details</h2>
             <p className="mb-6 text-navy-700 leading-relaxed">{job.job_description}</p>
             <LocationDisplay lat={job.location_lat} lng={job.location_lon} isArtisan={false} />
        </Card>

        {/* --- QUOTES LIST --- */}
        {['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state) && (
          <div className="space-y-6">
            <h2 className="font-condensed font-bold text-2xl text-navy-900">
              Quotes Received <span className="text-navy-400 text-lg font-normal">({quotes.length})</span>
            </h2>
            
            {quotes.length === 0 ? (
              <div className="text-center py-12 bg-grey-50 rounded-lg border border-dashed border-grey-300">
                <p className="text-navy-500">No quotes yet. We've notified artisans in your area.</p>
              </div>
            ) : (
              quotes
                .sort((a, b) => a.quoted_fee_pesewas - b.quoted_fee_pesewas)
                .map((quote) => (
                  <Card key={quote.id} className="hover:shadow-md transition-shadow border border-grey-200 overflow-hidden">
                    
                    {/* Responsive Grid: Stacks on mobile, Row on desktop */}
                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                      
                      {/* LEFT: Artisan Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {quote.artisan_picture ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${quote.artisan_picture}`}
                              alt={quote.artisan_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                              {quote.artisan_name?.charAt(0) || 'A'}
                            </div>
                          )}
                          
                          <div>
                            <h3 className="font-bold text-lg text-navy-900 leading-tight">
                              {quote.artisan_name}
                            </h3>
                            
                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                ⭐ {parseFloat(quote.artisan_rating || 0).toFixed(1)}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {getTierLabel(quote.artisan_level || quote.tier_level)}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-grey-100 text-grey-600">
                                {quote.completed_jobs || 0} jobs
                              </span>
                            </div>
                          </div>
                        </div>
                         
                        {/* Quote Message Bubble */}
                        {quote.quote_message && (
                          <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-50">
                            <p className="text-navy-700 text-sm italic">"{quote.quote_message}"</p>
                          </div>
                        )}
                         
                        {quote.estimated_duration_hours && (
                          <p className="text-xs text-navy-500 mt-2 flex items-center gap-1">
                            <span>⏱️</span> Estimated time: <span className="font-semibold">{quote.estimated_duration_hours} hour{quote.estimated_duration_hours !== 1 ? 's' : ''}</span>
                          </p>
                        )}
                      </div>
                       
                      {/* RIGHT: Pricing (Top on desktop, Bottom w/ border on mobile) */}
                      <div className="w-full sm:w-auto sm:text-right border-t sm:border-0 border-grey-100 pt-4 sm:pt-0 mt-2 sm:mt-0">
                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end">
                          <p className="text-navy-500 text-xs uppercase tracking-wide font-semibold">Service Fee</p>
                          <p className="font-bold text-2xl text-navy-900">
                            {formatCurrency(quote.quoted_fee_pesewas)}
                          </p>
                        </div>
                        
                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end mt-1 sm:mt-0">
                          <p className="text-navy-400 text-xs">Warranty (5%)</p>
                          <p className="text-navy-500 text-sm">
                            + {formatCurrency(quote.warranty_fee_pesewas)}
                          </p>
                        </div>

                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end mt-3 pt-3 border-t border-grey-100">
                          <p className="text-navy-600 text-sm font-bold">You Pay</p>
                          <p className="font-black text-xl text-indigo-600">
                            {formatCurrency(quote.total_client_pays_pesewas)}
                          </p>
                        </div>
                      </div>
                    </div>
   
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/quotes/${quote.id}/negotiate`)}
                        className="w-full justify-center"
                      >
                        💬 Negotiate
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleAcceptQuote(quote.id)}
                        disabled={accepting === quote.id}
                        className="w-full justify-center shadow-md shadow-indigo-100"
                      >
                        {accepting === quote.id ? 'Processing...' : '✅ Accept & Pay'}
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        )}

        {/* --- MODAL --- */}
        {showDisputeModal && (
          <RaiseDisputeModal 
            jobId={job.id} 
            onClose={() => setShowDisputeModal(false)}
            onSuccess={() => { setShowDisputeModal(false); fetchData(); }}
          />
        )}
      </div>
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default ViewQuotesPage;