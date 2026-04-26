'use client';
import React, { useRef } from 'react';
import type { FilterType } from '@/lib/types';

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  onScrollToGroup?: (group: string) => void;
  showGroupNav?: boolean;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'missing', label: 'Faltan' },
  { key: 'repeated', label: 'Repes' },
];

const GROUP_KEYS = ['FCW', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'CC'];

export default function FilterBar({
  filter,
  onFilterChange,
  onScrollToGroup,
  showGroupNav = true,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-12 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-100 dark:border-zinc-800">
      {/* Filter buttons — always visible */}
      <div className="flex justify-center gap-2 px-4 pt-3 pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
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

      {/* Group nav with scroll arrows — always visible */}
      {showGroupNav && (
        <div className="flex items-center gap-0.5 px-1 pb-2">
          <button
            onClick={scrollLeft}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-lg font-bold"
            aria-label="Scroll izquierda"
          >
            ‹
          </button>
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto flex gap-1.5 no-scrollbar"
          >
            {GROUP_KEYS.map((g) => (
              <button
                key={g}
                onClick={() => onScrollToGroup?.(g)}
                className="flex-shrink-0 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 active:bg-[#00B8D4] active:text-white transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
          <button
            onClick={scrollRight}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-lg font-bold"
            aria-label="Scroll derecha"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
