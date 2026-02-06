'use client';

import { useState, useEffect } from 'react';
import { readStorage, writeStorage } from '@/lib/safeStorage';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sudoku-theme';

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStorage('local', THEME_STORAGE_KEY) as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark')) {
      setThemeState(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      // Prüfe System-Präferenz
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    writeStorage('local', THEME_STORAGE_KEY, newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme, mounted };
}

export function DarkModeToggle() {
  const { theme, toggleTheme, mounted } = useDarkMode();

  if (!mounted) {
    return (
      <button
        className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center"
        aria-label="Theme umschalten"
      >
        <span className="text-lg">🌙</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
      aria-label={theme === 'light' ? 'Zu Dark Mode wechseln' : 'Zu Light Mode wechseln'}
    >
      <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
    </button>
  );
}
