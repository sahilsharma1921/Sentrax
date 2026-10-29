import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-white/10',
    primary: 'bg-indigo-50 dark:bg-primary/15 text-indigo-700 dark:text-primary-hover border-indigo-200 dark:border-primary/30',
    danger: 'bg-red-50 dark:bg-danger/15 text-red-700 dark:text-danger border-red-200 dark:border-danger/30',
    warning: 'bg-amber-50 dark:bg-warning/15 text-amber-800 dark:text-warning border-amber-200 dark:border-warning/30',
    success: 'bg-emerald-50 dark:bg-success/15 text-emerald-800 dark:text-success border-emerald-200 dark:border-success/30',
    info: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  };

  return (
    <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border font-mono tracking-tight ' + styles[variant] + ' ' + className}>
      {children}
    </span>
  );
};