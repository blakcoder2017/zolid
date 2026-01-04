import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '@zolid/shared/components';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png';
import { fetchMomoProviders } from '../services/momoProviderService';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// --- MAPBOX CONFIGURATION ---
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.MAPBOX_TOKEN;

const searchMapboxLocations = async (query) => {
  if (!MAPBOX_TOKEN) return null;
  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const params = new URLSearchParams({ access_token: MAPBOX_TOKEN, country: 'gh', limit: '1' });
    const response = await fetch(`${endpoint}?${params}`);
    const data = await response.json();
    if (!data.features?.length) return null;
    return { lat: data.features[0].center[1], lon: data.features[0].center[0], formatted: data.features[0].place_name };
  } catch (error) {
    console.error("Mapbox Error:", error);
    return null;
  }
};

const RegisterPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [formData, setFormData] = useState({
    // Personal
    phone: '',
    fullName: '',
    dob: '',
    gender: 'MALE',
    email: '',
    momoNetwork: '',
    primaryLanguage: 'ENGLISH',
    // Business
    ghCardNumber: '',
    ghCardFile: null,
    primaryTrade: '',
    // Location
    locationSearch: '',      
    homeGpsAddress: '',      
    // Security
    password: '',
    confirmPassword: '',
    isIdentityVerified: true,
    acceptTerms: false
  });

  // UI States
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ghCardPreview, setGhCardPreview] = useState(null);
  
  // Location States
  const [geocoding, setGeocoding] = useState(false);
  const [locationLocked, setLocationLocked] = useState(false);

  // Provider & Verification States
  const [momoProviders, setMomoProviders] = useState([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [resolvingMomo, setResolvingMomo] = useState(false);
  const [momoVerified, setMomoVerified] = useState(false);
  const [resolvedName, setResolvedName] = useState('');

  // --- 1. LOAD PROVIDERS ---
  useEffect(() => {
    const loadMomoProviders = async () => {
      setIsLoadingProviders(true);
      try {
        const providers = await fetchMomoProviders();
        setMomoProviders(providers);
        if (providers.length > 0) {
          const mtn = providers.find(p => p.provider_name.toUpperCase().includes('MTN'));
          setFormData(prev => ({ ...prev, momoNetwork: mtn ? mtn.provider_name : providers[0].provider_name }));
        }
      } catch (error) {
        setMomoProviders([{ provider_name: 'MTN', provider_code: 'MTN' }, { provider_name: 'Telecel', provider_code: 'VOD' }, { provider_name: 'AT', provider_code: 'ATL' }]);
        setFormData(prev => ({ ...prev, momoNetwork: 'MTN' }));
      } finally {
        setIsLoadingProviders(false);
      }
    };
    loadMomoProviders();
  }, []);

  // --- 2. HANDLERS ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Reset verification if phone/network changes
    if (name === 'phone' || name === 'momoNetwork') {
        setMomoVerified(false);
        setResolvedName('');
    }

    if (name === 'locationSearch') {
        setLocationLocked(false);
        setFormData(prev => ({ ...prev, homeGpsAddress: '' }));
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  // MoMo Resolution
  const handleResolveMomo = async () => {
    if (!formData.phone || formData.phone.length < 10) {
        setError("Please enter a valid phone number.");
        return;
    }
    setResolvingMomo(true);
    setError('');
    
    try {
        const res = await apiClient.post('/identity/artisan/resolve-momo', {
            phone_primary: formData.phone,
            momo_network: formData.momoNetwork
        });
        setResolvedName(res.data.data.account_name);
        setMomoVerified(true);
    } catch (err) {
        setMomoVerified(false);
        setResolvedName('');
        setError(err.response?.data?.message || "Could not verify account. Please check details.");
    } finally {
        setResolvingMomo(false);
    }
  };

  // Ghana Card Upload
  const handleGhCardUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, ghCardFile: file }));
      const reader = new FileReader();
      reader.onload = (event) => setGhCardPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Location Search
  const handleAddressSearch = async () => {
    if (!formData.locationSearch.trim()) return;
    setGeocoding(true);
    setError('');
    
    try {
      const result = await searchMapboxLocations(formData.locationSearch);
      if (result) {
        setFormData(prev => ({ ...prev, locationSearch: result.formatted, homeGpsAddress: `${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}` }));
        setLocationLocked(true);
      } else {
        setError('Location not found.');
      }
    } catch (err) {
      setError('Search failed.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleGetLocation = () => {
    setGeocoding(true);
    if (!navigator.geolocation) { setError('Geolocation not supported'); setGeocoding(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, locationSearch: "Current Location", homeGpsAddress: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` }));
        setLocationLocked(true);
        setGeocoding(false);
      },
      () => { setError('Could not fetch location.'); setGeocoding(false); }
    );
  };

  // Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!momoVerified) { setError('Please verify your Mobile Money account first.'); return; }
    if (!formData.fullName || !formData.password) { setError('Please fill in all required fields'); return; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!formData.ghCardFile) { setError('Ghana Card upload is required'); return; }
    if (!formData.homeGpsAddress) { setError('Please verify your location.'); return; }
    if (!formData.acceptTerms) { setError('You must accept the terms.'); return; }

    setIsSubmitting(true);

    try {
      // 1. Upload Ghana Card
      let ghCardImageUrl = '';
      const uploadFormData = new FormData();
      uploadFormData.append('ghana_card_image', formData.ghCardFile);
      const uploadResponse = await apiClient.post('/upload/ghana-card-registration', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      ghCardImageUrl = uploadResponse.data.image_url;

      // 2. Register Artisan
      const registrationData = {
        phone_primary: formData.phone,
        full_name: formData.fullName,
        password: formData.password,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email,
        gh_card_number: formData.ghCardNumber,
        gh_card_image_url: ghCardImageUrl,
        home_gps_address: formData.homeGpsAddress,
        primary_trade: formData.primaryTrade,
        momo_network: formData.momoNetwork,
        paystack_resolved_name: resolvedName,
        is_identity_verified: formData.isIdentityVerified,
        primary_language: formData.primaryLanguage,
        accept_terms: formData.acceptTerms
      };

      const response = await apiClient.post('/identity/artisan/register', registrationData);

      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.artisan_id);
      localStorage.setItem('userRole', 'artisan');

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-grey-50 flex flex-col">
      <div className="bg-navy-900 text-white px-6 py-6 flex items-center justify-center shadow-md">
        <img src={logo} alt="ZOLID" className="h-10 w-auto" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-3xl">
          <Card className="p-6 sm:p-8 shadow-xl border-t-4 border-indigo-600">
            <h1 className="font-condensed font-bold text-2xl text-navy-900 mb-6 text-center">Artisan Registration</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 1. IDENTITY & MOMO VERIFICATION */}
              <section>
                <h3 className="flex items-center text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-grey-200">
                  <span className="bg-navy-100 text-navy-800 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
                  Identity & Payment
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-navy-700">Full Name</label>
                    <Input name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" />
                  </div>

                  <Input label="Phone Number (MoMo)" type="tel" name="phone" placeholder="024XXXXXXX" value={formData.phone} onChange={handleChange} required />

                  <div>
                    <label className="block mb-2 text-sm font-medium text-navy-700">Network</label>
                    <select name="momoNetwork" value={formData.momoNetwork} onChange={handleChange} className="w-full px-4 py-3 border border-grey-300 rounded-lg bg-white">
                      {momoProviders.map((p, i) => <option key={i} value={p.provider_name}>{p.provider_name}</option>)}
                    </select>
                  </div>
                </div>

                {/* VERIFICATION BUTTON */}
                <div className="mt-4">
                    {!momoVerified ? (
                        <Button 
                            type="button" 
                            onClick={handleResolveMomo} 
                            disabled={resolvingMomo || !formData.phone} 
                            variant="primary" 
                            fullWidth
                            className="flex items-center justify-center gap-2"
                        >
                            {resolvingMomo && <Loader2 className="animate-spin h-4 w-4" />}
                            {resolvingMomo ? "Verifying..." : "Verify Mobile Money Account"}
                        </Button>
                    ) : (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-600 h-5 w-5" />
                                <div>
                                    <p className="text-xs text-green-800 font-bold">Verified Account Name</p>
                                    <p className="text-sm text-green-900 font-mono">{resolvedName}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setMomoVerified(false)} className="text-xs text-green-700 underline">Change</button>
                        </div>
                    )}
                </div>
              </section>

              {/* 2. BUSINESS INFO */}
              <section>
                <h3 className="flex items-center text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-grey-200">
                  <span className="bg-navy-100 text-navy-800 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
                  Business & Location
                </h3>

                <div className="grid grid-cols-1 gap-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-navy-700">Primary Trade</label>
                        <select name="primaryTrade" value={formData.primaryTrade} onChange={handleChange} className="w-full px-4 py-3 border border-grey-300 rounded-lg bg-white" required>
                            <option value="">Select trade...</option>
                            <option value="Plumber">Plumber</option>
                            <option value="Electrician">Electrician</option>
                            <option value="Carpenter">Carpenter</option>
                            <option value="Mason">Mason</option>
                            <option value="Painter">Painter</option>
                            <option value="Welder">Welder</option>
                            <option value="AC Technician">AC Technician</option>
                        </select>
                    </div>

                    <div className="bg-grey-50 p-4 rounded-lg border border-grey-200">
                        <label className="block text-sm font-semibold text-navy-900 mb-2">Home Location</label>
                        <div className="flex gap-2 mb-2">
                            <input type="text" name="locationSearch" value={formData.locationSearch} onChange={handleChange} placeholder="Search Area..." className="flex-1 px-3 py-2 border rounded-lg" />
                            <Button type="button" onClick={handleAddressSearch} disabled={geocoding} size="sm">Search</Button>
                        </div>
                        <Button type="button" variant="ghost" size="sm" fullWidth onClick={handleGetLocation}>Use Current GPS</Button>
                        {locationLocked && <p className="text-xs text-green-600 mt-2">📍 Location Verified: {formData.homeGpsAddress}</p>}
                    </div>
                </div>
              </section>

              {/* 3. DOCUMENTS */}
              <section>
                <h3 className="flex items-center text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-grey-200">
                  <span className="bg-navy-100 text-navy-800 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                  Documents
                </h3>
                <div className="space-y-4">
                    <Input label="Ghana Card Number" name="ghCardNumber" placeholder="GHA-..." value={formData.ghCardNumber} onChange={handleChange} required />
                    
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-grey-300 rounded-lg cursor-pointer bg-grey-50 hover:bg-white transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         {ghCardPreview ? <img src={ghCardPreview} alt="Preview" className="h-24 object-contain" /> : <span className="text-gray-500">📷 Upload Ghana Card Photo</span>}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleGhCardUpload} />
                    </label>
                </div>
              </section>

              {/* 4. SECURITY */}
              <section>
                <h3 className="flex items-center text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-grey-200">
                  <span className="bg-navy-100 text-navy-800 rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">4</span>
                  Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="flex items-center mt-4">
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="h-5 w-5 text-indigo-600 rounded" />
                    <label className="ml-2 text-sm text-navy-700">I accept the Terms & Privacy Policy.</label>
                </div>
              </section>

              {error && <div className="p-3 bg-coral-50 border border-coral-200 text-coral-700 rounded flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting || !momoVerified} className="py-4 shadow-lg">
                {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
              </Button>

              <div className="text-center">
                 <span className="text-navy-600">Already have an account? </span>
                 <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
              </div>

            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;