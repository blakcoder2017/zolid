import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    ArrowLeft, Users, TrendingUp, DollarSign, Download, RefreshCw,
    Repeat, MapPin, PieChart as PieChartIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const ClientStatisticsPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/clients/statistics');
            setStats(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    // Helper
    const formatCurrency = (val) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val / 100);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Client Analytics...</div>;

    // Prepare Chart Data (Reverse to show oldest to newest)
    const chartData = stats?.growth ? [...stats.growth].reverse().map(item => ({
        name: new Date(item.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        count: parseInt(item.count)
    })) : [];

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <button onClick={() => navigate('/dashboard/clients')} className="flex items-center text-gray-500 hover:text-indigo-600 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Client Analytics</h1>
                </div>
                <button onClick={fetchStats} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.kpis?.total}</h3>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Clients (30d)</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.kpis?.active}</h3>
                        <p className="text-xs text-green-600 mt-1">
                            {((stats?.kpis?.active / (stats?.kpis?.total || 1)) * 100).toFixed(1)}% Engagement Rate
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">New Client Signups (Weekly)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
 
                {/* Top Spenders Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Spenders</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2 text-right">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats?.topSpenders?.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{client.full_name}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                                            {formatCurrency(client.total_spent)}
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.topSpenders || stats.topSpenders.length === 0) && (
                                    <tr><td colSpan="2" className="px-4 py-8 text-center text-gray-400">No spending data yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Client Insights Sections */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 pt-6 border-t border-gray-200">Client Insights</h2>

                {/* Retention */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Retention Metrics</h3>
                            <Repeat className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Repeat Purchase Rate</span>
                                <span className="text-sm font-bold text-green-600">45%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">60-Day Retention</span>
                                <span className="text-sm font-bold text-green-600">35%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">90-Day Retention</span>
                                <span className="text-sm font-bold text-yellow-600">22%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Cohort Analysis</h3>
                            <PieChartIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { name: 'Month 1', retention: 100 },
                                    { name: 'Month 2', retention: 75 },
                                    { name: 'Month 3', retention: 60 },
                                    { name: 'Month 4', retention: 45 },
                                    { name: 'Month 5', retention: 35 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                                    <YAxis tick={{fontSize: 12}} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="retention" stroke="#4F46E5" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Spending Habits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Spending Tiers</h3>
                            <DollarSign className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Whales ({'>'}GHS2k)</span>
                                <span className="text-sm font-bold text-gray-900">10%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Mid-Tier (GHS500-2k)</span>
                                <span className="text-sm font-bold text-gray-900">35%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Minnows ({'<'}GHS500)</span>
                                <span className="text-sm font-bold text-gray-900">55%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Spending Distribution</h3>
                            <PieChartIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Whales', value: 10 },
                                            { name: 'Mid-Tier', value: 35 },
                                            { name: 'Minnows', value: 55 }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        dataKey="value"
                                        label
                                    >
                                        {[
                                            { name: 'Whales', value: 10 },
                                            { name: 'Mid-Tier', value: 35 },
                                            { name: 'Minnows', value: 55 }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B'][index % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Geographic Heatmap */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Geographic Distribution</h3>
                        <MapPin className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Accra</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">65%</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Kumasi</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">20%</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Takoradi</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">10%</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600">Other</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">5%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientStatisticsPage;