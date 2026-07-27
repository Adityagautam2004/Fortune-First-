'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                : 'border-white/10 hover:border-white/20'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
