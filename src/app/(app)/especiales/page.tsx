'use client';
import React from 'react';
import StickerCard from '@/components/StickerCard';
import GuestLock from '@/components/GuestLock';
import { getExtraStickers, EXTRA_PLAYERS, EXTRA_VARIANTS } from '@/lib/stickers';
import { useCollection } from '@/contexts/CollectionContext';

export default function EspecialesPage() {
  const { getCount, isGuest } = useCollection();
  const allExtras = getExtraStickers();

  if (isGuest) {
    return (
      <GuestLock>
        <div className="px-3 pt-4">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">⭐ Extrastickers</h1>
        </div>
      </GuestLock>
    );
  }

  return (
    <div className="px-3 pt-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">⭐ Extrastickers</h1>

      {EXTRA_PLAYERS.map((playerName, idx) => {
        const playerStickers = allExtras.filter((s) => s.extraIndex === idx + 1);
        const owned = playerStickers.filter((s) => getCount(s.code) > 0).length;

        return (
          <div key={idx} className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">
                {playerName}
              </h2>
              <span className="text-xs text-zinc-400">{owned}/4</span>
            </div>

            {/* 4 variant cards in a row */}
            <div className="grid grid-cols-4 gap-1.5">
              {EXTRA_VARIANTS.map((variant) => {
                const sticker = playerStickers.find((s) => s.extraVariant === variant);
                if (!sticker) return null;
                return <StickerCard key={sticker.code} sticker={sticker} />;
              })}
            </div>
          </div>
        );
      })}

      <div className="h-4" />
    </div>
  );
}
