// import React from 'react';
// import { Card, BottomNavigation, TopNavigation } from '@zolid/shared/components';
// import { formatCurrency } from '@zolid/shared/utils';
// import { useAuth } from '@zolid/shared/hooks';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const BenefitsPage = () => {
//   const { user } = useAuth();
//   const [loading, setLoading] = React.useState(true);
//   const [profile, setProfile] = React.useState(null);
//   const [benefitsData, setBenefitsData] = React.useState(null);
//   const [error, setError] = React.useState(null);
//   const [claimingInsurance, setClaimingInsurance] = React.useState(false);
//   const [claimError, setClaimError] = React.useState(null);

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Available', icon: '💼' },
//     { path: '/my-jobs?filter=all', label: 'My Jobs', icon: '📋' },
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     if (user?.id) {
//       fetchProfile();
//       fetchBenefitsData();
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

//   const fetchBenefitsData = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await apiClient.get('/benefits/artisan/summary');
//       setBenefitsData(response.data.summary);
//     } catch (error) {
//       console.error('Failed to fetch benefits data:', error);
//       setError(error.response?.data?.message || 'Failed to load benefits data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getPlanBadge = (plan) => {
//     if (!plan) {
//       return { text: 'Not Enrolled', className: 'bg-grey-100 text-grey-700' };
//     }
//     if (plan === 'FREE') {
//       return { text: 'Free Plan', className: 'bg-indigo-100 text-indigo-700' };
//     }
//     if (plan === 'STANDARD') {
//       return { text: 'Standard Plan', className: 'bg-mint-100 text-mint-700' };
//     }
//     return { text: plan, className: 'bg-grey-100 text-grey-700' };
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     return new Date(dateString).toLocaleDateString('en-GB', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   };

//   const handleClaimInsurance = async () => {
//     setClaimError(null);
//     setClaimingInsurance(true);

//     try {
//       const response = await apiClient.post('/benefits/claim-rivia-insurance');
      
//       // Show success message
//       alert('🎉 Insurance claimed successfully! Your RiviaCo benefits are now active.');
      
//       // Refresh benefits data to show the new enrollment
//       await fetchBenefitsData();
//     } catch (error) {
//       const errorMessage = error.response?.data?.message ||
//                            error.response?.data?.error ||
//                            error.message ||
//                            'Failed to claim insurance. Please try again.';
//       setClaimError(errorMessage);
//     } finally {
//       setClaimingInsurance(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <TopNavigation profile={profile} logo={logo} />
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading benefits data...</p>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   if (error || !benefitsData) {
//     return (
//       <div className="min-h-screen bg-grey-50 pb-20">
//         <TopNavigation profile={profile} logo={logo} />
//         <div className="max-w-7xl mx-auto px-6 py-8">
//           <Card>
//             <div className="text-center py-8">
//               <p className="text-coral-600 mb-4">{error || 'Failed to load benefits data'}</p>
//               <button
//                 onClick={fetchBenefitsData}
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
//               >
//                 Retry
//               </button>
//             </div>
//           </Card>
//         </div>
//         <BottomNavigation items={navItems} />
//       </div>
//     );
//   }

//   const planBadge = getPlanBadge(benefitsData.riviaco_plan);
//   const standardPlanAnnualFee = 50000; // 500 GHS = 50000 pesewas
//   const contributionProgress = benefitsData.standard_plan_contribution_pesewas 
//     ? (benefitsData.standard_plan_contribution_pesewas / standardPlanAnnualFee) * 100 
//     : 0;

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       <TopNavigation profile={profile} logo={logo} />
      
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-6">
//           RiviaCo Benefits
//         </h1>

//         {/* Enrollment Status Card */}
//         <Card className="mb-6">
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-2">
//                 Enrollment Status
//               </h2>
//               <span className={`px-3 py-1 rounded-full text-sm font-semibold ${planBadge.className}`}>
//                 {planBadge.text}
//               </span>
//             </div>
//             {benefitsData.riviaco_policy_id && (
//               <div className="text-right">
//                 <p className="text-navy-500 text-xs mb-1">Policy ID</p>
//                 <p className="text-navy-900 font-semibold text-sm">{benefitsData.riviaco_policy_id}</p>
//               </div>
//             )}
//           </div>

//           {benefitsData.riviaco_enrollment_date && (
//             <p className="text-navy-600 text-sm">
//               Enrolled: {formatDate(benefitsData.riviaco_enrollment_date)}
//             </p>
//           )}

//           {/* Insurance Claim Section - Lazy Activation */}
//           {!benefitsData.riviaco_policy_id && (
//             <div className="mt-4 p-4 bg-mint-50 rounded-lg border border-mint-200">
//               <h3 className="font-semibold text-mint-900 mb-3">🎁 Claim Your Free Insurance Benefits</h3>
//               <p className="text-sm text-mint-700 mb-4">
//                 You're eligible for free RiviaCo health benefits! Claim your insurance to access:
//               </p>
//               <ul className="list-none text-sm text-mint-700 space-y-2 mb-4">
//                 <li className="flex items-start">
//                   <span className="text-mint-600 mr-2">✔</span>
//                   <span>Up to 15% off in-person services at Rivia Clinics</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="text-mint-600 mr-2">✔</span>
//                   <span>Free virtual care (chat, call, video)</span>
//                 </li>
//               </ul>
//               <button
//                 onClick={handleClaimInsurance}
//                 disabled={claimingInsurance}
//                 className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-all ${
//                   claimingInsurance
//                     ? 'bg-mint-400 cursor-not-allowed'
//                     : 'bg-mint-600 hover:bg-mint-700'
//                 }`}
//               >
//                 {claimingInsurance ? 'Claiming Insurance...' : '🎁 Claim My Free Insurance'}
//               </button>
//               {claimError && (
//                 <p className="text-xs text-coral-600 mt-2">{claimError}</p>
//               )}
//             </div>
//           )}

//           {/* Plan Benefits */}
//           {benefitsData.riviaco_plan === 'FREE' && (
//             <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
//               <h3 className="font-semibold text-indigo-900 mb-3">Free Plan Benefits:</h3>
//               <ul className="list-none text-sm text-indigo-700 space-y-2">
//                 <li className="flex items-start">
//                   <span className="text-indigo-600 mr-2">✔</span>
//                   <span>Up to 15% off in-person services at Rivia Clinics</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="text-indigo-600 mr-2">✔</span>
//                   <span>Free virtual care (chat, call, video)</span>
//                 </li>
//               </ul>
//               <p className="text-xs text-indigo-600 mt-4 font-semibold">
//                 Upgrade to Standard Plan after your first gig to unlock full benefits.
//               </p>
//             </div>
//           )}

//           {benefitsData.riviaco_plan === 'STANDARD' && (
//             <div className="mt-4 p-4 bg-mint-50 rounded-lg">
//               <div className="mb-3">
//                 <h3 className="font-semibold text-mint-900 mb-1">Standard Plan Benefits:</h3>
//                 <p className="text-xs text-mint-700">Access Fee: GHS 500 per person/year</p>
//               </div>
//               <ul className="list-none text-sm text-mint-700 space-y-2">
//                 <li className="flex items-start">
//                   <span className="text-mint-600 mr-2">✔</span>
//                   <span>GHS 2,500 in healthcare services at Rivia Clinics</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="text-mint-600 mr-2">✔</span>
//                   <span>Free virtual care included (chat, call, video)</span>
//                 </li>
//               </ul>

//               {/* Contribution Progress */}
//               <div className="mt-4 pt-4 border-t border-mint-200">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-xs text-mint-700 font-semibold">Annual Premium Progress (GHS 500/year)</span>
//                   <span className="text-xs text-mint-700 font-semibold">
//                     {formatCurrency(benefitsData.standard_plan_contribution_pesewas)} / {formatCurrency(standardPlanAnnualFee)}
//                   </span>
//                 </div>
//                 <div className="w-full bg-mint-200 rounded-full h-2">
//                   <div
//                     className="bg-mint-600 h-2 rounded-full transition-all"
//                     style={{ width: `${Math.min(contributionProgress, 100)}%` }}
//                   ></div>
//                 </div>
//                 <p className="text-xs text-mint-600 mt-2">
//                   {Math.round(contributionProgress)}% of annual premium paid (GHS 20/month contribution)
//                 </p>
//               </div>
//             </div>
//           )}
//         </Card>

//         {/* Premium Summary Card */}
//         <Card className="mb-6">
//           <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-4">
//             Premium Summary
//           </h2>
          
//           <div className="space-y-4">
//             <div className="flex justify-between items-center">
//               <div>
//                 <p className="text-navy-600 text-sm">Monthly Premium Paid</p>
//                 <p className="text-xs text-navy-500">
//                   {benefitsData.riviaco_plan === 'STANDARD' 
//                     ? '20 cedis/month toward annual fee'
//                     : 'Free plan - no monthly premium'}
//                 </p>
//               </div>
//               <p className="font-semibold text-xl text-navy-900">
//                 {formatCurrency(benefitsData.monthly_premium_paid_pesewas || 0)}
//               </p>
//             </div>

//             <div className="border-t border-navy-200 pt-4">
//               <div className="flex justify-between items-center mb-2">
//                 <p className="text-navy-600 text-sm">Total Premiums Remitted</p>
//                 <p className="font-semibold text-lg text-navy-900">
//                   {formatCurrency(benefitsData.total_premium_amount_pesewas || 0)}
//                 </p>
//               </div>
//               <p className="text-xs text-navy-500">
//                 {benefitsData.total_premiums_paid || 0} premium payment{benefitsData.total_premiums_paid !== 1 ? 's' : ''} remitted to RiviaCo
//               </p>
//             </div>

//             {benefitsData.pending_premium_amount_pesewas > 0 && (
//               <div className="border-t border-navy-200 pt-4">
//                 <div className="flex justify-between items-center">
//                   <p className="text-navy-600 text-sm">Pending Premiums</p>
//                   <p className="font-semibold text-lg text-yellow-700">
//                     {formatCurrency(benefitsData.pending_premium_amount_pesewas)}
//                   </p>
//                 </div>
//                 <p className="text-xs text-navy-500">
//                   Awaiting batch remittance to RiviaCo
//                 </p>
//               </div>
//             )}
//           </div>
//         </Card>

//         {/* Earnings Summary Card */}
//         <Card>
//           <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-4">
//             Lifetime Earnings (Net)
//           </h2>
          
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-navy-600 text-sm">Total Earnings After Deductions</p>
//               <p className="text-xs text-navy-500">
//                 Net amount received after platform fees and benefits deductions
//               </p>
//             </div>
//             <p className="font-condensed font-bold text-3xl text-mint-600">
//               {formatCurrency(benefitsData.total_lifetime_earnings_pesewas || 0)}
//             </p>
//           </div>
//         </Card>
//       </div>

//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default BenefitsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, Button, TopNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import { Heart, Shield, Activity, Clock, CheckCircle } from 'lucide-react';

const BenefitsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [benefitData, setBenefitData] = useState(null);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=all', label: 'My Jobs', icon: '📋' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  useEffect(() => {
    fetchBenefits();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/benefits/artisan/summary');
      setBenefitData(res.data.summary);
    } catch (error) {
      console.error("Benefits error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `GHS ${(amount / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopNavigation profile={user} onLogout={() => logout(navigate)} logo={logo} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <h1 className="font-condensed font-bold text-3xl text-navy-900">Health Benefits</h1>

        {/* Status Card */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Heart size={100} />
          </div>
          
          <div className="relative z-10">
            <p className="text-teal-100 text-sm font-semibold uppercase tracking-wider mb-1">Current Plan</p>
            <h2 className="text-4xl font-bold mb-4">
              {benefitData?.riviaco_plan === 'STANDARD' ? 'Standard Plan' : 
               benefitData?.riviaco_plan === 'FREE' ? 'Free Plan' : 'Not Enrolled'}
            </h2>

            {benefitData?.riviaco_plan ? (
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                <CheckCircle size={16} />
                <span>Active Policy: {benefitData.policy_id || 'Pending'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-500/20 w-fit px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-yellow-200/50">
                <Clock size={16} />
                <span>Eligibility Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Contribution Tracker (Only for Standard/Upgrading) */}
        <Card className="p-5">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h3 className="font-bold text-gray-800">Annual Contribution</h3>
                    <p className="text-xs text-gray-500">Towards Standard Plan (GHS 500/yr)</p>
                </div>
                <span className="font-mono font-bold text-teal-700 text-lg">
                    {formatCurrency(benefitData?.contribution_balance_pesewas || 0)}
                </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                    className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(((benefitData?.contribution_balance_pesewas || 0) / 50000) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="text-right text-xs text-gray-400">Target: GHS 500.00</p>
        </Card>

        {/* Plan Details */}
        <div className="grid md:grid-cols-2 gap-4">
            <Card className={`border-l-4 ${benefitData?.riviaco_plan ? 'border-teal-500' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <Shield className="text-teal-600" />
                    <h3 className="font-bold text-lg">Coverage Details</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2"><CheckCircle size={14} className="text-teal-500 mt-0.5" /> Virtual Care (Chat/Video)</li>
                    <li className="flex gap-2"><CheckCircle size={14} className="text-teal-500 mt-0.5" /> Discounted Prescriptions</li>
                    {benefitData?.riviaco_plan === 'STANDARD' && (
                        <>
                            <li className="flex gap-2"><CheckCircle size={14} className="text-teal-500 mt-0.5" /> In-person Consultation</li>
                            <li className="flex gap-2"><CheckCircle size={14} className="text-teal-500 mt-0.5" /> Lab Tests & Diagnostics</li>
                        </>
                    )}
                </ul>
            </Card>

            <Card>
                <div className="flex items-center gap-3 mb-3">
                    <Activity className="text-indigo-600" />
                    <h3 className="font-bold text-lg">How it works</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                    Every job you complete on Zolid contributes GHS 20 towards your premium. Once you hit the threshold, you automatically upgrade to the Standard Plan.
                </p>
                {/* REMOVED 'CLAIM INSURANCE' BUTTON AS REQUESTED */}
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100">
                    Processing time for new enrollments is currently 3-5 business days. You will be notified via SMS when your policy is active.
                </div>
            </Card>
        </div>

      </div>
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default BenefitsPage;