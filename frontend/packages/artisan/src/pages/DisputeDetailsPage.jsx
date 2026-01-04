import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, TopNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import { formatCurrency } from '@zolid/shared/utils';
import logo from '../assets/logos/logo.png';
import DisputeChatLog from '../components/DisputeChatLog';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const DisputeDetailsPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠' },
        { path: '/jobs', label: 'Available', icon: '💼' },
        { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
        { path: '/disputes', label: 'Disputes', icon: '⚖️' }, // <--- ADDED
        { path: '/wallet', label: 'Wallet', icon: '💰' },
        { path: '/profile', label: 'Profile', icon: '👤' },
      ];

    useEffect(() => {
        fetchDisputeDetails();
    }, [jobId]);

    const fetchDisputeDetails = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/disputes/${jobId}`);
            setDispute(res.data.data);
        } catch (error) {
            console.error("Failed to load dispute details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    if (!dispute) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Dispute not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <TopNavigation profile={user} logo={logo} />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/disputes')} className="mb-2">
                    <ArrowLeft size={16} className="mr-1" /> Back to Disputes
                </Button>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-red-900">Dispute #{dispute.id.substring(0, 8)}</h1>
                        <p className="text-sm text-red-700 mt-1">
                            Funds ({formatCurrency(dispute.gross_fee_pesewas)}) are currently held in escrow until this issue is resolved.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: Details */}
                    <div className="space-y-6">
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">Case Details</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Category:</span>
                                    <p className="font-medium">{dispute.category}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Description:</span>
                                    <p className="bg-gray-50 p-2 rounded border border-gray-100 mt-1">{dispute.description}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded ${dispute.status === 'OPEN' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {dispute.status}
                                    </span>
                                </div>
                                {dispute.resolution_notes && (
                                    <div className="bg-green-50 p-3 rounded border border-green-100">
                                        <span className="text-green-700 font-bold text-xs uppercase">Resolution</span>
                                        <p className="text-green-900">{dispute.resolution_notes}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {dispute.status === 'OPEN' && (
                            <Card className="bg-blue-50 border-blue-200">
                                <h4 className="font-bold text-blue-900 mb-2">Instructions</h4>
                                <p className="text-sm text-blue-800">
                                    Please use the chat on the right to provide evidence or negotiate with the client. 
                                    A Zolid Admin will mediate if a mutual agreement isn't reached.
                                </p>
                            </Card>
                        )}
                    </div>

                    {/* Right: Chat */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 px-1">Case Messages</h3>
                        
                        {/* FIX: Passed disputeStatus prop here */}
                        <DisputeChatLog 
                            disputeId={dispute.id} 
                            disputeStatus={dispute.status} 
                        />
                        
                    </div>
                </div>
            </div>

            <BottomNavigation items={navItems} />
        </div>
    );
};

export default DisputeDetailsPage;