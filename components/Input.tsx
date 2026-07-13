import React from 'react';

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
  const baseStyles = "w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all";
  const iconPadding = icon && as === 'input' ? 'pl-10' : '';

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
          <input className={`${baseStyles} ${iconPadding} ${className}`} {...(props as any)} />
        )}
      </div>
      
      {helperText && !error && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};