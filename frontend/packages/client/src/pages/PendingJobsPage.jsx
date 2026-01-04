import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const PendingJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState([]);

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  React.useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs and filter for pending actions
      const response = await apiClient.get(`/jobs/client/${user.id}`);
      const allJobs = response.data.jobs || [];
      
      // Include: COMPLETED_PENDING, OPEN_FOR_QUOTES, QUOTED, AWAITING_PAYMENT
      const pendingStates = ['COMPLETED_PENDING', 'OPEN_FOR_QUOTES', 'QUOTED', 'AWAITING_PAYMENT', 'MATCHED'];
      const filtered = allJobs.filter(job => pendingStates.includes(job.current_state));
      
      // For quote jobs, fetch quote counts
      const jobsWithQuoteCounts = await Promise.all(
        filtered.map(async (job) => {
          if (['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state)) {
            try {
              const quotesResponse = await apiClient.get(`/jobs/${job.id}/quotes`);
              return {
                ...job,
                quote_count: quotesResponse.data.quotes?.length || 0
              };
            } catch (error) {
              return { ...job, quote_count: 0 };
            }
          }
          return job;
        })
      );
      
      setJobs(jobsWithQuoteCounts);
    } catch (error) {
      console.error('Failed to fetch pending jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (state) => {
    const statusMap = {
      'DRAFT': { label: 'Draft', color: 'bg-grey-200 text-grey-700' },
      'ESCROW_PENDING': { label: 'Payment Required', color: 'bg-yellow-100 text-yellow-700' },
    };
    const status = statusMap[state] || { label: state, color: 'bg-grey-200 text-grey-700' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${status.color}`}>
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

  const handlePayJob = async (job) => {
    try {
      // Get payment link for this job
      const response = await apiClient.get(`/jobs/${job.id}/payment-link`);
      if (response.data.payment_link) {
        // Open payment link in new tab
        window.open(response.data.payment_link, '_blank');
        // Refresh jobs list after a delay
        setTimeout(() => {
          fetchJobs();
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to get payment link. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditJob = (job) => {
    // Store job in sessionStorage to pass to edit page
    sessionStorage.setItem('editJob', JSON.stringify(job));
    navigate('/post-job');
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/jobs/${jobId}`);
      // Refresh jobs list
      await fetchJobs();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to delete job. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="font-condensed font-bold text-4xl mb-2">
          Pending Actions
        </h1>
        <p className="text-navy-600 mb-6">
          Jobs waiting for your action: review quotes, make payment, or approve completed work.
        </p>

        {loading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading pending jobs...</p>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-navy-600 mb-4">No pending jobs</p>
              <button
                onClick={() => navigate('/post-job')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
              >
                Post a new job
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isQuoteJob = ['OPEN_FOR_QUOTES', 'QUOTED'].includes(job.current_state);
              const needsPayment = ['MATCHED', 'AWAITING_PAYMENT'].includes(job.current_state);
              
              return (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isQuoteJob) {
                      navigate(`/jobs/${job.id}/quotes`);
                    } else if (needsPayment) {
                      // For matched jobs awaiting payment, go to job details page
                      navigate(`/jobs/${job.id}`);
                    } else {
                      navigate(`/jobs/${job.id}`);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
                        {getJobStatusBadge(job.current_state)}
                        {isQuoteJob && job.quote_count !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                            💬 {job.quote_count} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
                          </span>
                        )}
                      </div>
                      {job.job_description && (
                        <p className="text-sm text-navy-600 mb-2 line-clamp-2">
                          {job.job_description}
                        </p>
                      )}
                      {job.gross_fee_pesewas > 0 ? (
                        <p className="text-2xl font-bold text-navy-900 mb-2">
                          {formatCurrency(job.gross_fee_pesewas)}
                        </p>
                      ) : isQuoteJob ? (
                        <p className="text-sm text-indigo-600 font-semibold mb-2">
                          💬 {job.quote_count > 0 ? `${job.quote_count} quotes received - Click to review!` : 'Waiting for quotes'}
                        </p>
                      ) : needsPayment ? (
                        <p className="text-sm text-yellow-600 font-semibold mb-2">
                          💳 Payment pending - Click to view details
                        </p>
                      ) : null}
                      {job.location_gps_address && (
                        <p className="text-sm text-navy-600 mb-1">
                          📍 {job.location_gps_address}
                        </p>
                      )}
                    <p className="text-xs text-navy-500 mt-2">
                      Created: {formatDate(job.created_at)}
                    </p>
                  </div>
                </div>

                {/* Artisan Info */}
                {job.artisan_name && (
                  <div className="mt-3 p-3 bg-grey-50 rounded-lg">
                    <p className="text-sm text-navy-600">
                      <span className="font-semibold">Artisan:</span> {job.artisan_name}
                    </p>
                    {job.artisan_phone && (
                      <p className="text-sm text-navy-600">
                        📞 {job.artisan_phone}
                      </p>
                    )}
                  </div>
                )}

                {/* After Photo */}
                {job.photo_evidence_after_url && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-navy-900 mb-2">Completion Photos:</p>
                    <img 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${job.photo_evidence_after_url}`}
                      alt="Job completed"
                      className="w-full rounded-lg border border-navy-200"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-navy-200 flex gap-2">
                  {isQuoteJob && job.quote_count > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}/quotes`);
                      }}
                      className="flex-1"
                    >
                      💬 Review {job.quote_count} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
                    </Button>
                  )}
                  {job.current_state === 'COMPLETED_PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}/approve`);
                      }}
                      className="flex-1"
                    >
                      ✅ Review & Approve
                    </Button>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default PendingJobsPage;
