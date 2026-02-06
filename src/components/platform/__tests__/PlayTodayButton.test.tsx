import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlayTodayButton } from '../PlayTodayButton';

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock('@/lib/analytics', () => ({
  DAILY_PROGRESS_EVENT: 'spielbar_daily_progress_updated',
  getDailyPrimaryTarget: jest.fn(),
  analytics: {
    trackPlayTodayClick: jest.fn(),
  },
}));

jest.mock('@/lib/safeStorage', () => ({
  useStorageAvailability: jest.fn(),
}));

import { analytics, getDailyPrimaryTarget } from '@/lib/analytics';
import { useStorageAvailability } from '@/lib/safeStorage';

const mockGetDailyPrimaryTarget = getDailyPrimaryTarget as jest.Mock;
const mockUseStorageAvailability = useStorageAvailability as jest.Mock;
const mockTrackPlayTodayClick = analytics.trackPlayTodayClick as jest.Mock;

describe('PlayTodayButton', () => {
  beforeEach(() => {
    mockUseStorageAvailability.mockReturnValue({ local: true, session: true });
    mockGetDailyPrimaryTarget.mockReturnValue({
      game: 'sudoku',
      href: '/games/sudoku/daily',
    });
    mockTrackPlayTodayClick.mockClear();
  });

  it('nutzt dynamisches Daily-Ziel wenn Storage verfugbar ist', async () => {
    render(<PlayTodayButton>Daily jetzt spielen</PlayTodayButton>);
    const link = await screen.findByRole('link', { name: 'Daily jetzt spielen' });
    expect(link).toHaveAttribute('href', '/games/sudoku/daily');
  });

  it('fallt auf uebergebenes href zuruck wenn Storage nicht verfugbar ist', async () => {
    mockUseStorageAvailability.mockReturnValue({ local: false, session: true });
    render(<PlayTodayButton href="/games/minesweeper/daily">Daily jetzt spielen</PlayTodayButton>);
    const link = await screen.findByRole('link', { name: 'Daily jetzt spielen' });
    expect(link).toHaveAttribute('href', '/games/minesweeper/daily');
  });

  it('trackt Klick auf den CTA', async () => {
    render(<PlayTodayButton>Daily jetzt spielen</PlayTodayButton>);
    const link = await screen.findByRole('link', { name: 'Daily jetzt spielen' });
    fireEvent.click(link);
    expect(mockTrackPlayTodayClick).toHaveBeenCalledTimes(1);
  });
});
