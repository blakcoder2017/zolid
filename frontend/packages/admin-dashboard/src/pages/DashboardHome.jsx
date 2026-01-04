import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
    TrendingUp, Users, DollarSign, Briefcase, 
    Activity, ArrowUpRight, BarChart3 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PlatformMetrics from '../components/PlatformMetrics';

// Reusable Stat Card Component
const StatCard = ({ title, value, subtext, icon: Icon, color, subValue }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200 flex flex-col justify-between h-full">
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
                {subValue && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <ArrowUpRight size={12} /> {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mt-1">{value}</h3>
            <p className="text-sm text-navy-500 font-medium mt-1">{title}</p>
        </div>
        <p className="text-xs text-navy-400 mt-4 pt-4 border-t border-navy-50">{subtext}</p>
    </div>
);

const DashboardHome = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Calls the updated /dashboard endpoint that returns { metrics, financials, systemHealth }
                const res = await api.get('/dashboard'); 
                setData(res.data.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    // Placeholder for 7-day trend (Connect to real daily_revenue endpoint later)
    const chartData = [
        { name: 'Mon', revenue: 400 },
        { name: 'Tue', revenue: 300 },
        { name: 'Wed', revenue: 550 },
        { name: 'Thu', revenue: 450 },
        { name: 'Fri', revenue: 600 },
        { name: 'Sat', revenue: 800 },
        { name: 'Sun', revenue: 750 },
    ];

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
            minimumFractionDigits: 2
        }).format(val / 100);
    };

    if (loading) return <div className="p-10 text-center text-navy-500">Loading dashboard...</div>;

    // Safely extract data or use defaults
    const metrics = data?.metrics || {};
    const finance = data?.financials || { pure_revenue: 0, mrr: 0, arr: 0 };

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            
            {/* 1. Header */}
            <div>
                <h1 className="text-2xl font-bold text-navy-900">Executive Overview</h1>
                <p className="text-gray-500">Real-time financial and operational performance.</p>
            </div>
            
            {/* 2. Financial Performance Row (MRR, ARR, Net Revenue) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Pure Revenue (Net)" 
                    value={formatCurrency(finance.pure_revenue)} 
                    subtext="Total platform commissions collected (All Time)"
                    icon={DollarSign}
                    color="text-green-600"
                />
                <StatCard 
                    title="MRR (Monthly Run Rate)" 
                    value={formatCurrency(finance.mrr)} 
                    subtext="Estimated based on last 30 days revenue"
                    icon={Activity}
                    color="text-blue-600"
                />
                <StatCard 
                    title="ARR (Annual Run Rate)" 
                    value={formatCurrency(finance.arr)} 
                    subtext="Projected annual revenue (MRR x 12)"
                    icon={TrendingUp}
                    color="text-indigo-600"
                />
            </div>

            {/* 3. Operational Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total GMV" 
                    value={formatCurrency(metrics.gmv_pesewas || 0)} 
                    subtext="Gross Merchandise Value processed"
                    icon={BarChart3}
                    color="text-purple-600"
                />
                <StatCard 
                    title="Active Jobs" 
                    value={metrics.active_jobs || 0} 
                    subtext="Jobs currently in progress"
                    icon={Briefcase}
                    color="text-violet-600"
                />
                <StatCard 
                    title="Active Artisans" 
                    value={metrics.active_artisans_30d || 0} 
                    subtext="Artisans active in last 30 days"
                    icon={Users}
                    color="text-orange-600"
                />
                <StatCard 
                    title="Completed Jobs" 
                    value={metrics.completed_jobs || 0} 
                    subtext="Total jobs successfully completed"
                    icon={Briefcase}
                    color="text-teal-600"
                />
            </div>

            {/* 4. Platform Metrics Component (Existing Logic) */}
            <div className="mt-8">
                <PlatformMetrics />
            </div>

            {/* 5. Unit Economics (Static for MVP, can be calculated dynamically later) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-2">Average Order Value (AOV)</h3>
                    <p className="text-3xl font-bold text-navy-900">GHS 250</p>
                    <p className="text-sm text-navy-500 mt-1">Average cost of a gig on ZOLID</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-2">Lifetime Value (LTV)</h3>
                    <p className="text-3xl font-bold text-navy-900">GHS 1,200</p>
                    <p className="text-sm text-navy-500 mt-1">Average total revenue generated by a client over 12 months</p>
                </div>
            </div>

            {/* 6. Revenue Trend Chart (Visual Placeholder) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200 h-96">
                <h3 className="text-lg font-bold text-navy-800 mb-4">Revenue Trend (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardHome;