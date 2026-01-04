import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@zolid/shared/components'; // Import Menu
import apiClient from '@zolid/shared/utils/apiClient';
import { Send, Wallet, ShieldAlert, ArrowLeft } from 'lucide-react';

const ClientDisputePage = () => {
    const { disputeId } = useParams();
    const navigate = useNavigate(); // Navigation hook
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    // Standard Navigation Items
    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠' },
        { path: '/active-jobs', label: 'Active', icon: '⚡' },
        { path: '/post-job', label: 'Post Job', icon: '➕' },
        { path: '/wallet', label: 'Wallet', icon: '💰' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];
    // 1. Initial Data Load & Polling
    useEffect(() => {
        const loadData = async () => {
            try {
                const [chatRes, walletRes] = await Promise.all([
                    apiClient.get(`/disputes/${disputeId}/messages`),
                    apiClient.get('/finance/wallet/balance')
                ]);
                
                setMessages(chatRes.data.data || []);
                
                // --- FIX: Correctly access nested balance data ---
                // API returns { status: 'success', data: { balance: 1000 } }
                const balance = walletRes.data.data?.balance || 0; 
                setWalletBalance(balance);
                
                setLoading(false);
            } catch (err) {
                console.error("Failed to load dispute data", err);
                setLoading(false);
            }
        };

        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, [disputeId]);

    // 2. Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 3. Send Message Handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            await apiClient.post(`/disputes/${disputeId}/messages`, { 
                message: text,
                senderRole: 'CLIENT'
            });
            setText('');
            // Optimistic update or wait for poll
            const res = await apiClient.get(`/disputes/${disputeId}/messages`);
            setMessages(res.data.data);
        } catch (err) {
            alert("Failed to send message");
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Dispute Details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* --- TOP HEADER WITH BACK BUTTON --- */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Dispute Center
                </h1>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-6">
                
                {/* LEFT COLUMN: Wallet & Info */}
                <div className="space-y-4">
                    {/* Wallet Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Wallet className="w-5 h-5" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Refund Wallet</span>
                        </div>
                        <div className="text-3xl font-bold mb-1">
                            {/* Format Currency Correctly */}
                            GHS {((Number(walletBalance) || 0) / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-indigo-200 mb-4">
                            Available for withdrawal (T+1 Settlement)
                        </div>
                        {walletBalance > 0 && (
                            <button 
                                onClick={() => alert("Withdrawal initiated! Funds will settle in 24 hours.")}
                                className="w-full bg-white text-indigo-700 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 transition"
                            >
                                Withdraw Funds
                            </button>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <p className="font-bold mb-1">How this works:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Admins review chat history.</li>
                            <li>Funds are held safely in Escrow.</li>
                            <li>If refunded, money appears in your Wallet above.</li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT COLUMN: Chat Interface */}
                <div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 p-4 font-semibold text-gray-700">
                        Case History
                    </div>

                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {messages.length === 0 && (
                            <p className="text-center text-gray-400 mt-10 text-sm">No messages yet. Start the conversation.</p>
                        )}
                        
                        {messages.map((msg) => {
                            const isMe = msg.sender_role === 'CLIENT';
                            const isAdmin = msg.sender_role === 'ADMIN';
                            
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-br-sm' 
                                        : isAdmin 
                                            ? 'bg-red-50 border border-red-100 text-gray-800' 
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                                    }`}>
                                        <div className={`text-xs font-bold mb-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                                            {msg.sender_role}
                                        </div>
                                        {msg.message}
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-3">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type message..."
                            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                        <button 
                            type="submit"
                            disabled={!text.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* --- BOTTOM NAVIGATION --- */}
            <BottomNavigation items={navItems} />
        </div>
    );
};

export default ClientDisputePage;