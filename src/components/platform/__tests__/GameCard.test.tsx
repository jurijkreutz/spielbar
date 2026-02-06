/**
 * Tests für GameCard Komponente
 *
 * Prüft:
 * - Badge-Rendering
 * - Description Fallback-Logik
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameCard } from '../GameCard';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

const baseGame = {
  id: '1',
  name: 'Test Game',
  slug: 'minesweeper',
  shortDescription: 'DB Short Description',
  longDescription: 'DB Long Description',
  thumbnail: null,
  continueBackground: null,
  status: 'published',
  badge: null,
  featured: false,
  homeFeatured: false,
  sortOrder: 0,
  gameComponent: 'Minesweeper',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GameCard', () => {
  it('rendert den Spielnamen', () => {
    render(<GameCard game={baseGame as any} />);
    expect(screen.getByText('Test Game')).toBeInTheDocument();
  });

  it('zeigt Badge wenn vorhanden', () => {
    const game = { ...baseGame, badge: 'Neu' };
    render(<GameCard game={game as any} />);
    expect(screen.getByText('Neu')).toBeInTheDocument();
  });

  it('zeigt Featured Badge wenn featured', () => {
    const game = { ...baseGame, featured: true };
    render(<GameCard game={game as any} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('nutzt GAME_DESCRIPTIONS Fallback statt DB-Beschreibung', () => {
    render(<GameCard game={baseGame as any} />);
    // minesweeper hat eine Beschreibung in GAME_DESCRIPTIONS
    expect(screen.getByText('Der Klassiker, der sofort klickt.')).toBeInTheDocument();
  });

  it('fällt auf DB-Beschreibung zurück für unbekannte Slugs', () => {
    const game = { ...baseGame, slug: 'unknown-game', shortDescription: 'Fallback Text' };
    render(<GameCard game={game as any} />);
    expect(screen.getByText('Fallback Text')).toBeInTheDocument();
  });

  it('zeigt "Spielen →" Link', () => {
    render(<GameCard game={baseGame as any} />);
    expect(screen.getByText('Spielen →')).toBeInTheDocument();
  });

  it('rendert Long Description wenn showLongDescription=true', () => {
    render(<GameCard game={baseGame as any} showLongDescription={true} />);
    // minesweeper hat eine long description in GAME_DESCRIPTIONS
    const longDesc = 'Der Klassiker, der sofort klickt. Decke alle sicheren Felder auf, ohne eine Mine zu erwischen';
    expect(screen.getByText((content) => content.includes('Decke alle sicheren Felder auf'))).toBeInTheDocument();
  });
});
