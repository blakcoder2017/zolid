// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Card, BottomNavigation, Button } from '@zolid/shared/components';
// import { useAuth } from '@zolid/shared/hooks';
// import { formatCurrency } from '@zolid/shared/utils';
// import apiClient from '@zolid/shared/utils/apiClient';
// import { Wallet, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
// import logo from '../assets/logos/logo.png';

// const ClientWalletPage = () => {
//     const navigate = useNavigate();
//     const { user } = useAuth();
//     const [balance, setBalance] = useState(0);
//     const [history, setHistory] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [withdrawAmount, setWithdrawAmount] = useState('');
//     const [submitting, setSubmitting] = useState(false);

//     const navItems = [
//         { path: '/dashboard', label: 'Home', icon: '🏠' },
//         { path: '/active-jobs', label: 'Active', icon: '⚡' },
//         { path: '/post-job', label: 'Post Job', icon: '➕' },
//         { path: '/wallet', label: 'Wallet', icon: '💰' },
//         { path: '/profile', label: 'Profile', icon: '👤' },
//     ];

//     useEffect(() => {
//         if (user?.id) fetchData();
//     }, [user?.id]);

//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const [balRes, histRes] = await Promise.all([
//                 apiClient.get('/finance/wallet/balance'),
//                 apiClient.get('/finance/wallet/requests')
//             ]);
//             // Handle potentially nested data structure
//             setBalance(balRes.data.data?.balance || balRes.data.data || 0);
//             setHistory(histRes.data.data || []);
//         } catch (error) {
//             console.error("Wallet load error:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleWithdraw = async (e) => {
//         e.preventDefault();
//         const numAmount = Number(withdrawAmount);
        
//         if (!withdrawAmount || isNaN(numAmount) || numAmount <= 0) {
//             alert("Please enter a valid amount");
//             return;
//         }

//         // Convert to Pesewas for API
//         const amountPesewas = Math.floor(numAmount * 100);

//         if (amountPesewas > balance) {
//             alert("Insufficient funds.");
//             return;
//         }

//         if (!window.confirm("Withdrawals are processed manually within 5 working days. Proceed?")) return;

