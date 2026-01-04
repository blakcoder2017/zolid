// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, Button, BottomNavigation } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import { ghsToPesewas } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import logo from '../assets/logos/logo.png';

// const PostJobPage = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const location = window.location; // For checking if we're editing
//   const [editJobId, setEditJobId] = React.useState(null);
//   const [formData, setFormData] = React.useState({
//     locationLat: '',
//     locationLon: '',
//     locationGpsAddress: '',
//     jobDescription: '',
//     quotesDeadline: '', // NEW: Optional deadline for quotes (48h default)
//   });
//   const [jobPicture, setJobPicture] = React.useState(null);
//   const [jobPicturePreview, setJobPicturePreview] = React.useState(null);
//   const [existingPhotoUrl, setExistingPhotoUrl] = React.useState(null);
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState('');
//   const [success, setSuccess] = React.useState(false);
//   const [paymentLink, setPaymentLink] = React.useState('');
//   const [gettingLocation, setGettingLocation] = React.useState(false);
//   const [locationError, setLocationError] = React.useState('');

//   // Check if we're editing a job (from sessionStorage)
//   React.useEffect(() => {
//     const editJobStr = sessionStorage.getItem('editJob');
//     if (editJobStr) {
//       try {
//         const job = JSON.parse(editJobStr);
//         setEditJobId(job.id);
//         setFormData({
//           locationLat: job.location_lat?.toString() || '',
//           locationLon: job.location_lon?.toString() || '',
//           locationGpsAddress: job.location_gps_address || '',
//           jobDescription: job.job_description || '',
//           quotesDeadline: job.quotes_deadline || '',
//         });
//         if (job.photo_evidence_before_url) {
//           // Store existing photo URL
//           setExistingPhotoUrl(job.photo_evidence_before_url);
//           // Set preview for existing image
//           const BACKEND_URL = import.meta.env.VITE_API_URL 
//             ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
//             : 'http://localhost:8000';
//           setJobPicturePreview(`${BACKEND_URL}${job.photo_evidence_before_url}`);
//         }
//         // Clear sessionStorage after reading
//         sessionStorage.removeItem('editJob');
//       } catch (error) {
//         console.error('Failed to parse edit job data:', error);
//       }
//     }
//   }, []);

//   const navItems = [
//     { path: '/dashboard', label: 'Home', icon: '🏠' },
//     { path: '/jobs', label: 'My Jobs', icon: '📋' },
//     { path: '/post-job', label: 'Post Job', icon: '➕' },
//     { path: '/profile', label: 'Profile', icon: '👤' },
//   ];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//     }));
//     setError('');
//     setSuccess(false);
//   };

