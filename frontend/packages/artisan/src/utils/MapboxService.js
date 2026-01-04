// src/services/mapboxService.js

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * REVERSE GEOCODING
 * Fetches the human-readable address from Mapbox.
 * Note: Mapbox expects [longitude, latitude].
 */
export const getAddressFromMapbox = async (lat, lng) => {
  if (!lat || !lng) return "Location pending...";

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // features[0] is specific (address), features[1] is usually neighborhood/city
      return data.features[0].place_name;
    }
    return "Address not found";
  } catch (error) {
    console.error("Mapbox Geocoding Error:", error);
    return "Unable to load address";
  }
};

/**
 * STATIC MAP IMAGE URL
 * Generates a URL for a static image of the map with a red pin.
 * Efficient: No interactive map load required.
 */
export const getStaticMapUrl = (lat, lng) => {
  if (!lat || !lng) return "";
  
  // pin-s+ff0000 adds a small red pin at the location
  // Mapbox format: /static/{overlay}/{lon},{lat},{zoom}/{width}x{height}
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},14.5,0/600x300?access_token=${MAPBOX_TOKEN}`;
};

/**
 * GOOGLE MAPS NAVIGATION LINK
 * Universal link to open the user's default map app for navigation.
 */
export const getNavigationLink = (lat, lng) => {
  // Using universal Google Maps intent (works on Android/iOS/Web)
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};