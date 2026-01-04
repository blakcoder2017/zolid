import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, LineChart, PieChart, Pie, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Clock, PieChart as PieChartIcon } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, color, isCritical }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-navy-200 ${isCritical ? 'border-red-500' : ''}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-navy-500 font-medium">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${isCritical ? 'text-red-600' : 'text-navy-900'}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                {Icon && <Icon className="w-6 h-6 text-white" />}
            </div>
        </div>
        <p className="text-xs text-navy-400 mt-4">{subtext}</p>
    </div>
);

const MarketplaceOperationsPage = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/marketplace-operations');
                setMetrics(res.data.data);
            } catch (error) {
                console.error("Failed to fetch marketplace operations data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    // Mock data for charts
    const funnelData = [
        { name: 'Posted', value: 1000 },
        { name: 'Quoted', value: 800 },
        { name: 'Negotiated', value: 600 },
        { name: 'Started', value: 500 },
        { name: 'Completed', value: 400 },
    ];

    const timeToHireData = [
        { name: 'Jan', hours: 24 },
        { name: 'Feb', hours: 22 },
        { name: 'Mar', hours: 20 },
        { name: 'Apr', hours: 18 },
        { name: 'May', hours: 16 },
        { name: 'Jun', hours: 14 },
    ];

    const timeToQuoteData = [
        { name: 'Jan', hours: 2 },
        { name: 'Feb', hours: 1.8 },
        { name: 'Mar', hours: 1.5 },
        { name: 'Apr', hours: 1.2 },
        { name: 'May', hours: 1.0 },
        { name: 'Jun', hours: 0.8 },
    ];

    const demandByTradeData = [
        { name: 'Plumbing', value: 40 },
        { name: 'Electrical', value: 30 },
        { name: 'Carpentry', value: 20 },
        { name: 'Painting', value: 10 },
    ];

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    if (loading) return <div className="p-10 text-center">Loading marketplace operations...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-navy-900">Marketplace Operations</h1>

            {/* Liquidity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Fill Rate"
                    value={`${metrics?.fillRate || 85}%`}
                    subtext={`Target: >80%`}
                    icon={TrendingUp}
                    color="bg-indigo-500"
                    isCritical={metrics?.fillRate < 80}
                />
                <StatCard
                    title="Zero-Quote Jobs"
                    value={metrics?.zeroQuoteJobs || 15}
                    subtext="Critical Alert: Jobs with 0 quotes after 24 hours"
                    icon={AlertTriangle}
                    color="bg-red-500"
                    isCritical={true}
                />
                <StatCard
                    title="Bid-to-Job Ratio"
                    value={metrics?.bidToJobRatio || 4.2}
                    subtext="Healthy range: 3-5"
                    icon={CheckCircle}
                    color="bg-green-500"
                    isCritical={metrics?.bidToJobRatio < 3 || metrics?.bidToJobRatio > 5}
                />
            </div>

            {/* Gig Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Conversion */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Funnel Conversion</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={funnelData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Time Metrics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Time Metrics</h3>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-navy-600 mb-2">Avg Time-to-Hire</h4>
                            <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={timeToHireData}>
                                    <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-navy-500 mt-2">Time from Job Post to Artisan Selected</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-navy-600 mb-2">Avg Time-to-Quote</h4>
                            <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={timeToQuoteData}>
                                    <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                            <p className="text-xs text-navy-500 mt-2">Time from Job Post to First Quote Received</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Demand by Trade */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-navy-800">Demand by Trade</h3>
                        <PieChartIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={demandByTradeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {demandByTradeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Supply Gaps */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Supply Gaps</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                                <p className="font-medium text-navy-900">Plumbing</p>
                                <p className="text-sm text-navy-500">High demand, low supply</p>
                            </div>
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                                <p className="font-medium text-navy-900">Electrical</p>
                                <p className="text-sm text-navy-500">Moderate demand, low supply</p>
                            </div>
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div>
                                <p className="font-medium text-navy-900">Carpentry</p>
                                <p className="text-sm text-navy-500">Balanced supply and demand</p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceOperationsPage;