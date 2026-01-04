// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../api/axios';
// import { Search, Filter, Eye, Edit, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// const ArtisansPage = () => {
//     const [artisans, setArtisans] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [page, setPage] = useState(1);
//     const [totalPages, setTotalPages] = useState(1);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filters, setFilters] = useState({
//         tier: '',
//         trade: '',
//         status: ''
//     });
    
//     const navigate = useNavigate();

//     const fetchArtisans = async () => {
//         try {
//             setLoading(true);
//             setError(null);
            
//             const params = new URLSearchParams({
//                 page: page.toString(),
//                 limit: '20',
//                 ...(searchTerm && { search: searchTerm }),
//                 ...(filters.tier && { tier: filters.tier }),
//                 ...(filters.trade && { trade: filters.trade }),
//                 ...(filters.status && { status: filters.status })
//             });

//             const response = await api.get(`/artisans?${params.toString()}`);
        
//             setArtisans(response.data.artisans);
//             setTotalPages(response.data.pages);
//             setLoading(false);
//         } catch (err) {
//             setError('Failed to fetch artisans. Please try again.', err);
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchArtisans();
//     }, [page, searchTerm, filters]);

//     const handleSearch = (e) => {
//         e.preventDefault();
//         setPage(1); // Reset to first page when searching
//         fetchArtisans();
//     };

//     const handleFilterChange = (e) => {
//         const { name, value } = e.target;
//         setFilters(prev => ({ ...prev, [name]: value }));
//     };

//     const handlePageChange = (newPage) => {
//         if (newPage >= 1 && newPage <= totalPages) {
//             setPage(newPage);
//         }
//     };

//     const handleDeleteArtisan = async (artisanId) => {
//         if (window.confirm('Are you sure you want to delete this artisan?')) {
//             try {
//                 await api.delete(`/artisans/${artisanId}`);
//                 fetchArtisans();
//             } catch {
//                 setError('Failed to delete artisan. Please try again.');
//             }
//         }
//     };

//     const getStatusBadge = (status) => {
//         const statusMap = {
//             'VERIFIED': { color: 'bg-mint-100', text: 'text-mint-600' },
//             'PENDING': { color: 'bg-yellow-100', text: 'text-yellow-600' },
//             'REJECTED': { color: 'bg-red-100', text: 'text-red-600' },
//             'SUSPENDED': { color: 'bg-orange-100', text: 'text-orange-600' }
//         };
//         return statusMap[status] || { color: 'bg-gray-100', text: 'text-gray-600' };
//     };

//     const getTierBadge = (tier) => {
//         const tierMap = {
//             'BRONZE': { color: 'bg-amber-100', text: 'text-amber-600' },
//             'SILVER': { color: 'bg-gray-100', text: 'text-gray-600' },
//             'GOLD': { color: 'bg-yellow-100', text: 'text-yellow-600' },
//             'PLATINUM': { color: 'bg-indigo-100', text: 'text-indigo-600' }
//         };
//         return tierMap[tier] || { color: 'bg-gray-100', text: 'text-gray-600' };
//     };

//     if (loading && artisans.length === 0) {
//         return (
//             <div className="p-6">
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
//                     <p className="text-navy-600">Loading artisans...</p>
//                 </div>
//             </div>
//         );
//     }

//     if (error) {
//         return (
//             <div className="p-6">
//                 <div className="bg-red-50 border border-red-200 rounded-xl p-6">
//                     <p className="text-red-600 mb-4">{error}</p>
//                     <button 
//                         onClick={fetchArtisans}
//                         className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
//                     >
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-6">
//             <div className="flex justify-between items-center">
//                 <h1 className="text-2xl font-bold text-navy-900">Artisan Management</h1>
//                 <button 
//                     onClick={() => navigate('/artisans/statistics')}
//                     className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
//                 >
//                     <span className="mr-2">Statistics</span>
//                 </button>
//             </div>

