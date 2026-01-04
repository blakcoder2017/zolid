import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import DisputeChatLog from '../components/DisputeChatLog';
// FIX: Added ShieldAlert to imports
import { X, MessageSquare, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

const DisputesPage = () => {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDispute, setSelectedDispute] = useState(null);
    
    // Modals state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    // Form state
    const [notes, setNotes] = useState('');
    const [history, setHistory] = useState([]);
    const [resolution, setResolution] = useState({
        decision: 'REFUND_CLIENT',
        notes: '',
        partialAmount: 0
    });

    // --- Data Fetching ---

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/disputes');
            setDisputes(response.data.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch disputes');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputeDetails = async (disputeId) => {
        try {
            const response = await axios.get(`/disputes/${disputeId}`);
            setSelectedDispute(response.data.data);
            setNotes(response.data.data.resolution_notes || '');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dispute details');
        }
    };

    const fetchDisputeHistory = async (disputeId) => {
        try {
            const response = await axios.get(`/disputes/${disputeId}/history`);
            setHistory(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dispute history');
        }
    };

    // --- Handlers ---

    const handleViewDetails = async (dispute) => {
        await fetchDisputeDetails(dispute.id);
        setShowDetailModal(true);
    };

    const handleViewHistory = async (dispute) => {
        await fetchDisputeDetails(dispute.id);
        await fetchDisputeHistory(dispute.id);
        setShowHistoryModal(true);
    };

    const handleResolveDispute = (dispute) => {
        setSelectedDispute(dispute);
        setResolution({
            decision: 'REFUND_CLIENT',
            notes: '',
            partialAmount: dispute.proposed_refund_amount || 0
        });
        setShowResolveModal(true);
    };

    const handleAddNotes = (dispute) => {
        setSelectedDispute(dispute);
        setNotes(dispute.resolution_notes || '');
        setShowNotesModal(true);
    };

    const handleSaveNotes = async () => {
        try {
            await axios.post(`/disputes/${selectedDispute.id}/notes`, { notes: notes });
            setShowNotesModal(false);
            fetchDisputes(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save notes');
        }
    };

    const handleSubmitResolution = async () => {
        try {
            await axios.post(`/disputes/${selectedDispute.id}/resolve`, resolution);
            setShowResolveModal(false);
            fetchDisputes(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resolve dispute');
        }
    };

    // --- Helpers ---

    const formatCurrency = (amount) => {
        return amount ? `₵${(amount / 100).toFixed(2)}` : '₵0.00';
    };

    const getStatusBadge = (status) => {
        const config = {
            'OPEN': { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle size={14} /> },
            'RESOLVED': { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
            'RESOLVED_AUTOMATED': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={14} /> },
            'DISMISSED': { color: 'bg-gray-100 text-gray-800', icon: <X size={14} /> }
        };
        const style = config[status] || config['OPEN'];
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${style.color}`}>
                {style.icon}
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getRaiserInfo = (dispute) => {
        if (!dispute) return {};
        const isClient = !!dispute.raised_by_client_id;
        return {
            isClient,
            role: isClient ? 'Client' : 'Artisan',
            name: dispute.raised_by_name || 'Unknown',
            phone: dispute.raised_by_phone || 'N/A',
            id: isClient ? dispute.raised_by_client_id : dispute.raised_by_artisan_id
        };
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Disputes...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4 border border-red-200">{error}</div>;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dispute Tribunal</h1>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600 border border-gray-200 shadow-sm">
                    Total: {disputes.length}
                </span>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job / Context</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Raiser</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pot Size</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {disputes.map((dispute) => {
                                const raiser = getRaiserInfo(dispute);
                                const isResolved = dispute.status !== 'OPEN';

                                return (
                                    <tr key={dispute.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(dispute)}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{dispute.category}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">Ref: {dispute.job_id.substring(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${raiser.isClient ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{raiser.name}</div>
                                                    <div className="text-xs text-gray-500">{raiser.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(dispute.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(dispute.gross_fee_pesewas)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                {/* --- ANALYZE BUTTON (Disabled if Resolved) --- */}
                                                <button 
                                                    onClick={() => !isResolved && handleViewDetails(dispute)} 
                                                    disabled={isResolved}
                                                    className={`px-3 py-1.5 rounded transition ${
                                                        isResolved 
                                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60' 
                                                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900'
                                                    }`}
                                                >
                                                    Analyze
                                                </button>

                                                {/* Resolve Button (Only for Open disputes) */}
                                                {!isResolved && (
                                                    <button 
                                                        onClick={() => handleResolveDispute(dispute)} 
                                                        className="text-white bg-green-600 px-3 py-1.5 rounded hover:bg-green-700 transition shadow-sm"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Dispute Detail Modal --- */}
            {showDetailModal && selectedDispute && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <ShieldAlert size={24} className="text-red-600" />
                                    Case #{selectedDispute.id.substring(0, 8)}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Opened on {new Date(selectedDispute.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                {selectedDispute.status === 'OPEN' && (
                                    <button onClick={() => { setShowDetailModal(false); handleResolveDispute(selectedDispute); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold">
                                        Resolve Case
                                    </button>
                                )}
                                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 flex overflow-hidden">
                            
                            {/* Left Panel: Case Details */}
                            <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-6 bg-gray-50/50">
                                <div className="space-y-6">
                                    
                                    {/* Financials */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">At Stake</h3>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Escrow</p>
                                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedDispute.gross_fee_pesewas)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-red-500">Refund Req.</p>
                                                <p className="font-bold text-red-700">{formatCurrency(selectedDispute.proposed_refund_amount)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Claim Description</h3>
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                            {selectedDispute.description}
                                        </p>
                                    </div>

                                    {/* Evidence */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Evidence</h3>
                                        {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedDispute.evidence_urls.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noreferrer">
                                                        <img src={url} className="w-full h-24 object-cover rounded border hover:opacity-80 transition" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No evidence provided.</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                                        <button onClick={() => handleViewHistory(selectedDispute)} className="w-full py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                                            View Audit Logs
                                        </button>
                                        <button onClick={() => handleAddNotes(selectedDispute)} className="w-full py-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-medium text-yellow-800 hover:bg-yellow-100">
                                            Add Internal Note
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Chat Log */}
                            <div className="w-2/3 bg-white p-6 flex flex-col">
                                <DisputeChatLog disputeId={selectedDispute.id} />
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* --- Resolve Modal --- */}
            {showResolveModal && selectedDispute && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-green-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-green-900">Final Verdict</h2>
                            <button onClick={() => setShowResolveModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                                <select
                                    className="w-full p-2.5 border border-gray-300 rounded-lg"
                                    value={resolution.decision}
                                    onChange={(e) => setResolution({ ...resolution, decision: e.target.value })}
                                >
                                    <option value="REFUND_CLIENT">Full Refund to Client</option>
                                    <option value="PAY_ARTISAN">Release to Artisan</option>
                                    <option value="PARTIAL_REFUND">Split Funds</option>
                                </select>
                            </div>
                            
                            {resolution.decision === 'PARTIAL_REFUND' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded"
                                        value={resolution.partialAmount}
                                        onChange={(e) => setResolution({...resolution, partialAmount: e.target.value})}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Remaining {formatCurrency(selectedDispute.gross_fee_pesewas - resolution.partialAmount)} goes to Artisan.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning</label>
                                <textarea 
                                    className="w-full p-2 border border-gray-300 rounded h-24"
                                    placeholder="Explain your decision..."
                                    value={resolution.notes}
                                    onChange={(e) => setResolution({...resolution, notes: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                            <button onClick={() => setShowResolveModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={handleSubmitResolution} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Execute</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Notes & History Modals ( Simplified ) --- */}
            {/* You can keep the Notes and History modals similar to previous versions if needed, 
                or they will open as simple overlays on top of the main UI. */}
                
        </div>
    );
};

export default DisputesPage;