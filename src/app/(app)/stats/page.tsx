'use client';
import React, { useMemo } from 'react';
import { useCollection } from '@/contexts/CollectionContext';
import { ALL_STICKERS, GROUPS, STICKER_MAP, EXTRA_PLAYERS } from '@/lib/stickers';

const GROUP_KEYS = Object.keys(GROUPS);
const EXTRA_TOTAL = EXTRA_PLAYERS.length * 4;

export default function StatsPage() {
  const { collection } = useCollection();

  // ── Overview stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const regularCodes = new Set(
      ALL_STICKERS.filter((s) => s.section !== 'extra').map((s) => s.code)
    );
    const total = regularCodes.size;
    let owned = 0;
    let repeated = 0;
    for (const code of regularCodes) {
      const count = collection[code]?.count ?? 0;
      if (count > 0) owned++;
      if (count > 1) repeated += count - 1;
    }
    return { total, owned, missing: total - owned, repeated };
  }, [collection]);

  // ── Extras stats ────────────────────────────────────────────────────────────
  const extrasOwned = useMemo(() => {
    return ALL_STICKERS
      .filter((s) => s.section === 'extra')
      .filter((s) => (collection[s.code]?.count ?? 0) > 0)
      .length;
  }, [collection]);

  // ── Group progress ──────────────────────────────────────────────────────────
  const groupStats = useMemo(() => {
    const groups = GROUP_KEYS.map((g) => {
      const teams = GROUPS[g];
      const total = teams.length * 20;
      let owned = 0;
      for (const team of teams) {
        for (let n = 1; n <= 20; n++) {
          if ((collection[`${team.code}-${n}`]?.count ?? 0) > 0) owned++;
        }
      }
      return { id: g, total, owned, pct: total > 0 ? owned / total : 0 };
    });

    // FCW
    const fcwOwned = Array.from({ length: 20 }, (_, i) => {
      const code = `FCW-${String(i).padStart(2, '0')}`;
      return (collection[code]?.count ?? 0) > 0 ? 1 : 0 as number;
    }).reduce((a: number, b: number) => a + b, 0);
    groups.push({ id: 'FCW', total: 20, owned: fcwOwned, pct: fcwOwned / 20 });

    // CC
    const ccOwned = Array.from({ length: 14 }, (_, i) => {
      const code = `CC-${String(i + 1).padStart(2, '0')}`;
      return (collection[code]?.count ?? 0) > 0 ? 1 : 0 as number;
    }).reduce((a: number, b: number) => a + b, 0);
    groups.push({ id: 'CC', total: 14, owned: ccOwned, pct: ccOwned / 14 });

    return groups;
  }, [collection]);

  // ── Top 8 most tapped ───────────────────────────────────────────────────────
  const topTapped = useMemo(() => {
    return Object.values(collection)
      .filter((e) => e.history_taps > 0)
      .sort((a, b) => b.history_taps - a.history_taps)
      .slice(0, 8)
      .map((e) => ({ ...e, info: STICKER_MAP.get(e.sticker_num) }));
  }, [collection]);

  // ── Top 8 most duplicated ───────────────────────────────────────────────────
  const topDups = useMemo(() => {
    return Object.values(collection)
      .filter((e) => e.max_dups > 1)
      .sort((a, b) => b.max_dups - a.max_dups)
      .slice(0, 8)
      .map((e) => ({ ...e, info: STICKER_MAP.get(e.sticker_num) }));
  }, [collection]);

  const overallPct = stats.total > 0 ? Math.round((stats.owned / stats.total) * 100) : 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function stickerName(e: { sticker_num: string; info?: ReturnType<typeof STICKER_MAP.get> }) {
    if (!e.info) return e.sticker_num;
    if (e.info.section === 'extra') return e.info.extraPlayerName ?? e.sticker_num;
    return e.info.role ?? e.sticker_num;
  }
  function stickerSub(e: { sticker_num: string; info?: ReturnType<typeof STICKER_MAP.get> }) {
    if (!e.info) return '';
    if (e.info.section === 'extra') return e.info.extraCountry ?? '';
    return e.info.teamName ?? '';
  }

  const maxPct = Math.max(...groupStats.map((g) => g.pct), 0.01);

  return (
    <div className="px-3 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 px-1">📊 Estadísticas</h1>

      {/* Overall progress bar */}
      <div className="px-1 mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Progreso general</span>
          <span className="font-bold text-[#00B8D4]">{overallPct}%</span>
        </div>
        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00B8D4] rounded-full transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* 4 big blocks — 2×2 */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <StatBlock value={stats.total}    label="Figuritas totales"  color="text-zinc-700 dark:text-zinc-200" />
        <StatBlock value={stats.owned}    label="Las tengo"          color="text-[#00B8D4]" />
        <StatBlock value={stats.missing}  label="Me faltan"          color="text-violet-500" />
        <StatBlock value={stats.repeated} label="Repetidas"          color="text-amber-500" />
      </div>

      {/* Especiales block */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400 mb-0.5">⭐ Especiales</p>
          <p className="text-2xl font-black text-violet-500">{extrasOwned}<span className="text-sm font-normal text-zinc-400">/{EXTRA_TOTAL}</span></p>
        </div>
        <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${EXTRA_TOTAL > 0 ? Math.round((extrasOwned / EXTRA_TOTAL) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Top 8 rankings — side by side */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <RankingBlock title="🔥 Más tocadas" entries={topTapped} valueKey="history_taps" color="text-[#00B8D4]" getName={stickerName} getSub={stickerSub} />
        <RankingBlock title="📦 Más repetidas" entries={topDups} valueKey="max_dups" color="text-violet-500" getName={stickerName} getSub={stickerSub} />
      </div>

      {/* Vertical group chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-4">
          Progreso por grupo
        </h2>
        <div className="flex items-end gap-1 h-20">
          {groupStats.map(({ id, pct }) => {
            const barH = Math.max(2, Math.round((pct / maxPct) * 72));
            return (
              <div key={id} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#00B8D4] rounded-t-sm transition-all"
                  style={{ height: `${barH}px` }}
                  title={`${id}: ${Math.round(pct * 100)}%`}
                />
                <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 leading-none">
                  {id}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
      <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

type Entry = { sticker_num: string; history_taps: number; max_dups: number; info?: ReturnType<typeof STICKER_MAP.get> };

function RankingBlock({
  title, entries, valueKey, color, getName, getSub,
}: {
  title: string;
  entries: Entry[];
  valueKey: 'history_taps' | 'max_dups';
  color: string;
  getName: (e: Entry) => string;
  getSub: (e: Entry) => string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm">
      <h2 className="font-bold text-xs text-zinc-800 dark:text-zinc-100 mb-2">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-[10px] text-zinc-400">Sin datos</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((e, i) => (
            <div key={e.sticker_num} className="flex items-start gap-1.5">
              <span className="text-[9px] font-bold text-zinc-400 w-3 mt-0.5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight truncate">
                  {getName(e)}
                </p>
                <p className="text-[9px] text-zinc-400 leading-tight truncate">
                  {e.sticker_num}{getSub(e) ? ` · ${getSub(e)}` : ''}
                </p>
              </div>
              <span className={`text-xs font-bold shrink-0 ${color}`}>{e[valueKey]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
