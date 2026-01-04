// src/services/LocationService.js

/**
 * Converts Latitude and Longitude into a human-readable address.
 * Uses OpenStreetMap (Nominatim) API.
 * * @param {number|string} lat - Latitude (e.g., 9.414167)
 * @param {number|string} lng - Longitude (e.g., -0.839862)
 * @returns {Promise<string>} - The formatted address string.
 */
export const getAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) return "Location pending...";
  
    try {
      // Using OpenStreetMap (Nominatim) - Free, no key required
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'JobAppProject/1.0' // OpenStreetMap requires a User-Agent
        }
      });
  
      const data = await response.json();
  
      if (data && data.display_name) {
        // Returns the full address. 
        // You can also use data.address.city or data.address.suburb for shorter versions.
        return data.display_name; 
      } else {
        return "Address not found";
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Unable to load address";
    }
  };
  
  /**
   * Generates a Google Maps link for directions.
   * Useful for the "Get Directions" button.
   */
  export const getMapLink = (lat, lng) => {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };