import React from 'react';

/**
 * Card Component
 * 
 * Variants:
 * - default: White card with shadow
 * - navy: Deep navy background (for finance cards)
 * - status: Colored status card (coral/mint)
 */
const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'rounded-xl p-6';
  
  const variants = {
    default: 'bg-white shadow-sm border border-grey-200',
    navy: 'bg-navy-900 text-white',
    'status-coral': 'bg-coral-50 border-l-4 border-coral-500',
    'status-mint': 'bg-mint-50 border-l-4 border-mint-500',
  };
  
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${clickableClass} ${className}`.trim();
  
  return (
    <div
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
