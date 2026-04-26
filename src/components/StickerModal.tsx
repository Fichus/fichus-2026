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
              <span className="text-yellow-400">★</span>
            ) : (
              <span className="text-zinc-300 dark:text-zinc-600">☆</span>
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
