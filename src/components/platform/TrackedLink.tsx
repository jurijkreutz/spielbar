'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { analytics } from '@/lib/analytics';

type Tracking =
  | { type: 'featured_card_click'; slug: string }
  | { type: 'continue_click'; slug: string }
  | { type: 'game_exit_to_overview'; from: string };

type TrackedLinkProps = {
  href: string;
  tracking: Tracking;
  className?: string;
  children: ReactNode;
};

export function TrackedLink({ href, tracking, className, children }: TrackedLinkProps) {
  const handleClick = () => {
    switch (tracking.type) {
      case 'featured_card_click':
        analytics.trackFeaturedCardClick(tracking.slug);
        break;
      case 'continue_click':
        analytics.trackContinueClick(tracking.slug);
        break;
      case 'game_exit_to_overview':
        analytics.trackExitToOverview(tracking.from);
        break;
      default:
        break;
    }
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
