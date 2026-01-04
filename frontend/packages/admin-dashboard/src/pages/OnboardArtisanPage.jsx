import React, { useState } from 'react';
import api from '../api/axios';
import { 
    UserPlus, Save, CheckCircle, Smartphone, MapPin, Briefcase, 
    CreditCard, Mail, Calendar, Globe, Hash, Search, Upload, 
    Loader2, XCircle, Image as ImageIcon, Lock, Eye, EyeOff 
} from 'lucide-react';

// Ensure this is set in your .env file: VITE_MAPBOX_TOKEN=pk.eyJ...
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const OnboardArtisanPage = () => {
    const [formData, setFormData] = useState({
        // Personal
        full_name: '',
        phone_primary: '',
        dob: '',
        gender: 'MALE',
        email: '',
        password: '',
        confirm_password: '',
        // Professional
        primary_trade: '',
        tier_level: '1',
        primary_language: 'ENGLISH',
        // Identity & Location
        home_gps_address: '',
        gh_card_number: '',
        momo_network: '',
        // Verification Data
        paystack_resolved_name: '',
        profile_picture_url: '',
        gh_card_image_url: ''
    });

    // UI States
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Feature States
    const [verifyingMomo, setVerifyingMomo] = useState(false);
    const [momoVerified, setMomoVerified] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [locationResults, setLocationResults] = useState([]);
    
    // File States
    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [ghCardFile, setGhCardFile] = useState(null);
    const [ghCardPreview, setGhCardPreview] = useState(null);

    const trades = ['Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Painting', 'Tiling', 'Welding', 'AC Technician', 'Auto Mechanic', 'Cleaner'];
    const languages = ['ENGLISH', 'TWI', 'GA', 'EWE', 'FANTE', 'HAUSA', 'DAGBANI'];
    const networks = ['MTN', 'VODAFONE', 'AIRTELTIGO'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'phone_primary' || e.target.name === 'momo_network') {
            setMomoVerified(false); 
        }
    };

    const handleResolveMomo = async () => {
        if (!formData.phone_primary || !formData.momo_network) {
            return setError("Phone and Network required for verification.");
        }
        setVerifyingMomo(true);
        setError('');
        
        try {
            // Uses the admin route created earlier
            const res = await api.post('/onboarding/resolve-momo', {
                phone_primary: formData.phone_primary,
                momo_network: formData.momo_network
            });
            
            const resolvedName = res.data.data.account_name;
            setFormData(prev => ({ ...prev, paystack_resolved_name: resolvedName }));
            setMomoVerified(true);
        } catch (err) {
            console.error(err);
            setMomoVerified(false);
            setError(err.response?.data?.message || "Could not verify MoMo number.");
        } finally {
            setVerifyingMomo(false);
        }
    };

    // --- MAPBOX GEOCODING ---
    const handleSearchLocation = async () => {
        if (!locationQuery || locationQuery.length < 3) return;
        setSearchingLocation(true);
        try {
            const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json`;
            const params = new URLSearchParams({ 
                access_token: MAPBOX_TOKEN, 
                country: 'gh', 
                limit: '5',
                types: 'place,locality,neighborhood'
            });
            
            const res = await fetch(`${endpoint}?${params}`);
            const data = await res.json();
            
            if (data.features && data.features.length > 0) {
                setLocationResults(data.features.map(f => ({
                    id: f.id,
                    name: f.place_name,
                    // Mapbox sends [lon, lat], we want "Lat, Lon" string
                    coords: `${f.center[1]}, ${f.center[0]}` 
                })));
            } else {
                setLocationResults([]);
            }
        } catch (err) {
            console.error("Location search failed", err);
        } finally {
            setSearchingLocation(false);
        }
    };

    const selectLocation = (loc) => {
        setFormData(prev => ({ ...prev, home_gps_address: loc.coords }));
        setLocationQuery(loc.name.split(',')[0]); // Just show city name
        setLocationResults([]); 
    };

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (type === 'profile') {
                setProfileFile(file);
                setProfilePreview(ev.target.result);
            } else {
                setGhCardFile(file);
                setGhCardPreview(ev.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // --- UPLOAD LOGIC (Local Storage via Admin API) ---
    const uploadSingleFile = async (file, type) => {
        const formData = new FormData();
        
        let endpoint = '';
        let fieldName = '';
        
        // These endpoints match the routes we added to adminRoutes.js
        if (type === 'profile') {
            endpoint = '/uploads/profile-picture'; 
            fieldName = 'profile_picture';
        } else {
            endpoint = '/uploads/ghana-card';     
            fieldName = 'ghana_card_image';
        }
        
        formData.append(fieldName, file);

        // Uses admin 'api' instance which includes the Admin Token
        const res = await api.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Returns relative path (e.g. "uploads/file.jpg")
        return type === 'profile' ? res.data.profile_picture_url : res.data.image_url;
    };

    const uploadFiles = async () => {
        let profileUrl = '';
        let cardUrl = '';

        try {
            if (profileFile) {
                profileUrl = await uploadSingleFile(profileFile, 'profile');
            }

            if (ghCardFile) {
                cardUrl = await uploadSingleFile(ghCardFile, 'card');
            }
        } catch (error) {
            console.error("Upload Error:", error);
            throw new Error("File upload failed. Please check file size and try again.");
        }

        return { profileUrl, cardUrl };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessData(null);

        // Password Validation
        if (formData.password && formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
        if (formData.password && formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            // 1. Upload Files
            const { profileUrl, cardUrl } = await uploadFiles();

            // 2. Format Phone
            let phone = formData.phone_primary.trim();
            if (phone.startsWith('0')) phone = '+233' + phone.substring(1);

            // 3. Prepare Payload
            const payload = { 
                ...formData, 
                phone_primary: phone,
                profile_picture_url: profileUrl,
                gh_card_image_url: cardUrl
            };
            
            // Remove confirm_password from payload
            delete payload.confirm_password;

            // 4. Submit Data
            const res = await api.post('/onboarding/manual', payload);
            setSuccessData(res.data.data);
            
            // 5. Reset Form
            setFormData({
                full_name: '', phone_primary: '', dob: '', gender: 'MALE', email: '', 
                password: '', confirm_password: '',
                primary_trade: '', tier_level: '1', primary_language: 'ENGLISH',
                home_gps_address: '', gh_card_number: '', momo_network: '',
                paystack_resolved_name: '', profile_picture_url: '', gh_card_image_url: ''
            });
            setProfilePreview(null);
            setGhCardPreview(null);
            setLocationQuery('');
            setMomoVerified(false);

        } catch (err) {
            console.error(err);
            setError(err.message || err.response?.data?.message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Manual Artisan Onboarding</h1>
            <p className="text-gray-500 mb-8">Register a full artisan profile directly into the system.</p>

            

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* LEFT: The Form */}
                <div className="xl:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2"><XCircle size={18}/> {error}</div>}

                        {/* SECTION 1: IDENTITY & FILES */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Identity & Files</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 relative">
                                        {profilePreview ? <img src={profilePreview} alt="Preview" className="w-full h-full object-cover" /> : <UserPlus size={32} className="text-gray-400" />}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                                        <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                            <Upload size={16} className="mr-2" /> Upload Photo
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'profile')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Card Image *</label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                                        {ghCardPreview ? <img src={ghCardPreview} alt="Card" className="absolute inset-0 w-full h-full object-contain" /> : <div className="flex flex-col items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-400 mb-1" /><p className="text-xs text-gray-500">Click to upload</p></div>}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'card')} required />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm" placeholder="Kwame Mensah" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Card Number *</label>
                                    <input required type="text" name="gh_card_number" value={formData.gh_card_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm" placeholder="GHA-..." />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PASSWORD SETTING */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Account Security</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Create Password *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={16} className="text-gray-400"/></div>
                                        <input 
                                            required 
                                            type={showPassword ? "text" : "password"} 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            className="pl-10 pr-10 w-full border border-gray-300 rounded-lg shadow-sm py-2" 
                                            placeholder="Min 6 chars" 
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={16} className="text-gray-400"/></div>
                                        <input 
                                            required 
                                            type={showPassword ? "text" : "password"} 
                                            name="confirm_password" 
                                            value={formData.confirm_password} 
                                            onChange={handleChange} 
                                            className="pl-10 w-full border border-gray-300 rounded-lg shadow-sm py-2" 
                                            placeholder="Retype password" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: PAYMENT VERIFICATION */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Payment Verification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Network *</label>
                                    <select required name="momo_network" value={formData.momo_network} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm">
                                        <option value="">Select...</option>
                                        {networks.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (MoMo) *</label>
                                    <div className="flex gap-2">
                                        <input required type="tel" name="phone_primary" value={formData.phone_primary} onChange={handleChange} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm" placeholder="024XXXXXXX" />
                                        <button 
                                            type="button" 
                                            onClick={handleResolveMomo}
                                            disabled={verifyingMomo || momoVerified}
                                            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${momoVerified ? 'bg-green-600' : 'bg-navy-700 hover:bg-navy-800'}`}
                                        >
                                            {verifyingMomo ? <Loader2 className="animate-spin" size={18} /> : momoVerified ? <CheckCircle size={18} /> : 'Verify'}
                                        </button>
                                    </div>
                                    {momoVerified && <p className="text-xs text-green-600 mt-1 font-bold">✓ Verified: {formData.paystack_resolved_name}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: WORK DETAILS (WITH MAPBOX) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Work Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Trade *</label>
                                    <select required name="primary_trade" value={formData.primary_trade} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm">
                                        <option value="">Select Trade...</option>
                                        {trades.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Search (Mapbox) *</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={locationQuery} 
                                            onChange={(e) => setLocationQuery(e.target.value)} 
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm" 
                                            placeholder="Type city or area (e.g. Madina)" 
                                        />
                                        <button type="button" onClick={handleSearchLocation} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
                                            {searchingLocation ? <Loader2 className="animate-spin" size={20} /> : <Search size={20}/>}
                                        </button>
                                    </div>
                                    
                                    {locationResults.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {locationResults.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => selectLocation(loc)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                                >
                                                    <div className="font-medium text-sm text-gray-900">{loc.name.split(',')[0]}</div>
                                                    <div className="text-xs text-gray-500 truncate">{loc.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {formData.home_gps_address && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin size={12} /> Coords: {formData.home_gps_address}</p>}
                                </div>
                                
                                <div className="md:col-span-2 grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm">
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                        <select name="primary_language" value={formData.primary_language} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm">
                                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-3 bg-navy-900 text-white font-bold rounded-lg shadow-lg hover:bg-navy-800 focus:outline-none focus:ring-4 focus:ring-navy-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            >
                                {loading ? <><Loader2 className="animate-spin" /> Processing...</> : <><Save size={20} /> Create Artisan Account</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Success Card */}
                <div className="xl:col-span-1">
                    {successData ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 h-fit sticky top-6 animate-in fade-in slide-in-from-right-4 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-full text-green-600"><CheckCircle size={24} /></div>
                                <h3 className="font-bold text-green-800 text-lg">Account Created!</h3>
                            </div>
                            
                            <div className="space-y-4 text-sm text-green-900">
                                <p>Share these credentials with the artisan:</p>
                                <div className="bg-white p-4 rounded border border-green-200 font-mono shadow-sm">
                                    <div className="mb-2"><span className="text-gray-500 block text-xs uppercase">Full Name</span> {successData.artisan.full_name}</div>
                                    <div className="mb-2"><span className="text-gray-500 block text-xs uppercase">Phone</span> {successData.artisan.phone_primary}</div>
                                    <div className="pt-2 border-t border-gray-100 mt-2">
                                        <span className="text-gray-500 block text-xs uppercase">Password</span>
                                        <span className="text-xl font-bold select-all">{successData.temp_password}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-start bg-blue-50 p-3 rounded text-blue-800 text-xs border border-blue-100">
                                    <Hash size={16} className="flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Account Status:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>Identity Verified (Admin)</li>
                                            <li>{momoVerified ? "Payment Verified (Paystack)" : "Payment Unverified"}</li>
                                            <li>Ready for Jobs</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 h-full min-h-[300px] flex flex-col items-center justify-center text-center text-gray-500">
                            <UserPlus size={48} className="mb-3 opacity-20" />
                            <h3 className="font-medium text-gray-900">Ready to Onboard</h3>
                            <p className="text-sm mt-1">Fill out the form to register a new artisan account.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardArtisanPage;