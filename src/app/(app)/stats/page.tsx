'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '@/contexts/CollectionContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import GuestLock from '@/components/GuestLock';
import Flag from '@/components/Flag';
import { ALL_STICKERS, GROUPS, STICKER_MAP, EXTRA_PLAYERS } from '@/lib/stickers';

const GROUP_KEYS = Object.keys(GROUPS);
const EXTRA_TOTAL = EXTRA_PLAYERS.length * 4;

export default function StatsPage() {
  const { collection, clearStats, isGuest } = useCollection();
  const [confirmClearTaps, setConfirmClearTaps] = useState(false);
  const [showGroupsGrid, setShowGroupsGrid] = useState(false);

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
    groups.push({ id: 'FWC', total: 20, owned: fcwOwned, pct: fcwOwned / 20 });

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

  // ── Top 8 LEAST duplicated ─────────────────────────────────────────────────
  // "Las que menos me han salido repetidas" — stickers I have owned at some
  // point but barely (or never) got duplicates of. We filter on history_taps
  // > 0 so this represents stickers the user actually opened/touched, not
  // ones never seen. Sort by max_dups ASC, ties broken by history_taps DESC
  // (more taps for the same max_dups = more "tried but no luck" → more
  // interesting / lucky finding).
  const leastDups = useMemo(() => {
    return Object.values(collection)
      .filter((e) => e.history_taps > 0)
      .sort((a, b) => {
        if (a.max_dups !== b.max_dups) return a.max_dups - b.max_dups;
        return b.history_taps - a.history_taps;
      })
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

  if (isGuest) {
    return (
      <GuestLock>
        <div className="px-3 pt-4 pb-4">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 px-1">📊 Estadísticas</h1>
        </div>
      </GuestLock>
    );
  }

  return (
    <div className="px-3 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 px-1">📊 Estadísticas</h1>

      {/* Overall progress bar */}
      <div className="px-1 mb-4">
        <div className="flex justify-between text-[13px] mb-1.5">
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
          <p className="text-[13px] text-zinc-400 mb-0.5">⭐ Especiales</p>
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
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <RankingBlock title="🔥 Más tocadas" subtitle="Histórico total de toques" entries={topTapped} valueKey="history_taps" color="text-[#00B8D4]" getName={stickerName} getSub={stickerSub} onClear={() => setConfirmClearTaps(true)} />
        <RankingBlock title="📦 Más repetidas" subtitle="Repetidas que tenés ahora" entries={topDups} valueKey="max_dups" color="text-violet-500" getName={stickerName} getSub={stickerSub} />
      </div>

      {/* Least-repeated ranking — full width, sits below the side-by-side
          duo. Value shown is max_dups (how many copies you ever owned at
          once). 1 = pure luck, never duplicated. */}
      <div className="mb-4">
        <RankingBlock
          title="🍀 Las menos repetidas"
          subtitle="Las que tocaste pero casi nunca te salieron repetidas"
          entries={leastDups}
          valueKey="max_dups"
          color="text-emerald-500"
          getName={stickerName}
          getSub={stickerSub}
        />
      </div>

      {confirmClearTaps && (
        <ConfirmDialog
          message="¿Limpiar el historial de toques? No afecta tus cantidades actuales."
          confirmLabel="Limpiar"
          onConfirm={() => { clearStats(); setConfirmClearTaps(false); }}
          onCancel={() => setConfirmClearTaps(false)}
        />
      )}

      {/* Vertical group chart with a "show grid" button to flip into a
          per-group team listing — handy for remembering which country is in
          which group while sorting / comparing trade lists. */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            Progreso por grupo
          </h2>
          <button
            onClick={() => setShowGroupsGrid(true)}
            className="text-[12px] font-semibold text-[#00B8D4] active:opacity-70 flex items-center gap-1"
            aria-label="Ver tabla de grupos"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Ver grupos
          </button>
        </div>
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

      {showGroupsGrid && (
        <GroupsGridModal onClose={() => setShowGroupsGrid(false)} />
      )}
    </div>
  );
}

/**
 * Quick-reference modal showing every group as a card with its four teams
 * (FIFA code + flag + name). Read-only.
 *
 * Layout: a flex column with a fixed header, a flex-1 scrollable body for the
 * 12 group cards, and a fixed-at-bottom Cerrar button. Earlier version put
 * `overflow-y-auto` on the whole sheet with `max-h-[85vh]` and items-end on
 * the parent — that resulted in the top group cards being clipped off-screen
 * AND the touch scroll not engaging because there was no clear scrollable
 * region. The fixed header + scrollable middle pattern is the standard
 * bottom-sheet layout for this and works reliably on touch devices.
 *
 * Rendered via createPortal so no ancestor's transform/backdrop-filter can
 * trap its `position: fixed`.
 */
function GroupsGridModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '85svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-1">
            Grupos del Mundial
          </h2>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 text-center">
            Referencia rápida de qué país está en cada grupo
          </p>
        </div>
        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-2"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(GROUPS).map(([id, teams]) => (
              <div key={id} className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#00B8D4] mb-2">
                  Grupo {id}
                </p>
                <ul className="space-y-1.5">
                  {teams.map((t) => (
                    <li key={t.code} className="flex items-center gap-1.5">
                      <Flag code={t.code} height={10} />
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 w-9">
                        {t.code}
                      </span>
                      <span className="text-[12px] text-zinc-800 dark:text-zinc-100 truncate">
                        {t.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Fixed footer */}
        <div className="flex-shrink-0 px-5 pt-2 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
      <p className={`text-3xl font-black ${color}`}>{value.toLocaleString()}</p>
      <p className="text-[13px] text-zinc-400 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

type Entry = { sticker_num: string; history_taps: number; max_dups: number; info?: ReturnType<typeof STICKER_MAP.get> };

function RankingBlock({
  title, subtitle, entries, valueKey, color, getName, getSub, onClear,
}: {
  title: string;
  subtitle: string;
  entries: Entry[];
  valueKey: 'history_taps' | 'max_dups';
  color: string;
  getName: (e: Entry) => string;
  getSub: (e: Entry) => string;
  onClear?: () => void;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-sm">
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <h2 className="font-bold text-[13px] text-zinc-800 dark:text-zinc-100 leading-tight">{title}</h2>
        {onClear && (
          <button onClick={onClear} className="text-zinc-300 dark:text-zinc-600 text-sm leading-none flex-shrink-0 hover:text-red-400 transition-colors" aria-label="Limpiar">✕</button>
        )}
      </div>
      <p className="text-[13px] text-zinc-400 mb-2 leading-tight">{subtitle}</p>
      {entries.length === 0 ? (
        <p className="text-[13px] text-zinc-400">Sin datos</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {entries.map((e, i) => (
            <div key={e.sticker_num} className="flex items-start gap-1.5">
              <span className="text-[11px] font-bold text-zinc-400 w-3 mt-0.5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight truncate">
                  {getName(e)}
                </p>
                <p className="text-[11px] text-zinc-400 leading-tight truncate">
                  {e.sticker_num}{getSub(e) ? ` · ${getSub(e)}` : ''}
                </p>
              </div>
              <span className={`text-[13px] font-bold shrink-0 ${color}`}>{e[valueKey]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
