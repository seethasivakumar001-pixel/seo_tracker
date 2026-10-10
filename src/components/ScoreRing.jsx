import React from 'react';
import { cn } from '../utils/cn';

export function ScoreRing({
  score = 80,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label = 'SEO Health',
  sublabel = '',
  className,
  showGrade = false
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color theme
  let color = '#10b981'; // emerald
  let bgColor = 'text-emerald-500';
  let grade = 'A';

  if (score < 60) {
    color = '#ef4444'; // rose
    bgColor = 'text-rose-500';
    grade = 'Needs Work';
  } else if (score < 80) {
    color = '#f59e0b'; // amber
    bgColor = 'text-amber-500';
    grade = 'Good';
  } else if (score >= 90) {
    grade = 'Excellent';
  }

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {score}
            <span className="text-xs text-slate-400 font-normal">/{max}</span>
          </span>
          {showGrade && (
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', bgColor)}>
              {grade}
            </span>
          )}
        </div>
      </div>

      {(label || sublabel) && (
        <div className="mt-2 text-center">
          {label && <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>}
          {sublabel && <p className="text-[11px] text-slate-400">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
