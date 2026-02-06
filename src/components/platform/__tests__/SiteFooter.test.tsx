import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SiteFooter from '../SiteFooter';

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

jest.mock('next/navigation', () => ({
  usePathname: () => '/games/minesweeper',
}));

describe('SiteFooter', () => {
  it('zeigt Impressum-Link und Kontakt-Button', () => {
    render(<SiteFooter />);
    expect(screen.getByText('Impressum')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kontakt' })).toBeInTheDocument();
  });

  it('öffnet das Kontakt-Modal', () => {
    render(<SiteFooter />);
    fireEvent.click(screen.getByRole('button', { name: 'Kontakt' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kontakt' })).toBeInTheDocument();
  });
});
