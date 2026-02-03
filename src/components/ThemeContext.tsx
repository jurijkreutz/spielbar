'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'classic' | 'pulse';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'minesweeper-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('classic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'classic' || stored === 'pulse')) {
      setThemeState(stored);
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'classic' ? 'pulse' : 'classic');
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Standalone Theme Toggle Button Component (ohne Context)
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('classic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'classic' || stored === 'pulse')) {
      setTheme(stored);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'classic' ? 'pulse' : 'classic';
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-700"
        disabled
      >
        <span className="w-2 h-2 rounded-full bg-zinc-400" />
        Classic
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
      title={theme === 'classic' ? 'Zu Color Pulse wechseln' : 'Zu Classic wechseln'}
    >
      {theme === 'classic' ? (
        <>
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          Classic
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" />
          Pulse
        </>
      )}
    </button>
  );
}

