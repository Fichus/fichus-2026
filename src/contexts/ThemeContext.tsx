'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'fichus-theme';

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null = not yet initialized (avoids touching the class before localStorage is read)
  const [theme, setTheme] = useState<Theme | null>(null);

  // On mount: read localStorage (or system preference) and set initial theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    } catch {
      setTheme('light');
    }
  }, []);

  // Apply class only after theme is initialized — never runs with stale 'light' default
  useEffect(() => {
    if (theme === null) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = (theme ?? 'light') === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, next); // save BEFORE state update
    } catch {}
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme: theme ?? 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
