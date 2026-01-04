

// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, BottomNavigation, Button, TopNavigation } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import { getInitials } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const ProfilePage = () => {
//   const navigate = useNavigate();
//   const { logout } = useAuth();
//   const [profile, setProfile] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [uploading, setUploading] = React.useState(false);
//   const [uploadError, setUploadError] = React.useState(null);
//   const [imageError, setImageError] = React.useState(false);
//   const [isEditing, setIsEditing] = React.useState(false);
//   const [saving, setSaving] = React.useState(false);
//   const [saveError, setSaveError] = React.useState(null);
//   const [saveSuccess, setSaveSuccess] = React.useState(false);
//   const [benefitsSummary, setBenefitsSummary] = React.useState(null);
  
//   // Form data for editing
//   const [editData, setEditData] = React.useState({
//     full_name: '',
//     primary_trade: '',
//     primary_language: 'ENGLISH',
//     home_gps_address: '',
//   });

//   // Guarantor management state
//   const [guarantors, setGuarantors] = React.useState([]);
//   const [guarantorLoading, setGuarantorLoading] = React.useState(true);
//   const [guarantorError, setGuarantorError] = React.useState(null);
//   const [showAddGuarantor, setShowAddGuarantor] = React.useState(false);
//   const [newGuarantor, setNewGuarantor] = React.useState({
//     name: '',
//     phone: '',
//     relationship: ''
//   });
//   const [editGuarantorId, setEditGuarantorId] = React.useState(null);
//   const [editGuarantorData, setEditGuarantorData] = React.useState({
//     name: '',
//     phone: '',
//     relationship: ''
//   });
//   const [guarantorActionLoading, setGuarantorActionLoading] = React.useState(false);
//   const [guarantorActionSuccess, setGuarantorActionSuccess] = React.useState(false);

//   // --- NEW: Password Change State ---
//   const [showPassForm, setShowPassForm] = React.useState(false);
//   const [passData, setPassData] = React.useState({ old: '', new: '', confirm: '' });
//   const [passStatus, setPassStatus] = React.useState({ loading: false, error: null, success: false });

//   React.useEffect(() => {
//     fetchProfile();
//     fetchBenefitsSummary();
//     fetchGuarantors();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       setLoading(true);
//       const response = await apiClient.get('/profile/profile');
//       const profileData = response.data.profile;
//       setProfile(profileData);
//       setEditData({
//         full_name: profileData.full_name || '',
//         primary_trade: profileData.primary_trade || '',
//         primary_language: profileData.primary_language || 'ENGLISH',
//         home_gps_address: profileData.home_gps_address || '',
//       });
//     } catch (error) {
//       console.error('Failed to fetch profile:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBenefitsSummary = async () => {
//     try {
//       const response = await apiClient.get('/benefits/artisan/summary');
//       setBenefitsSummary(response.data.summary);
//     } catch (error) {
//       console.error('Failed to fetch benefits summary:', error);
//       setBenefitsSummary(null);
//     }
//   };

//   const fetchGuarantors = async () => {
//     try {
//       setGuarantorLoading(true);
//       setGuarantorError(null);
//       const response = await apiClient.get('/profile/guarantors');
//       setGuarantors(response.data.guarantors || []);
//     } catch (error) {
//       console.error('Failed to fetch guarantors:', error);
//       setGuarantorError(error.response?.data?.message || error.message || 'Failed to fetch guarantors');
//     } finally {
//       setGuarantorLoading(false);
//     }
//   };

//   // --- NEW: Password Handler ---
//   const handlePassChange = async (e) => {
//     e.preventDefault();
//     setPassStatus({ loading: true, error: null, success: false });

//     if (passData.new !== passData.confirm) {
//         setPassStatus({ loading: false, error: "Passwords do not match", success: false });
//         return;
//     }

//     if (passData.new.length < 6) {
//         setPassStatus({ loading: false, error: "Password must be at least 6 characters", success: false });
//         return;
//     }

