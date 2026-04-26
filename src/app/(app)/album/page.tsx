'use client';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCollection } from '@/contexts/CollectionContext';
import StickerCard from '@/components/StickerCard';
import TeamSection from '@/components/TeamSection';
import {
  GROUPS,
  getFCWStickers,
  getCCStickers,
  getTeamStickers,
} from '@/lib/stickers';
import { useAlbumFilter, registerScrollToGroup } from '@/lib/albumStore';
import QuickScrollBar from '@/components/QuickScrollBar';
import type { StickerInfo } from '@/lib/types';

export default function AlbumPage() {
  const { getCount, collection } = useCollection();
  const [filter] = useAlbumFilter();
  const [search, setSearch] = React.useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const fcwStickers = useMemo(() => getFCWStickers(), []);
  const ccStickers  = useMemo(() => getCCStickers(), []);

  const scrollToGroupFn = useCallback((group: string) => {
    const el = sectionRefs.current[group];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Register with the album store so the sticky Header's group nav buttons work
  useEffect(() => {
    registerScrollToGroup(scrollToGroupFn);
    return () => registerScrollToGroup(null);
  }, [scrollToGroupFn]);

  const applyFilter = useCallback(
    (stickers: StickerInfo[]): StickerInfo[] => {
      let result = stickers;
      if (filter === 'missing')  result = result.filter((s) => getCount(s.code) === 0);
      if (filter === 'repeated') result = result.filter((s) => getCount(s.code) > 1);
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter(
          (s) =>
            s.code.toLowerCase().includes(q) ||
            s.role.toLowerCase().includes(q) ||
            s.teamName?.toLowerCase().includes(q) ||
            s.label.toLowerCase().includes(q)
        );
      }
      return result;
    },
    [filter, search, getCount, collection] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visibleFCW = useMemo(() => applyFilter(fcwStickers), [applyFilter, fcwStickers]);
  const visibleCC  = useMemo(() => applyFilter(ccStickers),  [applyFilter, ccStickers]);

  const registerRef = (key: string) => (el: HTMLElement | null) => {
    sectionRefs.current[key] = el;
  };

  const hasSearch = search.trim().length > 0;
  const hasFilter = filter !== 'all';

  return (
    <div>
      {/* Search — scrollable, sits above FCW */}
      <div className="px-3 pt-3 pb-1">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar jugador, código…"
          className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
        />
      </div>

      {/* FCW Section */}
      <div ref={registerRef('FCW')} className="px-3 mb-2 mt-2 scroll-mt-40">
        <h2 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 mb-2 px-1">
          🌍 FCW — Introducción &amp; Historia
        </h2>
        {visibleFCW.length > 0 ? (
          <div className="grid grid-cols-4 gap-1.5">
            {visibleFCW.map((s) => (
              <StickerCard key={s.code} sticker={s} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-zinc-400 px-1 py-2">Sin resultados</p>
        )}
      </div>

      {/* Groups A–L */}
      {Object.entries(GROUPS).map(([groupId, teams]) => (
        <div key={groupId}>
          <div
            ref={registerRef(groupId)}
            className="px-4 py-2 mt-2 bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 scroll-mt-40"
          >
            <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              Grupo {groupId}
            </span>
          </div>
          {teams.map((team) => {
            const teamStickerInfos = getTeamStickers(team.code);
            const filtered = applyFilter(teamStickerInfos);
            const visibleSet =
              hasFilter || hasSearch
                ? new Set(filtered.map((s) => s.code))
                : null;
            return (
              <TeamSection
                key={team.code}
                team={team}
                visibleCodes={visibleSet}
              />
            );
          })}
        </div>
      ))}

      {/* CC — Coca-Cola Section */}
      <div ref={registerRef('CC')} className="px-3 mb-2 mt-3 scroll-mt-40">
        <h2 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 mb-2 px-1">
          🥤 Coca-Cola
        </h2>
        {visibleCC.length > 0 ? (
          <div className="grid grid-cols-4 gap-1.5">
            {visibleCC.map((s) => (
              <StickerCard key={s.code} sticker={s} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-zinc-400 px-1 py-2">Sin resultados</p>
        )}
      </div>

      <div className="h-4" />

      {/* Floating quick-scroll sidebar */}
      <QuickScrollBar onSelect={scrollToGroupFn} />
    </div>
  );
}
