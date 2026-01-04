import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BottomNavigation Component
 * Mobile-first bottom navigation bar with safe area support
 * 
 * @param {Array} items - Array of navigation items with { path, label, icon }
 * @param {string} className - Additional className
 */
const BottomNavigation = ({ items = [], className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-grey-200 z-50 ${className}`}>
      {/* Safe area padding for iOS devices - using utility class from globals.css */}
      <div style={{ paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0px))` }}>
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex flex-col items-center justify-center 
                  flex-1 py-2 px-2 
                  transition-colors duration-200
                  ${active 
                    ? 'text-coral-500' 
                    : 'text-navy-500 hover:text-coral-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 rounded-lg
                `}
                aria-label={item.label}
              >
                {/* Icon */}
                <span className="text-2xl mb-1" aria-hidden="true">
                  {item.icon}
                </span>
                {/* Label */}
                <span className={`text-xs font-condensed font-semibold ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {/* Active indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-coral-500 rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
