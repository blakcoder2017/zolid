// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const JobDetailsPage = () => {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const [job, setJob] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [profile, setProfile] = React.useState(null);
//   const [photoFile, setPhotoFile] = React.useState(null);
//   const [photoPreview, setPhotoPreview] = React.useState(null);
//   const [uploading, setUploading] = React.useState(false);
//   const [submitting, setSubmitting] = React.useState(false);

//   React.useEffect(() => {
//     fetchJobDetails();
//     fetchProfile();
//   }, [jobId]);

//   const fetchProfile = async () => {
//     try {
//       const response = await apiClient.get('/profile/profile');
//       setProfile(response.data.profile);
//     } catch (error) {
//       console.error('Failed to fetch profile:', error);
//     }
//   };

//   const fetchJobDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get(`/jobs/${jobId}`);
//       setJob(response.data.job);
//       if (response.data.job?.photo_evidence_after_url) {
//         setPhotoPreview(response.data.job.photo_evidence_after_url);
//       }
//     } catch (error) {
//       console.error('Failed to fetch job details:', error);
//       alert('Failed to load job details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePhotoChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setPhotoFile(file);
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPhotoPreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleUploadPhoto = async () => {
//     if (!photoFile) {
//       alert('Please select a photo first');
//       return;
//     }

//     try {
//       setUploading(true);
//       const formData = new FormData();
//       formData.append('after_photo', photoFile);
//       formData.append('job_id', jobId);

//       const response = await apiClient.post('/upload/job-photos', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });

//       alert('✅ Photo uploaded successfully!');
//       await fetchJobDetails(); // Refresh to get uploaded photo
//       setPhotoFile(null);
//     } catch (error) {
//       console.error('Failed to upload photo:', error);
//       alert('Failed to upload photo: ' + (error.message || 'Unknown error'));
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleRequestSignoff = async () => {
//     if (!job?.photo_evidence_after_url && !photoFile) {
//       alert('⚠️ You must upload completion photos before requesting sign-off');
//       return;
//     }

//     // If photo not uploaded yet, upload it first
//     if (photoFile && !job?.photo_evidence_after_url) {
//       await handleUploadPhoto();
//     }

//     try {
//       setSubmitting(true);
//       const response = await apiClient.post(`/jobs/${jobId}/request-signoff`, {
//         photo_evidence_after_url: job?.photo_evidence_after_url
//       });

//       alert('✅ ' + (response.data?.message || 'Sign-off requested! Client will review your work.'));
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Failed to request sign-off:', error);
//       alert('Failed to request sign-off: ' + (error.message || 'Unknown error'));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Jobs', icon: '💼' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   const getStatusBadge = (state) => {
//     const badges = {
//       'STARTED': { text: 'In Progress', className: 'bg-indigo-100 text-indigo-700' },
//       'IN_PROGRESS': { text: 'In Progress', className: 'bg-indigo-100 text-indigo-700' },
//       'ESCROW_HELD': { text: 'Payment Secured', className: 'bg-mint-100 text-mint-700' },
//       'COMPLETED_PENDING': { text: 'Awaiting Approval', className: 'bg-coral-100 text-coral-700' },
//       'MATCHED_PENDING_PAYMENT': { text: 'Awaiting Payment', className: 'bg-yellow-100 text-yellow-700' },
//       'MATCHED': { text: 'Quote Accepted', className: 'bg-yellow-100 text-yellow-700' },
//       'AWAITING_PAYMENT': { text: 'Awaiting Payment', className: 'bg-yellow-100 text-yellow-700' }
//     };
//     return badges[state] || { text: state, className: 'bg-grey-100 text-grey-700' };
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <TopNavigation profile={profile} logo={logo} />
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading job details...</p>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   if (!job) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <TopNavigation profile={profile} logo={logo} />
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

//   const status = getStatusBadge(job.current_state);
//   // Can upload photo for IN_PROGRESS, ESCROW_HELD, STARTED jobs
//   const canUploadPhoto = ['IN_PROGRESS', 'STARTED', 'ESCROW_HELD'].includes(job.current_state);
//   // Can request signoff for IN_PROGRESS, ESCROW_HELD, STARTED jobs with photos
//   const canRequestSignoff = ['IN_PROGRESS', 'STARTED', 'ESCROW_HELD'].includes(job.current_state) && 
//                             (job.photo_evidence_after_url || photoFile);

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       <TopNavigation profile={profile} logo={logo} />

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
//           Job #{jobId.substring(0, 8)}
//         </h1>

//         <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-6 ${status.className}`}>
//           {status.text}
//         </span>

//         {/* Job Info */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Information</h2>
//           <div className="space-y-3">
//             <div>
//               <p className="text-navy-500 text-sm">Client</p>
//               <p className="text-navy-900 font-semibold">{job.client_name || 'N/A'}</p>
//               {job.client_phone && <p className="text-navy-600 text-sm">{job.client_phone}</p>}
//             </div>
//             {job.job_description && (
//               <div>
//                 <p className="text-navy-500 text-sm">Description</p>
//                 <p className="text-navy-900">{job.job_description}</p>
//               </div>
//             )}
//             {job.location_gps_address && (
//               <div>
//                 <p className="text-navy-500 text-sm">Location</p>
//                 <p className="text-navy-900">{job.location_gps_address}</p>
//               </div>
//             )}
//             <div className="border-t border-grey-200 pt-3">
//               <div className="flex justify-between items-center">
//                 <p className="text-navy-500 text-sm">Your Earnings</p>
//                 <p className="font-bold text-2xl text-mint-600">
//                   {formatCurrency(job.artisan_payout_pesewas)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </Card>

//         {/* Before Photo */}
//         {job.photo_evidence_before_url && (
//           <Card className="mb-6">
//             <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Before Photo</h2>
//             <img 
//               src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
//               alt="Before"
//               className="w-full rounded-lg"
//             />
//           </Card>
//         )}

//         {/* After Photo Upload */}
//         {canUploadPhoto && (
//           <Card className="mb-6">
//             <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">
//               Completion Photos {job.photo_evidence_after_url ? '(Uploaded)' : '(Required)'}
//             </h2>
//             {photoPreview && (
//               <img 
//                 src={photoPreview.startsWith('/') 
//                   ? `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${photoPreview}`
//                   : photoPreview}
//                 alt="After"
//                 className="w-full rounded-lg mb-4"
//               />
//             )}
//             <input 
//               type="file" 
//               accept="image/*"
//               capture="environment"
//               onChange={handlePhotoChange}
//               className="mb-4 w-full"
//             />
//             {photoFile && !job?.photo_evidence_after_url && (
//               <Button 
//                 variant="secondary" 
//                 fullWidth 
//                 onClick={handleUploadPhoto}
//                 disabled={uploading}
//               >
//                 {uploading ? 'Uploading...' : 'Upload Photo'}
//               </Button>
//             )}
//           </Card>
//         )}

//         {/* After Photo Display (Already uploaded) */}
//         {job.photo_evidence_after_url && job.current_state === 'COMPLETED_PENDING' && (
//           <Card className="mb-6">
//             <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Completion Photos</h2>
//             <img 
//               src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_after_url}`}
//               alt="After"
//               className="w-full rounded-lg"
//             />
//           </Card>
//         )}

//         {/* Actions */}
//         {canRequestSignoff ? (
//           <Button 
//             variant="primary" 
//             size="lg"
//             fullWidth 
//             onClick={handleRequestSignoff}
//             disabled={submitting || (!job?.photo_evidence_after_url && !photoFile)}
//           >
//             {submitting ? 'Requesting...' : '✅ Request Sign-off'}
//           </Button>
//         ) : job.current_state === 'COMPLETED_PENDING' ? (
//           <Card className="bg-coral-50 border-coral-200">
//             <p className="text-center text-navy-700">
//               ⏳ Waiting for client to review and approve your work
//             </p>
//           </Card>
//         ) : ['MATCHED', 'AWAITING_PAYMENT', 'MATCHED_PENDING_PAYMENT'].includes(job.current_state) ? (
//           <Card className="bg-yellow-50 border-yellow-200">
//             <p className="text-center text-navy-700">
//               ⏳ Waiting for client to complete payment. Once payment is confirmed, you can start work.
//             </p>
//           </Card>
//         ) : null}
//       </div>

//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default JobDetailsPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import LocationDisplay from '../components/LocationDisplay';
import RaiseDisputeModal from '../components/RaiseDisputeModal';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetchProfile();
  }, [jobId]);

  const fetchProfile = async () => {
    try {
        const response = await apiClient.get('/profile/profile');
        setProfile(response.data.profile);
    } catch(e) {}
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/jobs/${jobId}`);
      setJob(response.data.job);
      if (response.data.job?.photo_evidence_after_url) {
        setPhotoPreview(response.data.job.photo_evidence_after_url);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
     /* ... (Keep existing upload logic) ... */
     if (!photoFile) return alert('Select photo');
     try {
        setUploading(true);
        const formData = new FormData();
        formData.append('after_photo', photoFile);
        formData.append('job_id', jobId);
        await apiClient.post('/upload/job-photos', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        alert('Uploaded!');
        fetchJobDetails();
        setPhotoFile(null);
     } catch(e) { alert('Error: ' + e.message); } 
     finally { setUploading(false); }
  };

  const handleRequestSignoff = async () => {
      /* ... (Keep existing signoff logic) ... */
      try {
        setSubmitting(true);
        await apiClient.post(`/jobs/${jobId}/request-signoff`, { photo_evidence_after_url: job?.photo_evidence_after_url });
        alert('Sign-off requested!');
        navigate('/dashboard');
      } catch(e) { alert('Error: ' + e.message); }
      finally { setSubmitting(false); }
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  const isDisputed = job.current_state === 'DISPUTED';
  // DEFINITION OF ACTIVE FOR ARTISAN
  const isJobActive = ['STARTED', 'IN_PROGRESS', 'ESCROW_HELD', 'COMPLETED_PENDING'].includes(job.current_state);
  
  const canUpload = isJobActive && !isDisputed;

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">← Back</Button>

        <h1 className="font-condensed font-bold text-3xl mb-2">Job #{jobId.substring(0,8)}</h1>
        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-6 bg-indigo-100 text-indigo-700">
           {job.current_state.replace(/_/g, ' ')}
        </span>

        {/* --- DISPUTE BANNER --- */}
        {isDisputed && (
           <Card className="bg-red-50 border-red-200 mb-6">
              <h3 className="font-bold text-red-800">Job Disputed</h3>
              <p className="text-red-700 text-sm">Funds frozen. Admin is reviewing.</p>
           </Card>
        )}

        {/* --- JOB INFO --- */}
        <Card className="mb-6">
           <h2 className="font-bold text-xl mb-4">Job Info</h2>
           <p className="mb-2"><strong>Client:</strong> {job.client_name}</p>
           <p className="mb-4">{job.job_description}</p>
           <LocationDisplay lat={job.location_lat} lng={job.location_lon} isArtisan={true} />
        </Card>

        {/* --- UPLOAD & SIGNOFF --- */}
        {canUpload && (
            <Card className="mb-6">
                <h2 className="font-bold text-xl mb-4">Work Evidence</h2>
                {photoPreview && <img src={photoPreview} className="w-full rounded mb-4" />}
                
                <div className="space-y-4">
                    <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) { setPhotoFile(file); const r = new FileReader(); r.onload = () => setPhotoPreview(r.result); r.readAsDataURL(file); }
                    }} className="w-full" />
                    
                    {photoFile && !job?.photo_evidence_after_url && (
                        <Button variant="secondary" fullWidth onClick={handleUploadPhoto} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                        </Button>
                    )}
                    
                    {(job.photo_evidence_after_url || photoFile) && (
                        <Button variant="primary" fullWidth onClick={handleRequestSignoff} disabled={submitting}>
                            {submitting ? 'Sending...' : '✅ Request Sign-off'}
                        </Button>
                    )}
                </div>
            </Card>
        )}

        {/* --- REPORT ISSUE BUTTON (Explicitly placed outside conditional cards) --- */}
        {isJobActive && !isDisputed && (
            <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm mb-2">Is there a problem with the client?</p>
                <button 
                    onClick={() => setShowDisputeModal(true)}
                    className="text-coral-600 font-bold text-sm underline hover:text-coral-800"
                >
                    🚩 Raise a Dispute / Report Issue
                </button>
            </div>
        )}

        {/* --- MODAL --- */}
        {showDisputeModal && (
            <RaiseDisputeModal 
                jobId={job.id} 
                onClose={() => setShowDisputeModal(false)} 
                onSuccess={() => { setShowDisputeModal(false); fetchJobDetails(); }} 
            />
        )}

      </div>
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default JobDetailsPage;