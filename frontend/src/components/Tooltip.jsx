import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 50
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + 10;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - 10;
    } else if (position === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2;
    } else {
      // top
      top = rect.top - 8;
      left = rect.left + rect.width / 2;
    }

    setCoords({ top, left });
  };

  const show = () => {
    updatePosition();
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  if (!content) return children;

  const transforms = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2'
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex w-full justify-center"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>

      {isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`
            }}
            className={cn(
              'fixed z-[9999] px-3 py-1.5 text-xs font-bold text-white bg-slate-900/95 dark:bg-[#1e293b]/95 backdrop-blur-md rounded-xl shadow-2xl whitespace-nowrap pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 border border-slate-700/70',
              transforms[position] || transforms.top,
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
