import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Phone, Mail, MapPin, Star, Briefcase, CheckCircle, XCircle, ShieldCheck, AlertTriangle, DollarSign, Globe, MessageSquare } from 'lucide-react';
import axios from 'axios';

// Mapbox integration
const getStaticMapUrl = (lat, lng) => {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    // If no token or invalid coords, return null
    if (!lat || !lng || !MAPBOX_TOKEN) return null;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},14.5,0/600x300?access_token=${MAPBOX_TOKEN}`;
};

const ArtisanDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artisan, setArtisan] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [guarantors, setGuarantors] = useState([]);
    const [pastJobs, setPastJobs] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [financials, setFinancials] = useState({});
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Function
    const fetchArtisanDetails = useCallback(async (signal = null) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.get(`/artisans/${id}`, { signal });
            
            setArtisan(response.data.data.profile);
            setPerformance(response.data.data.performance);
            setGuarantors(response.data.data.guarantors || []);
            setPastJobs(response.data.data.pastJobs || []);
            setDisputes(response.data.data.disputes || []);
            setFinancials(response.data.data.financials || {});
            setReviews(response.data.data.reviews || []);
            setLoading(false);
        } catch (err) {
            if (axios.isCancel(err)) return;
            if (err.response && err.response.status === 429) {
                setError('Too many requests. Please wait a moment.');
            } else {
                setError('Failed to fetch artisan details. Please try again.');
            }
            setLoading(false);
        }
    }, [id]);

    // 2. Debounced Effect
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            fetchArtisanDetails(controller.signal);
        }, 100);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [fetchArtisanDetails]);

    // Helper: Map status string to styles
    const getStatusBadge = (status) => {
        // Normalize input to uppercase to match keys
        const normalizedStatus = (status || 'PENDING').toUpperCase();
        
        const statusMap = {
            'VERIFIED': { color: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> },
            'PENDING': { color: 'bg-amber-100 border-amber-200', text: 'text-amber-700', icon: <AlertTriangle className="w-4 h-4" /> },
            'REJECTED': { color: 'bg-red-100 border-red-200', text: 'text-red-700', icon: <XCircle className="w-4 h-4" /> },
            'SUSPENDED': { color: 'bg-orange-100 border-orange-200', text: 'text-orange-700', icon: <AlertTriangle className="w-4 h-4" /> }
        };
        return statusMap[normalizedStatus] || statusMap['PENDING'];
    };

    const getTierBadge = (tier) => {
        const tierMap = {
            'BRONZE': { color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
            'SILVER': { color: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
            'GOLD': { color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
            'PLATINUM': { color: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' }
        };
        return tierMap[tier] || { color: 'bg-gray-50 border-gray-200', text: 'text-gray-600' };
    };

    const renderStars = (rating) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    const handleApproveGuarantor = async (guarantorId) => {
        try {
            await api.patch(`/artisans/${id}/guarantors/${guarantorId}/verify`);
            alert('Guarantor approved successfully!');
            fetchArtisanDetails();
        } catch (error) {
            alert('Failed to approve guarantor.');
        }
    };

    const handleSuspendArtisan = async () => {
        if (window.confirm('Are you sure you want to suspend this artisan? They will not be able to apply for jobs.')) {
            try {
                await api.patch(`/artisans/${id}/suspend`);
                alert('Artisan suspended successfully!');
                fetchArtisanDetails();
            } catch (error) {
                alert('Failed to suspend artisan.');
            }
        }
    };

    const handleLiftSuspension = async () => {
        if (window.confirm('Are you sure you want to lift the suspension for this artisan? They will be able to apply for jobs again.')) {
            try {
                await api.patch(`/artisans/${id}/lift-suspension`);
                alert('Suspension lifted successfully!');
                fetchArtisanDetails();
            } catch (error) {
                alert('Failed to lift suspension.');
            }
        }
    };

    if (loading && !artisan) {
        return (
            <div className="p-6">
                <div className="bg-white p-12 rounded-xl shadow-sm border border-navy-200 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-navy-600">Loading artisan details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4 font-medium">{error}</p>
                    <button onClick={() => fetchArtisanDetails()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!artisan) return null;

    // --- FIX: LOGIC FOR STATUS BADGE ---
    // Convert boolean is_identity_verified to the string expected by getStatusBadge
    let derivedStatus = 'PENDING';
    if (artisan.verification_status) {
        derivedStatus = artisan.verification_status;
    } else {
        derivedStatus = artisan.is_identity_verified ? 'VERIFIED' : 'PENDING';
    }
    
    const statusStyle = getStatusBadge(derivedStatus);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button onClick={() => navigate('/artisans')} className="flex items-center text-navy-600 hover:text-indigo-600 transition-colors font-medium bg-white px-4 py-2 rounded-lg border border-navy-100 shadow-sm">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Artisans
                </button>
                <div className="flex flex-wrap gap-2">
                   
                    {derivedStatus === 'PENDING' && (
                        <button onClick={() => navigate(`/artisans/${id}/approve`)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm shadow-emerald-200">
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </button>
                    )}
                    {!artisan.is_identity_verified ? (
                        <button onClick={handleLiftSuspension} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center shadow-sm shadow-amber-200">
                            <CheckCircle className="w-4 h-4 mr-2" /> Lift Suspension
                        </button>
                    ) : (
                        <button onClick={handleSuspendArtisan} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center shadow-sm shadow-red-200">
                            <XCircle className="w-4 h-4 mr-2" /> Suspend
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-24 h-24 flex-shrink-0">
                        {artisan.profile_picture_url ? (
                            <img 
                                src={artisan.profile_picture_url.startsWith('http') ? artisan.profile_picture_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${artisan.profile_picture_url}`}
                                alt={artisan.full_name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-sm"
                                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                            />
                        ) : null}
                        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-4xl shadow-sm border-4 border-white" style={{ display: artisan.profile_picture_url ? 'none' : 'flex' }}>
                            {artisan.full_name?.charAt(0) || 'A'}
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-2">
                            <div>
                                <h1 className="text-2xl font-bold text-navy-900 flex items-center justify-center md:justify-start">
                                    {artisan.full_name}
                                    {artisan.is_identity_verified && (
                                        <ShieldCheck className="w-5 h-5 text-emerald-500 ml-2" />
                                    )}
                                </h1>
                                <p className="text-navy-500 mt-1 font-medium">{artisan.primary_trade} Specialist</p>
                            </div>
                            <div className="flex space-x-2 mt-3 md:mt-0">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTierBadge(artisan.tier_level).color} ${getTierBadge(artisan.tier_level).text}`}>
                                    Tier {artisan.tier_level || '1'} 
                                </span>
                                {/* Fixed Status Badge */}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center border ${statusStyle.color} ${statusStyle.text}`}>
                                    {statusStyle.icon}
                                    <span className="ml-1">{derivedStatus}</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                            <div className="flex items-center justify-center md:justify-start bg-navy-50 p-2 rounded-lg text-navy-700">
                                <Phone className="w-4 h-4 text-navy-400 mr-2" /> {artisan.phone_primary}
                            </div>
                            <div className="flex items-center justify-center md:justify-start bg-navy-50 p-2 rounded-lg text-navy-700">
                                <Mail className="w-4 h-4 text-navy-400 mr-2" /> <span className="truncate max-w-[200px]">{artisan.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start bg-navy-50 p-2 rounded-lg text-navy-700">
                                <MapPin className="w-4 h-4 text-navy-400 mr-2" /> <span className="truncate max-w-[200px]">{artisan.home_gps_address || 'No Location'}</span>
                            </div>
                        </div>

                        {/* --- FIX: MAP DISPLAY --- */}
                        {artisan.home_gps_address && (
                            <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-navy-200">
                                <h4 className="text-sm font-medium text-navy-700 mb-3 flex items-center">
                                    <Globe className="w-4 h-4 text-indigo-600 mr-2" />
                                    Location on Map
                                </h4>
                                {(() => {
                                    try {
                                        // Robust parsing: split by comma, trim whitespace
                                        const parts = artisan.home_gps_address.split(',');
                                        if (parts.length >= 2) {
                                            const lat = parseFloat(parts[0].trim());
                                            const lng = parseFloat(parts[1].trim());
                                            const mapUrl = getStaticMapUrl(lat, lng);
                                            
                                            if (mapUrl) {
                                                return (
                                                    <div className="rounded-lg overflow-hidden border border-navy-100">
                                                        <img
                                                            src={mapUrl}
                                                            alt="Location Map"
                                                            className="w-full h-64 object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                        <div className="hidden text-center py-8 text-navy-400 bg-navy-50">
                                                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                            Map image could not be loaded.
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                    } catch (error) {
                                        console.error('Error parsing map coords');
                                    }
                                    return <div className="text-xs text-navy-400">Map unavailable (Invalid Coordinates or Missing Token)</div>;
                                })()}
                            </div>
                        )}

                        <div className="flex items-center justify-center md:justify-start mt-4">
                            <div className="mr-2">
                                {renderStars(artisan.reputation_score)}
                            </div>
                            <span className="text-navy-900 font-bold">{artisan.reputation_score ? Number(artisan.reputation_score).toFixed(1) : '0.0'}/5</span>
                            <span className="text-navy-400 ml-2 text-sm">({artisan.jobs_completed || 0} jobs completed)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium uppercase tracking-wider">Total Jobs</p>
                            <h3 className="text-3xl font-bold text-navy-900 mt-2">{performance?.total_jobs || 0}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                            <Briefcase className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">Lifetime total jobs completed</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium uppercase tracking-wider">Success Rate</p>
                            <h3 className="text-3xl font-bold text-navy-900 mt-2">
                                {performance?.total_jobs > 0 
                                    ? `${Math.round((performance.successful_jobs / performance.total_jobs) * 100)}%`
                                    : '0%'}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">Successful completion rate</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium uppercase tracking-wider">Total Earnings</p>
                            <h3 className="text-3xl font-bold text-navy-900 mt-2">
                                GHS {(performance?.total_earnings / 100).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">Lifetime earnings on platform</p>
                </div>
            </div>

            {/* Guarantors & Past Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Guarantors */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-900 mb-4 border-b border-navy-100 pb-2">Guarantors</h3>
                    {guarantors.length === 0 ? (
                        <div className="text-center py-8 text-navy-400 bg-navy-50 rounded-lg">No guarantors found.</div>
                    ) : (
                        <div className="space-y-3">
                            {guarantors.map((guarantor) => (
                                <div key={guarantor.id} className="border border-navy-100 rounded-lg p-3 hover:bg-navy-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-navy-900 text-sm">{guarantor.name}</h4>
                                            <div className="text-navy-500 text-xs mt-1">{guarantor.phone}</div>
                                            <div className="text-navy-400 text-xs uppercase mt-1 tracking-wider">{guarantor.relationship}</div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${guarantor.is_verified ? 'bg-mint-50 text-mint-600 border-mint-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                                                {guarantor.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                            {!guarantor.is_verified && (
                                                <button
                                                    onClick={() => handleApproveGuarantor(guarantor.id)}
                                                    className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700 transition-colors"
                                                    title="Approve this guarantor"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Jobs */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-900 mb-4 border-b border-navy-100 pb-2">Recent Jobs</h3>
                    {pastJobs.length === 0 ? (
                        <div className="text-center py-8 text-navy-400 bg-navy-50 rounded-lg">No past jobs found.</div>
                    ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {pastJobs.map((job) => (
                                <div key={job.id} className="border border-navy-100 rounded-lg p-3 hover:bg-navy-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-navy-900 text-sm truncate w-3/4">{job.job_description}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.current_state === 'PAYOUT_SUCCESS' ? 'bg-mint-50 text-mint-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {job.current_state.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-navy-500">
                                        <span>Fee: GHS {(job.gross_fee_pesewas / 100).toFixed(2)}</span>
                                        <span className="font-medium text-emerald-600">Payout: GHS {(job.artisan_payout_pesewas / 100).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Disputes & Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-900 mb-4 border-b border-navy-100 pb-2 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Disputes
                    </h3>
                    {disputes.length === 0 ? (
                        <div className="text-center py-8 text-navy-400 bg-navy-50 rounded-lg">No disputes found for this artisan.</div>
                    ) : (
                        <div className="space-y-4">
                            {disputes.map((dispute) => (
                                <div key={dispute.id} className="border border-navy-100 rounded-lg p-4 hover:bg-navy-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-navy-900 text-sm">{dispute.job_description || 'Job dispute'}</h4>
                                            <p className="text-navy-500 text-xs mt-1">{dispute.category}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${dispute.status === 'RESOLVED' ? 'bg-mint-50 text-mint-600 border-mint-200' : dispute.status === 'DISMISSED' ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                                            {dispute.status}
                                        </span>
                                    </div>
                                    <p className="text-navy-600 text-sm">{dispute.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-900 mb-4 border-b border-navy-100 pb-2 flex items-center">
                        <MessageSquare className="w-5 h-5 text-yellow-500 mr-2" />
                        Customer Reviews
                    </h3>
                    {reviews.length === 0 ? (
                        <div className="text-center py-8 text-navy-400 bg-navy-50 rounded-lg">No reviews found for this artisan.</div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="border border-navy-100 rounded-lg p-4 hover:bg-navy-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center mb-1">
                                                {renderStars(review.rating)}
                                                <span className="text-navy-900 font-bold ml-2">{review.rating}/5</span>
                                            </div>
                                            <p className="text-navy-600 text-sm">{review.review_text}</p>
                                        </div>
                                    </div>
                                    <p className="text-navy-400 text-xs mt-2">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArtisanDetailPage;