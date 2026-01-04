// import React, { useState, useEffect, useRef } from 'react';
// import api from '../api/axios';
// import { Send, User, Wrench, Shield } from 'lucide-react'; // Changed Tool to Wrench

// const DisputeChatLog = ({ disputeId }) => {
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [loading, setLoading] = useState(true);
//     const bottomRef = useRef(null);

//     const fetchMessages = async () => {
//         try {
//             const res = await api.get(`/disputes/${disputeId}/messages`);
//             setMessages(res.data.data || []);
//             setLoading(false);
//         } catch (error) {
//             console.error("Failed to load messages", error);
//         }
//     };

//     useEffect(() => {
//         fetchMessages();
//         // Poll every 5 seconds for live updates
//         const interval = setInterval(fetchMessages, 5000);
//         return () => clearInterval(interval);
//     }, [disputeId]);

//     useEffect(() => {
//         bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages]);

//     const handleSend = async (e) => {
//         e.preventDefault();
//         if (!newMessage.trim()) return;

//         try {
//             await api.post(`/disputes/${disputeId}/messages`, {
//                 message: newMessage
//             });
//             setNewMessage('');
//             fetchMessages(); // Refresh immediately
//         } catch (error) {
//             alert("Failed to send message");
//         }
//     };

//     const getSenderStyle = (role) => {
//         switch (role) {
//             case 'CLIENT':
//                 return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <User size={12} /> };
//             case 'ARTISAN':
//                 // Changed icon here to Wrench
//                 return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: <Wrench size={12} /> };
//             case 'ADMIN':
//                 return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <Shield size={12} /> };
//             default:
//                 return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: null };
//         }
//     };

//     return (
//         <div className="flex flex-col h-[500px] border rounded-lg bg-white shadow-sm">
//             <div className="p-3 border-b bg-gray-50 font-semibold text-gray-700 flex justify-between items-center">
//                 <span>Case Chat Log</span>
//                 <span className="text-xs font-normal text-gray-500">Live Updates Active</span>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
//                 {loading && <p className="text-center text-gray-400 text-sm">Loading history...</p>}
                
//                 {!loading && messages.length === 0 && (
//                     <p className="text-center text-gray-400 text-sm">No messages yet.</p>
//                 )}

//                 {messages.map((msg) => {
//                     const style = getSenderStyle(msg.sender_role);
//                     const isAdmin = msg.sender_role === 'ADMIN';
                    
//                     return (
//                         <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
//                             <div className={`max-w-[80%] rounded-lg p-3 border ${style.bg} ${style.border} text-sm`}>
//                                 <div className={`flex items-center gap-1 text-xs font-bold mb-1 ${style.text}`}>
//                                     {style.icon}
//                                     {msg.sender_role}
//                                 </div>
//                                 <p className="text-gray-800">{msg.message}</p>
//                                 <p className="text-[10px] text-gray-400 mt-1 text-right">
//                                     {new Date(msg.created_at).toLocaleString()}
//                                 </p>
//                             </div>
//                         </div>
//                     );
//                 })}
//                 <div ref={bottomRef} />
//             </div>

//             <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2">
//                 <input
//                     type="text"
//                     className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     placeholder="Type an admin note or intervention..."
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                 />
//                 <button 
//                     type="submit" 
//                     className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700"
//                 >
//                     Send
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default DisputeChatLog;

import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Send, User, Wrench, Shield, Lock } from 'lucide-react';

const DisputeChatLog = ({ disputeId, disputeStatus }) => { // Added disputeStatus prop
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    const isResolved = disputeStatus && disputeStatus !== 'OPEN';

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/disputes/${disputeId}/messages`);
            setMessages(res.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll every 5 seconds only if active
        if (!isResolved) {
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [disputeId, isResolved]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post(`/disputes/${disputeId}/messages`, {
                message: newMessage
            });
            setNewMessage('');
            fetchMessages(); 
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send message");
        }
    };

    const getSenderStyle = (role) => {
        switch (role) {
            case 'CLIENT':
                return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <User size={12} /> };
            case 'ARTISAN':
                return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: <Wrench size={12} /> };
            case 'ADMIN':
                return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <Shield size={12} /> };
            default:
                return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: null };
        }
    };

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-white shadow-sm">
            <div className="p-3 border-b bg-gray-50 font-semibold text-gray-700 flex justify-between items-center">
                <span>Case Chat Log</span>
                <span className={`text-xs font-normal px-2 py-0.5 rounded border ${isResolved ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {isResolved ? 'Thread Locked' : 'Live Updates Active'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {loading && <p className="text-center text-gray-400 text-sm">Loading history...</p>}
                
                {!loading && messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm">No messages yet.</p>
                )}

                {messages.map((msg) => {
                    const style = getSenderStyle(msg.sender_role);
                    const isAdmin = msg.sender_role === 'ADMIN';
                    
                    return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 border ${style.bg} ${style.border} text-sm`}>
                                <div className={`flex items-center gap-1 text-xs font-bold mb-1 ${style.text}`}>
                                    {style.icon}
                                    {msg.sender_role}
                                </div>
                                <p className="text-gray-800">{msg.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">
                                    {new Date(msg.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area - Disabled if resolved */}
            <form onSubmit={handleSend} className="p-3 border-t bg-white flex gap-2 relative">
                {isResolved && (
                    <div className="absolute inset-0 bg-gray-100/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                        <div className="bg-white px-3 py-1 rounded-full shadow border border-gray-200 flex items-center gap-2 text-gray-500 text-xs font-bold">
                            <Lock size={12} /> Case Resolved - Chat Closed
                        </div>
                    </div>
                )}
                
                <input
                    type="text"
                    className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder={isResolved ? "Chat is disabled" : "Type an admin note or intervention..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isResolved}
                />
                <button 
                    type="submit" 
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isResolved}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default DisputeChatLog;