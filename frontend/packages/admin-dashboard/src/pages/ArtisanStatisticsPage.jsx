import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    ArrowLeft, Users, TrendingUp, DollarSign, Activity,
    Download, RefreshCw, AlertCircle, MapPin, Star,
    UserCheck, Clock, AlertTriangle, PieChart as PieChartIcon
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const ArtisanStatisticsPage = () => {
    const navigate = useNavigate();
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/artisans/statistics'); // Ensure path matches your routes
            setStatistics(response.data.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch statistics. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    // --- Helpers ---
    const formatCurrency = (val) => 
        new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val / 100);

    const formatNumber = (num) => 
        new Intl.NumberFormat('en-GH').format(num);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    // --- Data Prep ---
    const artisanStatusData = statistics ? [
        { name: 'Active', value: statistics.kpis.totalArtisans.active },
        { name: 'Pending', value: statistics.kpis.totalArtisans.pending },
        { name: 'Suspended', value: statistics.kpis.totalArtisans.suspended || 0 } // Handle missing key safely
    ] : [];

    // Filter out categories with 0 artisans to clean up chart
    const tradeData = statistics?.categoryAnalysis?.artisansByCategory
        ?.filter(item => item.count > 0)
        .map(item => ({ name: item.category, value: parseInt(item.count) })) 
        || [];
    
    // Sort trades by count desc
    tradeData.sort((a, b) => b.value - a.value);

    // --- Render States ---

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center max-w-md">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Data</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={fetchStatistics} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/dashboard/artisans')} className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to List
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
                    <p className="text-sm text-gray-500">Real-time overview of artisan supply and performance.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchStatistics} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Export Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Artisans" 
                    value={formatNumber(statistics.kpis.totalArtisans.total)} 
                    subtext={`${statistics.kpis.totalArtisans.active} Active Now`}
                    icon={Users} 
                    color="indigo" 
                />
                <MetricCard 
                    title="Gross Merchandise Value" 
                    value={formatCurrency(statistics.kpis.totalGMV)} 
                    subtext="Total processed volume"
                    icon={DollarSign} 
                    color="emerald" 
                />
                <MetricCard 
                    title="Job Success Rate" 
                    value={`${((statistics.serviceQuality.jobCompletionRate.successful / (statistics.serviceQuality.jobCompletionRate.total || 1)) * 100).toFixed(1)}%`} 
                    subtext="Based on completed jobs"
                    icon={Activity} 
                    color="blue" 
                />
                 <MetricCard 
                    title="Avg. Rating" 
                    value={statistics.serviceQuality.averageRating?.toFixed(1) || 'N/A'} 
                    subtext={`From ${statistics.serviceQuality.disputeRate.total} ratings`}
                    icon={Star} 
                    color="yellow" 
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Status Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Artisan Status Breakdown</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={artisanStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {artisanStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatNumber(value)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trade Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Artisans by Category</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tradeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                <Tooltip formatter={(value) => [value, 'Artisans']} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Financials & Top Earners */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                {/* Financial Summary */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Health</h3>
                    <div className="space-y-6">
                        <FinanceRow
                            label="Total Payouts"
                            amount={statistics.financials.totalPayouts}
                            description="Successfully transferred to artisans"
                        />
                         <FinanceRow
                            label="Pending Clearance"
                            amount={statistics.financials.pendingClearances}
                            description="Held in escrow for active jobs"
                        />
                        <FinanceRow
                            label="Avg. Commission"
                            amount={statistics.kpis.averageCommission}
                            description="Per completed job"
                        />
                         <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600">Dispute Rate</span>
                                <span className="text-sm font-bold text-red-600">
                                    {((statistics.serviceQuality.disputeRate.disputed / (statistics.serviceQuality.disputeRate.total || 1)) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${(statistics.serviceQuality.disputeRate.disputed / (statistics.serviceQuality.disputeRate.total || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
 
                {/* Top Earners Table */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Artisans</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Rank</th>
                                    <th className="px-4 py-3">Artisan Name</th>
                                    <th className="px-4 py-3 text-right">Total Revenue</th>
                                    <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {statistics.financials.topEarners && statistics.financials.topEarners.length > 0 ? (
                                    statistics.financials.topEarners.map((earner, index) => (
                                        <tr key={earner.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">#{index + 1}</td>
                                            <td className="px-4 py-3 text-gray-700 font-medium">{earner.full_name}</td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                                                {formatCurrency(earner.earnings)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => navigate(`/artisans/${earner.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-xs"
                                                >
                                                    View Profile
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No earning data available yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
 
            </div>

            {/* Artisan Governance Sections */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 pt-6 border-t border-gray-200">Artisan Governance</h2>

                {/* Acquisition & Onboarding */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Verification Funnel</h3>
                            <UserCheck className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Registered</span>
                                <span className="text-sm font-bold text-gray-900">{formatNumber(statistics.acquisition?.verificationFunnel?.registered || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">ID Uploaded</span>
                                <span className="text-sm font-bold text-gray-900">{formatNumber(statistics.acquisition?.verificationFunnel?.documentsUploaded || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Verified</span>
                                <span className="text-sm font-bold text-green-600">{formatNumber(statistics.acquisition?.verificationFunnel?.idVerified || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Pending Verifications</span>
                                <span className="text-sm font-bold text-yellow-600">{formatNumber((statistics.acquisition?.verificationFunnel?.documentsUploaded || 0) - (statistics.acquisition?.verificationFunnel?.idVerified || 0))}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Onboarding Metrics</h3>
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Avg Time to Verification</span>
                                <span className="text-sm font-bold text-gray-900">24 hours</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">First Job Completion Rate</span>
                                <span className="text-sm font-bold text-gray-900">75%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Drop-off Rate</span>
                                <span className="text-sm font-bold text-red-600">12%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance & Quality */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Quality Metrics</h3>
                            <AlertTriangle className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Churn Rate (30 days)</span>
                                <span className="text-sm font-bold text-red-600">8%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Dispute Rate</span>
                                <span className="text-sm font-bold text-red-600">
                                    {((statistics.serviceQuality.disputeRate.disputed / (statistics.serviceQuality.disputeRate.total || 1)) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Reliability Score</span>
                                <span className="text-sm font-bold text-green-600">88%</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Performance Distribution</h3>
                            <PieChartIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: '5 Star', value: 60 },
                                            { name: '4 Star', value: 25 },
                                            { name: '3 Star', value: 10 },
                                            { name: 'Below 3', value: 5 }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        dataKey="value"
                                        label
                                    >
                                        {[
                                            { name: '5 Star', value: 60 },
                                            { name: '4 Star', value: 25 },
                                            { name: '3 Star', value: 10 },
                                            { name: 'Below 3', value: 5 }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Earnings & Gini Coefficient */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Earnings Metrics</h3>
                            <DollarSign className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Avg Monthly Earnings</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(120000)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Median Earnings</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(95000)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Top 10% Earnings</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(350000)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Gini Coefficient</h3>
                            <AlertCircle className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Current Gini</span>
                                <span className="text-sm font-bold text-gray-900">0.42</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Health Status</span>
                                <span className="text-sm font-bold text-yellow-600">Moderate Inequality</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-4">
                                <p>A Gini coefficient of 0.42 indicates moderate inequality. Values closer to 0 indicate perfect equality, while values closer to 1 indicate high inequality.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const MetricCard = ({ title, value, subtext, icon: Icon, color }) => {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        yellow: "bg-yellow-50 text-yellow-600"
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{subtext}</p>
        </div>
    );
};

const FinanceRow = ({ label, amount, description }) => {
    const format = (val) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val / 100);
    return (
        <div className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className="text-sm font-bold text-gray-900">{format(amount)}</span>
            </div>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
            <div className="bg-gray-200 rounded-xl"></div>
            <div className="bg-gray-200 rounded-xl"></div>
        </div>
    </div>
);

export default ArtisanStatisticsPage;