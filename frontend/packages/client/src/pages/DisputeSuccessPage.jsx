import React from 'react';
import { useParams } from 'react-router-dom';

const DisputeSuccessPage = () => {
    const { jobId } = useParams();

    return (
        <div className="container mx-auto p-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Dispute Resolved</h1>
            <p className="mb-6">The dispute has been successfully resolved.</p>
            <p>Your wallet has been credited with the agreed refund amount.</p>
        </div>
    );
};

export default DisputeSuccessPage;