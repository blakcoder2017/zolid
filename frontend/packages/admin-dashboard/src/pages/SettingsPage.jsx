import React, { useState } from 'react';
import api from '../api/axios'; // Admin axios instance
import { Lock, User, Shield } from 'lucide-react';

const SettingsPage = () => {
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: '' });

        if (formData.new_password !== formData.confirm_password) {
            setStatus({ loading: false, error: 'New passwords do not match', success: '' });
            return;
        }

        if (formData.new_password.length < 6) {
            setStatus({ loading: false, error: 'Password must be at least 6 characters', success: '' });
            return;
        }

        try {
            await api.post('/change-password', {
                old_password: formData.old_password,
                new_password: formData.new_password
            });
            setStatus({ loading: false, error: '', success: 'Password updated successfully' });
            setFormData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setStatus({ 
                loading: false, 
                error: err.response?.data?.message || 'Failed to update password', 
                success: '' 
            });
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-semibold text-gray-800">Security & Authentication</h2>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                        {status.error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                                {status.error}
                            </div>
                        )}
                        {status.success && (
                            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200">
                                {status.success}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    name="old_password"
                                    value={formData.old_password}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={status.loading}
                                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {status.loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {status.loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;