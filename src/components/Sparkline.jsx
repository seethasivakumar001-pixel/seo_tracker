import React from 'react';
import { cn } from '../utils/cn';

export function Sparkline({
  data = [],
  width = 110,
  height = 32,
  isRank = true, // for rankings, lower position (1) is better
  className
}) {
  if (!data || data.length < 2) {
    return <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 3;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    // If isRank, smaller value = top of sparkline
    const normalized = isRank ? (val - min) / range : 1 - (val - min) / range;
    const y = padding + normalized * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Determine trend color
  const first = data[0];
  const last = data[data.length - 1];
  const improved = isRank ? last < first : last > first;
  const declined = isRank ? last > first : last < first;

  let strokeColor = '#6366f1'; // neutral/indigo
  if (improved) strokeColor = '#10b981'; // emerald
  else if (declined) strokeColor = '#ef4444'; // rose

  return (
    <div className={cn('inline-flex items-center', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={points.split(' ').pop().split(',')[0]}
            cy={points.split(' ').pop().split(',')[1]}
            r="2.5"
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
}
