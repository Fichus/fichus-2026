'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

const GROUPS = ['FCW', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'CC'];

interface Props {
  onSelect: (group: string) => void;
}

export default function QuickScrollBar({ onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (window.scrollY < 100) { setVisible(false); return; }
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1500);
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
    // Keep visible briefly after tap
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 800);
  };

  return (
    <div
      className={`fixed z-40 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ right: 'max(2px, calc((100vw - 480px) / 2 + 2px))' }}
    >
      {GROUPS.map((g) => (
        <button
          key={g}
          onClick={() => handleSelect(g)}
          className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-[#00B8D4] dark:hover:text-[#00B8D4] active:text-[#00B8D4] leading-none py-[2px] px-1 transition-colors"
        >
          {g}
        </button>
      ))}
    </div>
  );
}
