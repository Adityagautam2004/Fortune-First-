'use client';

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 appearance-none cursor-pointer ${
            error
              ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
              : 'border-white/10 hover:border-white/20'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#111827] text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
