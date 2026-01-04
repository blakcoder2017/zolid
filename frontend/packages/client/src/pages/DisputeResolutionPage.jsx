import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

const DisputeResolutionPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [refundAmount, setRefundAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Raise dispute with proposed refund amount
            const response = await axios.post('/api/v1/disputes/raise', {
                job_id: jobId,
                category: 'POOR_QUALITY',
                description: `Client proposed refund of ₵${refundAmount}`,
                evidence_urls: [],
                proposed_refund_amount: refundAmount * 100 // Convert to pesewas
            });

            // Move to waiting room
            navigate(`/dispute-waiting/${jobId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit dispute');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Resolve Dispute</h1>
            <p className="mb-6">Propose a fair refund amount to resolve this dispute instantly.</p>

            {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Refund Amount (₵)</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full"
                    />
                    <div className="text-center mt-2">₵{refundAmount}</div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
            </form>
        </div>
    );
};

export default DisputeResolutionPage;