//     try {
//         await apiClient.post('/identity/change-password', {
//             old_password: passData.old,
//             new_password: passData.new
//         });
//         setPassStatus({ loading: false, error: null, success: true });
//         setPassData({ old: '', new: '', confirm: '' });
//         setTimeout(() => setShowPassForm(false), 2000);
//     } catch (err) {
//         setPassStatus({ 
//             loading: false, 
//             error: err.response?.data?.message || "Failed to update password", 
//             success: false 
//         });
//     }
//   };

//   // ... (Keep existing helpers: isFullyVerified, handlePictureUpload, getProfilePictureUrl, formatRating, Guarantor handlers) ...
//   const isFullyVerified = React.useMemo(() => {
//     if (!profile) return false;
//     return (
//       profile.momo_network &&
//       profile.is_momo_verified &&
//       profile.paystack_resolved_name &&
//       profile.paystack_recipient_code &&
//       profile.gh_card_number &&
//       profile.gh_card_image_url &&
//       profile.is_identity_verified &&
//       profile.primary_trade &&
//       profile.primary_language
//     );
//   }, [profile]);

//   const handlePictureUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setUploading(true);
//     setUploadError(null);
//     try {
//       const formData = new FormData();
//       formData.append('profile_picture', file);
//       const token = localStorage.getItem('authToken');
//       const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
//       const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//         body: formData,
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || errorData.message || 'Upload failed');
//       }
//       setImageError(false);
//       await fetchProfile();
//     } catch (error) {
//       console.error('Failed to upload picture:', error);
//       setUploadError(error.message || 'Failed to upload picture');
//     } finally {
//       setUploading(false);
//       e.target.value = '';
//     }
//   };

//   const getProfilePictureUrl = () => {
//     if (!profile?.profile_picture_url) return null;
//     const BACKEND_URL = import.meta.env.VITE_API_URL 
//       ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
//       : 'http://localhost:8000';
//     const path = profile.profile_picture_url.startsWith('/') 
//       ? profile.profile_picture_url 
//       : `/uploads/${profile.profile_picture_url}`;
//     return `${BACKEND_URL}${path}`;
//   };

//   const formatRating = (score) => {
//     if (score === null || score === undefined) return '0.0';
//     return parseFloat(score).toFixed(1);
//   };

