import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

const ArtisanApprovalPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [notes, setNotes] = useState('');

    const fetchArtisanDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get(`/artisans/${id}`);
            setArtisan(response.data.data.profile);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch artisan details. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArtisanDetails();
    }, [id]);

    const handleApprove = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            // Approve artisan
            const response = await api.patch(`/artisans/${id}/verify`, {
                status: 'VERIFIED',
                notes: notes
            });
            
            setSuccess('Artisan approved successfully!');
            setLoading(false);
            
            // Refresh artisan data
            await fetchArtisanDetails();
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/artisans/${id}`);
            }, 2000);
        } catch (err) {
            setError('Failed to approve artisan. Please try again.');
            setLoading(false);
        }
    };

    const handleReject = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            
            // Reject artisan
            const response = await api.patch(`/artisans/${id}/verify`, {
                status: 'REJECTED',
                notes: notes
            });
            
            setSuccess('Artisan rejected successfully!');
            setLoading(false);
            
            // Refresh artisan data
            await fetchArtisanDetails();
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/artisans/${id}`);
            }, 2000);
        } catch (err) {
            setError('Failed to reject artisan. Please try again.');
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
                <h1 className="text-2xl font-bold text-navy-900">Artisan Verification</h1>
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

            {/* Artisan Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-3xl">
                        {artisan.business_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-navy-900 flex items-center">
                                    {artisan.business_name}
                                </h2>
                                <p className="text-navy-500 mt-1">{artisan.trade} Specialist</p>
                            </div>
                            <div className="flex space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-600 flex items-center`}>
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    Pending Verification
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center">
                                <Info className="w-4 h-4 text-navy-400 mr-2" />
                                <span className="text-navy-600 text-sm">Phone: {artisan.phone_number}</span>
                            </div>
                            <div className="flex items-center">
                                <Info className="w-4 h-4 text-navy-400 mr-2" />
                                <span className="text-navy-600 text-sm">Email: {artisan.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                                <Info className="w-4 h-4 text-navy-400 mr-2" />
                                <span className="text-navy-600 text-sm">Location: {artisan.location_description || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                                <Info className="w-4 h-4 text-navy-400 mr-2" />
                                <span className="text-navy-600 text-sm">Experience: {artisan.years_of_experience || 'N/A'} years</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4">Verification Checklist</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-navy-200 rounded-lg">
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-navy-400 mr-3" />
                            <span className="text-navy-700">ID Card Verified</span>
                        </div>
                        {artisan.id_card_url ? (
                            <CheckCircle className="w-5 h-5 text-mint-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-navy-200 rounded-lg">
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-navy-400 mr-3" />
                            <span className="text-navy-700">Business License Verified</span>
                        </div>
                        {artisan.business_license_url ? (
                            <CheckCircle className="w-5 h-5 text-mint-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-navy-200 rounded-lg">
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-navy-400 mr-3" />
                            <span className="text-navy-700">Profile Information Complete</span>
                        </div>
                        {artisan.bio && artisan.services_offered ? (
                            <CheckCircle className="w-5 h-5 text-mint-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>

                    <div className="flex items-center justify-between p-3 border border-navy-200 rounded-lg">
                        <div className="flex items-center">
                            <ShieldCheck className="w-5 h-5 text-navy-400 mr-3" />
                            <span className="text-navy-700">Contact Information Valid</span>
                        </div>
                        {artisan.phone_number && artisan.email ? (
                            <CheckCircle className="w-5 h-5 text-mint-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Verification Notes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4">Verification Notes</h3>
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add verification notes (reason for approval/rejection, additional comments, etc.)"
                    rows="6"
                    className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            {/* Verification Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4">Verification Decision</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-mint-200 rounded-lg p-4 text-center">
                        <h4 className="font-medium text-navy-700 mb-2">Approve Artisan</h4>
                        <p className="text-sm text-navy-500 mb-4">Approve this artisan to start receiving jobs on the platform.</p>
                        <button 
                            onClick={handleApprove}
                            disabled={loading}
                            className={`w-full bg-mint-600 text-white py-2 rounded-md font-medium hover:bg-mint-700 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </>
                            )}
                        </button>
                    </div>

                    <div className="border border-red-200 rounded-lg p-4 text-center">
                        <h4 className="font-medium text-navy-700 mb-2">Reject Artisan</h4>
                        <p className="text-sm text-navy-500 mb-4">Reject this artisan's application with reason.</p>
                        <button 
                            onClick={handleReject}
                            disabled={loading}
                            className={`w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                    Processing...
                                </span>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-navy-50 rounded-lg text-sm text-navy-500">
                    <Info className="w-4 h-4 inline-block mr-1" />
                    <span>Once you make a decision, the artisan will be notified and their status will be updated accordingly.</span>
                </div>
            </div>
        </div>
    );
};

export default ArtisanApprovalPage;