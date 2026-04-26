'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    const theme = localStorage.getItem('fichus-theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return null;
}