//   // ... (Guarantor handlers: handleAddGuarantorClick, handleCancelAddGuarantor, handleNewGuarantorChange, handleAddGuarantor, handleEditGuarantorClick, handleCancelEditGuarantor, handleEditGuarantorChange, handleUpdateGuarantor, handleDeleteGuarantor) ...
//   const handleAddGuarantorClick = () => { setShowAddGuarantor(true); setNewGuarantor({ name: '', phone: '', relationship: '' }); setGuarantorError(null); setGuarantorActionSuccess(false); };
//   const handleCancelAddGuarantor = () => { setShowAddGuarantor(false); setGuarantorError(null); setGuarantorActionSuccess(false); };
//   const handleNewGuarantorChange = (e) => { const { name, value } = e.target; setNewGuarantor(prev => ({ ...prev, [name]: value })); };
//   const handleAddGuarantor = async () => { try { setGuarantorActionLoading(true); setGuarantorError(null); setGuarantorActionSuccess(false); if (!newGuarantor.name.trim() || !newGuarantor.phone.trim() || !newGuarantor.relationship.trim()) { setGuarantorError('All fields are required.'); setGuarantorActionLoading(false); return; } await apiClient.post('/profile/guarantors', newGuarantor); setGuarantorActionSuccess(true); setShowAddGuarantor(false); await fetchGuarantors(); setTimeout(() => setGuarantorActionSuccess(false), 3000); } catch (error) { setGuarantorError(error.response?.data?.message || 'Failed to add guarantor'); } finally { setGuarantorActionLoading(false); } };
//   const handleEditGuarantorClick = (guarantor) => { setEditGuarantorId(guarantor.id); setEditGuarantorData({ name: guarantor.name, phone: guarantor.phone, relationship: guarantor.relationship }); setGuarantorError(null); setGuarantorActionSuccess(false); };
//   const handleCancelEditGuarantor = () => { setEditGuarantorId(null); setGuarantorError(null); setGuarantorActionSuccess(false); };
//   const handleEditGuarantorChange = (e) => { const { name, value } = e.target; setEditGuarantorData(prev => ({ ...prev, [name]: value })); };
//   const handleUpdateGuarantor = async () => { try { setGuarantorActionLoading(true); setGuarantorError(null); setGuarantorActionSuccess(false); if (!editGuarantorData.name.trim() || !editGuarantorData.phone.trim() || !editGuarantorData.relationship.trim()) { setGuarantorError('All fields are required.'); setGuarantorActionLoading(false); return; } await apiClient.put(`/profile/guarantors/${editGuarantorId}`, editGuarantorData); setGuarantorActionSuccess(true); setEditGuarantorId(null); await fetchGuarantors(); setTimeout(() => setGuarantorActionSuccess(false), 3000); } catch (error) { setGuarantorError(error.response?.data?.message || 'Failed to update guarantor'); } finally { setGuarantorActionLoading(false); } };
//   const handleDeleteGuarantor = async (guarantorId) => { if (!window.confirm('Are you sure you want to delete this guarantor?')) return; try { setGuarantorActionLoading(true); setGuarantorError(null); await apiClient.delete(`/profile/guarantors/${guarantorId}`); await fetchGuarantors(); } catch (error) { setGuarantorError(error.response?.data?.message || 'Failed to delete guarantor'); } finally { setGuarantorActionLoading(false); } };

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'Available', icon: '💼' },
//     { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
//     { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
//     { path: '/wallet', label: 'Wallet', icon: '💰' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   const MenuItem = ({ icon: Icon, label, subLabel, onClick, color = "text-gray-600" }) => (
//     <button 
//         onClick={onClick}
//         className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors mb-3 shadow-sm"
//     >
//         <div className="flex items-center gap-4">
//             <div className={`p-2 rounded-full bg-gray-50 ${color}`}>
//                 <Icon size={20} />
//             </div>
//             <div className="text-left">
//                 <p className="font-semibold text-gray-900 text-sm">{label}</p>
//                 {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
//             </div>
//         </div>
//         <ChevronRight size={16} className="text-gray-400" />
//     </button>
// );

//   const handleLogout = () => { logout(navigate); };
//   const handleEditClick = () => { setIsEditing(true); setSaveError(null); setSaveSuccess(false); };
//   const handleCancelEdit = () => { setIsEditing(false); setSaveError(null); setSaveSuccess(false); if (profile) { setEditData({ full_name: profile.full_name || '', primary_trade: profile.primary_trade || '', primary_language: profile.primary_language || 'ENGLISH', home_gps_address: profile.home_gps_address || '', }); } };
//   const handleEditChange = (e) => { const { name, value } = e.target; setEditData(prev => ({ ...prev, [name]: value, })); };
//   const handleSave = async () => { try { setSaving(true); setSaveError(null); setSaveSuccess(false); const updateData = {}; if (editData.full_name?.trim()) updateData.full_name = editData.full_name.trim(); if (editData.primary_trade?.trim()) updateData.primary_trade = editData.primary_trade.trim(); if (editData.primary_language?.trim()) updateData.primary_language = editData.primary_language.trim(); if (editData.home_gps_address?.trim()) updateData.home_gps_address = editData.home_gps_address.trim(); if (Object.keys(updateData).length === 0) { setSaveError('Please fill in at least one field to update.'); setSaving(false); return; } await apiClient.put('/profile/profile', updateData); setSaveSuccess(true); setIsEditing(false); await fetchProfile(); setTimeout(() => setSaveSuccess(false), 3000); } catch (error) { setSaveError(error.response?.data?.message || 'Failed to update profile'); } finally { setSaving(false); } };

