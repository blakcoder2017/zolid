import React from 'react';
import { useParams } from 'react-router-dom';

const NegotiationSuccessPage = () => {
    const { disputeId } = useParams();

    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Dispute Resolved</h1>
            <p className="mb-6">The dispute has been successfully resolved.</p>
            <p>You will receive the agreed amount in your wallet shortly.</p>
        </div>
    );
};

export default NegotiationSuccessPage;