//   const handlePictureChange = (e) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setJobPicture(file);
//       // Create preview
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setJobPicturePreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleGetLocation = (useHighAccuracy = false) => {
//     if (!navigator.geolocation) {
//       setLocationError('Geolocation is not supported by your browser');
//       return;
//     }

//     setGettingLocation(true);
//     setLocationError('');
//     setError('');

//     // Request location - try network-based first, fallback to GPS if needed
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const lat = position.coords.latitude;
//         const lon = position.coords.longitude;
//         setFormData(prev => ({
//           ...prev,
//           locationLat: lat.toFixed(6),
//           locationLon: lon.toFixed(6),
//         }));
//         setGettingLocation(false);
//         setLocationError(''); // Clear any previous errors on success
//       },
//       (error) => {
//         setGettingLocation(false);
//         let errorMessage = '';
        
//         // Handle different geolocation error codes with specific guidance
//         switch (error.code) {
//           case error.PERMISSION_DENIED:
//             errorMessage = 'Location permission was denied. Please click the location icon (🔒 or 📍) in your browser\'s address bar and allow location access, then try again.';
//             break;
//           case error.POSITION_UNAVAILABLE:
//             // If network-based failed and we haven't tried high accuracy yet, suggest trying GPS
//             if (!useHighAccuracy) {
//               errorMessage = 'Network location unavailable. Click "Try with GPS" below for a more accurate location, or enter coordinates manually.';
//             } else {
//               errorMessage = 'Location unavailable. Please: 1) Check browser location permission (address bar icon), 2) Ensure location services are enabled on your device, 3) Try moving near a window or outside, or 4) Enter coordinates manually using the link below.';
//             }
//             break;
//           case error.TIMEOUT:
//             errorMessage = 'Location request timed out. Try: 1) Moving to a location with better signal, 2) Clicking "Try with GPS" below, or 3) Enter coordinates manually.';
//             break;
//           default:
//             errorMessage = 'Unable to determine your location. Please check browser permissions, device location services, and internet connection. Or enter coordinates manually.';
//             break;
//         }
//         setLocationError(errorMessage);
//       },
//       {
//         enableHighAccuracy: useHighAccuracy, // Use GPS if useHighAccuracy is true
//         timeout: 20000, // 20 second timeout
//         maximumAge: useHighAccuracy ? 0 : 60000 // Don't use cached for high accuracy, but accept cached for network-based
//       }
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess(false);
//     setPaymentLink('');

//     // Validation - Job description required
//     if (!formData.jobDescription || !formData.jobDescription.trim()) {
//       setError('Job description is required');
//       return;
//     }
    
//     // Validation - Location required
//     if (!formData.locationLat || !formData.locationLon) {
//       setError('Please get your location or enter coordinates manually');
//       return;
//     }

//     const lat = parseFloat(formData.locationLat);
//     const lon = parseFloat(formData.locationLon);

//     if (isNaN(lat) || isNaN(lon)) {
//       setError('Location coordinates must be valid numbers');
//       return;
//     }

//     if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
//       setError('Invalid location coordinates');
//       return;
//     }

//     setLoading(true);

//     try {
//       let photoUrl = null;

//       // Upload picture first if provided
//       if (jobPicture) {
//         try {
//           const pictureFormData = new FormData();
//           pictureFormData.append('image', jobPicture);
          
//           const token = localStorage.getItem('authToken');
//           const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
          
//           const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//             },
//             body: pictureFormData,
//           });

//           if (!uploadResponse.ok) {
//             const errorData = await uploadResponse.json();
//             throw new Error(errorData.error || errorData.message || 'Picture upload failed');
//           }

//           const uploadData = await uploadResponse.json();
//           photoUrl = uploadData.image_url;
//         } catch (uploadError) {
//           setError(`Failed to upload picture: ${uploadError.message}`);
//           setLoading(false);
//           return;
//         }
//       }
//       // Note: If editing and no new picture selected, existingPhotoUrl will be used in jobData below

//       // NEW QUOTE SYSTEM: No price - artisans will quote
//       const jobData = {
//         job_description: formData.jobDescription.trim(),
//         location_lat: lat,
//         location_lon: lon,
//       };

//       if (formData.locationGpsAddress && formData.locationGpsAddress.trim()) {
//         jobData.location_gps_address = formData.locationGpsAddress.trim();
//       }
      
//       // NEW: Optional quotes deadline
//       if (formData.quotesDeadline) {
//         jobData.quotes_deadline = new Date(formData.quotesDeadline).toISOString();
//       }

//       // Include photo URL if we have one (new upload or existing when editing)
//       if (photoUrl) {
//         jobData.photo_evidence_before_url = photoUrl;
//       } else if (editJobId && existingPhotoUrl) {
//         // When editing, include existing photo URL if no new picture was uploaded
//         jobData.photo_evidence_before_url = existingPhotoUrl;
//       }

//       let response;
//       if (editJobId) {
//         // Update existing job
//         response = await apiClient.put(`/jobs/${editJobId}`, jobData);
//         setSuccess(true);
//         // Redirect to My Jobs page after a short delay
//         setTimeout(() => {
//           navigate('/jobs');
//         }, 1500);
//       } else {
//         // Create new job
//         response = await apiClient.post('/jobs/create', jobData);
//         const jobId = response.data.job?.id;
//         setSuccess(true);
        
//         // Clear form
//         setFormData({
//           locationLat: '',
//           locationLon: '',
//           locationGpsAddress: '',
//           jobDescription: '',
//           quotesDeadline: '',
//         });
//         setJobPicture(null);
//         setJobPicturePreview(null);

//         // NEW: Redirect to ViewQuotesPage for this job to see quotes as they come in
//         setTimeout(() => {
//           if (jobId) {
//             navigate(`/jobs/${jobId}/quotes`);
//           } else {
//             navigate('/jobs');
//           }
//         }, 1500); // 1.5 second delay to show success message
//       }
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || 
//                            err.response?.data?.error || 
//                            err.message || 
//                            'Failed to create job. Please try again.';
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePaymentLinkClick = () => {
//     if (paymentLink) {
//       window.open(paymentLink, '_blank');
//       // Redirect to My Jobs page after opening payment link
//       setTimeout(() => {
//         navigate('/jobs');
//       }, 500); // Small delay to ensure popup opens
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
//         </div>
//       </nav>

//       {/* Page Content */}
//       <div className="max-w-2xl mx-auto px-6 py-8">
//         <h1 className="font-condensed font-bold text-4xl mb-6">
//           Post New Job
//         </h1>

//         <Card className="p-6">
//           {success && !editJobId && paymentLink && (
//             <div className="mb-6 p-4 bg-mint-100 border border-mint-300 rounded-lg">
//               <p className="text-mint-800 font-semibold mb-2">✅ Job created successfully!</p>
//               <p className="text-sm text-mint-700 mb-4">
//                 Please complete payment to activate your job. Click the button below to proceed to payment.
//               </p>
//               <Button
//                 variant="primary"
//                 onClick={handlePaymentLinkClick}
//                 fullWidth
//               >
//                 Complete Payment
//               </Button>
//             </div>
//           )}
          
//           {success && editJobId && (
//             <div className="mb-6 p-4 bg-mint-100 border border-mint-300 rounded-lg">
//               <p className="text-mint-800 font-semibold mb-2">✅ Job updated successfully!</p>
//               <p className="text-sm text-mint-700">
//                 Your job has been updated. Redirecting to jobs list...
//               </p>
//             </div>
//           )}

//           {error && (
//             <div className="mb-6 p-4 bg-coral-50 border border-coral-200 rounded-lg">
//               <p className="text-sm text-coral-700">{error}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               {/* NEW QUOTE SYSTEM: Info banner */}
//               <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
//                 <p className="text-indigo-900 font-semibold mb-1">💰 How Pricing Works</p>
//                 <p className="text-sm text-indigo-700">
//                   Artisans will submit quotes for your job. You'll review all quotes and select the best one!
//                 </p>
//               </div>
              
//               {/* Job Description - NOW REQUIRED */}
//               <div>
//                 <label htmlFor="jobDescription" className="block text-sm font-semibold text-navy-900 mb-2">
//                   Job Description <span className="text-coral-600">*</span>
//                 </label>
//                 <textarea
//                   id="jobDescription"
//                   name="jobDescription"
//                   rows="4"
//                   value={formData.jobDescription}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="Describe the work needed (e.g., Fix leaking kitchen sink pipe...)"
//                   disabled={loading}
//                 />
//               </div>

//               {/* Location - Get from Device */}
//               <div>
//                 <label className="block text-sm font-semibold text-navy-900 mb-2">
//                   Job Location <span className="text-coral-600">*</span>
//                 </label>
//                 <div className="flex gap-2 mb-3">
//                   <Button
//                     type="button"
//                     variant="secondary"
//                     onClick={() => handleGetLocation(false)}
//                     disabled={loading || gettingLocation}
//                     className="flex-1"
//                   >
//                     {gettingLocation ? 'Getting Location...' : '📍 Get Location'}
//                   </Button>
//                   <Button
//                     type="button"
//                     variant="secondary"
//                     onClick={() => handleGetLocation(true)}
//                     disabled={loading || gettingLocation}
//                     className="flex-1"
//                   >
//                     {gettingLocation ? 'Getting GPS...' : '🌐 Try with GPS'}
//                   </Button>
//                 </div>
                
//                 {locationError && (
//                   <div className="mb-3 p-3 bg-coral-50 border border-coral-200 rounded-lg">
//                     <p className="text-sm text-coral-700 mb-2">{locationError}</p>
//                     <p className="text-xs text-navy-600">
//                       💡 <strong>Tip:</strong> You can also get coordinates from{' '}
//                       <a 
//                         href="https://www.google.com/maps" 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         className="text-indigo-600 hover:text-indigo-700 underline"
//                       >
//                         Google Maps
//                       </a>
//                       {' '}by right-clicking on a location and selecting coordinates, or enter them manually below.
//                     </p>
//                   </div>
//                 )}

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label htmlFor="locationLat" className="block text-xs font-medium text-navy-700 mb-1">
//                       Latitude
//                     </label>
//                     <input
//                       type="number"
//                       id="locationLat"
//                       name="locationLat"
//                       step="any"
//                       value={formData.locationLat}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                       placeholder="e.g., 5.6037"
//                       disabled={loading}
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="locationLon" className="block text-xs font-medium text-navy-700 mb-1">
//                       Longitude
//                     </label>
//                     <input
//                       type="number"
//                       id="locationLon"
//                       name="locationLon"
//                       step="any"
//                       value={formData.locationLon}
//                       onChange={handleChange}
//                       required
//                       className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                       placeholder="e.g., -0.1870"
//                       disabled={loading}
//                     />
//                   </div>
//                 </div>
//                 <p className="text-xs text-navy-500 mt-1">Click the button above to automatically get your location, or enter manually</p>
//               </div>

//               {/* GPS Address (Optional) */}
//               <div>
//                 <label htmlFor="locationGpsAddress" className="block text-sm font-semibold text-navy-900 mb-2">
//                   GPS Address (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   id="locationGpsAddress"
//                   name="locationGpsAddress"
//                   value={formData.locationGpsAddress}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="e.g., GA-123-456"
//                   disabled={loading}
//                 />
//                 <p className="text-xs text-navy-500 mt-1">Ghana Post GPS address (optional)</p>
//               </div>

//               {/* Quotes Deadline (Optional) */}
//               <div>
//                 <label htmlFor="quotesDeadline" className="block text-sm font-semibold text-navy-900 mb-2">
//                   Quote Deadline (Optional)
//                 </label>
//                 <input
//                   type="datetime-local"
//                   id="quotesDeadline"
//                   name="quotesDeadline"
//                   value={formData.quotesDeadline}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   disabled={loading}
//                 />
//                 <p className="text-xs text-navy-500 mt-1">Default: 48 hours from now</p>
//               </div>

//               {/* Job Picture (Optional) */}
//               <div>
//                 <label htmlFor="jobPicture" className="block text-sm font-semibold text-navy-900 mb-2">
//                   Job Picture (Optional)
//                 </label>
//                 {jobPicturePreview && (
//                   <div className="mb-3">
//                     <img
//                       src={jobPicturePreview}
//                       alt="Job preview"
//                       className="w-full max-w-md h-48 object-cover rounded-lg border border-navy-200"
//                     />
//                   </div>
//                 )}
//                 <input
//                   type="file"
//                   id="jobPicture"
//                   name="jobPicture"
//                   accept="image/jpeg,image/jpg,image/png,image/gif"
//                   onChange={handlePictureChange}
//                   className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                   disabled={loading}
//                 />
//                 <p className="text-xs text-navy-500 mt-1">Upload a picture showing the work needed (optional)</p>
//               </div>

//               <Button
//                 type="submit"
//                 variant="primary"
//                 size="lg"
//                 fullWidth
//                 disabled={loading}
//                 className="mt-6"
//               >
//                 {loading ? (editJobId ? 'Updating Job...' : 'Creating Job...') : (editJobId ? 'Update Job' : 'Create Job')}
//               </Button>
//             </div>
//           </form>

//           <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
//             <p className="text-sm text-indigo-900 font-semibold mb-2">📋 What happens next?</p>
//             <ol className="text-sm text-indigo-700 space-y-1 ml-4">
//               <li>1. Artisans will submit quotes for your job</li>
//               <li>2. You'll review all quotes and select the best one</li>
//               <li>3. Complete payment for the selected quote</li>
//               <li>4. Artisan starts work after payment confirmation</li>
//             </ol>
//           </div>
//         </Card>
//       </div>

//       {/* Bottom Navigation */}
//       <BottomNavigation items={navItems} />
//     </div>
//   );
// };

// export default PostJobPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, BottomNavigation } from '@zolid/shared/components';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';

// --- MAPBOX CONFIGURATION ---
// Access the token from environment variables (Vite requires VITE_ prefix)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.MAPBOX_TOKEN;

/**
 * Search Mapbox API for a location in Ghana.
 * Returns the best match with coordinates and formatted name.
 */
const searchMapboxLocations = async (query) => {
  if (!MAPBOX_TOKEN) {
    console.error("Missing VITE_MAPBOX_TOKEN in .env");
    // Return null so the UI can handle the error gracefully
    return null;
  }

  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: 'gh', // Limit results to Ghana
      types: 'place,locality,neighborhood,poi,address', // Focus on relevant areas
      limit: '1',
    });

    const response = await fetch(`${endpoint}?${params}`);
    if (!response.ok) throw new Error('Location search failed');
    
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const bestMatch = data.features[0];
    return {
      lat: bestMatch.center[1], // Mapbox returns [lon, lat]
      lon: bestMatch.center[0],
      formatted: bestMatch.place_name,
    };
  } catch (error) {
    console.error("Mapbox Error:", error);
    throw error;
  }
};

