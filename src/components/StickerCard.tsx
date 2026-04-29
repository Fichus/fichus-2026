'use client';
import React, { useCallback } from 'react';
import type { StickerInfo } from '@/lib/types';
import { useCollection } from '@/contexts/CollectionContext';

interface Props {
  sticker: StickerInfo;
}

// Per-variant style for extra stickers (owned = full color, empty = tenue hint)
const EXTRA_STYLES: Record<string, {
  bg: string; text: string; sub: string; btn: string;
  emptyBg: string; emptyText: string; emptySub: string; emptyBtn: string;
}> = {
  BASE: {
    bg:        'bg-violet-200 dark:bg-violet-800',
    text:      'text-violet-900 dark:text-violet-100',
    sub:       'text-violet-700/80 dark:text-violet-200/70',
    btn:       'bg-violet-300/60 dark:bg-violet-600/50 text-violet-900 dark:text-violet-100',
    emptyBg:   'bg-violet-50 dark:bg-violet-950/60',
    emptyText: 'text-violet-300 dark:text-violet-700',
    emptySub:  'text-violet-200 dark:text-violet-800',
    emptyBtn:  'bg-violet-100/70 dark:bg-violet-900/30 text-violet-300 dark:text-violet-700',
  },
  BRO: {
    bg:        'bg-amber-200 dark:bg-amber-700',
    text:      'text-amber-900 dark:text-amber-100',
    sub:       'text-amber-700/80 dark:text-amber-200/70',
    btn:       'bg-amber-300/60 dark:bg-amber-600/50 text-amber-900 dark:text-amber-100',
    emptyBg:   'bg-amber-50 dark:bg-amber-950/60',
    emptyText: 'text-amber-300 dark:text-amber-700',
    emptySub:  'text-amber-200 dark:text-amber-800',
    emptyBtn:  'bg-amber-100/70 dark:bg-amber-900/30 text-amber-300 dark:text-amber-700',
  },
  SIL: {
    bg:        'bg-slate-300 dark:bg-slate-600',
    text:      'text-slate-800 dark:text-slate-100',
    sub:       'text-slate-600/80 dark:text-slate-200/70',
    btn:       'bg-slate-400/50 dark:bg-slate-500/50 text-slate-800 dark:text-slate-100',
    emptyBg:   'bg-slate-100 dark:bg-slate-900/70',
    emptyText: 'text-slate-300 dark:text-slate-600',
    emptySub:  'text-slate-200 dark:text-slate-700',
    emptyBtn:  'bg-slate-200/70 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600',
  },
  ORO: {
    bg:        'bg-yellow-200 dark:bg-yellow-700',
    text:      'text-yellow-900 dark:text-yellow-100',
    sub:       'text-yellow-700/80 dark:text-yellow-200/70',
    btn:       'bg-yellow-300/60 dark:bg-yellow-600/50 text-yellow-900 dark:text-yellow-100',
    emptyBg:   'bg-yellow-50 dark:bg-yellow-950/60',
    emptyText: 'text-yellow-300 dark:text-yellow-700',
    emptySub:  'text-yellow-200 dark:text-yellow-800',
    emptyBtn:  'bg-yellow-100/70 dark:bg-yellow-900/30 text-yellow-300 dark:text-yellow-700',
  },
};