//   const trades = ['Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Painting', 'Tiling', 'Roofing', 'Welding', 'Aluminum Works', 'General Construction', 'AC Technician', 'Barber', 'Cleaner', 'Other'];
//   const languages = ['ENGLISH', 'TWI', 'GA', 'EWE', 'FANTE', 'HAUSA', 'WAALI', 'DAGAARE', 'DAGBANLI', 'MAMPRULI', 'GONJA', 'FRAFRA'];
//   const relationshipOptions = ['Family Member', 'Friend', 'Colleague', 'Employer', 'Community Leader', 'Neighbor', 'Relative', 'Former Principal','Master','Other'];

//   return (
//     <div className="min-h-screen bg-grey-50 pb-20">
//       <TopNavigation profile={profile} onLogout={handleLogout} logo={logo} />

//       <div className="max-w-7xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-6">Profile</h1>

//         {loading ? (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Loading profile...</p>
//           </Card>
//         ) : profile ? (
//           <>
//             {/* ... (Existing Profile/Picture/Benefits Cards - preserved) ... */}
//             <Card className="mb-6">
//               <div className="flex flex-col items-center py-6">
//                 <div className="relative mb-4">
//                   {profile.profile_picture_url && !imageError ? (
//                     <img src={getProfilePictureUrl()} alt={profile.full_name} className="w-32 h-32 rounded-full object-cover border-4 border-navy-200" onError={() => setImageError(true)} />
//                   ) : (
//                     <div className="w-32 h-32 rounded-full bg-indigo-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-navy-200">{getInitials(profile.full_name)}</div>
//                   )}
//                   <label className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-600 transition-colors">
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
//                     <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" onChange={handlePictureUpload} disabled={uploading} className="hidden" />
//                   </label>
//                 </div>
//                 {uploading && <p className="text-sm text-navy-600 mb-2">Uploading...</p>}
//                 {uploadError && <p className="text-sm text-coral-600 mb-2">{uploadError}</p>}
//                 <div className="flex items-center gap-2 mb-2">
//                   <h2 className="font-condensed font-bold text-2xl text-navy-900">{profile.full_name}</h2>
//                   {isFullyVerified && (
//                     <div className="relative group">
//                       <svg className="w-6 h-6 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="10" className="text-blue-100 fill-blue-500 opacity-20" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" className="text-white" fill="white" stroke="none" /><path d="M10.0001 15.171L6.46455 11.6355L7.87877 10.2213L10.0001 12.3426L16.364 5.9787L17.7783 7.39291L10.0001 15.171Z" fill="#1C64F2" stroke="#1C64F2" strokeWidth="1"/><path d="M22.25 12c0-5.66-4.59-10.25-10.25-10.25S1.75 6.34 1.75 12 6.34 22.25 12 22.25 22.25 17.66 22.25 12z" className="text-blue-500" fill="currentColor" /><path d="M10.25 16.75l-4-4 1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5-8 8z" className="text-white" fill="#FFF" /></svg>
//                       <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-navy-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Verified Professional</div>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2 mb-4">
//                   <div className="flex items-center">
//                     <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
//                     <span className="ml-1 font-semibold text-lg text-navy-900">{formatRating(profile.reputation_score)}</span>
//                   </div>
//                   {profile.total_review_count > 0 && <span className="text-navy-500 text-sm">({profile.total_review_count} reviews)</span>}
//                 </div>
//               </div>
//             </Card>

//             {/* Profile Details Card */}
//             <Card>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900">Profile Details</h2>
//                 {!isEditing && <Button variant="secondary" size="sm" onClick={handleEditClick}>Edit</Button>}
//               </div>
//               {saveSuccess && <div className="mb-4 p-3 bg-mint-100 text-mint-700 rounded-lg text-sm">Profile updated successfully!</div>}
//               {saveError && <div className="mb-4 p-3 bg-coral-100 text-coral-700 rounded-lg text-sm">{saveError}</div>}
              
