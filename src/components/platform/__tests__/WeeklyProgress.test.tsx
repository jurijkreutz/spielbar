/**
 * Tests für WeeklyProgress Komponente
 *
 * Prüft:
 * - Soft-Goal Rendering (3-Tage Ziel)
 * - Erfolgstext, Streak-Badge und Info-Tooltip
 * - Ausblenden bei fehlendem LocalStorage
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeeklyProgress } from '../WeeklyProgress';

jest.mock('@/lib/analytics', () => ({
  getWeeklyDailyProgress: jest.fn(),
  DAILY_PROGRESS_EVENT: 'spielbar_daily_progress_updated',
}));

jest.mock('@/lib/safeStorage', () => ({
  useStorageAvailability: jest.fn(),
}));

import { getWeeklyDailyProgress } from '@/lib/analytics';
import { useStorageAvailability } from '@/lib/safeStorage';

const mockGetWeeklyDailyProgress = getWeeklyDailyProgress as jest.Mock;
const mockUseStorageAvailability = useStorageAvailability as jest.Mock;

describe('WeeklyProgress', () => {
  beforeEach(() => {
    mockUseStorageAvailability.mockReturnValue({ local: true, session: true });
    mockGetWeeklyDailyProgress.mockReturnValue({
      count: 0,
      total: 7,
      goal: 3,
      achieved: false,
      weekStreak: 0,
    });
  });

  it('zeigt Fortschritt als "X / 3 Tage gespielt"', async () => {
    mockGetWeeklyDailyProgress.mockReturnValue({
      count: 2,
      total: 7,
      goal: 3,
      achieved: false,
      weekStreak: 1,
    });
    render(<WeeklyProgress />);
    expect(await screen.findByText('2 / 3 Tage gespielt')).toBeInTheDocument();
  });

  it('zeigt Erfolgstext bei erreichtem Ziel', async () => {
    mockGetWeeklyDailyProgress.mockReturnValue({
      count: 3,
      total: 7,
      goal: 3,
      achieved: true,
      weekStreak: 2,
    });
    render(<WeeklyProgress />);
    expect(await screen.findByText('Wochenziel erreicht ✓')).toBeInTheDocument();
  });

  it('zeigt keinen Soft-Reminder-Text mehr wenn Ziel noch offen ist', async () => {
    mockGetWeeklyDailyProgress.mockReturnValue({
      count: 1,
      total: 7,
      goal: 3,
      achieved: false,
      weekStreak: 0,
    });
    render(<WeeklyProgress />);
    expect(await screen.findByText('1 / 3 Tage gespielt')).toBeInTheDocument();
    expect(screen.queryByText('Kein Druck: verpasste Tage sind okay.')).not.toBeInTheDocument();
  });

  it('zeigt Week-Streak Badge', async () => {
    mockGetWeeklyDailyProgress.mockReturnValue({
      count: 3,
      total: 7,
      goal: 3,
      achieved: true,
      weekStreak: 2,
    });
    render(<WeeklyProgress />);
    expect(await screen.findByText('Week Streak: 2 Wochen')).toBeInTheDocument();
  });

  it('zeigt ein Info-Element mit Streak-Erklarung', async () => {
    render(<WeeklyProgress />);
    expect(await screen.findByLabelText('Streak-Erklärung')).toBeInTheDocument();
    expect(
      screen.getByText('Eine Woche zählt, wenn du an mindestens 3 Tagen ein Daily spielst. Verpasste Tage sind okay.')
    ).toBeInTheDocument();
  });

  it('blendet sich aus wenn LocalStorage nicht verfugbar ist', () => {
    mockUseStorageAvailability.mockReturnValue({ local: false, session: true });
    render(<WeeklyProgress />);
    expect(screen.queryByText('Diese Woche')).not.toBeInTheDocument();
  });
});
