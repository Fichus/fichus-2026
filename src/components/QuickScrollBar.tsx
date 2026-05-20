'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAlbumVisibleGroups } from '@/lib/albumStore';

// Fallback list when the album page hasn't published one yet (initial render).
const DEFAULT_GROUPS = ['FWC', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'CC'];

interface Props {
  onSelect: (group: string) => void;
}

export default function QuickScrollBar({ onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Published by the album page; varies by view mode + filter. Null = default.
  const visibleGroups = useAlbumVisibleGroups();

  const groups = visibleGroups ?? DEFAULT_GROUPS;

  const show = useCallback(() => {
    if (window.scrollY < 100) { setVisible(false); return; }
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', show, { passive: true });
    return () => {
      window.removeEventListener('scroll', show);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [show]);

  const handleSelect = (g: string) => {
    onSelect(g);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1500);
  };

  // If a filter dropped everything, hide the bar entirely — clicking on a group
  // that has nothing to show would just scroll to a missing/hidden header.
  if (groups.length === 0) return null;

  return (
    <div
      // Position uses `svh` (small viewport height) instead of `%` so the bar
      // stays anchored at the same pixel position when the mobile browser's
      // address/toolbar slides in and out. With `top: 50%` the value was
      // re-evaluated against the *current* layout viewport, so each chrome
      // collapse/expand visibly jumped the bar. `svh` is the smallest viewport
      // ignoring chrome — it doesn't change.
      className={`fixed z-40 -translate-y-1/2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        top: '50svh',
        right: 'max(2px, calc((100vw - 480px) / 2 + 2px))',
      }}
    >
      {/*
        Mid-transparent background. 25% was too see-through and the letters
        looked "stamped" awkwardly on the figus behind. 45% keeps the figus
        readable but gives the chip enough body for the letters to anchor on.
        Dropped the text-shadow which was the source of the "raro" look.
      */}
      <div className="flex flex-col items-center gap-0 bg-white/45 dark:bg-zinc-800/45 backdrop-blur-[1px] rounded-full py-1 px-0.5">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => handleSelect(g)}
            className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 hover:text-[#00B8D4] dark:hover:text-[#00B8D4] active:text-[#00B8D4] leading-none py-1 px-2 transition-colors"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
