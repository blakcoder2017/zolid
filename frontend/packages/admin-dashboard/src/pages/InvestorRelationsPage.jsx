import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    TrendingUp, TrendingDown, DollarSign, Users, 
    Activity, Download, Calendar, AlertCircle, PieChart 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const InvestorRelationsPage = () => {
    // State
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRangeLabel, setDateRangeLabel] = useState('');
    
    // Filter State
    const [timeRange, setTimeRange] = useState('month'); 
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Data Fetching ---
    const fetchInvestorMetrics = async (overrideRange = null) => {
        try {
            setLoading(true);
            setError(null);

            const rangeToUse = overrideRange || timeRange;
            const params = {};

            if (rangeToUse === 'custom') {
                if (!customStart || !customEnd) {
                    setLoading(false);
                    return; 
                }
                params.timeRange = 'custom';
                params.startDate = customStart;
                params.endDate = customEnd;
                setDateRangeLabel(`${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}`);
            } else {
                params.timeRange = rangeToUse;
                const labels = { month: 'Last 30 Days', quarter: 'Last 90 Days', year: 'Last 365 Days' };
                setDateRangeLabel(labels[rangeToUse] || 'Custom Range');
            }

            const response = await api.get('/investor-metrics', { params });
            setMetrics(response.data.data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError('Failed to load investor metrics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Filter Change
    useEffect(() => {
        if (timeRange !== 'custom') {
            fetchInvestorMetrics();
        }
    }, [timeRange]);

    const handleApplyCustomDate = () => {
        if (customStart && customEnd) {
            fetchInvestorMetrics('custom');
        } else {
            alert("Please select both start and end dates");
        }
    };

    // --- PDF Export ---
    const handleExportPDF = () => {
        if (!metrics) return;
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();

        doc.setFontSize(20);
        doc.text("ZOLID - Investor Relations Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated: ${dateStr} | Period: ${dateRangeLabel}`, 14, 30);

        // KPI Table
        const kpiData = [
            ['Metric', 'Current Value', 'Growth', 'Previous Value'],
            ['GMV', `GHS ${metrics.gmv.current.toLocaleString()}`, `${metrics.gmv.growthRate.toFixed(1)}%`, `GHS ${metrics.gmv.previous.toLocaleString()}`],
            ['Revenue', `GHS ${metrics.revenue.current.toLocaleString()}`, `${metrics.revenue.growthRate.toFixed(1)}%`, `GHS ${metrics.revenue.previous.toLocaleString()}`],
            ['Active Artisans', metrics.activeArtisans.current, `${metrics.activeArtisans.growthRate.toFixed(1)}%`, metrics.activeArtisans.previous],
        ];

        doc.autoTable({
            startY: 40,
            head: [kpiData[0]],
            body: kpiData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`ZOLID_Report_${dateStr}.pdf`);
    };

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val / 100);
    const formatNumber = (num) => new Intl.NumberFormat('en-GH').format(num);
    const hasData = metrics && metrics.gmv.current > 0;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Investor Relations</h1>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>Showing data for: <span className="font-semibold text-gray-700">{dateRangeLabel}</span></span>
                    </div>
                </div>
                
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <div className="flex bg-white rounded-lg shadow-sm">
                        {['month', 'quarter', 'year', 'custom'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium first:rounded-l-lg last:rounded-r-lg border-r last:border-r-0 border-gray-100 transition-colors ${
                                    timeRange === range 
                                    ? 'bg-indigo-50 text-indigo-700' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {range === 'month' ? '30D' : range === 'quarter' ? '90D' : range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2 px-2">
                            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="text-xs border-gray-300 rounded py-1" />
                            <span className="text-gray-400">-</span>
                            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="text-xs border-gray-300 rounded py-1" />
                            <button onClick={handleApplyCustomDate} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700">Apply</button>
                        </div>
                    )}

                    <div className="w-px h-6 bg-gray-300 mx-1"></div>

                    <button 
                        onClick={handleExportPDF} 
                        disabled={!metrics || loading}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 disabled:opacity-30" 
                        title="Download PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && <SkeletonLoader />}

            {/* Error State */}
            {!loading && error && (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center text-red-600">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    {error}
                </div>
            )}

            {/* Zero Data Banner */}
            {!loading && metrics && !hasData && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center text-yellow-800 text-sm">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>No transaction data found for the selected period ({dateRangeLabel}). Metrics will appear as zero.</span>
                </div>
            )}

            {/* Main Content */}
            {!loading && metrics && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="GMV" value={formatCurrency(metrics.gmv.current)} growth={metrics.gmv.growthRate} previous={formatCurrency(metrics.gmv.previous)} icon={Activity} color="blue" />
                        <KPICard title="Net Revenue" value={formatCurrency(metrics.revenue.current)} growth={metrics.revenue.growthRate} previous={formatCurrency(metrics.revenue.previous)} icon={DollarSign} color="green" />
                        <KPICard title="Active Artisans" value={formatNumber(metrics.activeArtisans.current)} growth={metrics.activeArtisans.growthRate} previous={metrics.activeArtisans.previous} icon={Users} color="orange" />
                        <KPICard title="Active Clients" value={formatNumber(metrics.activeClients.current)} growth={metrics.activeClients.growthRate} previous={metrics.activeClients.previous} icon={Users} color="purple" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Unit Economics */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-sm uppercase font-bold text-gray-500 mb-4 tracking-wider">Platform Health</h3>
                            <div className="space-y-5">
                                <MetricRow label="Fill Rate" value={`${metrics.platformEfficiency}%`} subtext="Jobs successfully matched" />
                                <MetricRow label="Retention" value={`${metrics.customerRetention}%`} subtext="Repeat clients (60 days)" />
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase">Burn Rate (Est)</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.burnRate.current)}</p>
                                        </div>
                                        <div className={`text-sm font-medium ${metrics.burnRate.growthRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {metrics.burnRate.growthRate > 0 ? '+' : ''}{metrics.burnRate.growthRate.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                            <h3 className="text-sm uppercase font-bold text-gray-500 mb-6 tracking-wider">Top Categories by Volume</h3>
                            <div className="flex-1 min-h-[250px] relative">
                                {metrics.topGrowingCategories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.topGrowingCategories} layout="vertical" margin={{ left: 40, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={{fill: '#F3F4F6'}}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            />
                                            <Bar dataKey="jobCount" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChartState />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Regional Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Regional Growth</h3>
                            <span className="text-xs bg-white px-2 py-1 rounded border text-gray-500">Top 5 Cities</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-white text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 font-normal">City</th>
                                        <th className="px-6 py-3 font-normal">Region</th>
                                        <th className="px-6 py-3 font-normal text-right">Volume</th>
                                        <th className="px-6 py-3 font-normal text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {metrics.topGrowingCities.length > 0 ? (
                                        metrics.topGrowingCities.map((city, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{city.name}</td>
                                                <td className="px-6 py-4 text-gray-500">{city.region}</td>
                                                <td className="px-6 py-4 text-right font-bold text-indigo-600">{city.current_jobs}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        --
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                                                    <p>No regional activity recorded for this period.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Sub-Components ---

const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="col-span-2 h-64 bg-gray-200 rounded-xl"></div>
        </div>
    </div>
);

const EmptyChartState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 m-4">
        <PieChart className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm font-medium">No category data available</p>
        <p className="text-xs">Try selecting a different date range</p>
    </div>
);

const KPICard = ({ title, value, growth, previous, icon: Icon, color }) => {
    const isPositive = growth >= 0;
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600"
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                <span className={`flex items-center font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(growth).toFixed(1)}%
                </span>
                <span className="text-gray-400 ml-2">vs {previous} prev.</span>
            </div>
        </div>
    );
};

const MetricRow = ({ label, value, subtext }) => (
    <div className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-3 last:pb-0">
        <div>
            <span className="block text-sm text-gray-600">{label}</span>
            {subtext && <span className="block text-xs text-gray-400 mt-0.5">{subtext}</span>}
        </div>
        <span className="font-bold text-gray-900">{value}</span>
    </div>
);

export default InvestorRelationsPage;