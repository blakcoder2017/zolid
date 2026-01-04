// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const SubmitQuotePage = () => {
//   const { jobId } = useParams();
//   const navigate = useNavigate();
//   const [job, setJob] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [submitting, setSubmitting] = React.useState(false);
//   const [profile, setProfile] = React.useState(null);
  
//   // Form state
//   const [quotedFee, setQuotedFee] = React.useState('');
//   const [quoteMessage, setQuoteMessage] = React.useState('');
//   const [estimatedHours, setEstimatedHours] = React.useState('');
//   const [breakdown, setBreakdown] = React.useState(null);

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Jobs', icon: '💼' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     fetchJobDetails();
//     fetchProfile();
//   }, [jobId]);

//   // Calculate breakdown when quotedFee changes
//   React.useEffect(() => {
//     if (quotedFee && parseFloat(quotedFee) >= 10) {
//       calculateBreakdown(parseFloat(quotedFee));
//     } else {
//       setBreakdown(null);
//     }
//   }, [quotedFee]);

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
//     } catch (error) {
//       console.error('Failed to fetch job details:', error);
//       alert('Failed to load job details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const calculateBreakdown = (feeGHS) => {
//     const feePesewas = Math.floor(feeGHS * 100);
    
//     // Same calculation as backend
//     const warrantyFee = Math.floor(feePesewas * 0.15); // 15%
//     const totalClientPays = feePesewas + warrantyFee;
//     const benefitDeduction = Math.floor(feePesewas * 0.05); // 5%
//     const platformCommission = Math.floor(feePesewas * 0.05); // 5%
//     const artisanPayout = feePesewas - platformCommission - benefitDeduction;
    
