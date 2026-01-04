import React from 'react';

/**
 * Button Component
 * 
 * Variants:
 * - primary: Coral (Kinetic Coral) - Primary actions
 * - success: Mint (Mint Shield) - Success actions
 * - secondary: Ghost button with border
 * - text: Text link style
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'font-condensed font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-coral-500 hover:bg-coral-600 text-white focus:ring-coral-500',
    success: 'bg-mint-500 hover:bg-mint-600 text-white focus:ring-mint-500',
    secondary: 'border-2 border-navy-500 text-navy-500 hover:bg-navy-50 focus:ring-navy-500',
    text: 'text-indigo-600 hover:text-indigo-700 underline focus:ring-indigo-500',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-10 py-5 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`.trim();
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
