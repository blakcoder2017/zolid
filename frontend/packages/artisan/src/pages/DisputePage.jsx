import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, TopNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import { formatCurrency } from '@zolid/shared/utils';
import logo from '../assets/logos/logo.png';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const DisputesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [disputes, setDisputes] = useState([]);
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
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/disputes');
            setDisputes(res.data.data || []);
        } catch (error) {
            console.error("Failed to load disputes", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'OPEN': return { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <AlertTriangle size={16} />, label: 'Active Case' };
            case 'RESOLVED': return { color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={16} />, label: 'Resolved' };
            case 'RESOLVED_AUTOMATED': return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <CheckCircle size={16} />, label: 'Auto Resolved' };
            default: return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <Clock size={16} />, label: status };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <TopNavigation profile={user} logo={logo} />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="font-condensed font-bold text-3xl text-navy-900">Dispute Center</h1>
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-bold border shadow-sm">
                        Total: {disputes.length}
                    </span>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Loading cases...</p>
                ) : disputes.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed">
                        <div className="inline-flex p-3 bg-green-50 rounded-full mb-3">
                            <CheckCircle className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Disputes</h3>
                        <p className="text-gray-500 text-sm">You have no active or past disputes.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((dispute) => {
                            const status = getStatusConfig(dispute.status);
                            return (
                                <Card key={dispute.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/disputes/${dispute.job_id}`)}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{dispute.category}</h3>
                                            <p className="text-xs text-gray-500 font-mono">Job #{dispute.job_id.substring(0, 8)}</p>
                                        </div>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${status.color}`}>
                                            {status.icon} {status.label}
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 bg-gray-50 p-2 rounded">
                                        "{dispute.description}"
                                    </p>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Held in Escrow</p>
                                            <p className="font-bold text-navy-900">{formatCurrency(dispute.gross_fee_pesewas)}</p>
                                        </div>
                                        <Button size="sm" variant="secondary">View Details →</Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNavigation items={navItems} />
        </div>
    );
};

export default DisputesPage;