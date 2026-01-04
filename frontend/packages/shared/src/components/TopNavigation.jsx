import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '@zolid/shared/utils';

const TopNavigation = ({ profile, onLogout, showProfilePicture = true, logo }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = React.useState(false);

  const getProfilePictureUrl = () => {
    if (!profile?.profile_picture_url) return null;
    // Backend serves uploads at base URL (not under /api/v1)
    const BACKEND_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:8000';
    // profile_picture_url is already in format /uploads/filename.jpg
    const path = profile.profile_picture_url.startsWith('/') 
      ? profile.profile_picture_url 
      : `/uploads/${profile.profile_picture_url}`;
    return `${BACKEND_URL}${path}`;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <nav className="bg-navy-900 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {logo ? (
            <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          ) : (
            <span className="text-xl font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>ZOLID</span>
          )}
        </div>
        {showProfilePicture && profile && (
          <div className="flex items-center gap-3">
            {profilePictureUrl && !imageError ? (
              <img
                src={profilePictureUrl}
                alt={profile.full_name || 'Profile'}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20 cursor-pointer hover:border-white/40 transition-colors"
                onClick={() => navigate('/profile')}
                onError={() => setImageError(true)}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold border-2 border-white/20 cursor-pointer hover:border-white/40 transition-colors"
                onClick={() => navigate('/profile')}
              >
                {getInitials(profile.full_name || 'User')}
              </div>
            )}
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-sm hover:text-indigo-400 transition-colors ml-4"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default TopNavigation;
