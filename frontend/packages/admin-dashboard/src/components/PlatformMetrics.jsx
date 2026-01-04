import { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShieldCheck, PiggyBank, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const MetricCard = ({ title, value, subtext, icon: Icon, color, status }) => {
    const statusColors = {
        HEALTHY: 'bg-green-100 text-green-800',
        WARNING: 'bg-yellow-100 text-yellow-800',
        CRITICAL: 'bg-red-100 text-red-800'
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-navy-500 font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-navy-900 mt-1">{value}</h3>
                    {status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                            {status}
                        </span>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
            </div>
            <p className="text-xs text-navy-400 mt-4">{subtext}</p>
        </div>
    );
};

const PlatformMetrics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchPlatformMetrics = async () => {
            try {
                const res = await api.get('/platform-metrics');
                setMetrics(res.data.data);
            } catch (err) {
                console.error("Failed to fetch platform metrics:", err);
                setError("Failed to load platform metrics");
            } finally {
                setLoading(false);
            }
        };
        fetchPlatformMetrics();
    }, [refreshKey]);

    // Auto-refresh every 30 seconds to ensure data is up to date
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-center">Loading platform metrics...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
    if (!metrics) return <div className="p-10 text-center">No platform metrics available</div>;

    const { takeRate, escrowHealth } = metrics;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-900">Platform Financial Health</h2>
                <button
                    onClick={() => setRefreshKey(prev => prev + 1)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Take-Rate */}
                <MetricCard
                    title="Platform Take-Rate"
                    value={`${takeRate.current_take_rate_percent}%`}
                    subtext={`Target: ${takeRate.target_range} | ${takeRate.transaction_count} transactions`}
                    icon={ShieldCheck}
                    color="bg-indigo-500"
                />
                
                {/* Escrow Pool Health */}
                <MetricCard
                    title="Escrow Pool Health"
                    value={`GHS ${(escrowHealth.escrow_balance_pesewas / 100).toLocaleString()}`}
                    subtext={`${escrowHealth.active_jobs_count} active jobs | Coverage: ${escrowHealth.coverage_ratio_percent}%`}
                    icon={PiggyBank}
                    color={escrowHealth.health_status === 'HEALTHY' ? 'bg-green-500' : escrowHealth.health_status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'}
                    status={escrowHealth.health_status}
                />
            </div>
            
            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Take-Rate Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Total GMV:</span>
                            <span className="text-sm font-medium text-navy-900">GHS {(takeRate.total_gmv_pesewas / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Total Revenue:</span>
                            <span className="text-sm font-medium text-navy-900">GHS {(takeRate.total_revenue_pesewas / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Net Revenue:</span>
                            <span className="text-sm font-medium text-navy-900">GHS {(takeRate.net_revenue_pesewas / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Average Take-Rate:</span>
                            <span className="text-sm font-medium text-navy-900">{takeRate.average_take_rate_percent}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Target Range:</span>
                            <span className="text-sm font-medium text-green-600">{takeRate.target_range}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Escrow Health Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Active Jobs Value:</span>
                            <span className="text-sm font-medium text-navy-900">GHS {(escrowHealth.total_active_jobs_value_pesewas / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Coverage Ratio:</span>
                            <span className="text-sm font-medium text-navy-900">{escrowHealth.coverage_ratio_percent}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Status:</span>
                            <span className={`text-sm font-medium ${escrowHealth.health_status === 'HEALTHY' ? 'text-green-600' : escrowHealth.health_status === 'WARNING' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {escrowHealth.health_status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-navy-500">Active Jobs:</span>
                            <span className="text-sm font-medium text-navy-900">{escrowHealth.active_jobs_count}</span>
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">{escrowHealth.status_description}</p>
                </div>
            </div>
        </div>
    );
};

export default PlatformMetrics;