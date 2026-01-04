import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const response = await axios.get(`/clients/${id}`);
                setClient(response.data.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchClient();
    }, [id]);

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button
                    onClick={() => navigate('/clients')}
                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Back to Clients
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Client Details</h1>
                    <button
                        onClick={() => navigate('/clients')}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Clients
                    </button>
                </div>

                {client && client.profile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name:</label>
                                <p className="text-gray-900">{client.profile.full_name || 'N/A'}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                                <p className="text-gray-900">{client.profile.email || 'N/A'}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone:</label>
                                <p className="text-gray-900">{client.profile.phone_primary || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Total Jobs:</label>
                                <p className="text-gray-900">{client.profile.total_jobs || 0}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Total Spent:</label>
                                <p className="text-gray-900">
                                    {client.profile.total_spent ?
                                        new Intl.NumberFormat('en-GH', {
                                            style: 'currency',
                                            currency: 'GHS'
                                        }).format(client.profile.total_spent / 100) : 'GHS 0.00'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Created At:</label>
                                <p className="text-gray-900">{client.profile.created_at ? new Date(client.profile.created_at).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {client && client.recentJobs && client.recentJobs.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Jobs</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {client.recentJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.job_description || 'N/A'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {job.gross_fee_pesewas ?
                                                    new Intl.NumberFormat('en-GH', {
                                                        style: 'currency',
                                                        currency: 'GHS'
                                                    }).format(job.gross_fee_pesewas / 100) : 'GHS 0.00'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{job.current_state || 'N/A'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientDetailPage;