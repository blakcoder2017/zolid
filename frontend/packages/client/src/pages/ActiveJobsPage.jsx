import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import LocationDisplay from '../components/LocationDisplay';
import { ShieldAlert, CheckCircle, Clock, MapPin, Briefcase } from 'lucide-react';
import logo from '../assets/logos/logo.png';

const ActiveJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);

  // const navItems = [
  //   { path: '/dashboard', label: 'Home', icon: '🏠' },
  //   { path: '/jobs', label: 'All Jobs', icon: '📋' },
  //   { path: '/active-jobs', label: 'Active', icon: '⚡' },
  //   { path: '/pending-jobs', label: 'Pending', icon: '⏳' },
  //   { path: '/profile', label: 'Profile', icon: '👤' },
  // ];

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // We fetch 'all' and filter client-side to ensure we catch DISPUTED jobs 
      // if the backend 'active' filter is too strict.
      const response = await apiClient.get(`/jobs/client/${user.id}?filter=all`);
      
      const activeStates = [
        'MATCHED_PENDING_PAYMENT', 
        'ESCROW_HELD', 
        'STARTED', 
        'IN_PROGRESS',
        'COMPLETED_PENDING', 
        'DISPUTED'
      ];
      
      const activeJobs = (response.data.jobs || []).filter(job => 
        activeStates.includes(job.current_state)
      );
      
      setJobs(activeJobs);
    } catch (error) {
      console.error('Failed to fetch active jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the dispute chat/wallet page
  const handleViewDispute = async (jobId) => {
    try {
      // 1. Get the dispute details to find the ID
      const res = await apiClient.get(`/disputes/${jobId}`);
      if (res.data.data && res.data.data.id) {
        // 2. Navigate to the Dispute Resolution Page
        navigate(`/disputes/${res.data.data.id}`);
      } else {
        // Fallback if no dispute record found (shouldn't happen if state is DISPUTED)
        alert("Dispute record not found. Please contact support.");
      }
    } catch (error) {
      console.error("Error finding dispute:", error);
      alert("Failed to load dispute details.");
    }
  };

  const getJobStatusBadge = (state) => {
    const statusMap = {
      'ESCROW_HELD': { label: 'In Escrow', className: 'bg-indigo-100 text-indigo-700' },
      'STARTED': { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      'IN_PROGRESS': { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
      'COMPLETED_PENDING': { label: 'Review Needed', className: 'bg-purple-100 text-purple-700' },
      'DISPUTED': { label: 'Disputed', className: 'bg-red-100 text-red-700' },
      'MATCHED_PENDING_PAYMENT': { label: 'Awaiting Payment', className: 'bg-yellow-100 text-yellow-700' }
    };
    
    const status = statusMap[state] || { label: state.replace('_', ' '), className: 'bg-gray-100 text-gray-700' };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${status.className}`}>
        {status.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900 mb-6">
          Active Jobs
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-navy-600">Loading your active jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-navy-600 text-lg font-medium mb-2">No active jobs</p>
            <p className="text-gray-500 mb-6">You don't have any jobs in progress right now.</p>
            <Button
              onClick={() => navigate('/post-job')}
              className="mx-auto"
            >
              Post a New Job
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  
                  {/* Job Details */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start gap-3 mb-2">
                      <h3 className="font-bold text-lg text-navy-900 truncate">
                        {job.job_description}
                      </h3>
                      {getJobStatusBadge(job.current_state)}
                    </div>
                    
                    <p className="text-2xl font-bold text-navy-900 mb-3">
                      {formatCurrency(job.gross_fee_pesewas)}
                    </p>

                    {/* Location Component */}
                    <div className="mb-3">
                      <LocationDisplay 
                        address={job.location_gps_address}
                        lat={job.location_lat}
                        lng={job.location_lon}
                      />
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      {job.artisan_name ? (
                        <p className="flex items-center gap-1">
                          <span className="bg-gray-100 p-1 rounded-full"><Briefcase className="w-3 h-3" /></span>
                          Artisan: <span className="font-semibold text-navy-700">{job.artisan_name}</span>
                        </p>
                      ) : (
                        <p className="italic text-gray-400">Waiting for artisan assignment...</p>
                      )}
                      
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        Posted: {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full md:w-auto flex flex-col items-end justify-center gap-2 mt-2 md:mt-0">
                    
                    {/* 1. DISPUTE ACTION */}
                    {job.current_state === 'DISPUTED' && (
                      <Button 
                        onClick={() => handleViewDispute(job.id)}
                        className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto flex items-center justify-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Resolve Dispute
                      </Button>
                    )}

                    {/* 2. APPROVAL ACTION */}
                    {job.current_state === 'COMPLETED_PENDING' && (
                      <Button 
                        onClick={() => navigate(`/jobs/${job.id}/approve`)}
                        className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Review & Approve
                      </Button>
                    )}

                    {/* 3. IN PROGRESS INDICATOR */}
                    {(job.current_state === 'STARTED' || job.current_state === 'IN_PROGRESS' || job.current_state === 'ESCROW_HELD') && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium w-full md:w-auto justify-center">
                        <Clock className="w-4 h-4 animate-pulse" />
                        Work In Progress
                      </div>
                    )}

                    {/* 4. PAYMENT ACTION */}
                    {job.current_state === 'MATCHED_PENDING_PAYMENT' && (
                      <Button 
                        onClick={() => navigate(`/jobs/${job.id}/payment`)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white w-full md:w-auto"
                      >
                        Complete Payment
                      </Button>
                    )}

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

export default ActiveJobsPage;