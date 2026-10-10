import React from 'react';
import { cn } from '../utils/cn';

const variants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700/80',
  primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  outline: 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
};

const sizes = {
  xs: 'text-[10px] px-2 py-0.5 font-bold',
  sm: 'text-[11px] px-2.5 py-0.5 font-semibold',
  md: 'text-xs px-3 py-1 font-semibold',
  lg: 'text-sm px-3.5 py-1.5 font-semibold'
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  dot = false,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-colors',
        variants[variant] || variants.default,
        sizes[size] || sizes.sm,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse',
            variant === 'success' && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]',
            variant === 'danger' && 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]',
            variant === 'warning' && 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]',
            variant === 'primary' && 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]',
            variant === 'info' && 'bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.8)]',
            variant === 'purple' && 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]',
            variant === 'default' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
}