//             {/* Search and Filter */}
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
//                 <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
//                     <div>
//                         <label className="block text-sm font-medium text-navy-700 mb-1">Search</label>
//                         <div className="relative">
//                             <input 
//                                 type="text"
//                                 placeholder="Name, phone, or business"
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="w-full px-4 py-2 pl-10 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//                             />
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-4 h-4" />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-navy-700 mb-1">Tier</label>
//                         <select 
//                             name="tier"
//                             value={filters.tier}
//                             onChange={handleFilterChange}
//                             className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//                         >
//                             <option value="">All Tiers</option>
//                             <option value="BRONZE">Bronze</option>
//                             <option value="SILVER">Silver</option>
//                             <option value="GOLD">Gold</option>
//                             <option value="PLATINUM">Platinum</option>
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-navy-700 mb-1">Trade</label>
//                         <select 
//                             name="trade"
//                             value={filters.trade}
//                             onChange={handleFilterChange}
//                             className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//                         >
//                             <option value="">All Trades</option>
//                             <option value="PLUMBING">Plumbing</option>
//                             <option value="ELECTRICAL">Electrical</option>
//                             <option value="CARPENTRY">Carpentry</option>
//                             <option value="PAINTING">Painting</option>
//                             <option value="CLEANING">Cleaning</option>
//                             <option value="GENERAL">General</option>
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-navy-700 mb-1">Status</label>
//                         <select 
//                             name="status"
//                             value={filters.status}
//                             onChange={handleFilterChange}
//                             className="w-full px-4 py-2 border border-navy-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
//                         >
//                             <option value="">All Statuses</option>
//                             <option value="VERIFIED">Verified</option>
//                             <option value="PENDING">Pending</option>
//                             <option value="REJECTED">Rejected</option>
//                             <option value="SUSPENDED">Suspended</option>
//                         </select>
//                     </div>

//                     <div className="md:col-span-4">
//                         <button 
//                             type="submit"
//                             className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center"
//                         >
//                             <Filter className="w-4 h-4 mr-2" />
//                             Apply Filters
//                         </button>
//                     </div>
//                 </form>
//             </div>

