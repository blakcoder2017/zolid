// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const JobsPage = () => {
//   const navigate = useNavigate();
//   const [jobs, setJobs] = React.useState([]);
//   const [loading, setLoading] = React.useState(true);
//   const [profile, setProfile] = React.useState(null);

//   React.useEffect(() => {
//     fetchJobs();
//   }, []);

//   const [verificationError, setVerificationError] = React.useState(null);

//   const fetchJobs = async () => {
//     try {
//       setLoading(true);
//       setVerificationError(null);
//       // NEW QUOTE SYSTEM: Fetch jobs that are open for quotes
//       const response = await apiClient.get('/jobs/available');
//       setJobs(response.data.jobs || []);
      
//       // Also fetch artisan's quotes to show status
//       const quotesResponse = await apiClient.get('/jobs/my-quotes');
//       const myQuotes = quotesResponse.data.quotes || [];
      
//       // Add quote info to jobs
//       const jobsWithQuotes = (response.data.jobs || []).map(job => {
//         const myQuote = myQuotes.find(q => q.job_id === job.id && q.status === 'PENDING');
//         return {
//           ...job,
//           has_quoted: !!myQuote,
//           my_quote: myQuote
//         };
//       });
      
//       setJobs(jobsWithQuotes);
//     } catch (error) {
//       console.error('Failed to fetch available jobs:', error);
//       if ((error.status === 403 || error.response?.status === 403) && (error.data?.error || error.response?.data?.error)) {
//         setVerificationError({
//           message: error.data?.error || error.response?.data?.error || 'Access Denied: You must complete your profile verification to see jobs.',
//           status: error.data?.status || error.response?.data?.status,
//         });
//       }
//       setJobs([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Available', icon: '💼' },
//     { path: '/my-jobs?filter=all', label: 'My Jobs', icon: '📋' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];


//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       {/* Top Navigation */}
//       <TopNavigation profile={profile} logo={logo} />

//       {/* Page Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-6">
//           Available Jobs
//         </h1>

