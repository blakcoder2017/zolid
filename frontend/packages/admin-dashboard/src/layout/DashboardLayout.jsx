import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, HardHat, Wallet,
    Gavel, Settings, LogOut, Menu, X, ShoppingBag,
    Presentation, Shield, AlertTriangle, Database, BarChart2,ArrowDownCircle,
    Banknote, UserPlus
} from 'lucide-react';
import { useState } from 'react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/withdrawals', label: 'Withdrawals', icon: ArrowDownCircle },
        { path: '/analytics/risk', label: 'Credit & Risk', icon: BarChart2 }, // NEW
        { path: '/analytics/products', label: 'Data Products', icon: Database }, // NEW
        { path: '/artisans', label: 'Artisans', icon: Users },
        { path: '/onboarding/manual', label: 'Onboard Artisan', icon: UserPlus },
        { path: '/clients', label: 'Clients', icon: Users },
        { path: '/disputes', label: 'Disputes', icon: AlertTriangle },
        { path: '/finance', label: 'Finance', icon: Wallet },
        { path: '/riviaco', label: 'Insurance', icon: Shield }, // <--- ADDED THIS
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-navy-50 overflow-hidden">
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-navy-900 text-navy-300 transition-all duration-300 flex flex-col`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-navy-800">
                    {isSidebarOpen ? (
                        <span className="text-xl font-bold text-white tracking-wide">ZOLID<span className="text-indigo-500">.</span></span>
                    ) : (
                        <span className="text-xl font-bold text-indigo-500">Z.</span>
                    )}
                </div>

                <nav className="flex-1 py-6 space-y-1 px-3">
                    {navItems.map((item) => (
                        <NavLink 
                            key={item.path} 
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-3 rounded-lg transition-colors ${
                                    isActive 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'hover:bg-navy-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 min-w-[20px]" />
                            {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-navy-800">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-navy-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="ml-3">Sign Out</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm border-b border-navy-200 flex items-center justify-between px-6">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-navy-100 rounded-md text-navy-600">
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-navy-900">{user?.full_name}</p>
                            <p className="text-xs text-navy-500">{user?.role}</p>
                        </div>
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                            {user?.full_name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;