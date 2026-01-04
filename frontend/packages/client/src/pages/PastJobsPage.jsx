import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const PastJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState([]);
  const [ratingJobId, setRatingJobId] = React.useState(null);
  const [rating, setRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  const [submittingRating, setSubmittingRating] = React.useState(false);
  const [ratingError, setRatingError] = React.useState('');
  const [jobReviews, setJobReviews] = React.useState({}); // Map of jobId -> review data

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
      const response = await apiClient.get(`/jobs/client/${user.id}`);
      const allJobs = response.data.jobs || [];
      // Filter for past jobs (completed or cancelled)
      const past = allJobs.filter(job => 
        job.current_state === 'PAYOUT_SUCCESS' || 
        job.current_state === 'CANCELLED'
      );
      setJobs(past);
      
      // Fetch existing reviews for completed jobs
      const reviewsMap = {};
      await Promise.all(
        past
          .filter(job => job.current_state === 'PAYOUT_SUCCESS')
          .map(async (job) => {
            try {
              const reviewResponse = await apiClient.get(`/profile/review/${job.id}`);
              if (reviewResponse.data.review) {
                reviewsMap[job.id] = reviewResponse.data.review;
              }
            } catch (error) {
              // No review exists or error - ignore
              console.error(`Failed to fetch review for job ${job.id}:`, error);
            }
          })
      );
      setJobReviews(reviewsMap);
    } catch (error) {
      console.error('Failed to fetch past jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusBadge = (state) => {
    const statusMap = {
      'PAYOUT_SUCCESS': { label: 'Completed', color: 'bg-mint-100 text-mint-700' },
      'CANCELLED': { label: 'Cancelled', color: 'bg-grey-200 text-grey-700' },
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

  const handleRatingClick = (jobId) => {
    setRatingJobId(jobId);
    // If review exists, load it
    const existingReview = jobReviews[jobId];
    if (existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text || '');
    } else {
      setRating(0);
      setReviewText('');
    }
    setRatingError('');
  };

  const handleSubmitRating = async (jobId) => {
    if (!rating || rating < 1 || rating > 5) {
      setRatingError('Please select a rating (1-5 stars)');
      return;
    }

    setSubmittingRating(true);
    setRatingError('');

    try {
      await apiClient.post('/profile/review', {
        job_transaction_id: jobId,
        rating: rating,
        review_text: reviewText.trim() || null,
      });

      // Refresh jobs list and reviews
      await fetchJobs();
      setRatingJobId(null);
      setRating(0);
      setReviewText('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to submit rating. Please try again.';
      setRatingError(errorMessage);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCancelRating = () => {
    setRatingJobId(null);
    setRating(0);
    setReviewText('');
    setRatingError('');
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
              <p className="text-navy-600 mb-4">No past jobs</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-navy-900">Job #{job.id.slice(0, 8)}</h3>
                      {getJobStatusBadge(job.current_state)}
                    </div>
                    <p className="text-2xl font-bold text-navy-900 mb-2">
                      {formatCurrency(job.gross_fee_pesewas)}
                    </p>
                    {job.location_gps_address && (
                      <p className="text-sm text-navy-600 mb-1">
                        📍 {job.location_gps_address}
                      </p>
                    )}
                    {job.artisan_name && (
                      <p className="text-sm text-navy-600 mb-1">
                        👷 Artisan: <span className="font-medium">{job.artisan_name}</span>
                      </p>
                    )}
                    <p className="text-xs text-navy-500 mt-2">
                      Completed: {formatDate(job.updated_at || job.created_at)}
                    </p>
                  </div>
                </div>

                {/* Rating Section for Completed Jobs */}
                {job.current_state === 'PAYOUT_SUCCESS' && ratingJobId !== job.id && (
                  <div className="mt-4 pt-4 border-t border-navy-200">
                    {jobReviews[job.id] ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-navy-900">Your Rating:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-lg">
                                {star <= jobReviews[job.id].rating ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                        </div>
                        {jobReviews[job.id].review_text && (
                          <p className="text-sm text-navy-600 mb-2 italic">"{jobReviews[job.id].review_text}"</p>
                        )}
                        <button
                          onClick={() => handleRatingClick(job.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          ✏️ Edit Rating
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRatingClick(job.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        ⭐ Rate Artisan
                      </button>
                    )}
                  </div>
                )}

                {/* Rating Form */}
                {job.current_state === 'PAYOUT_SUCCESS' && ratingJobId === job.id && (
                  <div className="mt-4 pt-4 border-t border-navy-200">
                    <p className="text-sm font-semibold text-navy-900 mb-2">Rate this artisan:</p>
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-2xl focus:outline-none"
                          disabled={submittingRating}
                        >
                          {star <= rating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>

                    {/* Review Text */}
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Write a review (optional)"
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                      rows="3"
                      disabled={submittingRating}
                    />

                    {ratingError && (
                      <p className="text-sm text-coral-600 mb-2">{ratingError}</p>
                    )}

                    {/* Rating Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitRating(job.id)}
                        disabled={submittingRating || !rating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                      >
                        {submittingRating ? 'Submitting...' : 'Submit Rating'}
                      </button>
                      <button
                        onClick={handleCancelRating}
                        disabled={submittingRating}
                        className="px-4 py-2 bg-grey-200 text-navy-700 rounded-lg hover:bg-grey-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
