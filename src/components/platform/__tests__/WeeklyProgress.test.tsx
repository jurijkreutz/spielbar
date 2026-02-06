/**
 * Tests für WeeklyProgress Komponente
 *
 * Prüft:
 * - Streak-Text-Rendering basierend auf Anzahl
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WeeklyProgress } from '../WeeklyProgress';

jest.mock('@/lib/analytics', () => ({
  getWeeklyDailyProgress: jest.fn(),
}));

import { getWeeklyDailyProgress } from '@/lib/analytics';

const mockGetWeeklyDailyProgress = getWeeklyDailyProgress as jest.Mock;

describe('WeeklyProgress', () => {
  it('zeigt "Noch kein Daily gespielt" bei count 0', () => {
    mockGetWeeklyDailyProgress.mockReturnValue({ count: 0, total: 7 });
    render(<WeeklyProgress />);
    expect(screen.getByText('Noch kein Daily gespielt.')).toBeInTheDocument();
  });

  it('zeigt "Du hast an X Tagen gespielt" bei count 1-6', () => {
    mockGetWeeklyDailyProgress.mockReturnValue({ count: 3, total: 7 });
    render(<WeeklyProgress />);
    expect(screen.getByText('Du hast an 3 Tagen gespielt.')).toBeInTheDocument();
  });

  it('zeigt "Starke Woche: 7/7" bei count 7', () => {
    mockGetWeeklyDailyProgress.mockReturnValue({ count: 7, total: 7 });
    render(<WeeklyProgress />);
    expect(screen.getByText('Starke Woche: 7/7.')).toBeInTheDocument();
  });

  it('zeigt "Diese Woche" Label', () => {
    mockGetWeeklyDailyProgress.mockReturnValue({ count: 0, total: 7 });
    render(<WeeklyProgress />);
    expect(screen.getByText('Diese Woche')).toBeInTheDocument();
  });
});