//     setBreakdown({
//       your_quote: feePesewas,
//       warranty_fee: warrantyFee,
//       client_pays: totalClientPays,
//       benefit_deduction: benefitDeduction,
//       platform_commission: platformCommission,
//       your_payout: artisanPayout
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!quotedFee || parseFloat(quotedFee) < 10) {
//       alert('Minimum quote is GHS 10.00');
//       return;
//     }
    
//     if (parseFloat(quotedFee) > 10000) {
//       alert('Maximum quote is GHS 10,000.00');
//       return;
//     }
    
//     try {
//       setSubmitting(true);
//       const response = await apiClient.post(`/jobs/${jobId}/submit-quote`, {
//         quoted_fee_pesewas: Math.floor(parseFloat(quotedFee) * 100),
//         quote_message: quoteMessage || null,
//         estimated_duration_hours: estimatedHours ? parseInt(estimatedHours) : null
//       });
      
//       alert('✅ ' + (response.data?.message || 'Quote submitted successfully!'));
//       navigate('/jobs');
//     } catch (error) {
//       console.error('Failed to submit quote:', error);
//       alert('Failed to submit quote: ' + (error.message || 'Unknown error'));
//     } finally {
//       setSubmitting(false);
//     }
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
//             <Button variant="secondary" fullWidth onClick={() => navigate('/jobs')}>
//               Back to Jobs
//             </Button>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       <TopNavigation profile={profile} logo={logo} />

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <Button 
//           variant="ghost" 
//           size="sm" 
//           onClick={() => navigate('/jobs')}
//           className="mb-4"
//         >
//           ← Back to Jobs
//         </Button>

//         <h1 className="font-condensed font-bold text-3xl mb-6">
//           Submit Your Quote
//         </h1>

//         {/* Job Details */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Details</h2>
//           <div className="space-y-2">
//             <div>
//               <p className="text-navy-500 text-sm">Client</p>
//               <p className="text-navy-900 font-semibold">{job.client_name || 'N/A'}</p>
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
//                 <p className="text-navy-900">📍 {job.location_gps_address}</p>
//               </div>
//             )}
//             {job.photo_evidence_before_url && (
//               <div>
//                 <p className="text-navy-500 text-sm mb-2">Job Photo</p>
//                 <img 
//                   src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
//                   alt="Job"
//                   className="w-full max-w-md rounded-lg border border-navy-200"
//                 />
//               </div>
//             )}
//             {job.quotes_deadline && (
//               <div>
//                 <p className="text-navy-500 text-sm">Quote Deadline</p>
//                 <p className="text-coral-600 font-semibold">
//                   {new Date(job.quotes_deadline).toLocaleDateString()} at{' '}
//                   {new Date(job.quotes_deadline).toLocaleTimeString()}
//                 </p>
//               </div>
//             )}
//           </div>
//         </Card>

//         {/* Quote Form */}
//         <form onSubmit={handleSubmit}>
//           <Card className="mb-6">
//             <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Your Quote</h2>
            
//             <div className="space-y-4">
//               {/* Quote Amount */}
//               <div>
//                 <label className="block text-navy-700 font-semibold mb-2">
//                   Your Quote (GHS) *
//                 </label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   min="10"
//                   max="10000"
//                   value={quotedFee}
//                   onChange={(e) => setQuotedFee(e.target.value)}
//                   placeholder="400.00"
//                   className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-2xl font-bold"
//                   required
//                 />
//                 <p className="text-navy-500 text-sm mt-1">
//                   Min: GHS 10.00 | Max: GHS 10,000.00
//                 </p>
//               </div>

//               {/* Estimated Duration */}
//               <div>
//                 <label className="block text-navy-700 font-semibold mb-2">
//                   Estimated Duration (hours)
//                 </label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={estimatedHours}
//                   onChange={(e) => setEstimatedHours(e.target.value)}
//                   placeholder="2"
//                   className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>

//               {/* Quote Message */}
//               <div>
//                 <label className="block text-navy-700 font-semibold mb-2">
//                   Message to Client (Optional)
//                 </label>
//                 <textarea
//                   value={quoteMessage}
//                   onChange={(e) => setQuoteMessage(e.target.value)}
//                   placeholder="I can complete this job in 2 hours with quality materials..."
//                   rows={4}
//                   className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </div>
//           </Card>

//           {/* Fee Breakdown */}
//           {breakdown && (
//             <Card className="mb-6 bg-grey-50">
//               <h3 className="font-condensed font-bold text-lg text-navy-900 mb-4">Fee Breakdown</h3>
              
//               <div className="space-y-2 mb-4">
//                 <div className="flex justify-between">
//                   <span className="text-navy-600">Your Quote:</span>
//                   <span className="font-semibold">{formatCurrency(breakdown.your_quote)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-navy-600">Warranty Fee (15%):</span>
//                   <span className="font-semibold">{formatCurrency(breakdown.warranty_fee)}</span>
//                 </div>
//                 <div className="border-t border-navy-200 pt-2 flex justify-between text-lg">
//                   <span className="font-bold text-navy-900">Client Pays:</span>
//                   <span className="font-bold text-navy-900">{formatCurrency(breakdown.client_pays)}</span>
//                 </div>
//               </div>

//               <div className="border-t border-navy-300 pt-4">
//                 <p className="text-navy-700 font-semibold mb-2">Your Earnings:</p>
//                 <div className="space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-navy-600">Your Quote:</span>
//                     <span>{formatCurrency(breakdown.your_quote)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-navy-600">- Health Benefit (5%):</span>
//                     <span className="text-coral-600">-{formatCurrency(breakdown.benefit_deduction)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-navy-600">- Platform Fee (5%):</span>
//                     <span className="text-coral-600">-{formatCurrency(breakdown.platform_commission)}</span>
//                   </div>
//                   <div className="border-t border-navy-200 pt-2 flex justify-between text-lg">
//                     <span className="font-bold text-mint-600">You Receive:</span>
//                     <span className="font-bold text-mint-600 text-2xl">{formatCurrency(breakdown.your_payout)}</span>
//                   </div>
//                 </div>
//               </div>
//             </Card>
//           )}

//           {/* Submit Button */}
//           <Button 
//             type="submit"
//             variant="primary" 
//             size="lg"
//             fullWidth 
//             disabled={submitting || !quotedFee || parseFloat(quotedFee) < 10}
//           >
//             {submitting ? 'Submitting...' : '💰 Submit Quote'}
//           </Button>
//         </form>
//       </div>

//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default SubmitQuotePage;
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, TopNavigation } from '@zolid/shared/components';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
// 1. Import the Location Display Component
import LocationDisplay from '../components/LocationDisplay'; 