function StickerCard({ sticker }: Props) {
  const { getCount, isFavorite, addSticker, removeSticker, toggleFavorite } = useCollection();
  const count = getCount(sticker.code);
  const favorite = isFavorite(sticker.code);

  const isOwned   = count > 0;
  const isExtra   = sticker.section === 'extra';
  const variant   = sticker.extraVariant ?? 'BASE';
  const extraStyle = EXTRA_STYLES[variant];

  // ── Background ─────────────────────────────────────────────────────────────
  let bgClass: string;
  if (isExtra) {
    bgClass = isOwned ? extraStyle.bg : extraStyle.emptyBg;
  } else if (isOwned) {
    bgClass = 'bg-[#00B8D4]';
  } else {
    bgClass = 'bg-slate-200 dark:bg-zinc-800';
  }

  // ── Text ───────────────────────────────────────────────────────────────────
  let textMain: string;
  let textSub: string;
  if (isExtra) {
    textMain = isOwned ? extraStyle.text : extraStyle.emptyText;
    textSub  = isOwned ? extraStyle.sub  : extraStyle.emptySub;
  } else if (isOwned) {
    textMain = 'text-white';
    textSub  = 'text-white/75';
  } else {
    textMain = 'text-zinc-600 dark:text-zinc-300';
    textSub  = 'text-zinc-500 dark:text-zinc-400';
  }

  // ── Buttons ────────────────────────────────────────────────────────────────
  let btnBg: string;
  let btnText: string;
  let dividerColor: string;
  if (isExtra) {
    const btnStr = isOwned ? extraStyle.btn : extraStyle.emptyBtn;
    btnBg        = btnStr.split(' ').slice(0, 2).join(' ');
    btnText      = btnStr.split(' ').slice(2).join(' ');
    dividerColor = 'text-current opacity-25';
  } else if (isOwned) {
    btnBg        = 'bg-white/20';
    btnText      = 'text-white';
    dividerColor = 'text-white/30';
  } else {
    btnBg        = 'bg-zinc-300/60 dark:bg-zinc-700/70';
    btnText      = 'text-zinc-700 dark:text-zinc-200';
    dividerColor = 'text-zinc-400/60 dark:text-zinc-500/60';
  }

  // ── Tap handler ───────────────────────────────────────────────────────────
  // Long-press to open a detail modal was removed — taps anywhere on the card
  // (except the +/−/heart buttons) just add the sticker.
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      addSticker(sticker.code);
    },
    [addSticker, sticker.code]
  );

  // ── Card content labels ───────────────────────────────────────────────────
  const VARIANT_LABELS: Record<string, string> = { BASE: 'Base', BRO: 'Bronce', SIL: 'Plata', ORO: 'Oro' };
  const mainLabel = isExtra ? (VARIANT_LABELS[variant] ?? variant) : sticker.label;
  const subLabel  = isExtra ? '' : sticker.role;

  return (
    <div
      className={`relative flex flex-col rounded-xl cursor-pointer select-none transition-colors duration-150 ${bgClass} shadow-sm overflow-hidden aspect-[3/4]`}
      onClick={handleClick}
    >
        {/* Fav heart — top-left */}
        <button
          className="absolute top-1 left-1.5 leading-none z-10"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(sticker.code); }}
          aria-label="Favorita"
        >
          {favorite ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              className={isOwned ? `opacity-60 ${textMain}` : 'text-zinc-400 dark:text-zinc-500'}
              stroke="currentColor"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          )}
        </button>

        {/* Repeat badge — top-right dark-cyan circle */}
        {count > 1 && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0D7A8E] text-white text-[9px] font-bold flex items-center justify-center leading-none z-10">
            ×{count - 1}
          </div>
        )}

        {/* Center: main label + sub label */}
        <div className="flex-1 flex flex-col items-center justify-center px-1.5 pt-5 pb-1 gap-0.5">
          <span className={`font-bold text-[13px] leading-tight text-center line-clamp-2 ${textMain}`}>
            {mainLabel}
          </span>
          {subLabel && (
            <span className={`text-[13px] leading-tight text-center ${textSub}`}>
              {subLabel}
            </span>
          )}
        </div>

        {/* Bottom: [−] | [+] rounded-full buttons near edges */}
        <div className="flex items-center px-1.5 pb-1.5 gap-1">
          <button
            className={`flex-1 h-6 rounded-full flex items-center justify-center text-sm font-bold active:opacity-70 z-10 ${btnBg} ${btnText}`}
            onClick={(e) => { e.stopPropagation(); removeSticker(sticker.code); }}
            aria-label="Quitar"
          >
            −
          </button>
          <span className={`text-xs font-light select-none ${dividerColor}`}>|</span>
          <button
            className={`flex-1 h-6 rounded-full flex items-center justify-center text-sm font-bold active:opacity-70 z-10 ${btnBg} ${btnText}`}
            onClick={(e) => { e.stopPropagation(); addSticker(sticker.code); }}
            aria-label="Agregar"
          >
            +
          </button>
      </div>
    </div>
  );
}

export default React.memo(StickerCard);
