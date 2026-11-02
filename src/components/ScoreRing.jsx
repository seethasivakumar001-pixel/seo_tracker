import React from 'react';
import { cn } from '../utils/cn';

export const getAuditGrade = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return 'A';
  if (s >= 75) return 'B';
  if (s >= 60) return 'C';
  if (s >= 40) return 'D';
  return 'F';
};

export const getAuditScoreColor = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return { stroke: '#10b981', text: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
  if (s >= 50) return { stroke: '#f97316', text: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' };
  return { stroke: '#ef4444', text: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' };
};

export function ScoreRing({
  score = 80,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label = 'SEO Health',
  sublabel = '',
  className,
  showGrade = false,
  useLetterGrades = false,
  customGrade,
  customColor,
  customBgColor
}) {
  const isUntested = score === null || score === undefined || score === '' || score === '—' || isNaN(Number(score));
  const numericScore = isUntested ? 0 : Number(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = isUntested ? 0 : Math.min(100, Math.max(0, (numericScore / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color theme
  let color = customColor || '#94a3b8'; // slate for untested
  let bgColor = customBgColor || 'text-slate-400';
  let grade = customGrade || 'Not Tested';

  if (!isUntested && !customColor) {
    if (useLetterGrades) {
      const theme = getAuditScoreColor(numericScore);
      const letter = getAuditGrade(numericScore);
      color = theme.stroke;
      bgColor = theme.text;
      grade = customGrade || `Grade ${letter}`;
    } else {
      if (numericScore < 60) {
        color = '#ef4444'; // rose
        bgColor = 'text-rose-500';
        grade = 'Needs Work';
      } else if (numericScore < 80) {
        color = '#f59e0b'; // amber
        bgColor = 'text-amber-500';
        grade = 'Good';
      } else {
        color = '#10b981'; // emerald
        bgColor = 'text-emerald-500';
        grade = 'Excellent';
      }
    }
  } else if (!isUntested && customGrade) {
    grade = customGrade;
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
            {isUntested ? '—' : numericScore}
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
