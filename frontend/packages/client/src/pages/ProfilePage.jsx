// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, BottomNavigation, Button } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const ProfilePage = () => {
//   const navigate = useNavigate();
//   const { logout } = useAuth();
//   const [profile, setProfile] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [isEditing, setIsEditing] = React.useState(false);
//   const [saving, setSaving] = React.useState(false);
//   const [saveError, setSaveError] = React.useState(null);
//   const [saveSuccess, setSaveSuccess] = React.useState(false);
  
//   // Form data for editing
//   const [editData, setEditData] = React.useState({
//     full_name: '',
//     home_gps_address: '',
//   });

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'My Jobs', icon: '📋' },
//     { path: '/post-job', label: 'Post Job', icon: '➕' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   React.useEffect(() => {
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get('/profile/profile');
//       const profileData = response.data.profile;
//       setProfile(profileData);
      
//       // Initialize edit data with current profile values
//       setEditData({
//         full_name: profileData.full_name || '',
//         home_gps_address: profileData.home_gps_address || '',
//       });
//     } catch (error) {
//       console.error('Failed to fetch profile:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     logout(navigate);
//   };

//   const handleEditClick = () => {
//     setIsEditing(true);
//     setSaveError(null);
//     setSaveSuccess(false);
//   };

//   const handleCancelEdit = () => {
//     setIsEditing(false);
//     setSaveError(null);
//     setSaveSuccess(false);
//     // Reset edit data to current profile values
//     if (profile) {
//       setEditData({
//         full_name: profile.full_name || '',
//         home_gps_address: profile.home_gps_address || '',
//       });
//     }
//   };

//   const handleEditChange = (e) => {
//     const { name, value } = e.target;
//     setEditData(prev => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSave = async () => {
//     try {
//       setSaving(true);
//       setSaveError(null);
//       setSaveSuccess(false);

//       // Prepare update data (only include fields that have values)
//       const updateData = {};
//       if (editData.full_name?.trim()) updateData.full_name = editData.full_name.trim();
//       if (editData.home_gps_address?.trim()) updateData.home_gps_address = editData.home_gps_address.trim();

//       if (Object.keys(updateData).length === 0) {
//         setSaveError('Please fill in at least one field to update.');
//         setSaving(false);
//         return;
//       }

//       const response = await apiClient.put('/profile/profile', updateData);
      
//       setSaveSuccess(true);
//       setIsEditing(false);
      
//       // Refresh profile data
//       await fetchProfile();
      
//       // Clear success message after 3 seconds
//       setTimeout(() => setSaveSuccess(false), 3000);
//     } catch (error) {
//       console.error('Failed to update profile:', error);
//       const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update profile';
//       setSaveError(errorMessage);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       {/* Top Navigation */}
//       <nav className="bg-navy-900 text-white px-6 py-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center">
//             <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
//           </div>
//           <button
//             onClick={handleLogout}
//             className="text-sm hover:text-indigo-400 transition-colors"
//           >
//             Logout
//           </button>
//         </div>
//       </nav>

//       {/* Page Content */}
//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-6">
//           Profile
//         </h1>

//         {loading ? (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading profile...</p>
//           </Card>
//         ) : profile ? (
//           <>
//             {/* Profile Details */}
//             <Card>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900">Profile Details</h2>
//                 {!isEditing && (
//                   <Button variant="secondary" size="sm" onClick={handleEditClick}>
//                     Edit
//                   </Button>
//                 )}
//               </div>

//               {saveSuccess && (
//                 <div className="mb-4 p-3 bg-mint-100 text-mint-700 rounded-lg text-sm">
//                   Profile updated successfully!
//                 </div>
//               )}

//               {saveError && (
//                 <div className="mb-4 p-3 bg-coral-100 text-coral-700 rounded-lg text-sm">
//                   {saveError}
//                 </div>
//               )}

//               {isEditing ? (
//                 <div className="space-y-4">
//                   {/* Full Name */}
//                   <div>
//                     <label htmlFor="full_name" className="block text-sm font-semibold text-navy-900 mb-2">
//                       Full Name
//                     </label>
//                     <input
//                       type="text"
//                       id="full_name"
//                       name="full_name"
//                       value={editData.full_name}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                       placeholder="Enter your full name"
//                     />
//                   </div>

