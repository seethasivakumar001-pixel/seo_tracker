import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../utils/cn';
import { Card } from './Card';

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last 30 days',
  icon: Icon,
  iconColor = 'text-indigo-500',
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/50',
  badgeText,
  className
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <Card className={cn('p-5 relative group hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300', className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h3>
            {badgeText && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={cn(
            'p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 transition-transform duration-300 group-hover:scale-110 flex-shrink-0 shadow-xs',
            iconBg,
            iconColor
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center gap-2 text-xs">
          <div
            className={cn(
              'inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md text-[11px]',
              isPositive && 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-850',
              isNegative && 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-850',
              isNeutral && 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
            )}
          >
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />}
            {isNeutral && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
            {changeLabel}
          </span>
        </div>
      )}
    </Card>
  );
}