//               {isEditing ? (
//                 <div className="space-y-4">
//                   {/* Fields */}
//                   <div><label className="block text-sm font-semibold text-navy-900 mb-2">Full Name</label><input type="text" name="full_name" value={editData.full_name} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg" /></div>
//                   <div><label className="block text-sm font-semibold text-navy-900 mb-2">Primary Trade</label><select name="primary_trade" value={editData.primary_trade} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg">{trades.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
//                   <div><label className="block text-sm font-semibold text-navy-900 mb-2">Primary Language</label><select name="primary_language" value={editData.primary_language} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg">{languages.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
//                   <div><label className="block text-sm font-semibold text-navy-900 mb-2">GPS Address</label><input type="text" name="home_gps_address" value={editData.home_gps_address} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg" /></div>
//                   <div className="flex gap-3 pt-4"><Button variant="primary" onClick={handleSave} disabled={saving} fullWidth>{saving ? 'Saving...' : 'Save Changes'}</Button><Button variant="secondary" onClick={handleCancelEdit} disabled={saving} fullWidth>Cancel</Button></div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div><p className="text-navy-500 text-sm mb-1">Phone</p><p className="text-navy-900">{profile.phone_primary}</p></div>
//                   <div><p className="text-navy-500 text-sm mb-1">Full Name</p><p className="text-navy-900">{profile.full_name || 'Not set'}</p></div>
//                   {profile.primary_trade && <div><p className="text-navy-500 text-sm mb-1">Primary Trade</p><p className="text-navy-900">{profile.primary_trade}</p></div>}
//                   {profile.primary_language && <div><p className="text-navy-500 text-sm mb-1">Primary Language</p><p className="text-navy-900">{profile.primary_language}</p></div>}
//                   {profile.home_gps_address && <div><p className="text-navy-500 text-sm mb-1">Location</p><p className="text-navy-900">{profile.home_gps_address}</p></div>}
//                 </div>
//               )}
//             </Card>
//             {/* --- NEW ID CARD LINK --- */}
//             <div className="mb-6">
//                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Identity</h3>
//                     <MenuItem 
//                         icon={QrCode} 
//                         label="My Digital ID Card" 
//                         subLabel="Download and share your verified ID"
//                         onClick={() => navigate('/id-card')}
//                         color="text-indigo-600"
//                     />
//                 </div>

//             {/* Guarantors Card */}
//             <Card className="mt-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900">Guarantors</h2>
//                 {!showAddGuarantor && !editGuarantorId && <Button variant="secondary" size="sm" onClick={handleAddGuarantorClick}>Add Guarantor</Button>}
//               </div>
//               {/* ... (Guarantor logic retained) ... */}
//               {/* Simplified View for brevity in output, implies full code presence */}
//               {!showAddGuarantor && !editGuarantorId && guarantors.length === 0 && <div className="text-center py-8"><p className="text-navy-600 mb-4">No guarantors added yet.</p></div>}
//               {!showAddGuarantor && !editGuarantorId && guarantors.length > 0 && (
//                 <div className="space-y-4">{guarantors.map(g => (
//                   <div key={g.id} className="border p-4 rounded-lg flex justify-between"><div className="flex-1"><h3>{g.name}</h3><p>{g.phone}</p><p>{g.relationship}</p></div><div className="flex flex-col gap-2"><Button size="sm" variant="text" onClick={() => handleEditGuarantorClick(g)}>Edit</Button><Button size="sm" variant="text" className="text-coral-600" onClick={() => handleDeleteGuarantor(g.id)}>Delete</Button></div></div>
//                 ))}</div>
//               )}
//               {/* Add/Edit Guarantor Forms */}
//               {(showAddGuarantor || editGuarantorId) && (
//                  <div className="space-y-4">
//                     {/* ... (Form Inputs for Name, Phone, Relationship) ... */}
//                     <input placeholder="Name" value={showAddGuarantor ? newGuarantor.name : editGuarantorData.name} onChange={showAddGuarantor ? handleNewGuarantorChange : handleEditGuarantorChange} name="name" className="w-full p-2 border rounded" />
//                     <input placeholder="Phone" value={showAddGuarantor ? newGuarantor.phone : editGuarantorData.phone} onChange={showAddGuarantor ? handleNewGuarantorChange : handleEditGuarantorChange} name="phone" className="w-full p-2 border rounded" />
//                     <select value={showAddGuarantor ? newGuarantor.relationship : editGuarantorData.relationship} onChange={showAddGuarantor ? handleNewGuarantorChange : handleEditGuarantorChange} name="relationship" className="w-full p-2 border rounded">{relationshipOptions.map(o => <option key={o} value={o}>{o}</option>)}</select>
//                     <div className="flex gap-3"><Button variant="primary" onClick={showAddGuarantor ? handleAddGuarantor : handleUpdateGuarantor} disabled={guarantorActionLoading}>{guarantorActionLoading ? 'Saving...' : 'Save'}</Button><Button variant="secondary" onClick={showAddGuarantor ? handleCancelAddGuarantor : handleCancelEditGuarantor}>Cancel</Button></div>
//                  </div>
//               )}
//             </Card>

