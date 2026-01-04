import React from 'react';
import Lottie from 'lottie-react';

/**
 * LottieAnimation Component
 * 
 * @param {string} animationData - Lottie JSON animation data
 * @param {number} height - Height in pixels (default: 300)
 * @param {number} width - Width in pixels (default: 'auto')
 * @param {boolean} loop - Whether to loop animation (default: true)
 * @param {boolean} autoplay - Whether to autoplay (default: true)
 */
const LottieAnimation = ({ 
  animationData, 
  height = 300, 
  width = 'auto',
  loop = true,
  autoplay = true,
  className = ''
}) => {
  if (!animationData) {
    // Fallback placeholder
    return (
      <div 
        className={`flex items-center justify-center bg-grey-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-grey-400 text-sm">Animation Loading...</div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height, width }}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ height, width }}
      />
    </div>
  );
};

export default LottieAnimation;
