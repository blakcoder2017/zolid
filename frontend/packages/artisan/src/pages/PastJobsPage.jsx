// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import { useAuth } from '@zolid/shared/hooks';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const PastJobsPage = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [loading, setLoading] = React.useState(true);
//   const [jobs, setJobs] = React.useState([]);
//   const [profile, setProfile] = React.useState(null);

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Available', icon: '💼' },
//     { path: '/my-jobs?filter=all', label: 'My Jobs', icon: '📋' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     if (user?.id) {
//       fetchPastJobs();
//       fetchProfile();
//     }
//   }, [user?.id]);

//   const fetchProfile = async () => {
//     try {
//       const response = await apiClient.get('/profile/profile');
//       setProfile(response.data.profile);
//     } catch (error) {
//       console.error('Failed to fetch profile:', error);
//     }
//   };

//   const fetchPastJobs = async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get('/jobs/my-jobs?filter=completed');
//       setJobs(response.data.jobs || []);
//     } catch (error) {
//       console.error('Failed to fetch past jobs:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-GB', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       {/* Top Navigation */}
//       <TopNavigation profile={profile} logo={logo} />

//       {/* Page Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <button
//           onClick={() => navigate('/dashboard')}
//           className="text-indigo-600 hover:text-indigo-700 mb-4 text-sm font-semibold"
//         >
//           ← Back to Dashboard
//         </button>

//         <h1 className="font-condensed font-bold text-4xl mb-6">
//           Past Jobs
//         </h1>

//         {loading ? (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading past jobs...</p>
//           </Card>
//         ) : jobs.length === 0 ? (
//           <Card>
//             <div className="text-center py-12">
//               <p className="text-navy-600 mb-4">No completed jobs yet</p>
//               <p className="text-navy-500 text-sm">
//                 Jobs you've completed and received payment for will appear here.
//               </p>
//             </div>
//           </Card>
//         ) : (
//           <div className="space-y-4">
//             {jobs.map((job) => (
//               <Card 
//                 key={job.id}
//                 className="hover:shadow-lg transition-shadow"
//               >
//                 <div className="flex justify-between items-start mb-3">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-2 flex-wrap">
//                       <h3 className="font-semibold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
//                       <span className="px-2 py-1 rounded text-xs font-semibold bg-mint-100 text-mint-700">
//                         Completed
//                       </span>
//                     </div>
//                     {job.job_description && (
//                       <p className="text-sm text-navy-600 mb-2 line-clamp-2">
//                         {job.job_description}
//                       </p>
//                     )}
//                     {job.client_name && (
//                       <p className="text-sm text-navy-600 mb-1">
//                         Client: <span className="font-medium">{job.client_name}</span>
//                       </p>
//                     )}
//                     {job.location_gps_address && (
//                       <p className="text-sm text-navy-500 mb-2">
//                         📍 {job.location_gps_address}
//                       </p>
//                     )}
//                     <div className="flex items-center justify-between mt-3">
//                       <div>
//                         <p className="text-sm text-navy-500">Earned</p>
//                         <p className="text-2xl font-bold text-mint-600">
//                           {formatCurrency(job.artisan_payout_pesewas || 0)}
//                         </p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-xs text-navy-500">
//                           Completed: {formatDate(job.updated_at || job.created_at)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
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

// export default PastJobsPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
// 1. Import Service
import { getAddressFromMapbox } from '../utils/MapboxService';

// 2. Helper Component for List View (Text Only)
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

  return <span className="text-sm text-navy-500">📍 {locationName}</span>;
};

const PastJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState([]);
  const [profile, setProfile] = React.useState(null);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];
  React.useEffect(() => {
    if (user?.id) {
      fetchPastJobs();
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchPastJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/jobs/my-jobs?filter=completed');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch past jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <TopNavigation profile={profile} logo={logo} />

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-700 mb-4 text-sm font-semibold"
        >
          ← Back to Dashboard
        </button>

        <h1 className="font-condensed font-bold text-4xl mb-6">
          Past Jobs
        </h1>

        {loading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading past jobs...</p>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-navy-600 mb-4">No completed jobs yet</p>
              <p className="text-navy-500 text-sm">
                Jobs you've completed and received payment for will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card 
                key={job.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-mint-100 text-mint-700">
                        Completed
                      </span>
                    </div>
                    {job.job_description && (
                      <p className="text-sm text-navy-600 mb-2 line-clamp-2">
                        {job.job_description}
                      </p>
                    )}
                    {job.client_name && (
                      <p className="text-sm text-navy-600 mb-1">
                        Client: <span className="font-medium">{job.client_name}</span>
                      </p>
                    )}
                    
                    {/* --- LOCATION DISPLAY (Text Only) --- */}
                    <div className="mb-2">
                      <JobLocation 
                         lat={job.location_lat} 
                         lng={job.location_lon} 
                         fallback={job.location_gps_address || "Location unavailable"}
                      />
                    </div>
                    {/* ------------------------------------ */}

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-sm text-navy-500">Earned</p>
                        <p className="text-2xl font-bold text-mint-600">
                          {formatCurrency(job.artisan_payout_pesewas || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500">
                          Completed: {formatDate(job.updated_at || job.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default PastJobsPage;