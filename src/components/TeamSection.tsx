'use client';
import React, { forwardRef, useMemo, useState } from 'react';
import type { StickerInfo, TeamDef } from '@/lib/types';
import { getTeamStickers } from '@/lib/stickers';
import { useCollection } from '@/contexts/CollectionContext';
import StickerCard from './StickerCard';
import ConfirmDialog from './ConfirmDialog';
import Flag from './Flag';
import { sortStickersBySuffix } from '@/lib/sortHelpers';
import type { SortMode } from '@/lib/albumStore';

interface Props {
  team: TeamDef;
  /** When set, restricts displayed stickers to this set (filter/search result). */
  visibleCodes?: Set<string> | null;
  /** Sticker number ordering inside the team. */
  sortMode?: SortMode;
}

const TeamSection = forwardRef<HTMLDivElement, Props>(function TeamSection(
  { team, visibleCodes, sortMode = 'az-min' },
  ref
) {
  const { getCount, completeTeam, clearTeam } = useCollection();
  const stickers = getTeamStickers(team.code);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'clear' | null>(null);

  const owned = stickers.filter((s) => getCount(s.code) > 0).length;
  const total = stickers.length;
  const isComplete = owned === total;
  const hasAny = owned > 0;

  // Apply visibility filter then sort. The sort must happen here (not in the
  // page) so each team's grid runs through the same ordering as its siblings.
  const displayed: StickerInfo[] = useMemo(() => {
    const list = visibleCodes ? stickers.filter((s) => visibleCodes.has(s.code)) : stickers;
    return sortStickersBySuffix(list, sortMode);
  }, [stickers, visibleCodes, sortMode]);

  if (displayed.length === 0) return null;

  return (
    <div ref={ref} className="px-3 mb-2">
      {/* Team header — always shows: code · name · flag emoji · "Grupo X" */}
      <div className="flex items-center gap-1.5 py-2">
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 leading-none w-9">
          {team.code}
        </span>
        <span className="flex-1 min-w-0 truncate font-bold text-sm text-zinc-800 dark:text-zinc-100">
          {team.name}
          <span className="ml-1.5 inline-flex items-center gap-1 align-baseline font-medium text-[11px] text-zinc-400 dark:text-zinc-500">
            <Flag code={team.code} height={11} />
            Grupo {team.group}
          </span>
        </span>
        {/* Buttons LEFT of counter */}
        {!isComplete && (
          <button
            onClick={() => setConfirmAction('complete')}
            className="text-[13px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {hasAny && (
          <button
            onClick={() => setConfirmAction('clear')}
            className="text-[13px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold"
          >
            ✕ Vaciar
          </button>
        )}
        <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">
          {owned}/{total}
        </span>
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {displayed.map((s) => (
          <StickerCard key={s.code} sticker={s} />
        ))}
      </div>

      {/* Confirm dialogs */}
      {confirmAction === 'complete' && (
        <ConfirmDialog
          message={`¿Completar el equipo de ${team.name}? Se marcará 1 para cada figurita faltante.`}
          confirmLabel="Completar"
          onConfirm={() => {
            completeTeam(team.code);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'clear' && (
        <ConfirmDialog
          message={`¿Vaciar el equipo de ${team.name}? Se pondrá 0 a todas sus figuritas.`}
          confirmLabel="Vaciar"
          danger
          onConfirm={() => {
            clearTeam(team.code);
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
});

export default TeamSection;
