import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size,
  maxWidth = 'max-w-xl',
  className
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = size && SIZE_MAP[size] ? SIZE_MAP[size] : maxWidth;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Positioning wrapper: min-h-full ensures proper vertical centering */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        {/* Modal Dialog */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'relative w-full my-auto flex flex-col max-h-[calc(100vh-2.5rem)] bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 focus:outline-none pointer-events-auto',
            widthClass,
            className
          )}
        >
          {/* Header */}
          {(title || onClose) && (
            <div className="shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-white dark:bg-[#111827]">
              <div className="min-w-0 flex-1">
                {title && (
                  <h3 id="modal-headline" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {description}
                  </p>
                )}
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-[#0062ff] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
            {children}
          </div>

          {/* Optional Fixed Footer */}
          {footer && (
            <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
