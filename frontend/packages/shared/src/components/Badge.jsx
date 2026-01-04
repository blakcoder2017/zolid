import React from 'react';
import { JOB_STATE_COLORS, JOB_STATE_LABELS } from '../constants';

/**
 * Badge Component
 * 
 * Variants:
 * - state: Uses job state colors
 * - coral: Kinetic Coral
 * - mint: Mint Shield
 * - indigo: Electric Indigo
 * - grey: Steel Grey
 */
const Badge = ({
  children,
  variant = 'grey',
  state, // Job state (overrides variant if provided)
  className = '',
  ...props
}) => {
  // If state is provided, use job state colors
  const colorVariant = state ? JOB_STATE_COLORS[state] : variant;
  const label = state ? JOB_STATE_LABELS[state] : children;
  
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
  
  const variants = {
    coral: 'bg-coral-100 text-coral-700',
    mint: 'bg-mint-100 text-mint-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    grey: 'bg-grey-200 text-navy-700',
  };
  
  const classes = `${baseClasses} ${variants[colorVariant]} ${className}`.trim();
  
  return (
    <span className={classes} {...props}>
      {label || children}
    </span>
  );
};

export default Badge;
