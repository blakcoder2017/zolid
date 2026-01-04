import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Database, TrendingUp, Map, BarChart2 } from 'lucide-react';

const DataProductsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/analytics/data-products');
                setData(res.data.data);
            } catch (err) {
                console.error("Failed to fetch data products", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return <div className="p-8 text-center">Generating Data Feeds...</div>;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sellable Data Products</h1>
                    <p className="text-gray-500">Monetizable APIs for Lenders, Insurers, and NGOs</p>
                </div>
            </div>

            {/* PRODUCT 1: Artisan Credit Signal API */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">1. Artisan Credit Signal (ZTI)</h2>
                        <p className="text-sm text-gray-500">The "FICO Score" of informal labor. Distribution of ZOLID Trust Index.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {Object.entries(data?.zti_distribution || {}).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase">{key}</p>
                            <p className="text-3xl font-bold text-indigo-700 mt-2">{value}</p>
                            <p className="text-xs text-gray-400 mt-1">Artisans</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-xs text-gray-600 truncate">
                    GET /api/v1/partners/credit-score?artisan_id=...
                </div>
            </div>

            {/* PRODUCT 2: Labor Risk Feed */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">2. Labor Risk Feed (Insurers)</h2>
                        <p className="text-sm text-gray-500">Trade-level failure rates and warranty triggers.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">Trade Category</th>
                                <th className="px-4 py-2 text-right">Job Volume</th>
                                <th className="px-4 py-2 text-right">Dispute Rate</th>
                                <th className="px-4 py-2">Risk Tier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.labor_risk_feed.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.primary_trade}</td>
                                    <td className="px-4 py-3 text-right">{item.total_jobs}</td>
                                    <td className="px-4 py-3 text-right text-red-600 font-bold">{item.risk_rate}%</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            parseFloat(item.risk_rate) < 2 ? 'bg-green-100 text-green-800' : 
                                            parseFloat(item.risk_rate) < 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {parseFloat(item.risk_rate) < 2 ? 'LOW' : parseFloat(item.risk_rate) < 5 ? 'MEDIUM' : 'HIGH'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PRODUCT 3: Market Intelligence */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Map size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">3. Informal Labor Market Intel</h2>
                        <p className="text-sm text-gray-500">Regional supply/demand gaps and income bands for NGOs/Govt.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-2">Region</th>
                                <th className="px-4 py-2">Trade</th>
                                <th className="px-4 py-2 text-right">Supply (Artisans)</th>
                                <th className="px-4 py-2 text-right">Demand (Jobs)</th>
                                <th className="px-4 py-2 text-right">Avg Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data?.market_intelligence.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.region}</td>
                                    <td className="px-4 py-3">{item.primary_trade}</td>
                                    <td className="px-4 py-3 text-right">{item.artisan_supply}</td>
                                    <td className="px-4 py-3 text-right">{item.job_demand}</td>
                                    <td className="px-4 py-3 text-right">₵{item.avg_job_value_ghs}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default DataProductsPage;