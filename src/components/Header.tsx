'use client';
import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAlbumFilter, scrollToGroup } from '@/lib/albumStore';
import type { FilterType } from '@/lib/types';

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'missing', label: 'Faltan' },
  { key: 'repeated', label: 'Repes' },
];

const GROUP_KEYS = ['FCW', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'CC'];

export default function Header() {
  const { toggleTheme } = useTheme();
  const pathname = usePathname();
  const isAlbum = pathname === '/album';
  const [filter, setFilter] = useAlbumFilter();
  const groupScrollRef = useRef<HTMLDivElement>(null);

  const scrollGroupsLeft = () => groupScrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
  const scrollGroupsRight = () => groupScrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' });

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      {/* Row 1: Brand + theme toggle */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-1.5">
          <div className="font-bold text-base text-zinc-900 dark:text-white tracking-tight">
            Fichus<span className="text-[#00B8D4]">2026</span>
          </div>
          <div className="text-[9px] font-bold bg-[#00B8D4] text-white px-1.5 py-0.5 rounded-sm leading-none">
            BETA
          </div>
        </div>
        {/*
          No JS conditional on `theme` — both icons always in the DOM.
          Tailwind dark: classes control visibility via CSS.
          Server and client produce identical HTML → zero hydration mismatch.
        */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          aria-label="Cambiar tema"
        >
          <span className="dark:hidden"><MoonIcon /></span>
          <span className="hidden dark:inline-flex"><SunIcon /></span>
        </button>
      </div>

      {/* Rows 2 + 3: only on the album page */}
      {isAlbum && (
        <>
          {/* Row 2: Filter pills */}
          <div className="flex justify-center gap-2 px-4 pb-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-[#00B8D4] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Row 3: Group nav with ‹ › arrows */}
          <div className="flex items-center gap-0.5 px-1 pb-2">
            <button
              onClick={scrollGroupsLeft}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-lg font-bold"
              aria-label="Anterior"
            >
              ‹
            </button>
            <div
              ref={groupScrollRef}
              className="flex-1 overflow-x-auto flex gap-1.5 no-scrollbar"
            >
              {GROUP_KEYS.map((g) => (
                <button
                  key={g}
                  onClick={() => scrollToGroup(g)}
                  className="flex-shrink-0 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 active:bg-[#00B8D4] active:text-white transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
            <button
              onClick={scrollGroupsRight}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-lg font-bold"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </>
      )}
    </header>
  );
}
