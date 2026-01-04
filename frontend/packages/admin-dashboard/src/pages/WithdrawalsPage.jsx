import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, Clock, Smartphone, User } from 'lucide-react';

const WithdrawalsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/withdrawals?status=PENDING');
            setRequests(res.data.data);
        } catch (err) {
            console.error("Failed to load withdrawals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id, amount) => {
        if (!window.confirm(`Are you sure you want to transfer GHS ${(amount/100).toFixed(2)} immediately?`)) return;
        
        setProcessingId(id);
        try {
            await api.post(`/withdrawals/${id}/approve`);
            alert("Transfer Initiated Successfully");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || "Approval Failed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter rejection reason (will be sent to user):");
        if (!reason) return;

        setProcessingId(id);
        try {
            await api.post(`/withdrawals/${id}/reject`, { reason });
            alert("Request Rejected & Funds Refunded to Wallet");
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || "Rejection Failed");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Requests...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
                    <p className="text-gray-500">Manage pending payouts to MoMo wallets</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg text-indigo-700 font-bold">
                    Pending: {requests.length}
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                    <p className="mt-1 text-sm text-gray-500">No pending withdrawal requests.</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <User size={16} className="text-gray-500" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{req.user_name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{req.user_role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            GHS {(req.amount_pesewas / 100).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                            <Smartphone size={14} className="text-gray-400" />
                                            {req.momo_number} ({req.bank_code})
                                        </div>
                                        <div className="text-xs text-green-600 font-medium">
                                            {req.resolved_account_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleReject(req.id)}
                                                disabled={processingId === req.id}
                                                className="px-3 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 disabled:opacity-50 text-xs font-bold"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(req.id, req.amount_pesewas)}
                                                disabled={processingId === req.id}
                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                                            >
                                                {processingId === req.id ? 'Processing...' : 'Approve & Pay'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WithdrawalsPage;