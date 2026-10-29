import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-[#172033] dark:text-gray-300">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#596579] dark:text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={'w-full rounded-xl bg-white dark:bg-dark-surface text-[#172033] dark:text-gray-100 placeholder:text-[#596579]/60 dark:placeholder:text-gray-500 border border-[#E1E5EE] dark:border-dark-border focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
            (error ? 'border-danger focus:ring-danger ' : '') +
            (Icon ? 'pl-10 ' : 'pl-3.5 ') +
            'pr-4 py-2.5 text-sm transition-colors focus:outline-none ' + className}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
    </div>
  );
};