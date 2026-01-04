import { useEffect, useState } from 'react';
import api from '../api/axios';
import { DollarSign, AlertTriangle, CheckCircle, BarChart2, Clock, Wallet, RefreshCw } from 'lucide-react';

const FinancialLedgerPage = () => {
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLedgerData = async () => {
            try {
                const res = await api.get('/finance/ledger');
                setLedgerData(res.data.data);
            } catch (err) {
                console.error('Failed to fetch ledger data:', err);
                setError('Failed to fetch ledger data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchLedgerData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading financial ledger...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'HEALTHY': return 'bg-green-100 text-green-800';
            case 'CRITICAL_IMBALANCE': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const formatCurrency = (amount) => {
        return `GHS ${(amount / 100).toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-navy-900">Financial Ledger</h1>

            {/* Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium">Ledger Status</p>
                            <div className={`flex items-center mt-2`}>
                                {ledgerData.status === 'HEALTHY' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                )}
                                <h3 className={`text-xl font-bold ${ledgerData.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>
                                    {ledgerData.status === 'HEALTHY' ? 'Healthy' : 'Critical Imbalance'}
                                </h3>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-500">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">System integrity check</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium">Net Discrepancy</p>
                            <h3 className={`text-2xl font-bold mt-1 ${ledgerData.net_discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(ledgerData.net_discrepancy)}
                            </h3>
                        </div>
                        <div className="p-3 rounded-lg bg-mint-500">
                            <BarChart2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">Should be GHS 0.00 for perfect balance</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-navy-500 font-medium">Total Volume</p>
                            <h3 className="text-2xl font-bold text-navy-900 mt-1">
                                {formatCurrency(ledgerData.volume)}
                            </h3>
                        </div>
                        <div className="p-3 rounded-lg bg-violet-500">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-navy-400 mt-4">Total transaction volume</p>
                </div>
            </div>

            {/* Account Balances */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                <h3 className="text-lg font-bold text-navy-800 mb-4">Account Balances</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ledgerData.accounts && ledgerData.accounts.map((account, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.account_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatCurrency(account.balance)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(account.balance === 0 ? 'HEALTHY' : 'CRITICAL_IMBALANCE')}`}>
                                            {account.balance === 0 ? 'Balanced' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Health Check */}
            {ledgerData.status === 'CRITICAL_IMBALANCE' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Critical ledger imbalance detected! The net discrepancy is {formatCurrency(ledgerData.net_discrepancy)}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Ledger Features */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-navy-900 pt-6 border-t border-navy-200">Financial Ledger Details</h2>

                {/* Escrow Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-navy-800">Escrow Health</h3>
                            <Wallet className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Total Escrow Liability</span>
                                <span className="text-sm font-bold text-navy-900">GHS 15,000</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Aging Escrow ({'>'}30 days)</span>
                                <span className="text-sm font-bold text-yellow-600">GHS 2,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Bank Balance Match</span>
                                <span className="text-sm font-bold text-green-600">Yes</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-navy-800">Platform P&L</h3>
                            <BarChart2 className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Total Credits Issued</span>
                                <span className="text-sm font-bold text-navy-900">GHS 5,000</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Warranty Fund Balance</span>
                                <span className="text-sm font-bold text-navy-900">GHS 3,200</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Contra-Revenue</span>
                                <span className="text-sm font-bold text-red-600">GHS 1,800</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reconciliation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-navy-800">Reconciliation Status</h3>
                            <RefreshCw className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Ledger Imbalance Alert</span>
                                <span className={`text-sm font-bold ${ledgerData.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>
                                    {ledgerData.status === 'HEALTHY' ? 'Balanced' : 'Imbalanced'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Pending Withdrawals</span>
                                <span className="text-sm font-bold text-yellow-600">GHS 8,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Last Reconciliation</span>
                                <span className="text-sm font-bold text-navy-900">2024-06-15</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-navy-800">Aging Analysis</h3>
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">Current (0-30 days)</span>
                                <span className="text-sm font-bold text-green-600">GHS 12,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">30-60 days</span>
                                <span className="text-sm font-bold text-yellow-600">GHS 1,800</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-navy-600">{'>'} 60 days</span>
                                <span className="text-sm font-bold text-red-600">GHS 700</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-navy-200">
                    <h3 className="text-lg font-bold text-navy-800 mb-4">Financial Summary</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Assets</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GHS 25,000</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Healthy
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Liabilities</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GHS 18,000</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Monitor
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Net Equity</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GHS 7,000</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Positive
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialLedgerPage;