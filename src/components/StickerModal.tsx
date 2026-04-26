'use client';
import React from 'react';
import type { StickerInfo } from '@/lib/types';
import { useCollection } from '@/contexts/CollectionContext';

interface Props {
  sticker: StickerInfo;
  onClose: () => void;
}

export default function StickerModal({ sticker, onClose }: Props) {
  const { getCount, isFavorite, addSticker, removeSticker, toggleFavorite } = useCollection();
  const count = getCount(sticker.code);
  const favorite = isFavorite(sticker.code);

  const title =
    sticker.section === 'extra'
      ? sticker.extraPlayerName!
      : sticker.section === 'team'
      ? `${sticker.teamName} — ${sticker.role}`
      : sticker.role;

  const subtitle =
    sticker.section === 'extra'
      ? (sticker.extraVariant === 'BASE' ? 'Base' : sticker.extraVariant === 'BRO' ? 'Bronce' : sticker.extraVariant === 'SIL' ? 'Plata' : 'Oro')
      : sticker.code;

  const sectionLabel =
    sticker.section === 'fcw'
      ? 'Introducción / Historia'
      : sticker.section === 'team'
      ? `Grupo ${sticker.group} — ${sticker.teamName}`
      : sticker.section === 'cc'
      ? 'Coca-Cola'
      : 'Extrasticker';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-t-2xl bg-white dark:bg-zinc-900 p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — star on left */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={() => toggleFavorite(sticker.code)}
            className="text-2xl leading-none mt-0.5 flex-shrink-0"
            aria-label="Favorita"
          >
            {favorite ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">{sectionLabel}</p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{title}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#00B8D4]">{count}</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">Tenés</p>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-violet-500">{Math.max(0, count - 1)}</p>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">Repetidas</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => removeSticker(sticker.code)}
            disabled={count <= 0}
            className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white text-2xl font-bold disabled:opacity-30 active:scale-95 transition-transform"
          >
            −
          </button>
          <span className="text-4xl font-bold text-zinc-900 dark:text-white w-10 text-center">
            {count}
          </span>
          <button
            onClick={() => addSticker(sticker.code)}
            className="w-14 h-14 rounded-2xl bg-[#00B8D4] text-white text-2xl font-bold active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
