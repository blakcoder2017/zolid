// src/components/LocationDisplay.jsx
import React, { useState, useEffect } from 'react';
import { getAddressFromMapbox, getStaticMapUrl, getNavigationLink } from '../utils/MapboxService';

/**
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} isArtisan - If true, shows "Get Directions" button
 */
const LocationDisplay = ({ lat, lng, isArtisan = false }) => {
  const [address, setAddress] = useState("Locating...");
  const staticMapUrl = getStaticMapUrl(lat, lng);
  const navLink = getNavigationLink(lat, lng);

  useEffect(() => {
    // 1. Fetch address when coords change
    if (lat && lng) {
      getAddressFromMapbox(lat, lng).then((addr) => setAddress(addr));
    }
  }, [lat, lng]);

  if (!lat || !lng) return null;

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Address Header */}
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-start gap-2">
        <span className="text-xl">📍</span>
        <div>
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Job Location</h4>
          <p className="text-gray-900 font-medium text-sm leading-snug">{address}</p>
        </div>
      </div>

      {/* Map Image */}
      <div className="relative w-full h-48 bg-gray-200">
        <img 
          src={staticMapUrl} 
          alt="Map location" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Artisan Action Button */}
      {isArtisan && (
        <a 
          href={navLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
        >
          Get Directions 🚀
        </a>
      )}
    </div>
  );
};

export default LocationDisplay;