//         {loading ? (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading available jobs...</p>
//           </Card>
//         ) : verificationError ? (
//           <Card>
//             <div className="text-center py-8">
//               <div className="mb-4">
//                 <span className="text-4xl">🔒</span>
//               </div>
//               <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-2">
//                 Profile Verification Required
//               </h2>
//               <p className="text-navy-600 mb-6">
//                 {verificationError.message || 'You must complete your profile verification to see jobs.'}
//               </p>
//               {verificationError.status && (
//                 <div className="bg-grey-100 rounded-lg p-4 mb-6 text-left">
//                   <p className="text-sm font-semibold text-navy-900 mb-2">Verification Status:</p>
//                   <ul className="space-y-1 text-sm text-navy-600">
//                     <li className={verificationError.status.momo_verified ? 'text-mint-700' : 'text-coral-600'}>
//                       {verificationError.status.momo_verified ? '✅' : '❌'} MoMo Verified
//                     </li>
//                     <li className={verificationError.status.identity_verified ? 'text-mint-700' : 'text-coral-600'}>
//                       {verificationError.status.identity_verified ? '✅' : '❌'} Identity Verified
//                     </li>
//                     <li className={verificationError.status.location_set ? 'text-mint-700' : 'text-coral-600'}>
//                       {verificationError.status.location_set ? '✅' : '❌'} Location Set
//                     </li>
//                   </ul>
//                 </div>
//               )}
//               <Button
//                 variant="primary"
//                 size="md"
//                 onClick={() => navigate('/complete-profile')}
//               >
//                 Complete Profile Verification
//               </Button>
//             </div>
//           </Card>
//         ) : jobs.length === 0 ? (
//           <Card>
//             <p className="text-navy-600 text-center py-8">No available jobs at the moment</p>
//           </Card>
//         ) : (
//           <div className="space-y-4">
//             {jobs.map((job) => (
//               <Card key={job.id} className="hover:shadow-lg transition-shadow">
//                 <div className="flex justify-between items-start mb-4">
//                   <div className="flex-1">
//                     <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
//                       {job.client_name || 'Client'}
//                     </h3>
//                     {job.client_phone && (
//                       <p className="text-navy-600 text-sm mb-2">
//                         📞 {job.client_phone}
//                       </p>
//                     )}
//                     {job.job_description && (
//                       <div className="mb-3">
//                         <p className="text-navy-700 text-sm font-semibold mb-1">Description:</p>
//                         <p className="text-navy-600 text-sm line-clamp-3">
//                           {job.job_description}
//                         </p>
//                       </div>
//                     )}
//                     {job.location_gps_address && (
//                       <p className="text-navy-600 text-sm mb-1">
//                         📍 {job.location_gps_address}
//                       </p>
//                     )}
//                     {(job.location_lat && job.location_lon) && (
//                       <p className="text-navy-500 text-xs mb-2">
//                         Coordinates: {parseFloat(job.location_lat).toFixed(4)}, {parseFloat(job.location_lon).toFixed(4)}
//                       </p>
//                     )}
//                     {job.photo_evidence_before_url && (
//                       <div className="mt-2 mb-2">
//                         <p className="text-navy-700 text-xs font-semibold mb-1">Job Photo:</p>
//                         <img 
//                           src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
//                           alt="Job photo"
//                           className="w-full max-w-xs h-32 object-cover rounded-lg border border-navy-200"
//                         />
//                       </div>
//                     )}
//                     <p className="text-navy-500 text-xs mt-2">
//                       Posted: {new Date(job.created_at).toLocaleDateString('en-GB', {
//                         year: 'numeric',
//                         month: 'short',
//                         day: 'numeric',
//                         hour: '2-digit',
//                         minute: '2-digit'
//                       })}
//                     </p>
//                   </div>
//                   <div className="text-right ml-4">
//                     <div className="bg-indigo-50 rounded-lg p-3 mb-3">
//                       <p className="text-indigo-700 text-xs font-semibold mb-1">
//                         💰 Open for Quotes
//                       </p>
//                       <p className="text-indigo-900 text-lg font-bold">
//                         {job.quote_count || 0} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
//                       </p>
//                     </div>
//                     {job.quotes_deadline && (
//                       <p className="text-navy-500 text-xs">
//                         ⏰ Deadline: {new Date(job.quotes_deadline).toLocaleDateString('en-GB', {
//                           month: 'short',
//                           day: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//                 {job.has_quoted ? (
//                   <div className="bg-mint-50 border border-mint-300 rounded-lg p-3 text-center">
//                     <p className="text-mint-800 font-semibold text-sm">
//                       ✅ You've submitted a quote (GHS {((job.my_quote?.quoted_fee_pesewas || job.my_quote?.amount_pesewas || 0) / 100).toFixed(2)})
//                     </p>
//                   </div>
//                 ) : (
//                   <Button
//                     variant="primary"
//                     size="sm"
//                     fullWidth
//                     onClick={() => navigate(`/jobs/${job.id}/submit-quote`)}
//                   >
//                     💬 Submit Quote
//                   </Button>
//                 )}
//               </Card>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default JobsPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
// 1. Import Service for Text-Only Location
import { getAddressFromMapbox } from '../utils/MapboxService';

// 2. Helper Component for List View (Text Only)
// Displays "Neighborhood, City" instead of map or coords
const JobLocation = ({ lat, lng, fallback }) => {
  const [locationName, setLocationName] = React.useState(fallback || "Locating...");

  React.useEffect(() => {
    let isMounted = true;
    if (lat && lng) {
      getAddressFromMapbox(lat, lng).then(fullAddress => {
        if (isMounted && fullAddress) {
          // Parse: "Sakasaka, Tamale, Northern Region..." -> "Sakasaka, Tamale"
          const parts = fullAddress.split(',');
          const shortAddress = parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
          setLocationName(shortAddress);
        }
      }).catch(() => {
        if (isMounted) setLocationName(fallback || "Location unavailable");
      });
    } else {
      setLocationName(fallback || "No GPS set");
    }
    return () => { isMounted = false; };
  }, [lat, lng, fallback]);

  return <span className="text-navy-900 font-medium">📍 {locationName}</span>;
};