const PostJobPage = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = React.useState({
    locationSearch: '',       // The text user types (e.g. "East Legon")
    locationLandmark: '',     // The specific details (e.g. "Near Blue Gate")
    jobDescription: '',
    quotesDeadline: '',
    locationGpsAddress: '',   // Optional digital address (e.g. GA-123-456)
    
    // Hidden coordinates (System needs these, User doesn't manually edit them)
    locationLat: '', 
    locationLon: '',
  });
  
  const [loading, setLoading] = React.useState(false);
  const [geocoding, setGeocoding] = React.useState(false); // Spinner for map search
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  // Check if we're editing a job (Legacy support)
  React.useEffect(() => {
    const editJobStr = sessionStorage.getItem('editJob');
    if (editJobStr) {
      try {
        const job = JSON.parse(editJobStr);
        // Pre-fill data if editing
        setFormData(prev => ({
          ...prev,
          jobDescription: job.job_description || '',
          locationLat: job.location_lat || '',
          locationLon: job.location_lon || '',
          locationSearch: "Existing Job Location", // Placeholder since we can't reverse-geocode easily without API cost
        }));
        sessionStorage.removeItem('editJob');
      } catch (err) {
        console.error('Failed to parse edit job:', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // --- HANDLERS ---

  // 1. Handle Mapbox Search
  const handleAddressSearch = async () => {
    if (!formData.locationSearch.trim()) return;

    setGeocoding(true);
    setError('');
    
    try {
      const result = await searchMapboxLocations(formData.locationSearch);
      
      if (result) {
        setFormData(prev => ({
          ...prev,
          locationLat: result.lat.toFixed(6),
          locationLon: result.lon.toFixed(6),
          locationSearch: result.formatted // Update input to the official name
        }));
      } else {
        setError(MAPBOX_TOKEN ? 'Location not found. Try a broader area (e.g. "Accra").' : 'Map service unavailable. Please enter area manually.');
      }
    } catch (err) {
      setError('Connection failed. Please check your internet.');
    } finally {
      setGeocoding(false);
    }
  };

  // 2. Handle Browser GPS
  const handleGetLocation = () => {
    setGeocoding(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGeocoding(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationLat: position.coords.latitude.toFixed(6),
          locationLon: position.coords.longitude.toFixed(6),
          locationSearch: "Current Location (GPS Detected)"
        }));
        setGeocoding(false);
      },
      (err) => {
        console.warn(err);
        setError('GPS Signal Weak. Please search for your Area/Suburb manually.');
        setGeocoding(false);
      },
      { timeout: 10000, enableHighAccuracy: false } // Fast mode
    );
  };

  // 3. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate: We need coordinates (from search or GPS)
    if (!formData.locationLat || !formData.locationLon) {
      setError('Please click "Search" or "Use GPS" to confirm your location area.');
      setLoading(false);
      return;
    }

    try {
      // MERGE LOGIC: Combine Description + Landmark
      // We do this because the DB location field is too small for detailed directions
      const fullDescription = `${formData.jobDescription.trim()} \n\n[LANDMARK/DIRECTIONS]: ${formData.locationLandmark}`;

      const jobData = {
        job_description: fullDescription,
        location_lat: parseFloat(formData.locationLat),
        location_lon: parseFloat(formData.locationLon),
        quotes_deadline: formData.quotesDeadline ? new Date(formData.quotesDeadline).toISOString() : null,
        location_gps_address: formData.locationGpsAddress
      };

      const response = await apiClient.post('/jobs/create', jobData);
      
      setSuccess(true);
      // Redirect to Quotes page to see incoming bids
      setTimeout(() => {
        if (response.data?.job?.id) {
          navigate(`/jobs/${response.data.job.id}/quotes`);
        } else {
          navigate('/jobs');
        }
      }, 1500);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to post job.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/active-jobs', label: 'Active', icon: '⚡' },
    { path: '/post-job', label: 'Post Job', icon: '➕' },
    { path: '/wallet', label: 'Wallet', icon: '💰' },
    { path: '/profile', label: 'Profile', icon: '👤' },
];

  return (
    <div className="min-h-screen bg-grey-50 pb-20">
      {/* Top Navigation */}
      <nav className="bg-navy-900 text-white px-6 py-4">
        <div className="flex items-center">
          <img 
            src={logo} 
            alt="ZOLID" 
            className="h-8 w-auto cursor-pointer" 
            onClick={() => navigate('/dashboard')} 
          />
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-condensed font-bold text-4xl mb-6">
          Post New Job
        </h1>

        <Card className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">Job Posted!</h2>
              <p className="text-navy-600">Redirecting to your quotes...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- SECTION 1: LOCATION (SMART INPUT) --- */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="font-condensed font-bold text-lg text-navy-900 mb-3">📍 Job Location</h3>
                
                {/* Area Search */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-navy-900 mb-1">
                    Area / Suburb <span className="text-coral-600">*</span>
                  </label>
                  
                  {/* MOBILE FIX: flex-col (stacked) on mobile, sm:flex-row (side-by-side) on desktop */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      name="locationSearch"
                      value={formData.locationSearch}
                      onChange={handleChange}
                      placeholder="e.g. East Legon, Madina, Osu..."
                      className="w-full sm:flex-1 px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                    />
                    <Button 
                      type="button" 
                      variant="primary" 
                      onClick={handleAddressSearch}
                      disabled={geocoding}
                      className="w-full sm:w-auto min-w-[100px]" // Ensure button is clickable on mobile
                    >
                      {geocoding ? 'Finding...' : 'Search'}
                    </Button>
                  </div>
                  
                  {/* Visual Feedback */}
                  {formData.locationLat && (
                    <p className="text-xs text-mint-600 mt-2 font-medium animate-pulse">
                      ✅ Location Locked: {formData.locationSearch}
                    </p>
                  )}
                  {error && <p className="text-xs text-coral-600 mt-2 font-medium">⚠️ {error}</p>}
                  
                  <div className="mt-3 text-center">
                    <span className="text-xs text-navy-400 uppercase font-bold tracking-wider">OR</span>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    fullWidth 
                    onClick={handleGetLocation}
                    className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                  >
                    📍 Use My Current GPS Location
                  </Button>
                </div>

                {/* Landmark */}
                <div className="mb-2">
                  <label className="block text-sm font-semibold text-navy-900 mb-1">
                    Landmark / Directions <span className="text-coral-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="locationLandmark"
                    value={formData.locationLandmark}
                    onChange={handleChange}
                    placeholder="e.g. Near American House, Blue Gate, Behind Total Station"
                    className="w-full px-4 py-3 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <p className="text-xs text-navy-500 mt-1">Help the artisan find you easily.</p>
                </div>

                {/* Digital Address */}
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1">
                    Digital Address (Optional)
                  </label>
                  <input
                    type="text"
                    name="locationGpsAddress"
                    value={formData.locationGpsAddress}
                    onChange={handleChange}
                    placeholder="e.g. GA-123-4567"
                    className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* --- SECTION 2: JOB DETAILS --- */}
              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2">
                  What needs to be done? <span className="text-coral-600">*</span>
                </label>
                <textarea
                  name="jobDescription"
                  rows="4"
                  value={formData.jobDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe the issue (e.g. Leaking pipe under the kitchen sink...)"
                  required
                />
              </div>

              {/* Quote Deadline (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2">
                  Quote Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  name="quotesDeadline"
                  value={formData.quotesDeadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-navy-200 rounded-lg text-sm"
                />
                <p className="text-xs text-navy-500 mt-1">When do you need the quotes by?</p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                className="mt-4 shadow-lg shadow-coral-500/30"
              >
                {loading ? 'Posting...' : 'Post Job for Quotes'}
              </Button>
            </form>
          )}
        </Card>
      </div>

      <BottomNavigation items={navItems} />
    </div>
  );
};

export default PostJobPage;