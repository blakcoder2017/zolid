// import React, { useState, useEffect, useRef } from 'react';
// import apiClient from '@zolid/shared/utils/apiClient';
// import { Send, User, Shield, Wrench } from 'lucide-react';

// const DisputeChatLog = ({ disputeId }) => {
//     const [messages, setMessages] = useState([]);
//     const [newMessage, setNewMessage] = useState('');
//     const [loading, setLoading] = useState(true);
//     const bottomRef = useRef(null);

//     const fetchMessages = async () => {
//         try {
//             const res = await apiClient.get(`/disputes/${disputeId}/messages`);
//             setMessages(res.data.data || []);
//             setLoading(false);
//         } catch (error) {
//             console.error("Failed to load messages", error);
//         }
//     };

//     useEffect(() => {
//         if (!disputeId) return;
//         fetchMessages();
//         // Poll every 5 seconds for updates
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
//             await apiClient.post(`/disputes/${disputeId}/messages`, {
//                 message: newMessage
//             });
//             setNewMessage('');
//             fetchMessages(); // Refresh immediately
//         } catch (error) {
//             alert("Failed to send message");
//         }
//     };

//     const getSenderConfig = (role) => {
//         switch (role) {
//             case 'ARTISAN':
//                 return { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', icon: <Wrench size={12} />, label: 'Me' };
//             case 'CLIENT':
//                 return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800', icon: <User size={12} />, label: 'Client' };
//             case 'ADMIN':
//                 return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <Shield size={12} />, label: 'Zolid Admin' };
//             default:
//                 return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: null, label: 'Unknown' };
//         }
//     };

//     return (
//         <div className="flex flex-col h-[400px] border rounded-lg bg-white shadow-sm">
//             <div className="p-3 border-b bg-gray-50 font-semibold text-gray-700 text-sm flex justify-between items-center">
//                 <span>Case History</span>
//                 <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded border">Live</span>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
//                 {loading && <p className="text-center text-gray-400 text-xs">Loading history...</p>}
                
//                 {!loading && messages.length === 0 && (
//                     <div className="text-center py-8">
//                         <p className="text-gray-400 text-sm">No messages yet.</p>
//                         <p className="text-gray-300 text-xs">Start the conversation below.</p>
//                     </div>
//                 )}

//                 {messages.map((msg) => {
//                     const isMe = msg.sender_role === 'ARTISAN';
//                     const style = getSenderConfig(msg.sender_role);
                    
//                     return (
//                         <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
//                             <div className={`max-w-[85%] rounded-lg p-3 border text-sm shadow-sm ${style.bg} ${style.border}`}>
//                                 <div className={`flex items-center gap-1 text-[10px] font-bold mb-1 uppercase ${style.text}`}>
//                                     {style.icon}
//                                     {style.label}
//                                 </div>
//                                 <p className="text-gray-800 leading-snug">{msg.message}</p>
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
//                     className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
//                     placeholder="Type your message..."
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                 />
//                 <button 
//                     type="submit" 
//                     disabled={!newMessage.trim()}
//                     className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                     <Send size={18} />
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default DisputeChatLog;

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@zolid/shared/utils/apiClient';
import { Send, User, Wrench, Shield, Lock } from 'lucide-react';

const DisputeChatLog = ({ disputeId, disputeStatus }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    // Check if the dispute is resolved based on the prop passed from the parent page
    const isResolved = disputeStatus && disputeStatus !== 'OPEN';

    const fetchMessages = async () => {
        try {
            const res = await apiClient.get(`/disputes/${disputeId}/messages`);
            setMessages(res.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    };

    useEffect(() => {
        fetchMessages();
        
        // Only poll for new messages if the dispute is NOT resolved
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
            await apiClient.post(`/disputes/${disputeId}/messages`, {
                message: newMessage
            });
            setNewMessage('');
            fetchMessages(); 
        } catch (error) {
            // FIX: Display the actual error message from the backend (e.g., "Dispute is resolved")
            const errorMessage = error.response?.data?.message || "Failed to send message";
            alert(errorMessage);
            
            // If the error indicates the dispute is resolved, refresh the page to update UI state
            if (errorMessage.toLowerCase().includes('resolved')) {
                window.location.reload();
            }
        }
    };

    const getSenderConfig = (role) => {
        switch (role) {
            case 'ARTISAN':
                return { bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800', icon: <Wrench size={12} />, label: 'Me' };
            case 'CLIENT':
                return { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-800', icon: <User size={12} />, label: 'Client' };
            case 'ADMIN':
                return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <Shield size={12} />, label: 'Zolid Admin' };
            default:
                return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', icon: null, label: 'Unknown' };
        }
    };

    return (
        <div className="flex flex-col h-[400px] border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="p-3 border-b bg-gray-50 font-semibold text-gray-700 text-sm flex justify-between items-center">
                <span>Case History</span>
                <span className={`text-xs font-normal px-2 py-0.5 rounded border ${isResolved ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {isResolved ? 'Thread Locked' : 'Live Updates Active'}
                </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {loading && <p className="text-center text-gray-400 text-xs">Loading history...</p>}
                
                {!loading && messages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">No messages yet.</p>
                        <p className="text-gray-300 text-xs">Start the conversation below.</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_role === 'ARTISAN';
                    const style = getSenderConfig(msg.sender_role);
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 border text-sm shadow-sm ${style.bg} ${style.border}`}>
                                <div className={`flex items-center gap-1 text-[10px] font-bold mb-1 uppercase ${style.text}`}>
                                    {style.icon}
                                    {style.label}
                                </div>
                                <p className="text-gray-800 leading-snug">{msg.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">
                                    {new Date(msg.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area (Disabled if Resolved) */}
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
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder={isResolved ? "Chat is disabled" : "Type your message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isResolved} 
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim() || isResolved}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default DisputeChatLog;