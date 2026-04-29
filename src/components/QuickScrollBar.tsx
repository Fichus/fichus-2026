'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAlbumVisibleGroups } from '@/lib/albumStore';

const ALL_GROUPS = ['FCW', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'CC'];

interface Props {
  onSelect: (group: string) => void;
}

export default function QuickScrollBar({ onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // null = no filter active → show everything; Set = restrict to these groups.
  const visibleGroups = useAlbumVisibleGroups();

  const groups = visibleGroups
    ? ALL_GROUPS.filter((g) => visibleGroups.has(g))
    : ALL_GROUPS;

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
      className={`fixed z-40 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ right: 'max(2px, calc((100vw - 480px) / 2 + 2px))' }}
    >
      <div className="flex flex-col items-center gap-0 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full py-1 px-0.5 shadow-sm">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => handleSelect(g)}
            className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#00B8D4] dark:hover:text-[#00B8D4] active:text-[#00B8D4] leading-none py-1 px-2 transition-colors"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
