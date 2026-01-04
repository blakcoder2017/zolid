import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';
import { BottomNavigation, Button } from '@zolid/shared/components';
import { useAuth } from '@zolid/shared/hooks';
import apiClient from '@zolid/shared/utils/apiClient';
import { Download, Share2, ArrowLeft, ShieldCheck, MapPin, Star, Award } from 'lucide-react';
import logo from '../assets/logos/logo.png'; 

const IdCardPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const cardRef = useRef(null);
    
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ rating: '5.0', completed_jobs: 0 });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // NEW: State for the resolved city name
    const [locationName, setLocationName] = useState("Ghana");

    const profileUrl = `${window.location.origin}/book/${user?.id}`;

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠' },
        { path: '/jobs', label: 'Available', icon: '💼' },
        { path: '/my-jobs?filter=active', label: 'My Jobs', icon: '📋' },
        { path: '/disputes', label: 'Disputes', icon: '⚖️' }, 
        { path: '/wallet', label: 'Wallet', icon: '💰' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profRes = await apiClient.get('/profile/profile');
                setProfile(profRes.data.profile);

                try {
                    const statRes = await apiClient.get('/dashboard/artisan/stats');
                    setStats(statRes.data.stats);
                } catch (statErr) {
                    console.warn("Stats failed, using defaults");
                }
            } catch (error) {
                console.error("Failed to load ID data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- NEW: Resolve Location Name from Coordinates ---
    useEffect(() => {
        if (!profile?.home_gps_address) return;

        const resolveLocation = async () => {
            // Check if the address looks like coordinates (e.g. "5.6037, -0.1870")
            // This Regex checks for: Number, Comma, Number
            const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(profile.home_gps_address);

            if (isCoords) {
                const [lat, lon] = profile.home_gps_address.split(',').map(s => s.trim());
                try {
                    // Use OpenStreetMap Nominatim (Free, No Key Required)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    
                    if (data && data.address) {
                        const addr = data.address;
                        // Find the most relevant city name
                        const city = addr.city || addr.town || addr.suburb || addr.village || addr.county || addr.state;
                        // const country = addr.country || "Ghana";
                        
                        // Set specific location (e.g. "East Legon" or "Kumasi")
                        if (city) setLocationName(city);
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                    // Keep default "Ghana" if fetch fails
                }
            } else {
                // If it's already text (e.g. "Accra, Ghana"), just use the first part
                const textCity = profile.home_gps_address.split(',')[0];
                setLocationName(textCity);
            }
        };

        resolveLocation();
    }, [profile]);

    const getProfilePictureUrl = () => {
        if (!profile?.profile_picture_url) return null;
        if (profile.profile_picture_url.startsWith('http')) return profile.profile_picture_url;
        
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');
        const cleanPath = profile.profile_picture_url.startsWith('/') ? profile.profile_picture_url.substring(1) : profile.profile_picture_url;
        
        return cleanPath.startsWith('uploads/') ? `${BASE_URL}/${cleanPath}` : `${BASE_URL}/uploads/${cleanPath}`;
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: null,
                logging: false,
                onclone: (document) => {
                    const images = document.getElementsByTagName("img");
                    for (let img of images) { img.crossOrigin = "anonymous"; }
                }
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Zolid_ID_${profile?.full_name?.replace(/\s+/g, '_') || 'Artisan'}.png`;
            link.click();
        } catch (err) {
            console.error("ID Generation failed", err);
            alert("Could not generate image. Try refreshing.");
        } finally {
            setGenerating(false);
        }
    };

    const handleShareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Hire ${profile?.full_name} on Zolid`,
                    text: `Check out my verified artisan profile! Rated ${stats.rating} stars.`,
                    url: profileUrl,
                });
            } catch (error) { console.log('Error sharing:', error); }
        } else {
            navigator.clipboard.writeText(profileUrl);
            alert("Link copied!");
        }
    };

    const getMemberYear = () => {
        if (!profile?.created_at) return new Date().getFullYear();
        return new Date(profile.created_at).getFullYear();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading ID...</div>;
    const validImageSrc = getProfilePictureUrl() || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=random`;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <span className="font-bold text-gray-900">Digital ID</span>
                <div className="w-8"></div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
                <div className="text-center mb-2">
                    <h1 className="text-xl font-bold text-navy-900">Verified Artisan ID</h1>
                    <p className="text-gray-500 text-xs">Share this card to build trust with clients.</p>
                </div>

                <div className="flex justify-center">
                    <div 
                        ref={cardRef} 
                        className="relative w-full max-w-[320px] aspect-[0.63] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-navy-900 to-indigo-900 text-white select-none"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                        <div className="p-6 flex justify-between items-start">
                            <img src={logo} alt="Zolid" className="h-5 w-auto brightness-0 invert opacity-90" />
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest">ARTISAN ID</span>
                                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 mt-1">VERIFIED</span>
                            </div>
                        </div>

                        <div className="flex justify-center mt-1 mb-3">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-[3px] border-white/20 p-1 bg-white/5 backdrop-blur-sm overflow-hidden">
                                    <img 
                                        src={validImageSrc} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover bg-gray-800"
                                        crossOrigin="anonymous" 
                                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${profile?.full_name}`; }}
                                    />
                                </div>
                                <div className="absolute bottom-1 right-1 bg-green-500 text-white p-1 rounded-full border-2 border-navy-900 shadow-sm">
                                    <ShieldCheck size={12} strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center px-4 space-y-0.5">
                            <h2 className="text-lg font-bold tracking-wide truncate leading-tight">{profile?.full_name || 'Artisan'}</h2>
                            <p className="text-indigo-200 font-medium uppercase text-[10px] tracking-wider">{profile?.primary_trade || 'General Trade'}</p>
                            
                            {/* UPDATED LOCATION DISPLAY */}
                            <div className="flex justify-center items-center gap-1.5 mt-2 text-[10px] text-white/80 bg-white/10 py-1 px-3 rounded-full inline-flex mx-auto">
                                <MapPin size={10} />
                                <span>{locationName}</span>
                            </div>
                        </div>

                        <div className="mt-5 mx-5 p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 flex justify-between items-center">
                            <div className="text-center flex-1 border-r border-white/10">
                                <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold text-base">
                                    {stats.rating || '5.0'} <Star size={12} fill="currentColor" />
                                </div>
                                <p className="text-[8px] uppercase opacity-60">Rating</p>
                            </div>
                            <div className="text-center flex-1 border-r border-white/10">
                                <div className="font-bold text-base">{stats.completed_jobs || 0}</div>
                                <p className="text-[8px] uppercase opacity-60">Jobs</p>
                            </div>
                            <div className="text-center flex-1">
                                <div className="font-bold text-base text-green-400">T{profile?.tier_level || 1}</div>
                                <p className="text-[8px] uppercase opacity-60">Tier</p>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-navy-950/40 backdrop-blur-sm flex justify-between items-center border-t border-white/5">
                            <div className="text-left">
                                <p className="text-[8px] opacity-50 uppercase tracking-wider">MEMBER SINCE</p>
                                <p className="text-[10px] font-mono font-bold">{getMemberYear()}</p>
                            </div>
                            <div className="bg-white p-1 rounded shadow-sm">
                                <QRCodeCanvas value={profileUrl} size={42} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button onClick={handleDownload} disabled={generating} variant="primary" className="flex items-center justify-center gap-2 h-12">
                        {generating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> : <Download size={18} />}
                        Download
                    </Button>
                    <Button onClick={handleShareLink} variant="outline" className="flex items-center justify-center gap-2 h-12 bg-white">
                        <Share2 size={18} />
                        Share
                    </Button>
                </div>
            </div>

            <BottomNavigation items={navItems} />
        </div>
    );
};

export default IdCardPage;