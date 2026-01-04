import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation, Input, TopNavigation } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);
  const [response, setResponse] = React.useState(null);
  const [initialLoading, setInitialLoading] = React.useState(true);
  
  const [formData, setFormData] = React.useState({
    gh_card_number: '',
    home_gps_address: '',
    primary_trade: '',
    primary_language: 'ENGLISH',
  });
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = React.useState(null);
  const [ghanaCardImage, setGhanaCardImage] = React.useState(null);
  const [ghanaCardImagePreview, setGhanaCardImagePreview] = React.useState(null);
  const [existingProfilePictureUrl, setExistingProfilePictureUrl] = React.useState(null);
  const [existingGhanaCardImageUrl, setExistingGhanaCardImageUrl] = React.useState(null);
  const [profile, setProfile] = React.useState(null);

  // Fetch existing profile data on mount
  React.useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      setInitialLoading(true);
      const profileResponse = await apiClient.get('/profile/profile');
      const profile = profileResponse.data.profile;
      
      if (profile) {
        // Pre-fill form data
        setFormData({
          gh_card_number: profile.gh_card_number || '',
          home_gps_address: profile.home_gps_address || '',
          primary_trade: profile.primary_trade || '',
          primary_language: profile.primary_language || 'ENGLISH',
        });
        
        // Set existing image URLs for display
        if (profile.profile_picture_url) {
          setExistingProfilePictureUrl(profile.profile_picture_url);
        }
        if (profile.gh_card_image_url) {
          setExistingGhanaCardImageUrl(profile.gh_card_image_url);
        }
      }
    } catch (error) {
      console.error('Failed to fetch existing profile:', error);
      // Don't show error, just proceed with empty form
    } finally {
      setInitialLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGhanaCardImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGhanaCardImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setGhanaCardImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to get image URL from backend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Backend serves uploads at base URL (not under /api/v1)
    const BACKEND_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:8000';
    const path = imagePath.startsWith('/') 
      ? imagePath 
      : `/uploads/${imagePath}`;
    return `${BACKEND_URL}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

      // Upload profile picture if provided
      if (profilePicture) {
        const formDataForUpload = new FormData();
        formDataForUpload.append('profile_picture', profilePicture);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || errorData.message || 'Failed to upload profile picture');
        }
      }

      // Upload Ghana Card image only if a new one is selected
      // If existingGhanaCardImageUrl exists, we skip upload unless user selects a new file
      if (ghanaCardImage) {
        const formDataForUpload = new FormData();
        formDataForUpload.append('ghana_card_image', ghanaCardImage);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/upload/ghana-card`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || errorData.message || 'Failed to upload Ghana Card image');
        }
      }

      // Build update data - MVP required fields
      const updateData = {};
      
      // Required MVP fields
      if (!formData.gh_card_number || !formData.gh_card_number.trim()) {
        setError('Ghana Card Number is required.');
        setLoading(false);
        return;
      }
      updateData.gh_card_number = formData.gh_card_number.trim();

      if (!formData.primary_trade || !formData.primary_trade.trim()) {
        setError('Primary Trade is required.');
        setLoading(false);
        return;
      }
      updateData.primary_trade = formData.primary_trade.trim();

      if (!formData.primary_language || !formData.primary_language.trim()) {
        setError('Primary Language is required.');
        setLoading(false);
        return;
      }
      updateData.primary_language = formData.primary_language.trim();

      // GPS Address is now required
      if (!formData.home_gps_address || !formData.home_gps_address.trim()) {
        setError('GPS Address is required.');
        setLoading(false);
        return;
      }
      updateData.home_gps_address = formData.home_gps_address.trim();

      const response = await apiClient.post('/identity/artisan/verify-identity', updateData);
      setResponse(response);

      // Show success message and redirect after a short delay
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Profile verification error:', err);
      
      // Handle network errors specifically
      if (err.message?.includes('ERR_CONNECTION_REFUSED') || err.message?.includes('Failed to fetch') || err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if the server is running and try again.');
      } else {
        const errorMsg = err.response?.data?.message || 
                         err.response?.data?.error || 
                         err.data?.error ||
                         err.message || 
                         'Failed to complete profile verification';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Jobs', icon: '💼' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];


  const trades = [
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Painting',
    'Hairdressing',
    'Barbering',
    'Beauty',
    'Nail Care',
    'Massage',
    'Spa',
    'Facial',
    'Hair Styling',
    'Hair Cutting',
    'Masonry',
    'Painting',
    'Tiling',
    'Roofing',
    'Welding',
    'Aluminum Works',
    'General Construction',
  ];

  const languages = [
    'ENGLISH',
    'TWI',
    'GA',
    'EWE',
    'FANTE',
    'HAUSA',
    'WAALI',
    'DAGAARE',
    'DAGBANLI',
    'MAMPRULI',
    'GONJA',
    'FRAFRA',
  ];

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <TopNavigation profile={profile} logo={logo} />

      {/* Page Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-condensed font-bold text-4xl mb-2">
          Complete Your Profile
        </h1>
        <p className="text-navy-600 mb-8">
          Complete your profile to unlock job access. All fields marked with * are required.
        </p>

        {initialLoading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading profile data...</p>
          </Card>
        ) : success ? (
          <Card variant="navy">
            <p className="text-white text-center py-8">
              ✅ Profile information saved! {response?.data?.can_see_gigs ? 'You can now see jobs.' : 'Continue adding information to unlock job access.'} Redirecting...
            </p>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
                  <p className="text-coral-700 text-sm">{error}</p>
                </div>
              )}

              {/* Ghana Card Number */}
              <div>
                <label htmlFor="gh_card_number" className="block text-sm font-semibold text-navy-900 mb-2">
                  Ghana Card Number <span className="text-coral-600">*</span>
                </label>
                <Input
                  id="gh_card_number"
                  name="gh_card_number"
                  type="text"
                  value={formData.gh_card_number}
                  onChange={handleChange}
                  placeholder="GHA-123456789-0"
                  required
                  className="w-full"
                />
                <p className="text-navy-500 text-xs mt-1">
                  Your Ghana Card number (must start with "GHA")
                </p>
              </div>

              {/* Ghana Card Image */}
              <div>
                <label htmlFor="ghana_card_image" className="block text-sm font-semibold text-navy-900 mb-2">
                  Ghana Card Image <span className="text-coral-600">*</span>
                  {existingGhanaCardImageUrl && (
                    <span className="text-xs text-mint-600 ml-2">(Already uploaded)</span>
                  )}
                </label>
                <div className="space-y-2">
                  {/* Show existing image or new preview */}
                  {(ghanaCardImagePreview || existingGhanaCardImageUrl) && (
                    <div className="w-full max-w-xs border-2 border-navy-200 rounded-lg overflow-hidden">
                      <img 
                        src={ghanaCardImagePreview || getImageUrl(existingGhanaCardImageUrl)} 
                        alt="Ghana Card" 
                        className="w-full h-auto object-contain" 
                      />
                    </div>
                  )}
                  <input
                    id="ghana_card_image"
                    name="ghana_card_image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleGhanaCardImageChange}
                    required={!existingGhanaCardImageUrl}
                    className="block w-full text-sm text-navy-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-500 file:text-white
                      hover:file:bg-indigo-600
                      cursor-pointer"
                  />
                  <p className="text-navy-500 text-xs">
                    {existingGhanaCardImageUrl 
                      ? 'Ghana Card image already uploaded. Upload a new one to replace it.' 
                      : 'Upload a clear photo of your Ghana Card (max 5MB)'}
                  </p>
                </div>
              </div>

              {/* Primary Trade */}
              <div>
                <label htmlFor="primary_trade" className="block text-sm font-semibold text-navy-900 mb-2">
                  Primary Trade <span className="text-coral-600">*</span>
                </label>
                <select
                  id="primary_trade"
                  name="primary_trade"
                  value={formData.primary_trade}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select your trade</option>
                  {trades.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              {/* Primary Language */}
              <div>
                <label htmlFor="primary_language" className="block text-sm font-semibold text-navy-900 mb-2">
                  Primary Language <span className="text-coral-600">*</span>
                </label>
                <select
                  id="primary_language"
                  name="primary_language"
                  value={formData.primary_language}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <p className="text-navy-500 text-xs mt-1">
                  Your preferred language for communication
                </p>
              </div>

              {/* GPS Address */}
              <div>
                <label htmlFor="home_gps_address" className="block text-sm font-semibold text-navy-900 mb-2">
                  GPS Address <span className="text-coral-600">*</span>
                </label>
                <Input
                  id="home_gps_address"
                  name="home_gps_address"
                  type="text"
                  value={formData.home_gps_address}
                  onChange={handleChange}
                  placeholder="GA-123-456"
                  required
                  className="w-full"
                />
                <p className="text-navy-500 text-xs mt-1">
                  Your GPS address code (e.g., GA-123-456). Required to unlock job access.
                </p>
              </div>

              {/* Profile Picture */}
              <div>
                <label htmlFor="profile_picture" className="block text-sm font-semibold text-navy-900 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="space-y-2">
                  {profilePicturePreview && (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-navy-200">
                      <img src={profilePicturePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    id="profile_picture"
                    name="profile_picture"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-navy-600
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-500 file:text-white
                      hover:file:bg-indigo-600
                      cursor-pointer"
                  />
                  <p className="text-navy-500 text-xs">
                    Add a professional profile picture (max 5MB)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Complete Profile'}
              </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation items={navItems} />
    </div>
  );
};

export default CompleteProfilePage;