//         try {
//             setSubmitting(true);
//             await apiClient.post('/finance/wallet/withdraw', { amount: amountPesewas });
//             alert("Withdrawal request submitted successfully!");
//             setWithdrawAmount('');
//             fetchData(); // Refresh data to show new balance and pending request
//         } catch (err) {
//             alert(err.response?.data?.message || "Request failed");
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const getStatusBadge = (status) => {
//         const config = {
//             'PENDING': { color: 'text-yellow-700 bg-yellow-100', icon: <Clock className="w-3 h-3 mr-1" /> },
//             'APPROVED': { color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
//             'PROCESSED': { color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
//             'REJECTED': { color: 'text-red-700 bg-red-100', icon: <XCircle className="w-3 h-3 mr-1" /> },
//         };
//         const style = config[status] || config['PENDING'];
        
//         return (
//             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.color}`}>
//                 {style.icon} {status}
//             </span>
//         );
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 pb-20">
//             {/* Top Navigation */}
//             <nav className="bg-navy-900 text-white px-6 py-4 shadow-sm sticky top-0 z-10">
//                 <div className="flex justify-between items-center">
//                     <img src={logo} alt="ZOLID" className="h-8 w-auto" />
//                     <button onClick={fetchData} className="text-white opacity-80 hover:opacity-100">
//                         <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
//                     </button>
//                 </div>
//             </nav>

//             <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
//                 <h1 className="text-2xl font-bold text-navy-900">My Wallet</h1>

//                 {/* Balance Card */}
//                 <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
//                     <div className="flex items-center gap-2 opacity-90 mb-1">
//                         <Wallet className="w-5 h-5" />
//                         <span className="text-sm font-semibold uppercase tracking-wider">Available Balance</span>
//                     </div>
//                     <h2 className="text-4xl font-bold mb-6">
//                         {formatCurrency(balance)}
//                     </h2>
                    
//                     {/* Withdrawal Form */}
//                     <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
//                         <label className="text-xs text-indigo-100 mb-1 block">Request Withdrawal (GHS)</label>
//                         <div className="flex gap-2">
//                             <input 
//                                 type="number" 
//                                 value={withdrawAmount}
//                                 onChange={(e) => setWithdrawAmount(e.target.value)}
//                                 placeholder="0.00"
//                                 className="flex-1 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
//                             />
//                             <button 
//                                 onClick={handleWithdraw}
//                                 disabled={submitting || balance <= 0}
//                                 className="bg-white text-indigo-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50 transition-colors"
//                             >
//                                 {submitting ? 'Sending...' : 'Withdraw'}
//                             </button>
//                         </div>
//                         <p className="text-xs text-indigo-200 mt-2 flex items-start gap-1">
//                             <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
//                             <span>Withdrawals are subject to review. Funds typically arrive within <strong>5 working days</strong>.</span>
//                         </p>
//                     </div>
//                 </div>

//                 {/* Request History */}
//                 <div>
//                     <h3 className="font-bold text-gray-800 mb-4 text-lg">Transaction History</h3>
                    
//                     {loading && history.length === 0 ? (
//                         <div className="text-center py-8 text-gray-500">Loading...</div>
//                     ) : history.length === 0 ? (
//                         <Card className="text-center py-12 border-dashed">
//                             <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//                             <p className="text-gray-500">No withdrawal history yet.</p>
//                         </Card>
//                     ) : (
//                         <div className="space-y-3">
//                             {history.map((req) => (
//                                 <div key={req.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
//                                     <div>
//                                         <div className="flex items-center gap-2 mb-1">
//                                             <span className="font-bold text-gray-900">{formatCurrency(req.amount_pesewas)}</span>
//                                             {req.status === 'PENDING' && (
//                                                 <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
//                                                     Manual Review
//                                                 </span>
//                                             )}
//                                         </div>
//                                         <p className="text-xs text-gray-500">
//                                             Requested on {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                                         </p>
//                                     </div>
//                                     <div className="text-right">
//                                         {getStatusBadge(req.status)}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <BottomNavigation items={navItems} />
//         </div>
//     );
// };

// export default ClientWalletPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import { formatCurrency } from '@zolid/shared/utils';
import apiClient from '@zolid/shared/utils/apiClient';
import { Wallet, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Smartphone, User } from 'lucide-react';
import logo from '../assets/logos/logo.png';

const ClientWalletPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [momoNumber, setMomoNumber] = useState('');
    const [bankCode, setBankCode] = useState('');
    const [accountName, setAccountName] = useState('');
    const [resolvingName, setResolvingName] = useState(false);

    // Hardcoded for now, or fetch from /identity/momo-providers
    const providers = [
        { name: 'MTN Mobile Money', code: 'MTN' },
        { name: 'Telecel Cash', code: 'VOD' },
        { name: 'AT Money', code: 'ATL' }
    ];

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠' },
        { path: '/active-jobs', label: 'Active', icon: '⚡' },
        { path: '/post-job', label: 'Post Job', icon: '➕' },
        { path: '/wallet', label: 'Wallet', icon: '💰' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    useEffect(() => {
        if (user?.id) fetchData();
    }, [user?.id]);

    // Effect to resolve name when Number and Bank are set
    useEffect(() => {
        const resolveName = async () => {
            if (momoNumber.length >= 10 && bankCode) {
                setResolvingName(true);
                setAccountName(''); // Clear previous
                try {
                    const res = await apiClient.post('/finance/wallet/resolve-momo', {
                        momo_number: momoNumber,
                        bank_code: bankCode
                    });
                    setAccountName(res.data.data.account_name);
                } catch (error) {
                    console.error("Name resolution failed", error);
                    setAccountName(''); // Or set error state
                } finally {
                    setResolvingName(false);
                }
            }
        };

        const timer = setTimeout(resolveName, 1000); // Debounce
        return () => clearTimeout(timer);
    }, [momoNumber, bankCode]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balRes, histRes] = await Promise.all([
                apiClient.get('/finance/wallet/balance'),
                apiClient.get('/finance/wallet/requests')
            ]);
            setBalance(balRes.data.data?.balance || 0);
            setHistory(histRes.data.data || []);
        } catch (error) {
            console.error("Wallet load error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        
        if (!amount || numAmount <= 0) { alert("Invalid amount"); return; }
        if (!momoNumber || !bankCode || !accountName) { alert("Please provide valid payment details"); return; }

        const amountPesewas = Math.floor(numAmount * 100);
        if (amountPesewas > balance) { alert("Insufficient funds."); return; }

        if (!window.confirm(`Withdraw GHS ${numAmount} to ${accountName}?`)) return;

        try {
            setSubmitting(true);
            await apiClient.post('/finance/wallet/withdraw', { 
                amount: amountPesewas,
                momo_number: momoNumber,
                bank_code: bankCode,
                account_name: accountName
            });
            alert("Withdrawal request submitted successfully!");
            setAmount('');
            setMomoNumber('');
            setAccountName('');
            setBankCode('');
            fetchData(); 
        } catch (err) {
            alert(err.response?.data?.message || "Request failed");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'PENDING': { color: 'text-yellow-700 bg-yellow-100', icon: <Clock className="w-3 h-3 mr-1" /> },
            'APPROVED': { color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
            'PROCESSED': { color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
            'REJECTED': { color: 'text-red-700 bg-red-100', icon: <XCircle className="w-3 h-3 mr-1" /> },
        };
        const style = config[status] || config['PENDING'];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.color}`}>
                {style.icon} {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <nav className="bg-navy-900 text-white px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <img src={logo} alt="ZOLID" className="h-8 w-auto" />
                <button onClick={fetchData} className="text-white opacity-80 hover:opacity-100">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </nav>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <h1 className="text-2xl font-bold text-navy-900">My Wallet</h1>

                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-2 opacity-90 mb-1">
                        <Wallet className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Available Balance</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-6">{formatCurrency(balance)}</h2>
                    
                    {/* Updated Withdrawal Form */}
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-indigo-100 mb-1 block">Amount (GHS)</label>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full rounded-lg px-3 py-2 text-gray-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-indigo-100 mb-1 block">Network</label>
                                <select 
                                    value={bankCode}
                                    onChange={(e) => setBankCode(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 text-gray-900 focus:outline-none"
                                >
                                    <option value="">Select...</option>
                                    {providers.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-indigo-100 mb-1 block">MoMo Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="tel" 
                                        value={momoNumber}
                                        onChange={(e) => setMomoNumber(e.target.value)}
                                        placeholder="024..."
                                        className="w-full rounded-lg pl-8 pr-3 py-2 text-gray-900 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-indigo-100 mb-1 block">Account Name</label>
                                <div className="relative">
                                    <User className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        value={accountName}
                                        readOnly
                                        placeholder={resolvingName ? "Resolving..." : "Auto-filled"}
                                        className="w-full rounded-lg pl-8 pr-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed focus:outline-none border border-gray-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleWithdraw}
                            disabled={submitting || balance <= 0 || !accountName}
                            className="w-full bg-white text-indigo-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50 mt-2 transition-colors"
                        >
                            {submitting ? 'Processing...' : 'Withdraw Funds'}
                        </button>
                    </div>
                </div>

                {/* History Section (Unchanged) */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-4 text-lg">Transaction History</h3>
                    {loading && history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : history.length === 0 ? (
                        <Card className="text-center py-12 border-dashed">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">No withdrawal history yet.</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {history.map((req) => (
                                <div key={req.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">{formatCurrency(req.amount_pesewas)}</span>
                                            {req.status === 'PENDING' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Manual Review</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">{getStatusBadge(req.status)}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <BottomNavigation items={navItems} />
        </div>
    );
};

export default ClientWalletPage;