// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import LocationDisplay from '../components/LocationDisplay';
// import { ArrowLeft, Clock, ShieldAlert, CheckCircle, Briefcase, MapPin } from 'lucide-react';

// const JobDetailsPage = () => {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [job, setJob] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Bottom Navigation Configuration
//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/active-jobs', label: 'Active', icon: '⚡' },
//     { path: '/post-job', label: 'Post Job', icon: '➕' },
//     { path: '/jobs', label: 'All Jobs', icon: '📋' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   useEffect(() => {
//     const fetchJobDetails = async () => {
//       try {
//         const response = await apiClient.get(`/jobs/${jobId}`);
//         setJob(response.data.data);
//       } catch (error) {
//         console.error("Error fetching job details:", error);
//         alert("Failed to load job details.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (jobId) fetchJobDetails();
//   }, [jobId]);

//   if (loading) return <div className="p-10 text-center text-gray-500">Loading job details...</div>;
//   if (!job) return <div className="p-10 text-center text-red-500">Job not found</div>;

//   const getStatusBadge = (state) => {
//     const map = {
//       'DRAFT': 'bg-gray-100 text-gray-700',
//       'OPEN_FOR_QUOTES': 'bg-blue-100 text-blue-700',
//       'MATCHED_PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
//       'ESCROW_HELD': 'bg-purple-100 text-purple-800',
//       'STARTED': 'bg-indigo-100 text-indigo-800',
//       'IN_PROGRESS': 'bg-indigo-100 text-indigo-800',
//       'COMPLETED_PENDING': 'bg-green-100 text-green-800',
//       'PAYOUT_SUCCESS': 'bg-green-100 text-green-800',
//       'DISPUTED': 'bg-red-100 text-red-800',
//       'CANCELLED_REFUNDED': 'bg-gray-200 text-gray-600'
//     };
//     return (
//       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[state] || 'bg-gray-100'}`}>
//         {state.replace(/_/g, ' ')}
//       </span>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 pb-24">
//       {/* Header */}
//       <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
//         <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
//           <ArrowLeft className="w-5 h-5 text-gray-600" />
//         </button>
//         <h1 className="font-bold text-lg text-gray-800">Job Details</h1>
//       </div>

//       <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
//         {/* Main Info Card */}
//         <Card className="space-y-4">
//           <div className="flex justify-between items-start">
//             <div>
//               <h2 className="text-xl font-bold text-navy-900 mb-1">{job.job_description}</h2>
//               <p className="text-sm text-gray-500">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
//             </div>
//             {getStatusBadge(job.current_state)}
//           </div>

//           <div className="flex items-center gap-2 text-2xl font-bold text-navy-900">
//             {formatCurrency(job.gross_fee_pesewas)}
//           </div>

//           <div className="pt-4 border-t border-gray-100">
//             <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
//               <MapPin className="w-4 h-4" /> Location
//             </h3>
//             <LocationDisplay 
//               address={job.location_gps_address}
//               lat={job.location_lat}
//               lng={job.location_lon}
//             />
//           </div>
//         </Card>

//         {/* Artisan Info (If Assigned) */}
//         {job.artisan_id && (
//           <Card>
//             <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
//               <Briefcase className="w-4 h-4" /> Assigned Artisan
//             </h3>
//             <div className="flex items-center gap-4">
//               <img 
//                 src={job.artisan_profile_picture_url || "https://via.placeholder.com/50"} 
//                 alt="Artisan" 
//                 className="w-12 h-12 rounded-full border border-gray-200 object-cover"
//               />
//               <div>
//                 <p className="font-bold text-navy-900">{job.artisan_name}</p>
//                 <p className="text-sm text-gray-500">{job.artisan_phone || "Contact hidden"}</p>
//               </div>
//             </div>
//           </Card>
//         )}

//         {/* Action Buttons */}
//         <div className="space-y-3">
//           {job.current_state === 'DISPUTED' && (
//             <Button 
//               className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
//               onClick={() => navigate(`/disputes/${job.active_dispute_id || ''}`)}
//             >
//               <ShieldAlert className="w-4 h-4" /> Resolve Dispute
//             </Button>
//           )}

//           {job.current_state === 'COMPLETED_PENDING' && (
//             <Button 
//               className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
//               onClick={() => navigate(`/jobs/${job.id}/approve`)}
//             >
//               <CheckCircle className="w-4 h-4" /> Review & Approve Work
//             </Button>
//           )}

