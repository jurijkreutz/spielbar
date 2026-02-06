'use client';

import { useCallback, useId, useState } from 'react';
import { analytics } from '@/lib/analytics';

type InfoTooltipProps = {
  text: string;
  tooltipId: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
};

const alignClasses: Record<NonNullable<InfoTooltipProps['align']>, string> = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
};

export function InfoTooltip({
  text,
  tooltipId,
  className = '',
  align = 'center',
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const openTooltip = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        analytics.trackTooltipOpen(tooltipId);
      }
      return true;
    });
  }, [tooltipId]);

  const closeTooltip = useCallback(() => setOpen(false), []);

  const toggleTooltip = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        analytics.trackTooltipOpen(tooltipId);
      }
      return !prev;
    });
  }, [tooltipId]);

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={openTooltip}
      onMouseLeave={closeTooltip}
      onFocus={openTooltip}
      onBlur={closeTooltip}
    >
      <button
        type="button"
        onClick={toggleTooltip}
        className="h-10 w-10 sm:h-6 sm:w-6 rounded-full border border-zinc-300 text-xs font-bold text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
        aria-label="Info"
        aria-describedby={open ? id : undefined}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute bottom-full mb-2 z-30 w-56 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-xl ${alignClasses[align]}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