//             {/* --- NEW: Security Card (Password Change) --- */}
//             <Card className="mt-6 mb-20">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="font-condensed font-bold text-xl text-navy-900">Security</h2>
//                 {!showPassForm && (
//                     <Button variant="secondary" size="sm" onClick={() => setShowPassForm(true)}>
//                         Change Password
//                     </Button>
//                 )}
//               </div>

//               {showPassForm && (
//                 <form onSubmit={handlePassChange} className="space-y-4 bg-gray-50 p-4 rounded-lg">
//                     {passStatus.success && <div className="p-3 bg-mint-100 text-mint-700 rounded text-sm">Password updated!</div>}
//                     {passStatus.error && <div className="p-3 bg-coral-100 text-coral-700 rounded text-sm">{passStatus.error}</div>}

//                     <input 
//                         type="password" placeholder="Current Password" 
//                         className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
//                         value={passData.old} 
//                         onChange={e => setPassData({...passData, old: e.target.value})} 
//                         required
//                     />
//                     <input 
//                         type="password" placeholder="New Password" 
//                         className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
//                         value={passData.new} 
//                         onChange={e => setPassData({...passData, new: e.target.value})} 
//                         required
//                     />
//                     <input 
//                         type="password" placeholder="Confirm New Password" 
//                         className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
//                         value={passData.confirm} 
//                         onChange={e => setPassData({...passData, confirm: e.target.value})} 
//                         required
//                     />

//                     <div className="flex gap-3">
//                         <Button variant="primary" type="submit" disabled={passStatus.loading} fullWidth>
//                             {passStatus.loading ? 'Updating...' : 'Update Password'}
//                         </Button>
//                         <Button variant="secondary" type="button" onClick={() => setShowPassForm(false)} fullWidth>
//                             Cancel
//                         </Button>
//                     </div>
//                 </form>
//               )}
//             </Card>
//           </>
//         ) : (
//           <Card>
//             <p className="text-navy-600 text-center py-8">Failed to load profile</p>
//           </Card>
//         )}
//       </div>

//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default ProfilePage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, TopNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { getInitials } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

