// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const ApproveJobPage = () => {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const [job, setJob] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [approving, setApproving] = React.useState(false);
//   const [showPinInput, setShowPinInput] = React.useState(false);
//   const [pin, setPin] = React.useState('');
//   const [rating, setRating] = React.useState(0);
//   const [reviewText, setReviewText] = React.useState('');

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'All Jobs', icon: '📋' },
//     { path: '/active-jobs', label: 'Active', icon: '⚡' },
//     { path: '/pending-jobs', label: 'Pending', icon: '⏳' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     fetchJobDetails();
//   }, [jobId]);

//   const fetchJobDetails = async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get(`/jobs/${jobId}`);
//       const jobData = response.data.job;
//       setJob(jobData);
      
//       // If job is already approved/completed, show a message
//       if (jobData.current_state === 'PAYOUT_SUCCESS') {
//         // Job was already approved - this is fine, just inform the user
//         console.log('Job has already been approved and payment released');
//       }
//     } catch (error) {
//       console.error('Failed to fetch job details:', error);
//       alert('Failed to load job details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleApproveWork = async () => {
//     // Check if already approved
//     if (job?.current_state === 'PAYOUT_SUCCESS') {
//       alert('✅ This job has already been approved and payment has been released to the artisan.');
//       navigate('/dashboard');
//       return;
//     }

//     if (showPinInput && pin.length !== 4) {
//       alert('Please enter a 4-digit PIN');
//       return;
//     }

//     try {
//       setApproving(true);
//       const response = await apiClient.post(`/jobs/${jobId}/approve-work`, {
//         pin: showPinInput ? pin : undefined,
//         rating: rating > 0 ? rating : undefined,
//         review_text: reviewText.trim() || undefined
//       });

//       alert('✅ ' + (response.data?.message || 'Work approved! Payment released to artisan.'));
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Failed to approve work:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
//       // If job is already approved, that's actually success
//       if (errorMessage.includes('PAYOUT_SUCCESS') || errorMessage.includes('already been approved')) {
//         alert('✅ This job has already been approved and payment has been released to the artisan.');
//         navigate('/dashboard');
//         return;
//       }
      
//       alert('Failed to approve work: ' + errorMessage);
//     } finally {
//       setApproving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <nav className="bg-navy-900 text-white px-6 py-4">
//           <img src={logo} alt="ZOLID" className="h-8 w-auto" />
//         </nav>
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
//           onClick={() => navigate('/pending-jobs')}
//           className="mb-4"
//         >
//           ← Back to Pending
//         </Button>

//         <h1 className="font-condensed font-bold text-3xl mb-2">
//           {job.current_state === 'PAYOUT_SUCCESS' ? 'Job Completed' : 'Review & Approve Work'}
//         </h1>
//         {job.current_state === 'PAYOUT_SUCCESS' ? (
//           <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-mint-100 text-mint-700 mb-6">
//             ✅ Approved - Payment Released
//           </span>
//         ) : (
//           <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-coral-100 text-coral-700 mb-6">
//             Awaiting Your Approval
//           </span>
//         )}

//         {/* Artisan Info */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Artisan Details</h2>
//           <div className="space-y-2">
//             <p className="text-navy-900 font-semibold text-lg">{job.artisan_name || 'N/A'}</p>
//             {job.artisan_phone && <p className="text-navy-600">📞 {job.artisan_phone}</p>}
//             {job.artisan_rating && (
//               <p className="text-navy-600">⭐ Rating: {job.artisan_rating}/5.0</p>
//             )}
//           </div>
//         </Card>

//         {/* Job Details */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Details</h2>
//           <div className="space-y-3">
//             {job.job_description && (
//               <div>
//                 <p className="text-navy-500 text-sm">Description</p>
//                 <p className="text-navy-900">{job.job_description}</p>
//               </div>
//             )}
//             {job.location_gps_address && (
//               <div>
//                 <p className="text-navy-500 text-sm">Location</p>
//                 <p className="text-navy-900">📍 {job.location_gps_address}</p>
//               </div>
//             )}
//             <div className="border-t border-grey-200 pt-3">
//               <div className="flex justify-between items-center">
//                 <p className="text-navy-500 text-sm">Total Paid</p>
//                 <p className="font-bold text-2xl text-navy-900">
//                   {formatCurrency((parseInt(job.gross_fee_pesewas || 0, 10) + parseInt(job.warranty_fee_pesewas || 0, 10)))}
//                 </p>
//               </div>
//               <p className="text-navy-500 text-xs mt-1">
//                 (Artisan receives: {formatCurrency(parseInt(job.artisan_payout_pesewas || 0, 10))})
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Before & After Photos */}
//         <div className="grid md:grid-cols-2 gap-6 mb-6">
//           {job.photo_evidence_before_url && (
//             <Card>
//               <h3 className="font-semibold text-navy-900 mb-3">Before Photos</h3>
//               <img 
//                 src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
//                 alt="Before"
//                 className="w-full rounded-lg border border-navy-200"
//               />
//             </Card>
//           )}
//           {job.photo_evidence_after_url && (
//             <Card>
//               <h3 className="font-semibold text-navy-900 mb-3">After Photos (Completion)</h3>
//               <img 
//                 src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_after_url}`}
//                 alt="After"
//                 className="w-full rounded-lg border border-navy-200"
//               />
//             </Card>
//           )}
//         </div>

