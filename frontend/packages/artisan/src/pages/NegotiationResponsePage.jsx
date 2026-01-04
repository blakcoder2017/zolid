import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@zolid/shared/utils/apiClient'

const NegotiationResponsePage = () => {
    const { disputeId } = useParams();
    const navigate = useNavigate();
    const [dispute, setDispute] = useState(null);
    const [counterOffer, setCounterOffer] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDispute = async () => {
            try {
                const response = await apiClient.get(`/api/v1/disputes/${disputeId}`);
                setDispute(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch dispute');
            }
        };

        fetchDispute();
    }, [disputeId]);

    const handleAccept = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await axios.post(`/api/v1/disputes/${disputeId}/accept`);
            navigate(`/negotiation-success/${disputeId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept proposal');
            setIsSubmitting(false);
        }
    };

    const handleCounterOffer = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await axios.post(`/api/v1/disputes/${disputeId}/counter`, {
                counter_offer_amount: counterOffer * 100 // Convert to pesewas
            });
            navigate(`/negotiation-waiting/${disputeId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit counter-offer');
            setIsSubmitting(false);
        }
    };

    if (!dispute) return <div className="container mx-auto p-4">Loading...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dispute Resolution</h1>
            <p className="mb-6">Client has raised a dispute and proposed a refund.</p>

            <div className="space-y-4 mb-6">
                <div>
                    <p className="font-medium">Client's Proposal:</p>
                    <p>₵{dispute.proposed_refund_amount / 100}</p>
                </div>

                <div>
                    <p className="font-medium">Job Amount:</p>
                    <p>₵{dispute.job.gross_fee_pesewas / 100}</p>
                </div>
            </div>

            <div className="space-y-4">
                <button
                    onClick={handleAccept}
                    disabled={isSubmitting}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                    Accept Proposal
                </button>

                <div>
                    <label className="block text-sm font-medium mb-2">Or make a counter-offer:</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={counterOffer}
                        onChange={(e) => setCounterOffer(e.target.value)}
                        className="w-full"
                    />
                    <div className="text-center mt-2">₵{counterOffer}</div>
                </div>

                <button
                    onClick={handleCounterOffer}
                    disabled={isSubmitting}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Counter-Offer'}
                </button>
            </div>
        </div>
    );
};

export default NegotiationResponsePage;
