'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DAILY_PROGRESS_EVENT, analytics, getDailyPrimaryTarget } from '@/lib/analytics';
import { useStorageAvailability } from '@/lib/safeStorage';

interface PlayTodayButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
  dynamicTarget?: boolean;
}

export function PlayTodayButton({
  href = '/games/minesweeper/daily',
  className = '',
  children = 'Heute spielen',
  dynamicTarget = true,
}: PlayTodayButtonProps) {
  const availability = useStorageAvailability();
  const [targetHref, setTargetHref] = useState(href);

  useEffect(() => {
    if (!dynamicTarget || !availability.local) {
      return;
    }

    const updateTarget = () => {
      setTargetHref(getDailyPrimaryTarget().href);
    };

    updateTarget();
    window.addEventListener('storage', updateTarget);
    window.addEventListener(DAILY_PROGRESS_EVENT, updateTarget as EventListener);

    return () => {
      window.removeEventListener('storage', updateTarget);
      window.removeEventListener(DAILY_PROGRESS_EVENT, updateTarget as EventListener);
    };
  }, [availability.local, dynamicTarget, href]);

  const handleClick = () => {
    analytics.trackPlayTodayClick();
  };

  return (
    <Link
      href={dynamicTarget && availability.local ? targetHref : href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}
