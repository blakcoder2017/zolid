import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Save, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ArtisanEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchArtisanDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get(`/artisans/${id}`);
            setArtisan(response.data.data.profile);
            setFormData(response.data.data.profile);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch artisan details. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArtisanDetails();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            // Update artisan details
            const response = await api.patch(`/artisans/${id}`, formData);
            
            setSuccess('Artisan details updated successfully!');
            setArtisan(response.data.data);
            setLoading(false);
            
            // Refresh after a short delay
            setTimeout(() => {
                navigate(`/artisans/${id}`);
            }, 2000);
        } catch (err) {
            setError('Failed to update artisan details. Please try again.');
            setLoading(false);
        }
    };

    if (loading && !artisan) {
        return (
            <div className="p-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <p className="text-navy-600">Loading artisan details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchArtisanDetails}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!artisan) {
        return (
            <div className="p-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <p className="text-navy-600">Artisan not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => navigate(`/artisans/${id}`)}
                    className="flex items-center text-navy-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Details
                </button>
                <h1 className="text-2xl font-bold text-navy-900">Edit Artisan</h1>
                <div></div> {/* Spacer */}
            </div>

            {success && (
                <div className="bg-mint-50 border border-mint-200 rounded-xl p-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-mint-600 mr-3" />
                    <p className="text-mint-600">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-navy-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-navy-900">Business Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Business Name</label>
                            <input 
                                type="text"
                                name="business_name"
                                value={formData.business_name || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Trade</label>
                            <select 
                                name="trade"
                                value={formData.trade || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                required
                            >
                                <option value="">Select Trade</option>
                                <option value="PLUMBING">Plumbing</option>
                                <option value="ELECTRICAL">Electrical</option>
                                <option value="CARPENTRY">Carpentry</option>
                                <option value="PAINTING">Painting</option>
                                <option value="CLEANING">Cleaning</option>
                                <option value="GENERAL">General</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Years of Experience</label>
                            <input 
                                type="number"
                                name="years_of_experience"
                                value={formData.years_of_experience || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Business Registration Number</label>
                            <input 
                                type="text"
                                name="business_registration_number"
                                value={formData.business_registration_number || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Tax ID</label>
                            <input 
                                type="text"
                                name="tax_id"
                                value={formData.tax_id || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-navy-900">Contact Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Phone Number</label>
                            <input 
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
                            <input 
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Location Description</label>
                            <input 
                                type="text"
                                name="location_description"
                                value={formData.location_description || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Full Address</label>
                            <textarea 
                                name="full_address"
                                value={formData.full_address || ''}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy-700 mb-1">Emergency Contact</label>
                            <input 
                                type="tel"
                                name="emergency_contact"
                                value={formData.emergency_contact || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-navy-900">Additional Information</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Bio</label>
                        <textarea 
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Services Offered</label>
                        <textarea 
                            name="services_offered"
                            value={formData.services_offered || ''}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Equipment</label>
                        <textarea 
                            name="equipment"
                            value={formData.equipment || ''}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Certifications</label>
                        <textarea 
                            name="certifications"
                            value={formData.certifications || ''}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                {/* Tier Management */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-navy-900">Tier Management</h3>
                    <div className="bg-navy-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-sm text-navy-500">Current Tier</p>
                                <p className="text-lg font-bold text-navy-900">{formData.tier_level}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => navigate(`/artisans/${id}/upgrade-tier`)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                                >
                                    Change Tier
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-navy-400">Tier changes require admin approval and may affect artisan benefits and visibility.</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-navy-200">
                    <button 
                        type="button"
                        onClick={() => navigate(`/artisans/${id}`)}
                        className="px-6 py-2 border border-navy-300 rounded-md text-navy-700 hover:bg-navy-50 transition-colors flex items-center"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                Saving...
                            </span>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ArtisanEditPage;