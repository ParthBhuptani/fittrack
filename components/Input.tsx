import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  as?: 'input' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  as = 'input', 
  className = '', 
  options,
  icon,
  helperText,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const baseStyles = "w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all";
  const iconPadding = icon && as === 'input' ? 'pl-10' : '';

  const isPassword = as === 'input' && props.type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : props.type;
  const passwordPadding = isPassword ? 'pr-10' : '';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      
      <div className="relative">
        {icon && as === 'input' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}

        {as === 'select' ? (
          <select className={`${baseStyles} ${className}`} {...(props as any)}>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : as === 'textarea' ? (
          <textarea className={`${baseStyles} ${className}`} rows={3} {...(props as any)} />
        ) : (
          <input
            className={`${baseStyles} ${iconPadding} ${passwordPadding} ${className}`}
            {...(props as any)}
            type={resolvedType}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      
      {helperText && !error && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};