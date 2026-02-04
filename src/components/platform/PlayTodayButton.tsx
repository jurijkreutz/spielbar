'use client';

import Link from 'next/link';
import { analytics } from '@/lib/analytics';

interface PlayTodayButtonProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PlayTodayButton({
  href = '/games/minesweeper/daily',
  className = '',
  children = 'Heute spielen',
}: PlayTodayButtonProps) {
  const handleClick = () => {
    analytics.trackPlayTodayClick();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  );
}