//                   {/* GPS Address */}
//                   <div>
//                     <label htmlFor="home_gps_address" className="block text-sm font-semibold text-navy-900 mb-2">
//                       GPS Address
//                     </label>
//                     <input
//                       type="text"
//                       id="home_gps_address"
//                       name="home_gps_address"
//                       value={editData.home_gps_address}
//                       onChange={handleEditChange}
//                       className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                       placeholder="Enter your GPS address (e.g., GA-123-456)"
//                     />
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="flex gap-3 pt-4">
//                     <Button
//                       variant="primary"
//                       onClick={handleSave}
//                       disabled={saving}
//                       fullWidth
//                     >
//                       {saving ? 'Saving...' : 'Save Changes'}
//                     </Button>
//                     <Button
//                       variant="secondary"
//                       onClick={handleCancelEdit}
//                       disabled={saving}
//                       fullWidth
//                     >
//                       Cancel
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-navy-500 text-sm mb-1">Phone</p>
//                     <p className="text-navy-900">{profile.phone_primary}</p>
//                   </div>
//                   <div>
//                     <p className="text-navy-500 text-sm mb-1">Full Name</p>
//                     <p className="text-navy-900">{profile.full_name || 'Not set'}</p>
//                   </div>
//                   {profile.email && (
//                     <div>
//                       <p className="text-navy-500 text-sm mb-1">Email</p>
//                       <p className="text-navy-900">{profile.email}</p>
//                     </div>
//                   )}
//                   {profile.home_gps_address && (
//                     <div>
//                       <p className="text-navy-500 text-sm mb-1">GPS Address</p>
//                       <p className="text-navy-900">{profile.home_gps_address}</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </Card>
//           </>
//         ) : (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Failed to load profile</p>
//           </Card>
//         )}
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default ProfilePage;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Existing State
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  
  // Existing Form Data
  const [editData, setEditData] = React.useState({
    full_name: '',
    home_gps_address: '',
  });

  // --- NEW: Password Change State ---
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/profile/profile');
      const profileData = response.data.profile;
      setProfile(profileData);
      
      setEditData({
        full_name: profileData.full_name || '',
        home_gps_address: profileData.home_gps_address || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(navigate);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        home_gps_address: profile.home_gps_address || '',
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const updateData = {};
      if (editData.full_name?.trim()) updateData.full_name = editData.full_name.trim();
      if (editData.home_gps_address?.trim()) updateData.home_gps_address = editData.home_gps_address.trim();

      if (Object.keys(updateData).length === 0) {
        setSaveError('Please fill in at least one field to update.');
        setSaving(false);
        return;
      }

      await apiClient.put('/profile/profile', updateData);
      
      setSaveSuccess(true);
      setIsEditing(false);
      await fetchProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update profile';
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // --- NEW: Handle Password Change ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
        setPassMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
    }

    if (passwordData.new_password.length < 6) {
        setPassMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
        return;
    }

    try {
        setPassLoading(true);
        // Endpoint matches identityRoutes.js
        await apiClient.post('/identity/change-password', {
            old_password: passwordData.old_password,
            new_password: passwordData.new_password
        });
        
        setPassMessage({ type: 'success', text: 'Password updated successfully.' });
        setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        // Close form after success
        setTimeout(() => {
            setShowPasswordForm(false);
            setPassMessage({ type: '', text: '' });
        }, 2000);
    } catch (err) {
        setPassMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
        setPassLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      <nav className="bg-navy-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="ZOLID" className="h-8 w-auto cursor-pointer" onClick={() => navigate('/dashboard')} />
          </div>
          <button
            onClick={handleLogout}
            className="text-sm hover:text-indigo-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <h1 className="font-condensed font-bold text-4xl">
          Profile
        </h1>

        {loading ? (
          <Card>
            <p className="text-navy-600 text-center py-8">Loading profile...</p>
          </Card>
        ) : profile ? (
          <>
            {/* Existing Profile Card */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-condensed font-bold text-xl text-navy-900">Profile Details</h2>
                {!isEditing && (
                  <Button variant="secondary" size="sm" onClick={handleEditClick}>
                    Edit
                  </Button>
                )}
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-mint-100 text-mint-700 rounded-lg text-sm">
                  Profile updated successfully!
                </div>
              )}

              {saveError && (
                <div className="mb-4 p-3 bg-coral-100 text-coral-700 rounded-lg text-sm">
                  {saveError}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-semibold text-navy-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={editData.full_name}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="home_gps_address" className="block text-sm font-semibold text-navy-900 mb-2">
                      GPS Address
                    </label>
                    <input
                      type="text"
                      id="home_gps_address"
                      name="home_gps_address"
                      value={editData.home_gps_address}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your GPS address (e.g., GA-123-456)"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-navy-500 text-sm mb-1">Phone</p>
                    <p className="text-navy-900">{profile.phone_primary}</p>
                  </div>
                  <div>
                    <p className="text-navy-500 text-sm mb-1">Full Name</p>
                    <p className="text-navy-900">{profile.full_name || 'Not set'}</p>
                  </div>
                  {profile.email && (
                    <div>
                      <p className="text-navy-500 text-sm mb-1">Email</p>
                      <p className="text-navy-900">{profile.email}</p>
                    </div>
                  )}
                  {profile.home_gps_address && (
                    <div>
                      <p className="text-navy-500 text-sm mb-1">GPS Address</p>
                      <p className="text-navy-900">{profile.home_gps_address}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* --- NEW: Security Card --- */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-condensed font-bold text-xl text-navy-900">Security</h2>
                {!showPasswordForm && (
                    <Button variant="secondary" size="sm" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                    </Button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handleChangePassword} className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {passMessage.text && (
                        <div className={`p-3 rounded text-sm ${passMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {passMessage.text}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={passwordData.old_password}
                            onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 border border-navy-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="primary" type="submit" disabled={passLoading} fullWidth>
                            {passLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button variant="secondary" type="button" onClick={() => setShowPasswordForm(false)} disabled={passLoading} fullWidth>
                            Cancel
                        </Button>
                    </div>
                </form>
              )}
            </Card>
          </>
        ) : (
          <Card>
            <p className="text-navy-600 text-center py-8">Failed to load profile</p>
          </Card>
        )}
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default ProfilePage;