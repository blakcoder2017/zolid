import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

const DisputeWaitingPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDispute = async () => {
            try {
                const response = await axios.get(`/api/v1/disputes/${jobId}`);
                setDispute(response.data.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch dispute');
                setLoading(false);
            }
        };

        fetchDispute();

        // Poll for updates every 5 seconds
        const interval = setInterval(fetchDispute, 5000);
        return () => clearInterval(interval);
    }, [jobId]);

    const handleAccept = async () => {
        try {
            await axios.post(`/api/v1/disputes/${dispute.id}/accept`);
            navigate(`/dispute-success/${jobId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to accept proposal');
        }
    };

    const handleReject = async () => {
        try {
            // Escalate to admin
            await axios.post(`/api/v1/disputes/${dispute.id}/escalate`);
            navigate(`/dispute-escalated/${jobId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to escalate dispute');
        }
    };

    if (loading) return <div className="container mx-auto p-4">Loading...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Dispute Resolution</h1>
            <p className="mb-6">Waiting for artisan response...</p>

            {dispute && (
                <div className="space-y-4">
                    <div>
                        <p className="font-medium">Your Proposal:</p>
                        <p>₵{dispute.proposed_refund_amount / 100}</p>
                    </div>

                    {dispute.artisan_counter_offer && (
                        <div>
                            <p className="font-medium">Artisan Counter-Offer:</p>
                            <p>₵{dispute.artisan_counter_offer / 100}</p>
                            <div className="space-x-2 mt-2">
                                <button
                                    onClick={handleAccept}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {!dispute.artisan_counter_offer && (
                        <p>Waiting for artisan to respond...</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DisputeWaitingPage;