// import apiClient from '@zolid/shared/utils/apiClient';

// /**
//  * Fetches mobile money providers from the backend
//  * @returns {Promise<Array>} Array of provider objects with provider_name and provider_code
//  */
// export const fetchMomoProviders = async () => {
//   try {
//     const response = await apiClient.get('/identity/momo-providers');
//     return response.data.providers;
//   } catch (error) {
//     console.error('Error fetching momo providers:', error);
//     // Fallback to hardcoded values if API fails
//     return [
//       { provider_name: 'MTN', provider_code: 'mtn' },
//       { provider_name: 'Telecel', provider_code: 'vod' },
//       { provider_name: 'ATMoney', provider_code: 'atl' }

  
//     ];
//   }
// };

// /**
//  * Gets provider code for a given provider name
//  * @param {string} providerName - The provider name
//  * @param {Array} providers - Array of provider objects
//  * @returns {string|null} The provider code or null if not found
//  */
// export const getProviderCode = (providerName, providers) => {
//   if (!providerName || !providers || providers.length === 0) return null;
  
//   const provider = providers.find(p => 
//     p.provider_name.toUpperCase() === providerName.toUpperCase()
//   );
  
//   return provider ? provider.provider_code : null;
// };

import apiClient from '@zolid/shared/utils/apiClient';

/**
 * Fetches mobile money providers from the backend
 * Now syncs directly with Paystack's live codes via the backend
 * @returns {Promise<Array>} Array of provider objects with provider_name and provider_code
 */
export const fetchMomoProviders = async () => {
  try {
    const response = await apiClient.get('/identity/momo-providers');
    
    // Sort them alphabetically for better UI (MTN, Telecel, Vodafone, etc.)
    return response.data.providers.sort((a, b) => 
      a.provider_name.localeCompare(b.provider_name)
    );
  } catch (error) {
    console.warn('Backend provider fetch failed, using frontend fallback:', error);
    
    // Fallback: Matches the structure returned by PaystackService.fetchGhanaMomoBankCodes()
    // Using Uppercase codes (MTN, VOD, ATL) to match Paystack's standard
    return [
      { provider_name: 'MTN', provider_code: 'MTN' },
      { provider_name: 'Telecel', provider_code: 'VOD' },     // Telecel uses Vodafone code
      { provider_name: 'Vodafone', provider_code: 'VOD' },    // Legacy support
      { provider_name: 'AirtelTigo', provider_code: 'ATL' },  // Standard name
      { provider_name: 'ATMoney', provider_code: 'ATL' }      // Alias
    ];
  }
};

/**
 * Gets provider code for a given provider name
 * @param {string} providerName - The provider name (e.g., "Telecel")
 * @param {Array} providers - Array of provider objects
 * @returns {string|null} The provider code (e.g., "VOD") or null if not found
 */
export const getProviderCode = (providerName, providers) => {
  if (!providerName || !providers || providers.length === 0) return null;
  
  // 1. Try Exact Match first
  const exactMatch = providers.find(p => 
    p.provider_name.toUpperCase() === providerName.toUpperCase()
  );
  if (exactMatch) return exactMatch.provider_code;

  // 2. Try Fuzzy Match (e.g., if user selected "Vodafone Ghana" but we have "Vodafone")
  const fuzzyMatch = providers.find(p => 
    providerName.toUpperCase().includes(p.provider_name.toUpperCase()) ||
    p.provider_name.toUpperCase().includes(providerName.toUpperCase())
  );

  return fuzzyMatch ? fuzzyMatch.provider_code : null;
};