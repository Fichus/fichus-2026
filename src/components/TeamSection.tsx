'use client';
import React, { forwardRef, useState } from 'react';
import type { TeamDef } from '@/lib/types';
import { getTeamStickers } from '@/lib/stickers';
import { useCollection } from '@/contexts/CollectionContext';
import StickerCard from './StickerCard';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  team: TeamDef;
  visibleCodes?: Set<string> | null; // null = show all
}

const TeamSection = forwardRef<HTMLDivElement, Props>(function TeamSection(
  { team, visibleCodes },
  ref
) {
  const { getCount, completeTeam, clearTeam } = useCollection();
  const stickers = getTeamStickers(team.code);
  const [confirmAction, setConfirmAction] = useState<'complete' | 'clear' | null>(null);

  const owned = stickers.filter((s) => getCount(s.code) > 0).length;
  const total = stickers.length;
  const isComplete = owned === total;
  const hasAny = owned > 0;

  const filtered = visibleCodes
    ? stickers.filter((s) => visibleCodes.has(s.code))
    : stickers;

  if (filtered.length === 0) return null;

  return (
    <div ref={ref} className="px-3 mb-2">
      {/* Team header */}
      <div className="flex items-center gap-1.5 py-2">
        <span className="text-xl leading-none">{team.flag}</span>
        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100 flex-1 truncate">
          {team.name}
        </span>
        {/* Buttons LEFT of counter */}
        {!isComplete && (
          <button
            onClick={() => setConfirmAction('complete')}
            className="text-[10px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {hasAny && (
          <button
            onClick={() => setConfirmAction('clear')}
            className="text-[10px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold"
          >
            ✕ Vaciar
          </button>
        )}
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-0.5">
          {owned}/{total}
        </span>
      </div>

      {/* Sticker grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {filtered.map((s) => (
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
