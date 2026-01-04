import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { TrendingUp, AlertTriangle, Shield, Activity, DollarSign } from 'lucide-react';

const CreditRiskPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/analytics/credit-risk');
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to fetch risk metrics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Risk Models...</div>;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Credit & Risk Metrics</h1>
                    <p className="text-gray-500">Predictive analytics for lending and default prevention</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Live Model</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Avg Predictability (IPS)</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {Math.round(data?.income_predictability.reduce((acc, curr) => acc + parseFloat(curr.ips_score), 0) / (data?.income_predictability.length || 1))}%
                            </p>
                        </div>
                        <Activity className="text-indigo-400" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Portfolio Risk (DPI)</p>
                            <p className="text-2xl font-bold text-red-600">
                                {Math.round(data?.default_probability.reduce((acc, curr) => acc + parseFloat(curr.dpi_score), 0) / (data?.default_probability.length || 1))}%
                            </p>
                        </div>
                        <AlertTriangle className="text-red-400" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Trust Index (Avg)</p>
                            <p className="text-2xl font-bold text-green-600">4.2/5.0</p>
                        </div>
                        <Shield className="text-green-400" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Avg Shock Capacity</p>
                            <p className="text-2xl font-bold text-blue-600">2.4x</p>
                        </div>
                        <DollarSign className="text-blue-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Income Predictability Score (IPS) */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-700">Income Predictability Score (IPS)</h3>
                        <p className="text-xs text-gray-500">Stability of earnings over time (0-100)</p>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Artisan</th>
                                    <th className="px-6 py-3">Avg Income</th>
                                    <th className="px-6 py-3 text-right">IPS Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.income_predictability.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.full_name}</td>
                                        <td className="px-6 py-3">₵{Math.round(item.income_avg / 100).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.ips_score > 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {Math.round(item.ips_score)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Default Probability Index (DPI) */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-700">Default Probability Index (DPI)</h3>
                        <p className="text-xs text-gray-500">Likelihood of job failure or non-payment</p>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">Artisan</th>
                                    <th className="px-6 py-3">Total Jobs</th>
                                    <th className="px-6 py-3 text-right">Risk %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data?.default_probability.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.full_name}</td>
                                        <td className="px-6 py-3">{item.total_jobs}</td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.dpi_score < 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.dpi_score}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditRiskPage;