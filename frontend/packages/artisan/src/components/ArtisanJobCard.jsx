import React, { useState } from 'react';
import apiClient from '@zolid/shared/utils/apiClient';
import { MapPin, Calendar, Clock, Briefcase, AlertCircle } from 'lucide-react';

const ArtisanJobCard = ({ job, onRefresh }) => {
    const [loading, setLoading] = useState(false);

    const handleStartWork = async () => {
        if (!window.confirm("Are you at the location and ready to start the work? This will notify the client.")) return;

        try {
            setLoading(true);
            // Call the new endpoint to transition state
            await apiClient.patch(`/jobs/${job.id}/start`);
            alert("Job Started successfully!");
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to start job");
        } finally {
            setLoading(false);
        }
    };

    // Helper for status badges
    const getStatusColor = (status) => {
        const colors = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'MATCHED_PENDING_PAYMENT': 'bg-blue-100 text-blue-800',
            'ESCROW_HELD': 'bg-purple-100 text-purple-800',
            'STARTED': 'bg-indigo-100 text-indigo-800',
            'COMPLETED_PENDING': 'bg-green-100 text-green-800',
            'PAYOUT_SUCCESS': 'bg-green-100 text-green-800',
            'DISPUTED': 'bg-red-100 text-red-800',
            'CANCELLED_REFUNDED': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{job.job_description}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(job.current_state)}`}>
                    {job.current_state.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{job.location_gps_address || "Location pending"}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>Budget: GHS {(job.gross_fee_pesewas / 100).toFixed(2)}</span>
                </div>
            </div>

            {/* ACTION AREA */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
                {job.current_state === 'ESCROW_HELD' ? (
                    <button 
                        onClick={handleStartWork}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Start Work'}
                    </button>
                ) : job.current_state === 'STARTED' ? (
                    <div className="flex items-center text-indigo-600 text-sm font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4 mr-2 animate-pulse" />
                        Work in Progress
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ArtisanJobCard;