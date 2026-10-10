import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, ChevronDown } from 'lucide-react';
import { useSEOStore } from '../store/seoStore';
import { cn } from '../utils/cn';

const presets = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'last-7-days', label: 'Last 7 Days', days: 7 },
  { id: 'last-30-days', label: 'Last 30 Days', days: 30 },
  { id: 'last-90-days', label: 'Last 90 Days', days: 90 },
  { id: 'last-6-months', label: 'Last 6 Months', days: 180 },
  { id: 'year-to-date', label: 'Year to Date', days: 270 }
];

export function DateRangePicker({ className }) {
  const { dateRange, setDateRange } = useSEOStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectPreset = (preset) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - preset.days);

    setDateRange({
      preset: preset.id,
      label: preset.label,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
    setIsOpen(false);
  };

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 inline-flex items-center gap-2 px-3 text-xs font-semibold whitespace-nowrap bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all text-slate-700 dark:text-slate-200 flex-shrink-0 cursor-pointer"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <span className="whitespace-nowrap">{dateRange.label || 'Last 30 Days'}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-56 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Date Range Presets</span>
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">Live</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {presets.map((p) => {
              const isSelected = dateRange.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl transition-all',
                    isSelected
                      ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  )}
                >
                  <span className="whitespace-nowrap">{p.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