//         {/* Rating Section */}
//         <Card className="mb-6">
//           <h3 className="font-semibold text-navy-900 mb-2">Rate This Artisan</h3>
//           <p className="text-sm text-navy-600 mb-4">
//             How satisfied were you with the work? (Optional but recommended)
//           </p>
          
//           {/* Star Rating */}
//           <div className="flex gap-1 mb-3">
//             {[1, 2, 3, 4, 5].map((star) => (
//               <button
//                 key={star}
//                 type="button"
//                 onClick={() => setRating(star)}
//                 className="text-3xl focus:outline-none transition-transform hover:scale-110"
//                 disabled={approving}
//               >
//                 {star <= rating ? '⭐' : '☆'}
//               </button>
//             ))}
//           </div>

//           {/* Review Text */}
//           <textarea
//             value={reviewText}
//             onChange={(e) => setReviewText(e.target.value)}
//             placeholder="Write a review (optional)"
//             className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
//             rows="3"
//             disabled={approving}
//           />
//         </Card>

//         {/* Optional PIN Verification */}
//         {!showPinInput ? (
//           <Card className="mb-6 bg-mint-50 border-mint-200">
//             <div className="flex items-start justify-between">
//               <div className="flex-1">
//                 <h3 className="font-semibold text-navy-900 mb-2">Physical Verification (Optional)</h3>
//                 <p className="text-sm text-navy-600 mb-4">
//                   For extra security, you can enter a 4-digit PIN on the artisan's phone to confirm you're physically present and satisfied.
//                 </p>
//                 <Button 
//                   variant="secondary" 
//                   size="sm"
//                   onClick={() => setShowPinInput(true)}
//                 >
//                   Use PIN Verification
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         ) : (
//           <Card className="mb-6">
//             <h3 className="font-semibold text-navy-900 mb-2">Enter 4-Digit PIN</h3>
//             <p className="text-sm text-navy-600 mb-4">
//               Give this PIN to the artisan to enter on their phone:
//             </p>
//             <input
//               type="text"
//               inputMode="numeric"
//               pattern="[0-9]*"
//               maxLength={4}
//               value={pin}
//               onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
//               placeholder="0000"
//               className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-3xl font-mono tracking-wider mb-4"
//             />
//             <Button 
//               variant="ghost" 
//               size="sm"
//               fullWidth
//               onClick={() => {
//                 setShowPinInput(false);
//                 setPin('');
//               }}
//             >
//               Cancel PIN Verification
//             </Button>
//           </Card>
//         )}

//         {/* Approve Work Button */}
//         {job.current_state === 'PAYOUT_SUCCESS' ? (
//           <Card className="bg-mint-50 border-mint-200 mb-4">
//             <p className="text-center text-navy-700 font-semibold mb-2">
//               ✅ Payment Already Released
//             </p>
//             <p className="text-center text-sm text-navy-600">
//               This job has been approved and payment has been released to the artisan. You can view it in your past jobs.
//             </p>
//             <Button 
//               variant="secondary" 
//               size="lg"
//               fullWidth
//               onClick={() => navigate('/past-jobs')}
//               className="mt-4"
//             >
//               View Past Jobs
//             </Button>
//           </Card>
//         ) : (
//           <>
//             <Button 
//               variant="primary" 
//               size="lg"
//               fullWidth
//               onClick={handleApproveWork}
//               disabled={approving || (showPinInput && pin.length !== 4)}
//               className="mb-4"
//             >
//               {approving ? 'Processing...' : '✅ Approve Work & Release Payment'}
//             </Button>

//             <p className="text-center text-sm text-navy-500">
//               By approving, you confirm the work is satisfactory and payment will be released instantly to the artisan.
//             </p>
//           </>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default ApproveJobPage;
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import RaiseDisputeModal from '../components/RaiseDisputeModal'; // 1. Import Modal

const ApproveJobPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [approving, setApproving] = React.useState(false);
  const [showPinInput, setShowPinInput] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  
  // 2. Add State for Modal
  const [showDisputeModal, setShowDisputeModal] = React.useState(false);


  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  React.useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/jobs/${jobId}`);
      const jobData = response.data.job;
      setJob(jobData);
      
      if (jobData.current_state === 'PAYOUT_SUCCESS') {
        console.log('Job has already been approved and payment released');
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      alert('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWork = async () => {
    if (job?.current_state === 'PAYOUT_SUCCESS') {
      alert('✅ This job has already been approved and payment has been released to the artisan.');
      navigate('/dashboard');
      return;
    }

    if (showPinInput && pin.length !== 4) {
      alert('Please enter a 4-digit PIN');
      return;
    }

    try {
      setApproving(true);
      const response = await apiClient.post(`/jobs/${jobId}/approve-work`, {
        pin: showPinInput ? pin : undefined,
        rating: rating > 0 ? rating : undefined,
        review_text: reviewText.trim() || undefined
      });

      alert('✅ ' + (response.data?.message || 'Work approved! Payment released to artisan.'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to approve work:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      if (errorMessage.includes('PAYOUT_SUCCESS') || errorMessage.includes('already been approved')) {
        alert('✅ This job has already been approved and payment has been released to the artisan.');
        navigate('/dashboard');
        return;
      }
      
      alert('Failed to approve work: ' + errorMessage);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 pb-20">
        <nav className="bg-navy-900 text-white px-6 py-4">
          <img src={logo} alt="ZOLID" className="h-8 w-auto" />
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <p className="text-navy-600 text-center py-8">Loading job details...</p>
          </Card>
        </div>
        <BottomNavigation items={navItems} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-grey-50 pb-20">
        <nav className="bg-navy-900 text-white px-6 py-4">
          <img src={logo} alt="ZOLID" className="h-8 w-auto" />
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <p className="text-navy-600 text-center py-8">Job not found</p>
            <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </Card>
        </div>
        <BottomNavigation items={navItems} />
      </div>
    );
  }

  // Helper to check state
  const isDisputed = job.current_state === 'DISPUTED';

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      <nav className="bg-navy-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/pending-jobs')}
          className="mb-4"
        >
          ← Back to Pending
        </Button>

        <h1 className="font-condensed font-bold text-3xl mb-2">
          {job.current_state === 'PAYOUT_SUCCESS' ? 'Job Completed' : 'Review & Approve Work'}
        </h1>

        {/* --- 3. STATUS BANNERS --- */}
        {job.current_state === 'PAYOUT_SUCCESS' ? (
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-mint-100 text-mint-700 mb-6">
            ✅ Approved - Payment Released
          </span>
        ) : isDisputed ? (
          <Card className="bg-red-50 border-red-200 mb-6 border-l-4 border-l-red-500">
             <div className="flex gap-3">
               <span className="text-2xl">🚨</span>
               <div>
                 <h3 className="font-bold text-red-800">Job Disputed</h3>
                 <p className="text-sm text-red-700 mt-1">
                   You reported an issue. Funds are frozen while our team reviews the case.
                 </p>
               </div>
             </div>
          </Card>
        ) : (
          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-coral-100 text-coral-700 mb-6">
            Awaiting Your Approval
          </span>
        )}

        {/* Artisan Info */}
        <Card className="mb-6">
          <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Artisan Details</h2>
          <div className="space-y-2">
            <p className="text-navy-900 font-semibold text-lg">{job.artisan_name || 'N/A'}</p>
            {job.artisan_phone && <p className="text-navy-600">📞 {job.artisan_phone}</p>}
            {job.artisan_rating && (
              <p className="text-navy-600">⭐ Rating: {job.artisan_rating}/5.0</p>
            )}
          </div>
        </Card>

        {/* Job Details */}
        <Card className="mb-6">
          <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Details</h2>
          <div className="space-y-3">
            {job.job_description && (
              <div>
                <p className="text-navy-500 text-sm">Description</p>
                <p className="text-navy-900">{job.job_description}</p>
              </div>
            )}
            {job.location_gps_address && (
              <div>
                <p className="text-navy-500 text-sm">Location</p>
                <p className="text-navy-900">📍 {job.location_gps_address}</p>
              </div>
            )}
            <div className="border-t border-grey-200 pt-3">
              <div className="flex justify-between items-center">
                <p className="text-navy-500 text-sm">Total Paid</p>
                <p className="font-bold text-2xl text-navy-900">
                  {formatCurrency((parseInt(job.gross_fee_pesewas || 0, 10) + parseInt(job.warranty_fee_pesewas || 0, 10)))}
                </p>
              </div>
              <p className="text-navy-500 text-xs mt-1">
                (Artisan receives: {formatCurrency(parseInt(job.artisan_payout_pesewas || 0, 10))})
              </p>
            </div>
          </div>
        </Card>

        {/* Before & After Photos */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {job.photo_evidence_before_url && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-3">Before Photos</h3>
              <img 
                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
                alt="Before"
                className="w-full rounded-lg border border-navy-200"
              />
            </Card>
          )}
          {job.photo_evidence_after_url && (
            <Card>
              <h3 className="font-semibold text-navy-900 mb-3">After Photos (Completion)</h3>
              <img 
                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_after_url}`}
                alt="After"
                className="w-full rounded-lg border border-navy-200"
              />
            </Card>
          )}
        </div>

        {/* Rating Section - Disable if Disputed */}
        {!isDisputed && (
            <Card className="mb-6">
              <h3 className="font-semibold text-navy-900 mb-2">Rate This Artisan</h3>
              <p className="text-sm text-navy-600 mb-4">
                How satisfied were you with the work? (Optional but recommended)
              </p>
              
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-3xl focus:outline-none transition-transform hover:scale-110"
                    disabled={approving}
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
    
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write a review (optional)"
                className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                rows="3"
                disabled={approving}
              />
            </Card>
        )}

        {/* Optional PIN Verification - Disable if Disputed */}
        {!isDisputed && !showPinInput && job.current_state !== 'PAYOUT_SUCCESS' && (
          <Card className="mb-6 bg-mint-50 border-mint-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-navy-900 mb-2">Physical Verification (Optional)</h3>
                <p className="text-sm text-navy-600 mb-4">
                  For extra security, you can enter a 4-digit PIN on the artisan's phone to confirm you're physically present and satisfied.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setShowPinInput(true)}>
                  Use PIN Verification
                </Button>
              </div>
            </div>
          </Card>
        )}

        {showPinInput && !isDisputed && (
          <Card className="mb-6">
            <h3 className="font-semibold text-navy-900 mb-2">Enter 4-Digit PIN</h3>
            <p className="text-sm text-navy-600 mb-4">
              Give this PIN to the artisan to enter on their phone:
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-3xl font-mono tracking-wider mb-4"
            />
            <Button variant="ghost" size="sm" fullWidth onClick={() => { setShowPinInput(false); setPin(''); }}>
              Cancel PIN Verification
            </Button>
          </Card>
        )}

        {/* --- 4. ACTION BUTTONS (Approve vs Dispute) --- */}
        {job.current_state === 'PAYOUT_SUCCESS' ? (
          <Card className="bg-mint-50 border-mint-200 mb-4">
            <p className="text-center text-navy-700 font-semibold mb-2">
              ✅ Payment Already Released
            </p>
            <p className="text-center text-sm text-navy-600">
              This job has been approved and payment has been released to the artisan.
            </p>
            <Button variant="secondary" size="lg" fullWidth onClick={() => navigate('/past-jobs')} className="mt-4">
              View Past Jobs
            </Button>
          </Card>
        ) : isDisputed ? (
           // If disputed, hide normal actions
           <div className="text-center p-4">
             <p className="text-gray-500">Actions are disabled while the dispute is active.</p>
           </div>
        ) : (
          <>
            <Button 
              variant="primary" 
              size="lg"
              fullWidth
              onClick={handleApproveWork}
              disabled={approving || (showPinInput && pin.length !== 4)}
              className="mb-4"
            >
              {approving ? 'Processing...' : '✅ Approve Work & Release Payment'}
            </Button>

            <p className="text-center text-sm text-navy-500 mb-6">
              By approving, you confirm the work is satisfactory and payment will be released instantly.
            </p>

            {/* --- REPORT ISSUE BUTTON --- */}
            <div className="text-center border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 mb-2">Not satisfied with the work shown?</p>
              <button 
                onClick={() => setShowDisputeModal(true)}
                className="text-coral-600 font-semibold text-sm hover:text-coral-800 hover:underline"
              >
                🚩 Raise a Dispute / Report Issue
              </button>
            </div>
          </>
        )}

        {/* --- 5. MODAL --- */}
        {showDisputeModal && (
          <RaiseDisputeModal 
            jobId={job.id} 
            onClose={() => setShowDisputeModal(false)}
            onSuccess={() => {
              setShowDisputeModal(false);
              fetchJobDetails(); // Refresh to show Disputed state
            }}
          />
        )}

      </div>
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default ApproveJobPage;