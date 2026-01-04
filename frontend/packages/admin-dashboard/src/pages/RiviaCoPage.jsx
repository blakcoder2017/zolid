import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Users, TrendingUp, CheckCircle, AlertCircle, ArrowUpCircle } from 'lucide-react';

const RiviaCoPage = () => {
    const [stats, setStats] = useState(null);
    const [artisans, setArtisans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // stores artisan ID being processed

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/riviaco/stats');
            setStats(res.data.data.stats);
            setArtisans(res.data.data.artisans);
        } catch (error) {
            console.error("Failed to fetch Rivia stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (artisanId) => {
        if (!window.confirm("Enroll this artisan in the Free Plan?")) return;
        try {
            setActionLoading(artisanId);
            await api.post(`/riviaco/enroll/${artisanId}`);
            fetchData(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || "Enrollment failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpgrade = async (artisanId) => {
        if (!window.confirm("Upgrade this artisan to Standard Plan? This confirms they have met the contribution requirements.")) return;
        try {
            setActionLoading(artisanId);
            await api.post(`/riviaco/upgrade/${artisanId}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Upgrade failed");
        } finally {
            setActionLoading(null);
        }
    };

    const formatCurrency = (amount) => `GHS ${(amount / 100).toFixed(2)}`;

    if (loading) return <div className="p-8 text-center text-gray-500">Loading RiviaCo Data...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="text-teal-600" />
                    RiviaCo Insurance Manager
                </h1>
                <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded">
                    Channel: {stats?.channel}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Enrolled</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.enrolled_free + stats?.enrolled_standard}</p>
                        </div>
                        <Users className="text-blue-500" size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Standard Plan</p>
                            <p className="text-2xl font-bold text-teal-600">{stats?.enrolled_standard}</p>
                        </div>
                        <CheckCircle className="text-teal-500" size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pending Enrollment</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.pending_enrollment}</p>
                        </div>
                        <AlertCircle className="text-orange-500" size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Contributions</p>
                            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(stats?.total_pot_pesewas)}</p>
                        </div>
                        <TrendingUp className="text-indigo-500" size={20} />
                    </div>
                </div>
            </div>

            {/* Artisans List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-700">Artisan Enrollment & Contributions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Artisan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plan Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contribution (Goal: 500)</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {artisans.map((artisan) => {
                                const percentage = Math.min((artisan.contribution / 50000) * 100, 100);
                                return (
                                    <tr key={artisan.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{artisan.full_name}</div>
                                            <div className="text-xs text-gray-500">{artisan.phone_primary}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {artisan.riviaco_plan === 'STANDARD' ? (
                                                <span className="px-2 py-1 text-xs font-bold text-teal-800 bg-teal-100 rounded-full">STANDARD</span>
                                            ) : artisan.riviaco_plan === 'FREE' ? (
                                                <span className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">FREE</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-200 rounded-full">NOT ENROLLED</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{formatCurrency(artisan.contribution)}</span>
                                                <span className="text-gray-400">500.00</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!artisan.riviaco_plan && (
                                                    <button 
                                                        onClick={() => handleEnroll(artisan.id)}
                                                        disabled={actionLoading === artisan.id}
                                                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                                                    >
                                                        {actionLoading === artisan.id ? '...' : 'Enroll Free'}
                                                    </button>
                                                )}
                                                
                                                {artisan.riviaco_plan !== 'STANDARD' && percentage >= 100 && (
                                                    <button 
                                                        onClick={() => handleUpgrade(artisan.id)}
                                                        disabled={actionLoading === artisan.id}
                                                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded shadow-sm"
                                                    >
                                                        <ArrowUpCircle size={12} />
                                                        {actionLoading === artisan.id ? '...' : 'Upgrade Now'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RiviaCoPage;