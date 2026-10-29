import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-glow focus:ring-primary',
    danger: 'bg-danger text-white hover:bg-danger-hover shadow-glow-danger focus:ring-danger',
    outline: 'border border-[#E1E5EE] dark:border-dark-border text-[#172033] dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 focus:ring-primary shadow-sm dark:shadow-none',
    secondary: 'bg-white dark:bg-dark-surface text-[#172033] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-surfaceHover border border-[#E1E5EE] dark:border-dark-border shadow-sm',
    ghost: 'text-[#596579] dark:text-gray-400 hover:text-[#172033] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={base + ' ' + sizes[size] + ' ' + variants[variant] + ' ' + className}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      <span>{children}</span>
    </button>
  );
};