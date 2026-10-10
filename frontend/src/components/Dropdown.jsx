import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../utils/cn';

export function Dropdown({
  trigger,
  items = [],
  value,
  onChange,
  align = 'left',
  width = 'w-56',
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
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

  const handleSelect = (item) => {
    onChange?.(item.value !== undefined ? item.value : item);
    item.onClick?.();
    setIsOpen(false);
  };

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            type="button"
            className="inline-flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200"
          >
            <span>{items.find((i) => i.value === value)?.label || 'Select option'}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute mt-1.5 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800/60',
            width,
            alignments[align]
          )}
        >
          <div className="py-1 px-1">
            {items.map((item, idx) => {
              if (item.divider) {
                return <div key={idx} className="my-1 border-t border-slate-100 dark:border-slate-800" />;
              }

              const isSelected = item.value !== undefined && item.value === value;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-2 transition-colors',
                    item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                    isSelected ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40' : 'text-slate-700 dark:text-slate-300',
                    item.danger && 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.icon && <item.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
