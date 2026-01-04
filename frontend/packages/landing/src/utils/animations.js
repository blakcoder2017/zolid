/**
 * Lottie Animation Data
 * 
 * These are placeholder URLs/imports. In production, you would:
 * 1. Download Lottie JSON files from lottiefiles.com
 * 2. Store them in public/animations/ or src/assets/animations/
 * 3. Import them here or fetch them dynamically
 */

// Placeholder animation data structure
// Replace these with actual Lottie JSON imports or API calls

export const ANIMATIONS = {
  // Construction/Work animation
  construction: null, // Will be loaded from public/animations/construction.json
  
  // Payment/Money animation
  payment: null, // Will be loaded from public/animations/payment.json
  
  // Trust/Security animation
  trust: null, // Will be loaded from public/animations/trust.json
  
  // Health/Insurance animation
  health: null, // Will be loaded from public/animations/health.json
  
  // Success/Checkmark animation
  success: null, // Will be loaded from public/animations/success.json
  
  // Loading animation
  loading: null, // Will be loaded from public/animations/loading.json
};

/**
 * Load animation from URL or local file
 * For now, we'll use CDN URLs from lottiefiles.com free animations
 */
export const getAnimationUrl = (animationName) => {
  const animations = {
    construction: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/abc123.json', // Placeholder
    payment: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/def456.json', // Placeholder
    trust: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/ghi789.json', // Placeholder
    health: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/jkl012.json', // Placeholder
    success: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/mno345.json', // Placeholder
    loading: 'https://lottie.host/8e1b3d8e-7c3f-4b5e-9f6a-1d2e3f4a5b6c/pqr678.json', // Placeholder
  };
  
  return animations[animationName] || null;
};

/**
 * Simple animation fallbacks using CSS/emoji when Lottie is not available
 */
export const getFallbackAnimation = (animationName) => {
  const fallbacks = {
    construction: '🏗️',
    payment: '💰',
    trust: '🔒',
    health: '🏥',
    success: '✅',
    loading: '⏳',
  };
  
  return fallbacks[animationName] || '✨';
};