// --- FIX: Added missing imports here ---
import { 
    QrCode, User, CreditCard, Lock, HelpCircle, 
    LogOut, ChevronRight, Shield 
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password State
  const [showPassForm, setShowPassForm] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, error: null, success: false });

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Guarantor State
  const [guarantors, setGuarantors] = useState([]);
  const [showAddGuarantor, setShowAddGuarantor] = useState(false);
  const [newGuarantor, setNewGuarantor] = useState({ name: '', phone: '', relationship: '' });
  const [guarantorActionLoading, setGuarantorActionLoading] = useState(false);

  // --- NAVIGATION CONFIG ---
  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/jobs', label: 'Available', icon: '💼' },
    { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
    { path: '/disputes', label: 'Disputes', icon: '⚖️' }, 
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchProfile();
    fetchGuarantors();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/profile/profile');
      setProfile(response.data.profile);
      setEditData(response.data.profile); // Initialize edit form
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuarantors = async () => {
    try {
      const response = await apiClient.get('/profile/guarantors');
      setGuarantors(response.data.guarantors || []);
    } catch (error) {
      console.error('Failed to fetch guarantors');
    }
  };

  // --- HANDLERS ---

  const handlePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        // Use direct fetch since apiClient might assume JSON
        const token = localStorage.getItem('authToken');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        
        const res = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        
        if (!res.ok) throw new Error('Upload failed');
        
        setImageError(false);
        await fetchProfile(); // Refresh to see new image
    } catch (err) {
        alert("Failed to upload image");
    } finally {
        setUploading(false);
    }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    setPassStatus({ loading: true, error: null, success: false });

    if (passData.new !== passData.confirm) {
        setPassStatus({ loading: false, error: "Passwords do not match", success: false });
        return;
    }
    if (passData.new.length < 6) {
        setPassStatus({ loading: false, error: "Password must be at least 6 characters", success: false });
        return;
    }

    try {
        await apiClient.post('/identity/change-password', {
            old_password: passData.old,
            new_password: passData.new
        });
        setPassStatus({ loading: false, error: null, success: true });
        setPassData({ old: '', new: '', confirm: '' });
        setTimeout(() => setShowPassForm(false), 2000);
    } catch (err) {
        setPassStatus({ 
            loading: false, 
            error: err.response?.data?.message || "Failed to update password", 
            success: false 
        });
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
        await apiClient.put('/profile/profile', {
            full_name: editData.full_name,
            primary_trade: editData.primary_trade,
            home_gps_address: editData.home_gps_address
        });
        setSaveSuccess(true);
        setIsEditing(false);
        fetchProfile();
    } catch (err) {
        setSaveError("Update failed");
    } finally {
        setSaving(false);
    }
  };

  // --- HELPER COMPONENT ---
  const MenuItem = ({ icon: Icon, label, subLabel, onClick, color = "text-gray-600" }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors mb-3 shadow-sm"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full bg-gray-50 ${color}`}>
                <Icon size={20} />
            </div>
            <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                {subLabel && <p className="text-xs text-gray-500">{subLabel}</p>}
            </div>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
    </button>
  );

  const getProfilePictureUrl = () => {
    if (!profile?.profile_picture_url) return null;
    const BACKEND_URL = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:8000';
    
    // Check if it's already a full URL (e.g. cloud storage)
    if (profile.profile_picture_url.startsWith('http')) return profile.profile_picture_url;
    
    const path = profile.profile_picture_url.startsWith('/') 
      ? profile.profile_picture_url 
      : `/uploads/${profile.profile_picture_url}`;
    return `${BACKEND_URL}${path}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopNavigation profile={profile} logo={logo} />

      <div className="max-w-xl mx-auto px-4 py-6">
        
        {/* PROFILE HEADER CARD */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
                    {!imageError && profile?.profile_picture_url ? (
                        <img 
                            src={getProfilePictureUrl()} 
                            alt="Profile" 
                            className="w-full h-full object-cover" 
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-bold">
                            {getInitials(profile?.full_name)}
                        </div>
                    )}
                </div>
                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white cursor-pointer hover:bg-indigo-700 shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
                </label>
            </div>
            
            <h1 className="text-xl font-bold text-navy-900">{profile?.full_name}</h1>
            <p className="text-gray-500 text-sm">{profile?.primary_trade} • {profile?.location_city || 'Ghana'}</p>
            
            {uploading && <p className="text-xs text-indigo-600 mt-2 animate-pulse">Uploading new photo...</p>}
        </div>

        {/* --- IDENTITY SECTION --- */}
        <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Identity</h3>
            <MenuItem 
                icon={QrCode} 
                label="My Digital ID Card" 
                subLabel="Download and share your verified ID"
                onClick={() => navigate('/id-card')}
                color="text-indigo-600"
            />
        </div>

        {/* --- ACCOUNT SECTION --- */}
        <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Account</h3>
            
            {/* Edit Profile */}
            <Card className="mb-3">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-full text-gray-600"><User size={20} /></div>
                        <span className="font-semibold text-gray-900 text-sm">Personal Info</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                </div>
                
                {isEditing ? (
                    <div className="mt-3 space-y-3">
                        <input 
                            className="w-full border rounded p-2 text-sm" 
                            value={editData.full_name || ''} 
                            onChange={e => setEditData({...editData, full_name: e.target.value})}
                            placeholder="Full Name"
                        />
                        <input 
                            className="w-full border rounded p-2 text-sm" 
                            value={editData.home_gps_address || ''} 
                            onChange={e => setEditData({...editData, home_gps_address: e.target.value})}
                            placeholder="GPS Address"
                        />
                        <Button fullWidth size="sm" onClick={handleSaveProfile} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                ) : (
                    <div className="ml-11 text-xs text-gray-500">
                        {profile?.phone_primary} <br/>
                        {profile?.home_gps_address || 'No address set'}
                    </div>
                )}
            </Card>

            <MenuItem 
                icon={CreditCard} 
                label="Payment Methods" 
                onClick={() => navigate('/wallet')}
            />
            
            {/* Change Password Toggle */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mb-3">
                <button 
                    onClick={() => setShowPassForm(!showPassForm)}
                    className="w-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-gray-50 text-gray-600"><Lock size={20} /></div>
                        <p className="font-semibold text-gray-900 text-sm">Security & Password</p>
                    </div>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${showPassForm ? 'rotate-90' : ''}`} />
                </button>

                {showPassForm && (
                    <form onSubmit={handlePassChange} className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                        {passStatus.success && <div className="p-2 bg-green-50 text-green-700 text-xs rounded">Password updated!</div>}
                        {passStatus.error && <div className="p-2 bg-red-50 text-red-700 text-xs rounded">{passStatus.error}</div>}
                        
                        <input type="password" placeholder="Current Password" required
                            className="w-full p-2 border rounded text-sm"
                            value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})}
                        />
                        <input type="password" placeholder="New Password" required
                            className="w-full p-2 border rounded text-sm"
                            value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})}
                        />
                        <input type="password" placeholder="Confirm New Password" required
                            className="w-full p-2 border rounded text-sm"
                            value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})}
                        />
                        <Button type="submit" fullWidth size="sm" disabled={passStatus.loading}>
                            {passStatus.loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                )}
            </div>
        </div>

        {/* --- GUARANTORS --- */}
        <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Guarantors</h3>
            <Card>
                {guarantors.map(g => (
                    <div key={g.id} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-100">
                        <div>
                            <p className="font-bold text-sm">{g.name}</p>
                            <p className="text-xs text-gray-500">{g.relationship} • {g.phone}</p>
                        </div>
                    </div>
                ))}
                {guarantors.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No guarantors added.</p>}
                
                <Button variant="ghost" size="sm" fullWidth className="mt-2 text-indigo-600" onClick={() => alert('Feature managed by Admin')}>
                    + Add Guarantor (Contact Admin)
                </Button>
            </Card>
        </div>

        {/* --- LOGOUT --- */}
        <button 
            onClick={() => logout(navigate)}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-bold bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
        >
            <LogOut size={18} />
            Sign Out
        </button>

        <div className="text-center text-xs text-gray-400 pt-6 pb-20">
            v1.0.3 • Zolid Artisan App
        </div>
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default ProfilePage;