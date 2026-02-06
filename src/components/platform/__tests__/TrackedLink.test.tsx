/**
 * Tests für TrackedLink Komponente
 *
 * Prüft:
 * - Analytics Dispatch bei Klick
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackedLink } from '../TrackedLink';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, ...props }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    return <a href={href} onClick={onClick} {...props}>{children}</a>;
  };
});

// Mock analytics
const mockTrackFeaturedCardClick = jest.fn();
const mockTrackContinueClick = jest.fn();
const mockTrackExitToOverview = jest.fn();

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackFeaturedCardClick: (...args: unknown[]) => mockTrackFeaturedCardClick(...args),
    trackContinueClick: (...args: unknown[]) => mockTrackContinueClick(...args),
    trackExitToOverview: (...args: unknown[]) => mockTrackExitToOverview(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TrackedLink', () => {
  it('dispatcht featured_card_click Event bei Klick', () => {
    render(
      <TrackedLink href="/games/test" tracking={{ type: 'featured_card_click', slug: 'test-game' }}>
        Klick mich
      </TrackedLink>
    );

    fireEvent.click(screen.getByText('Klick mich'));
    expect(mockTrackFeaturedCardClick).toHaveBeenCalledWith('test-game');
  });

  it('dispatcht continue_click Event bei Klick', () => {
    render(
      <TrackedLink href="/games/test" tracking={{ type: 'continue_click', slug: 'minesweeper' }}>
        Weitermachen
      </TrackedLink>
    );

    fireEvent.click(screen.getByText('Weitermachen'));
    expect(mockTrackContinueClick).toHaveBeenCalledWith('minesweeper');
  });

  it('dispatcht game_exit_to_overview Event bei Klick', () => {
    render(
      <TrackedLink href="/" tracking={{ type: 'game_exit_to_overview', from: 'snake' }}>
        Zurück
      </TrackedLink>
    );

    fireEvent.click(screen.getByText('Zurück'));
    expect(mockTrackExitToOverview).toHaveBeenCalledWith('snake');
  });

  it('rendert Kinder korrekt', () => {
    render(
      <TrackedLink href="/test" tracking={{ type: 'featured_card_click', slug: 'test' }}>
        <span>Kind Element</span>
      </TrackedLink>
    );

    expect(screen.getByText('Kind Element')).toBeInTheDocument();
  });

  it('setzt href korrekt', () => {
    render(
      <TrackedLink href="/games/snake" tracking={{ type: 'featured_card_click', slug: 'snake' }}>
        Link
      </TrackedLink>
    );

    const link = screen.getByText('Link');
    expect(link.closest('a')).toHaveAttribute('href', '/games/snake');
  });
});
