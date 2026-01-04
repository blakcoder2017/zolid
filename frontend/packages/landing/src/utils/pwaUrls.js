/**
 * PWA URL Configuration
 * 
 * Determines the correct URLs for artisan and client PWAs
 * based on environment (development vs production)
 */

const getPwaBaseUrl = (app) => {
  // Check if we're in development or production
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Development: Use localhost with ports
    const ports = {
      artisan: 3001,
      client: 3002,
    };
    return `http://localhost:${ports[app]}`;
  } else {
    // Production: Use subdomains
    const subdomains = {
      artisan: 'artisan.zolid.com',
      client: 'client.zolid.com',
    };
    return `https://${subdomains[app]}`;
  }
};

export const getArtisanUrl = (path = '') => {
  const baseUrl = getPwaBaseUrl('artisan');
  return `${baseUrl}${path}`;
};

export const getClientUrl = (path = '') => {
  const baseUrl = getPwaBaseUrl('client');
  return `${baseUrl}${path}`;
};

// Common paths
export const PWA_PATHS = {
  artisan: {
    login: '/login',
    signup: '/signup',
    dashboard: '/dashboard',
  },
  client: {
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
  },
};