//             {/* Artisans Table */}
//             <div className="bg-white rounded-xl shadow-sm border border-navy-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="w-full">
//                         <thead className="bg-navy-50">
//                             <tr>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Artisan Name</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Trade</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Tier</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Status</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Rating</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Jobs Completed</th>
//                                 <th className="px-6 py-3 text-left text-xs font-medium text-navy-500 uppercase tracking-wider">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-navy-200">
//                             {artisans.length === 0 ? (
//                                 <tr>
//                                     <td colSpan="7" className="px-6 py-4 text-center text-navy-500">
//                                         No artisans found
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 artisans.map((artisan) => (
//                                     <tr key={artisan.id} className="hover:bg-navy-50">
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <div className="flex items-center">
//                                                 <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">
//                                                     {artisan.full_name ? artisan.full_name.split(' ').map(n => n[0]).join('') : 'A'}
//                                                 </div>
//                                                 <div>
//                                                     <div className="text-sm font-medium text-navy-900">{artisan.full_name}</div>
//                                                     <div className="text-sm text-navy-500">{artisan.phone_number}</div>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
//                                                 {artisan.trade}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadge(artisan.tier_level).color} ${getTierBadge(artisan.tier_level).text}`}>
//                                                 {artisan.tier_level}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(artisan.verification_status).color} ${getStatusBadge(artisan.verification_status).text}`}>
//                                                 {artisan.verification_status}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <div className="flex items-center">
//                                                 <div className="flex text-yellow-400">
//                                                     {[...Array(5)].map((_, i) => (
//                                                         <span key={i} className={`text-sm ${i < Math.floor(artisan.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
//                                                     ))}
//                                                 </div>
//                                                 <span className="ml-1 text-sm text-navy-500">({artisan.rating || 0})</span>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <span className="px-2 py-1 rounded-full text-xs font-medium bg-mint-100 text-mint-600">
//                                                 {artisan.jobs_completed_count || 0}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 whitespace-nowrap">
//                                             <div className="flex space-x-2">
//                                                 <button
//                                                     onClick={() => navigate(`/artisans/${artisan.id}`)}
//                                                     className="p-2 text-navy-600 hover:text-indigo-600 hover:bg-navy-100 rounded-full transition-colors"
//                                                     title="View Details"
//                                                 >
//                                                     <Eye className="w-4 h-4" />
//                                                 </button>
//                                                 <button
//                                                     onClick={() => navigate(`/artisans/${artisan.id}/edit`)}
//                                                     className="p-2 text-navy-600 hover:text-indigo-600 hover:bg-navy-100 rounded-full transition-colors"
//                                                     title="Edit"
//                                                 >
//                                                     <Edit className="w-4 h-4" />
//                                                 </button>
//                                                 <button
//                                                     onClick={() => handleDeleteArtisan(artisan.id)}
//                                                     className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
//                                                     title="Delete"
//                                                 >
//                                                     <XCircle className="w-4 h-4" />
//                                                 </button>
//                                                 {artisan.verification_status === 'PENDING' && (
//                                                     <button
//                                                         onClick={() => navigate(`/artisans/${artisan.id}/approve`)}
//                                                         className="p-2 text-mint-600 hover:text-mint-700 hover:bg-mint-100 rounded-full transition-colors"
//                                                         title="Approve"
//                                                     >
//                                                         <CheckCircle className="w-4 h-4" />
//                                                     </button>
//                                                 )}
//                                                 {artisan.verification_status === 'PENDING' && (
//                                                     <button
//                                                         onClick={() => navigate(`/artisans/${artisan.id}/reject`)}
//                                                         className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
//                                                         title="Reject"
//                                                     >
//                                                         <XCircle className="w-4 h-4" />
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 {totalPages > 1 && (
//                     <div className="flex justify-between items-center p-4 border-t border-navy-200">
//                         <div className="text-sm text-navy-500">
//                             Page {page} of {totalPages}
//                         </div>
//                         <div className="flex space-x-2">
//                             <button 
//                                 onClick={() => handlePageChange(page - 1)}
//                                 disabled={page === 1}
//                                 className={`p-2 rounded-md ${page === 1 ? 'bg-navy-100 text-navy-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
//                             >
//                                 <ChevronLeft className="w-4 h-4" />
//                             </button>
//                             <button 
//                                 onClick={() => handlePageChange(page + 1)}
//                                 disabled={page === totalPages}
//                                 className={`p-2 rounded-md ${page === totalPages ? 'bg-navy-100 text-navy-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
//                             >
//                                 <ChevronRight className="w-4 h-4" />
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ArtisansPage;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, Filter, Eye, Edit, CheckCircle, XCircle, ChevronLeft, ChevronRight, Star, Briefcase, MapPin } from 'lucide-react';

const ArtisansPage = () => {
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        tier: '',
        trade: '',
        status: ''
    });
    
    const navigate = useNavigate();
    // Helper to get image URL (adjust base URL based on your env)
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchArtisans = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(filters.tier && { tier: filters.tier }),
                ...(filters.trade && { trade: filters.trade }),
                ...(filters.status && { status: filters.status })
            });

            const response = await api.get(`/artisans?${params.toString()}`);
            console.log('response', response.data.artisans)
            setArtisans(response.data.artisans);
            setTotalPages(response.data.pages);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch artisans. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArtisans();
    }, [page, searchTerm, filters]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchArtisans();
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handleDeleteArtisan = async (artisanId) => {
        if (window.confirm('Are you sure you want to delete this artisan?')) {
            try {
                await api.delete(`/artisans/${artisanId}`);
                fetchArtisans();
            } catch {
                setError('Failed to delete artisan.');
            }
        }
    };

    const handleSuspendArtisan = async (artisanId) => {
        if (window.confirm('Are you sure you want to suspend this artisan? They will not be able to apply for jobs.')) {
            try {
                await api.patch(`/artisans/${artisanId}/suspend`);
                fetchArtisans();
            } catch {
                setError('Failed to suspend artisan.');
            }
        }
    };

    const handleLiftSuspension = async (artisanId) => {
        if (window.confirm('Are you sure you want to lift the suspension for this artisan? They will be able to apply for jobs again.')) {
            try {
                await api.patch(`/artisans/${artisanId}/lift-suspension`);
                fetchArtisans();
            } catch {
                setError('Failed to lift suspension.');
            }
        }
    };

    // --- Visual Helpers ---
    const getStatusBadge = (status) => {
        const styles = {
            'VERIFIED': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
            'REJECTED': 'bg-red-50 text-red-700 border-red-200',
            'SUSPENDED': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        const style = styles[status] || 'bg-gray-100 text-gray-700';
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>{status}</span>;
    };

    const getTierBadge = (tier) => {
        const styles = {
            'BRONZE': 'bg-orange-50 text-orange-700 border-orange-200',
            'SILVER': 'bg-slate-100 text-slate-700 border-slate-200',
            'GOLD': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'PLATINUM': 'bg-violet-50 text-violet-700 border-violet-200'
        };
        const style = styles[tier] || 'bg-gray-50 text-gray-600';
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>{tier || 'N/A'}</span>;
    };

    // Helper to render image source correctly
    const getProfileImage = (artisan) => {
        if (artisan.picture_url) {
            // Check if it's a full URL or relative path
            return artisan.picture_url.startsWith('http')
                ? artisan.picture_url
                : `${API_BASE_URL}${artisan.picture_url}`;
        }
        return null;
    };


    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Artisan Management</h1>
                    <p className="text-navy-500 text-sm mt-1">Manage, approve, and monitor service providers.</p>
                </div>
                <button 
                    onClick={() => navigate('/artisans/statistics')}
                    className="bg-white border border-navy-200 text-navy-700 px-4 py-2 rounded-lg hover:bg-navy-50 transition-colors flex items-center shadow-sm font-medium"
                >
                    <Briefcase className="w-4 h-4 mr-2" />
                    View Statistics
                </button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-navy-100">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-1.5">Search</label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-navy-50 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-4 h-4" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-1.5">Trade</label>
                        <select 
                            name="trade"
                            value={filters.trade}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2.5 bg-navy-50 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                            <option value="">All Trades</option>
                            <option value="PLUMBING">Plumbing</option>
                            <option value="ELECTRICAL">Electrical</option>
                            <option value="CARPENTRY">Carpentry</option>
                            <option value="PAINTING">Painting</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="GENERAL">General</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wider mb-1.5">Status</label>
                        <select 
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2.5 bg-navy-50 border border-navy-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="PENDING">Pending</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 flex justify-center items-center text-sm"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter Results
                        </button>
                    </div>
                </form>
            </div>

            {/* Main Table Content */}
            {loading ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-navy-200 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-navy-500">Loading artisans data...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={fetchArtisans} className="text-indigo-600 font-medium hover:underline">Try Again</button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-navy-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead>
                                <tr className="bg-navy-50/50 border-b border-navy-100">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-500 uppercase tracking-wider">Artisan Profile</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-500 uppercase tracking-wider">Trade & Tier</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-navy-500 uppercase tracking-wider">Performance</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-navy-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-navy-100">
                                {artisans.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-navy-400">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-navy-50 p-3 rounded-full mb-3">
                                                    <Search className="w-6 h-6 text-navy-300" />
                                                </div>
                                                <p>No artisans found matching your filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    artisans.map((artisan) => {
                                        const imageUrl = getProfileImage(artisan);
                                        return (
                                            <tr key={artisan.id} className="hover:bg-navy-50/50 transition-colors group">
                                                {/* Profile Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            {imageUrl ? (
                                                                <img 
                                                                    className="h-10 w-10 rounded-full object-cover border border-navy-200" 
                                                                    src={imageUrl} 
                                                                    alt={artisan.full_name} 
                                                                    onError={(e) => {
                                                                        e.target.onerror = null; 
                                                                        e.target.src = ''; // Fallback logic handled by parent div if src fails
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            {/* Fallback Avatar */}
                                                            <div 
                                                                className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200"
                                                                style={{ display: imageUrl ? 'none' : 'flex' }}
                                                            >
                                                                {artisan.full_name ? artisan.full_name.substring(0, 2).toUpperCase() : 'NA'}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-navy-900 group-hover:text-indigo-600 transition-colors">
                                                                {artisan.full_name}
                                                            </div>
                                                            <div className="text-xs text-navy-500 flex items-center mt-0.5">
                                                                {artisan.phone_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Trade & Tier Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="text-sm text-navy-700 font-medium flex items-center">
                                                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-navy-400" />
                                                            {artisan.trade || 'Unassigned'}
                                                        </span>
                                                        {getTierBadge(artisan.tier_level)}
                                                    </div>
                                                </td>

                                                {/* Status Column */}
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <span
                                                        className={`px-3 py-1 text-xs font-medium rounded-full
                                                        ${artisan.status
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {artisan.status ? 'Verified' : 'Pending'}
                                                    </span>

                                                    {!artisan.status && (
                                                        <button
                                                        onClick={() => handleSuspendArtisan(artisan.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Suspend User"
                                                        >
                                                        <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>

                                                {/* Performance Column */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center">
                                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1.5" />
                                                            <span className="text-sm font-bold text-navy-900">{artisan.rating ? Number(artisan.rating).toFixed(1) : '0.0'}</span>
                                                        </div>
                                                        <div className="h-4 w-px bg-navy-200"></div>
                                                        <div className="text-xs text-navy-600">
                                                            <span className="font-semibold text-navy-900">{artisan.jobs_completed || 0}</span> jobs
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <button
                                                            onClick={() => navigate(`/artisans/${artisan.id}`)}
                                                            className="p-1.5 text-navy-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="View Profile"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        
                                                        {artisan.verification_status === 'PENDING' ? (
                                                            <button
                                                                onClick={() => navigate(`/artisans/${artisan.id}/approve`)}
                                                                className="p-1.5 text-navy-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        ) : !artisan.is_identity_verified ? (
                                                            <button
                                                                onClick={() => handleLiftSuspension(artisan.id)}
                                                                className="p-1.5 text-navy-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                                title="Lift Suspension"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSuspendArtisan(artisan.id)}
                                                                className="p-1.5 text-navy-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Suspend User"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-6 py-4 border-t border-navy-100 bg-navy-50/30">
                            <span className="text-sm text-navy-500">
                                Page <span className="font-medium text-navy-900">{page}</span> of <span className="font-medium text-navy-900">{totalPages}</span>
                            </span>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`p-2 rounded-lg border ${page === 1 ? 'border-navy-100 text-navy-300 cursor-not-allowed' : 'border-navy-200 text-navy-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600'}`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`p-2 rounded-lg border ${page === totalPages ? 'border-navy-100 text-navy-300 cursor-not-allowed' : 'border-navy-200 text-navy-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600'}`}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArtisansPage;