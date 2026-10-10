import React from 'react';
import { cn } from '../utils/cn';

export function Card({ className, children, glow = true, ...props }) {
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-[#0f172a]/95 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-200 overflow-hidden',
        glow && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-indigo-500/30 dark:before:via-indigo-400/25 before:to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-3.5 bg-slate-50/60 dark:bg-[#0a0f1d]/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
}
