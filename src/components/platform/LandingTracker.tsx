'use client';

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';

export function LandingTracker() {
  useEffect(() => {
    analytics.trackLandingView();
  }, []);

  return null;
}

