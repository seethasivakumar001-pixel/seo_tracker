import React from 'react';
import { Search, Plus } from 'lucide-react';
import { cn } from '../utils/cn';

export function EmptyState({
  icon: Icon = Search,
  title = 'No records found',
  description = 'Try adjusting your filters or search query to find what you are looking for.',
  actionLabel,
  onAction,
  className
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white dark:bg-[#111827] border border-dashed border-slate-200 dark:border-slate-800', className)}>
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