//           {job.current_state === 'OPEN_FOR_QUOTES' && (
//             <Button 
//               className="w-full bg-indigo-600 text-white"
//               onClick={() => navigate(`/quotes/${job.id}`)}
//             >
//               View Quotes
//             </Button>
//           )}
//         </div>
//       </div>

//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default JobDetailsPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import LocationDisplay from '../components/LocationDisplay';
import { ArrowLeft, ShieldAlert, CheckCircle, Briefcase, MapPin } from 'lucide-react';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configuration for Bottom Navigation
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await apiClient.get(`/jobs/${jobId}`);
        // Ensure we handle the response structure correctly (status: success, data: {...})
        setJob(response.data.data); 
      } catch (error) {
        console.error("Error fetching job details:", error);
        // If error is 404/403, we might want to redirect, but for now just show error state
      } finally {
        setLoading(false);
      }
    };

    if (jobId) fetchJobDetails();
  }, [jobId]);

  // --- FIX: IMAGE URL HELPER ---
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150?text=No+Img";
    // If it's already a full URL (e.g. firebase/cloudinary), use it
    if (path.startsWith('http')) return path;
    // Otherwise, prepend the backend URL (Update localhost:8000 to your real backend URL in prod)
    const BASE_URL = 'http://localhost:8000'; 
    return `${BASE_URL}${path}`;
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading job details...</div>;
  if (!job) return <div className="p-10 text-center text-red-500">Job not found</div>;

  const getStatusBadge = (state) => {
    const map = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'OPEN_FOR_QUOTES': 'bg-blue-100 text-blue-700',
      'MATCHED_PENDING_PAYMENT': 'bg-yellow-100 text-yellow-800',
      'ESCROW_HELD': 'bg-purple-100 text-purple-800',
      'STARTED': 'bg-indigo-100 text-indigo-800',
      'IN_PROGRESS': 'bg-indigo-100 text-indigo-800',
      'COMPLETED_PENDING': 'bg-green-100 text-green-800',
      'PAYOUT_SUCCESS': 'bg-green-100 text-green-800',
      'DISPUTED': 'bg-red-100 text-red-800',
      'CANCELLED_REFUNDED': 'bg-gray-200 text-gray-600'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[state] || 'bg-gray-100'}`}>
        {state ? state.replace(/_/g, ' ') : 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Job Details</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Main Info Card */}
        <Card className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-1">{job.job_description}</h2>
              <p className="text-sm text-gray-500">Posted on {new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            {getStatusBadge(job.current_state)}
          </div>

          <div className="flex items-center gap-2 text-2xl font-bold text-navy-900">
            {formatCurrency(job.gross_fee_pesewas)}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </h3>
            <LocationDisplay 
              address={job.location_gps_address}
              lat={job.location_lat}
              lng={job.location_lon}
            />
          </div>
        </Card>

        {/* Artisan Info (Only shows if an artisan is assigned) */}
        {job.artisan_id && (
          <Card>
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Assigned Artisan
            </h3>
            <div className="flex items-center gap-4">
              <img 
                src={getImageUrl(job.artisan_profile_picture_url)} 
                alt="Artisan" 
                className="w-14 h-14 rounded-full border-2 border-indigo-100 object-cover"
                onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=No+Img"; }}
              />
              <div>
                <p className="font-bold text-navy-900 text-lg">{job.artisan_name}</p>
                <p className="text-sm text-gray-500">
                  {job.artisan_phone || "Contact details hidden"}
                </p>
                {/* Rating Badge if available */}
                {job.artisan_rating && (
                   <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                     ★ {job.artisan_rating}
                   </span>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {job.current_state === 'DISPUTED' && (
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              onClick={() => navigate(`/disputes/${job.active_dispute_id || ''}`)}
            >
              <ShieldAlert className="w-4 h-4" /> Resolve Dispute
            </Button>
          )}

          {job.current_state === 'COMPLETED_PENDING' && (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              onClick={() => navigate(`/jobs/${job.id}/approve`)}
            >
              <CheckCircle className="w-4 h-4" /> Review & Approve Work
            </Button>
          )}

          {job.current_state === 'OPEN_FOR_QUOTES' && (
            <Button 
              className="w-full bg-indigo-600 text-white"
              onClick={() => navigate(`/quotes/${job.id}`)}
            >
              View Quotes
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default JobDetailsPage;