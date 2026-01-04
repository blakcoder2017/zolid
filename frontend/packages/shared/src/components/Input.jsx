import React from 'react';

/**
 * Input Component
 */
const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputClasses = `
    w-full px-4 py-3 
    border ${error ? 'border-coral-500' : 'border-grey-300'} 
    rounded-lg 
    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();
  
  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2 text-sm font-medium text-navy-700">
          {label}
          {required && <span className="text-coral-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-coral-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-navy-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
