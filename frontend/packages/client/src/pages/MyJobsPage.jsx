import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import LocationDisplay from '../components/LocationDisplay'; // Import LocationDisplay
import logo from '../assets/logos/logo.png';
import { 
  Briefcase, 
  AlertCircle, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  CreditCard,
  FileText
} from 'lucide-react'; // Added icons

const MyJobsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  
  const filter = searchParams.get('filter') || 'all';

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  const filters = [
    { key: 'all', label: 'All Jobs' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'disputed', label: 'Disputed' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
    }
  }, [user?.id, filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/jobs/client/${user.id}?filter=${filter}`);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error(`Failed to fetch ${filter} jobs:`, error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setSearchParams({ filter: newFilter });
  };

  // Navigate to dispute page
  const handleViewDispute = async (e, jobId) => {
    e.stopPropagation(); // Prevent card click
    try {
      const res = await apiClient.get(`/disputes/${jobId}`);
      if (res.data.data && res.data.data.id) {
        navigate(`/disputes/${res.data.data.id}`);
      } else {
        alert("Dispute record not found.");
      }
    } catch (error) {
      console.error("Error finding dispute:", error);
      alert("Failed to load dispute details.");
    }
  };

  // Image URL helper
  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/150?text=No+Img";
    if (path.startsWith('http')) return path;
    const BASE_URL = 'http://localhost:8000'; // Adjust for production
    return `${BASE_URL}${path}`;
  };

  const getStatusBadge = (state) => {
    const map = {
      'DRAFT': { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      'OPEN_FOR_QUOTES': { label: 'Open', className: 'bg-blue-100 text-blue-700' },
      'MATCHED_PENDING_PAYMENT': { label: 'Pay Now', className: 'bg-yellow-100 text-yellow-800' },
      'ESCROW_HELD': { label: 'In Escrow', className: 'bg-indigo-100 text-indigo-700' },
      'STARTED': { label: 'In Progress', className: 'bg-indigo-100 text-indigo-700' },
      'IN_PROGRESS': { label: 'In Progress', className: 'bg-indigo-100 text-indigo-700' },
      'COMPLETED_PENDING': { label: 'Review', className: 'bg-purple-100 text-purple-700' },
      'PAYOUT_SUCCESS': { label: 'Completed', className: 'bg-green-100 text-green-800' },
      'DISPUTED': { label: 'Disputed', className: 'bg-red-100 text-red-800' },
      'CANCELLED_REFUNDED': { label: 'Refunded', className: 'bg-gray-200 text-gray-600' }
    };
    const status = map[state] || { label: state, className: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${status.className}`}>
        {status.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-navy-900 text-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <img src={logo} alt="ZOLID" className="h-8 w-auto" />
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-navy-900">All My Jobs</h1>
          <Button size="sm" onClick={() => navigate('/post-job')}>
            + New Job
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                filter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Job List */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No {filter} jobs found.</p>
            {filter === 'all' && (
              <button 
                onClick={() => navigate('/post-job')}
                className="mt-4 text-indigo-600 font-semibold hover:underline"
              >
                Post a Job
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card 
                key={job.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  
                  {/* Job Details */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between md:justify-start gap-3 mb-2">
                      <h3 className="font-bold text-lg text-navy-900 truncate">
                        {job.job_description}
                      </h3>
                      {getStatusBadge(job.current_state)}
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
                        <div className="flex items-center gap-2">
                          <img 
                            src={getImageUrl(job.artisan_profile_picture_url || job.artisan_picture)} 
                            alt="Artisan" 
                            className="w-6 h-6 rounded-full object-cover border border-gray-200"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/50?text=A"; }}
                          />
                          <span className="font-semibold text-navy-700">{job.artisan_name}</span>
                        </div>
                      ) : (
                        <p className="italic text-gray-400">No artisan yet</p>
                      )}
                      
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full md:w-auto flex flex-col items-end justify-center gap-2 mt-2 md:mt-0">
                    
                    {/* 1. DISPUTE ACTION */}
                    {job.current_state === 'DISPUTED' && (
                      <Button 
                        onClick={(e) => handleViewDispute(e, job.id)}
                        className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Resolve Dispute
                      </Button>
                    )}

                    {/* 2. APPROVAL ACTION */}
                    {job.current_state === 'COMPLETED_PENDING' && (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}/approve`); }}
                        className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Review Work
                      </Button>
                    )}

                    {/* 3. PAYMENT ACTION */}
                    {job.current_state === 'MATCHED_PENDING_PAYMENT' && (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}/payment`); }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Now
                      </Button>
                    )}

                    {/* 4. VIEW QUOTES */}
                    {(job.current_state === 'OPEN_FOR_QUOTES' || job.current_state === 'QUOTED') && (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}/quotes`); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto flex items-center justify-center gap-2 text-sm py-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Quotes
                      </Button>
                    )}

                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default MyJobsPage;