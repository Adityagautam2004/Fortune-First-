'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Matches next-themes' own default storage key, so anyone who already has a
// preference saved from before this replacement keeps it.
const STORAGE_KEY = 'theme';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Minimal stand-in for next-themes (attribute="class", defaultTheme="system",
// enableSystem) — next-themes@0.4.6 (latest stable) crashes during static
// prerendering under this Next/React version (a null React reference inside
// its own bundled code), so this reimplements just the class-toggling +
// system-preference + persistence behavior the app actually uses.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let stored: Theme = 'system';
    try {
      stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    } catch {
      // localStorage unavailable (private mode, etc.) — fall back to system.
    }
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');

    if (theme !== 'system') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = getSystemTheme();
      setResolvedTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — theme just won't persist across reloads.
    }
  };

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
