'use client';
import React, { useMemo } from 'react';
import { useCollection } from '@/contexts/CollectionContext';
import StickerCard from '@/components/StickerCard';
import { GROUPS, STICKER_MAP } from '@/lib/stickers';
import type { StickerInfo } from '@/lib/types';

const GROUP_KEYS = Object.keys(GROUPS);

interface FavGroup {
  key: string;
  label: string;
  stickers: StickerInfo[];
}

export default function FavoritasPage() {
  const { collection } = useCollection();

  const favorites = useMemo(() => {
    return Object.values(collection)
      .filter((e) => e.is_favorite)
      .map((e) => STICKER_MAP.get(e.sticker_num))
      .filter((s): s is StickerInfo => s !== undefined);
  }, [collection]);

  const grouped = useMemo<FavGroup[]>(() => {
    if (favorites.length === 0) return [];
    const result: FavGroup[] = [];

    // FCW
    const fcw = favorites.filter((s) => s.section === 'fcw');
    if (fcw.length > 0) result.push({ key: 'fcw', label: 'Introducción / Historia', stickers: fcw });

    // Groups A–L
    for (const g of GROUP_KEYS) {
      const grp = favorites.filter((s) => s.section === 'team' && s.group === g);
      if (grp.length > 0) result.push({ key: `group-${g}`, label: `Grupo ${g}`, stickers: grp });
    }

    // CC — Coca-Cola
    const cc = favorites.filter((s) => s.section === 'cc');
    if (cc.length > 0) result.push({ key: 'cc', label: 'Coca-Cola', stickers: cc });

    // Extras
    const extras = favorites.filter((s) => s.section === 'extra');
    if (extras.length > 0) result.push({ key: 'extra', label: 'Extrastickers', stickers: extras });

    return result;
  }, [favorites]);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <p className="text-4xl mb-3">☆</p>
        <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
          Nada por acá todavía
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Tocá la estrella ☆ de cualquier figurita para marcarla como favorita
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 px-0">
        ❤️ Favoritas{' '}
        <span className="text-sm font-normal text-zinc-400">({favorites.length})</span>
      </h1>

      <div className="flex flex-col gap-4">
        {grouped.map(({ key, label, stickers }) => (
          <div key={key}>
            <h2 className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              {label}
            </h2>
            <div className="grid grid-cols-4 gap-1.5">
              {stickers.map((s) => (
                <StickerCard key={s.code} sticker={s} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}