const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    fetchJobs();
  }, []);

  const [verificationError, setVerificationError] = React.useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setVerificationError(null);
      
      const response = await apiClient.get('/jobs/available');
      setJobs(response.data.jobs || []);
      
      const quotesResponse = await apiClient.get('/jobs/my-quotes');
      const myQuotes = quotesResponse.data.quotes || [];
      
      const jobsWithQuotes = (response.data.jobs || []).map(job => {
        const myQuote = myQuotes.find(q => q.job_id === job.id && q.status === 'PENDING');
        return {
          ...job,
          has_quoted: !!myQuote,
          my_quote: myQuote
        };
      });
      
      setJobs(jobsWithQuotes);
    } catch (error) {
      console.error('Failed to fetch available jobs:', error);
      if ((error.status === 403 || error.response?.status === 403) && (error.data?.error || error.response?.data?.error)) {
        setVerificationError({
          message: error.data?.error || error.response?.data?.error || 'Access Denied: You must complete your profile verification to see jobs.',
          status: error.data?.status || error.response?.data?.status,
        });
      }
      setJobs([]);
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
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-condensed font-bold text-4xl mb-6">
          Available Jobs
        </h1>

        {loading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading available jobs...</p>
          </Card>
        ) : verificationError ? (
          <Card>
            <div className="text-center py-8">
              <div className="mb-4"><span className="text-4xl">🔒</span></div>
              <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-2">Profile Verification Required</h2>
              <p className="text-navy-600 mb-6">{verificationError.message}</p>
              {verificationError.status && (
                <div className="bg-grey-100 rounded-lg p-4 mb-6 text-left">
                  <ul className="space-y-1 text-sm text-navy-600">
                    <li className={verificationError.status.momo_verified ? 'text-mint-700' : 'text-coral-600'}>
                      {verificationError.status.momo_verified ? '✅' : '❌'} MoMo Verified
                    </li>
                    <li className={verificationError.status.identity_verified ? 'text-mint-700' : 'text-coral-600'}>
                      {verificationError.status.identity_verified ? '✅' : '❌'} Identity Verified
                    </li>
                    <li className={verificationError.status.location_set ? 'text-mint-700' : 'text-coral-600'}>
                      {verificationError.status.location_set ? '✅' : '❌'} Location Set
                    </li>
                  </ul>
                </div>
              )}
              <Button variant="primary" size="md" onClick={() => navigate('/complete-profile')}>Complete Profile Verification</Button>
            </div>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <p className="text-navy-600 text-center py-8">No available jobs at the moment</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-condensed font-bold text-xl text-navy-900 mb-2">
                      {job.client_name || 'Client'}
                    </h3>
                    {job.client_phone && (
                      <p className="text-navy-600 text-sm mb-2">📞 {job.client_phone}</p>
                    )}
                    
                    {/* Description */}
                    {job.job_description && (
                      <div className="mb-3">
                        <p className="text-navy-700 text-sm font-semibold mb-1">Description:</p>
                        <p className="text-navy-600 text-sm line-clamp-3">{job.job_description}</p>
                      </div>
                    )}

                    {/* --- LOCATION DISPLAY (Text Only for List View) --- */}
                    <div className="mb-2">
                      <p className="text-navy-700 text-xs font-semibold mb-1">Location:</p>
                      <JobLocation 
                         lat={job.location_lat} 
                         lng={job.location_lon} 
                         fallback={job.location_gps_address || "Accra"}
                      />
                    </div>
                    {/* -------------------------------------------------- */}

                    {job.photo_evidence_before_url && (
                      <div className="mt-2 mb-2">
                        <p className="text-navy-700 text-xs font-semibold mb-1">Job Photo:</p>
                        <img 
                          src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
                          alt="Job photo"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border border-navy-200"
                        />
                      </div>
                    )}
                    <p className="text-navy-500 text-xs mt-2">
                      Posted: {new Date(job.created_at).toLocaleDateString('en-GB', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="bg-indigo-50 rounded-lg p-3 mb-3">
                      <p className="text-indigo-700 text-xs font-semibold mb-1">💰 Open for Quotes</p>
                      <p className="text-indigo-900 text-lg font-bold">
                        {job.quote_count || 0} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
                      </p>
                    </div>
                    {job.quotes_deadline && (
                      <p className="text-navy-500 text-xs">
                        ⏰ Deadline: {new Date(job.quotes_deadline).toLocaleDateString('en-GB', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                
                {job.has_quoted ? (
                  <div className="bg-mint-50 border border-mint-300 rounded-lg p-3 text-center">
                    <p className="text-mint-800 font-semibold text-sm">
                      ✅ You've submitted a quote (GHS {((job.my_quote?.quoted_fee_pesewas || job.my_quote?.amount_pesewas || 0) / 100).toFixed(2)})
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate(`/jobs/${job.id}/submit-quote`)}
                  >
                    💬 Submit Quote
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default JobsPage;