const SubmitQuotePage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [profile, setProfile] = React.useState(null);
  
  // Form state
  const [quotedFee, setQuotedFee] = React.useState('');
  const [quoteMessage, setQuoteMessage] = React.useState('');
  const [estimatedHours, setEstimatedHours] = React.useState('');
  const [breakdown, setBreakdown] = React.useState(null);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  React.useEffect(() => {
    fetchJobDetails();
    fetchProfile();
  }, [jobId]);

  // Calculate breakdown when quotedFee changes
  React.useEffect(() => {
    if (quotedFee && parseFloat(quotedFee) >= 10) {
      calculateBreakdown(parseFloat(quotedFee));
    } else {
      setBreakdown(null);
    }
  }, [quotedFee]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/jobs/${jobId}`);
      setJob(response.data.job);
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      alert('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const calculateBreakdown = (feeGHS) => {
    const feePesewas = Math.floor(feeGHS * 100);
    
    // Same calculation as backend
    const warrantyFee = Math.floor(feePesewas * 0.15); // 15%
    const totalClientPays = feePesewas + warrantyFee;
    const benefitDeduction = Math.floor(feePesewas * 0.05); // 5%
    const platformCommission = Math.floor(feePesewas * 0.05); // 5%
    const artisanPayout = feePesewas - platformCommission - benefitDeduction;
    
    setBreakdown({
      your_quote: feePesewas,
      warranty_fee: warrantyFee,
      client_pays: totalClientPays,
      benefit_deduction: benefitDeduction,
      platform_commission: platformCommission,
      your_payout: artisanPayout
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quotedFee || parseFloat(quotedFee) < 10) {
      alert('Minimum quote is GHS 10.00');
      return;
    }
    
    if (parseFloat(quotedFee) > 10000) {
      alert('Maximum quote is GHS 10,000.00');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await apiClient.post(`/jobs/${jobId}/submit-quote`, {
        quoted_fee_pesewas: Math.floor(parseFloat(quotedFee) * 100),
        quote_message: quoteMessage || null,
        estimated_duration_hours: estimatedHours ? parseInt(estimatedHours) : null
      });
      
      alert('✅ ' + (response.data?.message || 'Quote submitted successfully!'));
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to submit quote:', error);
      alert('Failed to submit quote: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 pb-20">
        <TopNavigation profile={profile} logo={logo} />
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
        <TopNavigation profile={profile} logo={logo} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <p className="text-navy-600 text-center py-8">Job not found</p>
            <Button variant="secondary" fullWidth onClick={() => navigate('/jobs')}>
              Back to Jobs
            </Button>
          </Card>
        </div>
        <BottomNavigation items={navItems} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/jobs')}
          className="mb-4"
        >
          ← Back to Jobs
        </Button>

        <h1 className="font-condensed font-bold text-3xl mb-6">
          Submit Your Quote
        </h1>

        {/* Job Details */}
        <Card className="mb-6">
          <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Job Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-navy-500 text-xs font-bold uppercase tracking-wider mb-1">Client</p>
              <p className="text-navy-900 font-semibold">{job.client_name || 'N/A'}</p>
            </div>
            {job.job_description && (
              <div>
                <p className="text-navy-500 text-xs font-bold uppercase tracking-wider mb-1">Description</p>
                <p className="text-navy-900">{job.job_description}</p>
              </div>
            )}
            
            {/* --- MAP INTEGRATION --- */}
            <div>
              {(job.location_lat && job.location_lon) ? (
                 <LocationDisplay 
                    lat={job.location_lat} 
                    lng={job.location_lon} 
                    isArtisan={true} // Shows "Get Directions"
                 />
              ) : (
                <>
                  <p className="text-navy-500 text-xs font-bold uppercase tracking-wider mb-1">Location</p>
                  <p className="text-navy-900">📍 {job.location_gps_address || "Address not provided"}</p>
                </>
              )}
            </div>
            {/* ----------------------- */}

            {job.photo_evidence_before_url && (
              <div>
                <p className="text-navy-500 text-xs font-bold uppercase tracking-wider mb-2">Job Photo</p>
                <img 
                  src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_before_url}`}
                  alt="Job"
                  className="w-full max-w-md rounded-lg border border-navy-200"
                />
              </div>
            )}
            {job.quotes_deadline && (
              <div>
                <p className="text-navy-500 text-xs font-bold uppercase tracking-wider mb-1">Quote Deadline</p>
                <p className="text-coral-600 font-semibold">
                  {new Date(job.quotes_deadline).toLocaleDateString()} at{' '}
                  {new Date(job.quotes_deadline).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Quote Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="font-condensed font-bold text-xl text-navy-900 mb-4">Your Quote</h2>
            
            <div className="space-y-4">
              {/* Quote Amount */}
              <div>
                <label className="block text-navy-700 font-semibold mb-2">
                  Your Quote (GHS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="10000"
                  value={quotedFee}
                  onChange={(e) => setQuotedFee(e.target.value)}
                  placeholder="400.00"
                  className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-2xl font-bold"
                  required
                />
                <p className="text-navy-500 text-sm mt-1">
                  Min: GHS 10.00 | Max: GHS 10,000.00
                </p>
              </div>

              {/* Estimated Duration */}
              <div>
                <label className="block text-navy-700 font-semibold mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="2"
                  className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quote Message */}
              <div>
                <label className="block text-navy-700 font-semibold mb-2">
                  Message to Client (Optional)
                </label>
                <textarea
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  placeholder="I can complete this job in 2 hours with quality materials..."
                  rows={4}
                  className="w-full px-4 py-2 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Fee Breakdown */}
          {breakdown && (
            <Card className="mb-6 bg-grey-50">
              <h3 className="font-condensed font-bold text-lg text-navy-900 mb-4">Fee Breakdown</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-navy-600">Your Quote:</span>
                  <span className="font-semibold">{formatCurrency(breakdown.your_quote)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-600">Warranty Fee (15%):</span>
                  <span className="font-semibold">{formatCurrency(breakdown.warranty_fee)}</span>
                </div>
                <div className="border-t border-navy-200 pt-2 flex justify-between text-lg">
                  <span className="font-bold text-navy-900">Client Pays:</span>
                  <span className="font-bold text-navy-900">{formatCurrency(breakdown.client_pays)}</span>
                </div>
              </div>

              <div className="border-t border-navy-300 pt-4">
                <p className="text-navy-700 font-semibold mb-2">Your Earnings:</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-600">Your Quote:</span>
                    <span>{formatCurrency(breakdown.your_quote)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-600">- Health Benefit (5%):</span>
                    <span className="text-coral-600">-{formatCurrency(breakdown.benefit_deduction)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy-600">- Platform Fee (5%):</span>
                    <span className="text-coral-600">-{formatCurrency(breakdown.platform_commission)}</span>
                  </div>
                  <div className="border-t border-navy-200 pt-2 flex justify-between text-lg">
                    <span className="font-bold text-mint-600">You Receive:</span>
                    <span className="font-bold text-mint-600 text-2xl">{formatCurrency(breakdown.your_payout)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            type="submit"
            variant="primary" 
            size="lg"
            fullWidth 
            disabled={submitting || !quotedFee || parseFloat(quotedFee) < 10}
          >
            {submitting ? 'Submitting...' : '💰 Submit Quote'}
          </Button>
        </form>
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default SubmitQuotePage;