import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BottomNavigation, TopNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import ArtisanJobCard from '../components/ArtisanJobCard';
import logo from '../assets/logos/logo.png';
import { Filter, RefreshCw } from 'lucide-react';

const MyJobsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  
  const filter = searchParams.get('filter') || 'active'; // Default to 'active' for better UX
  
  const filters = [
    { key: 'active', label: 'Active', icon: '⚡' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'quoted', label: 'My Quotes', icon: '💬' },
    { key: 'all', label: 'All Jobs', icon: '📋' },
  ];

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchJobs();
      fetchProfile();
    }
  }, [user?.id, filter]);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile/profile');
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/jobs/my-jobs?filter=${filter}`);
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

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <TopNavigation profile={profile} logo={logo} />

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-condensed font-bold text-3xl md:text-4xl text-navy-900">
            My Gigs
          </h1>
          {/* Mobile-friendly Refresh Button */}
          <button 
            onClick={fetchJobs} 
            className="p-2 bg-white rounded-full shadow-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Refresh Jobs"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                  : 'bg-white text-navy-600 hover:bg-grey-100 border border-grey-200'
              }`}
            >
              <span className="mr-2">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-navy-500 font-medium">Loading your jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-grey-300 p-10 text-center">
            <div className="inline-flex p-4 bg-grey-100 rounded-full mb-4">
              <Filter className="w-8 h-8 text-grey-400" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">No jobs found</h3>
            <p className="text-navy-500 mt-1 mb-6">
              You don't have any {filters.find(f => f.key === filter)?.label.toLowerCase()} jobs at the moment.
            </p>
            {filter !== 'all' && (
              <Button
                variant="secondary"
                onClick={() => handleFilterChange('all')}
                className="mx-auto"
              >
                View All History
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <ArtisanJobCard 
                key={job.id} 
                job={job} 
                onRefresh={fetchJobs} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default MyJobsPage;