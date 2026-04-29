'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCollection } from '@/contexts/CollectionContext';
import StickerCard from '@/components/StickerCard';
import TeamSection from '@/components/TeamSection';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  GROUPS,
  ALL_TEAMS,
  getFCWStickers,
  getCCStickers,
} from '@/lib/stickers';
import {
  useAlbumFilter,
  useAlbumViewMode,
  useAlbumSortMode,
  useAlbumSearch,
  useAlbumCollapsedGroups,
  toggleAlbumGroupCollapsed,
  setAlbumVisibleGroups,
  registerScrollToGroup,
} from '@/lib/albumStore';
import {
  sortStickersBySuffix,
  sortTeamsByName,
  sortGroupKeys,
} from '@/lib/sortHelpers';
import QuickScrollBar from '@/components/QuickScrollBar';
import type { StickerInfo } from '@/lib/types';

/* Chevron used by the per-group collapse toggle. Rotates 90° when expanded. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function AlbumPage() {
  const { getCount, collection, completeCodes, clearCodes } = useCollection();
  const [filter] = useAlbumFilter();
  const [viewMode] = useAlbumViewMode();
  const [sortMode] = useAlbumSortMode();
  const [search] = useAlbumSearch();
  const collapsedGroups = useAlbumCollapsedGroups();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [confirmAction, setConfirmAction] = useState<{ section: 'FCW' | 'CC'; type: 'complete' | 'clear' } | null>(null);

  const fcwStickers = useMemo(() => getFCWStickers(), []);
  const ccStickers  = useMemo(() => getCCStickers(),  []);

  const scrollToGroupFn = useCallback((group: string) => {
    const el = sectionRefs.current[group];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Register so the right-side QuickScrollBar can drive scrolling.
  useEffect(() => {
    registerScrollToGroup(scrollToGroupFn);
    return () => registerScrollToGroup(null);
  }, [scrollToGroupFn]);

  /* ── Filter + search ───────────────────────────────────────────────────── */
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

  const visibleFCW = useMemo(
    () => sortStickersBySuffix(applyFilter(fcwStickers), sortMode),
    [applyFilter, fcwStickers, sortMode]
  );
  const visibleCC = useMemo(
    () => sortStickersBySuffix(applyFilter(ccStickers), sortMode),
    [applyFilter, ccStickers, sortMode]
  );

  const registerRef = (key: string) => (el: HTMLElement | null) => {
    sectionRefs.current[key] = el;
  };

  const hasSearch = search.trim().length > 0;
  const hasFilter = filter !== 'all';

  /* ── Section stats ─────────────────────────────────────────────────────── */
  const fcwOwned = useMemo(() => fcwStickers.filter((s) => getCount(s.code) > 0).length, [fcwStickers, getCount, collection]); // eslint-disable-line react-hooks/exhaustive-deps
  const ccOwned  = useMemo(() => ccStickers.filter((s)  => getCount(s.code) > 0).length, [ccStickers,  getCount, collection]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Per-team visible codes (for filter+search) ─────────────────────────
     Computed once for ALL teams so each TeamSection only needs a Set lookup
     instead of running its own filter pipeline. */
  const teamVisible = useMemo(() => {
    const map = new Map<string, Set<string> | null>();
    if (!hasFilter && !hasSearch) {
      // Fast path: nothing filtered, every team shows everything.
      for (const t of ALL_TEAMS) map.set(t.code, null);
      return map;
    }
    for (const t of ALL_TEAMS) {
      // Reuse the same applyFilter as for FCW/CC so the predicate logic stays
      // in one place.
      const stickers = applyFilter(
        // Inline lookup of team stickers — cheap and avoids importing
        // getTeamStickers in this file just for this use.
        ALL_TEAMS_TO_STICKERS[t.code]
      );
      map.set(t.code, new Set(stickers.map((s) => s.code)));
    }
    return map;
  }, [hasFilter, hasSearch, applyFilter]);

  /* ── Visible groups (for the right-side QuickScrollBar) ─────────────────
     Publishes the set of group keys that have at least one visible sticker
     under the current filter/search. The sidebar reads it via the store. */
  useEffect(() => {
    if (!hasFilter && !hasSearch) {
      setAlbumVisibleGroups(null); // null = show all groups
      return;
    }
    const visible = new Set<string>();
    if (visibleFCW.length > 0) visible.add('FCW');
    if (visibleCC.length  > 0) visible.add('CC');
    for (const [groupId, teams] of Object.entries(GROUPS)) {
      const anyVisible = teams.some((t) => (teamVisible.get(t.code)?.size ?? 0) > 0);
      if (anyVisible) visible.add(groupId);
    }
    setAlbumVisibleGroups(visible);
  }, [hasFilter, hasSearch, visibleFCW.length, visibleCC.length, teamVisible]);

  // On unmount, reset so other pages (or returning here) start clean.
  useEffect(() => () => setAlbumVisibleGroups(null), []);

  /* ── Confirm handler for FCW/CC ─────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const codes = confirmAction.section === 'FCW'
      ? fcwStickers.map((s) => s.code)
      : ccStickers.map((s) => s.code);
    if (confirmAction.type === 'complete') await completeCodes(codes);
    else await clearCodes(codes);
    setConfirmAction(null);
  };

  /* ── Layout pieces ──────────────────────────────────────────────────────── */
  const renderFCW = () => (
    <div ref={registerRef('FCW')} className="px-3 mb-2 mt-2 scroll-mt-56">
      <div className="flex items-center gap-1.5 py-1 mb-1">
        <h2 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 flex-1">
          🌍 FCW — Introducción &amp; Historia
        </h2>
        {fcwOwned < fcwStickers.length && (
          <button
            onClick={() => setConfirmAction({ section: 'FCW', type: 'complete' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {fcwOwned > 0 && (
          <button
            onClick={() => setConfirmAction({ section: 'FCW', type: 'clear' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold"
          >
            ✕ Vaciar
          </button>
        )}
        <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
          {fcwOwned}/{fcwStickers.length}
        </span>
      </div>
      {visibleFCW.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {visibleFCW.map((s) => <StickerCard key={s.code} sticker={s} />)}
        </div>
      ) : (
        <p className="text-[13px] text-zinc-400 px-1 py-2">Sin resultados</p>
      )}
    </div>
  );

  const renderCC = () => (
    <div ref={registerRef('CC')} className="px-3 mb-2 mt-3 scroll-mt-56">
      <div className="flex items-center gap-1.5 py-1 mb-1">
        <h2 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 flex-1">
          🥤 Coca-Cola
        </h2>
        {ccOwned < ccStickers.length && (
          <button
            onClick={() => setConfirmAction({ section: 'CC', type: 'complete' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {ccOwned > 0 && (
          <button
            onClick={() => setConfirmAction({ section: 'CC', type: 'clear' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold"
          >
            ✕ Vaciar
          </button>
        )}
        <span className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
          {ccOwned}/{ccStickers.length}
        </span>
      </div>
      {visibleCC.length > 0 ? (
        <div className="grid grid-cols-4 gap-1.5">
          {visibleCC.map((s) => <StickerCard key={s.code} sticker={s} />)}
        </div>
      ) : (
        <p className="text-[13px] text-zinc-400 px-1 py-2">Sin resultados</p>
      )}
    </div>
  );

  /* ── Body: groups view vs countries view ────────────────────────────────── */
  // FCW / CC visibility + position.
  // - Under any active filter/search, hide the section entirely if it has no
  //   matching stickers (otherwise the user sees a "Sin resultados" stub for
  //   sections irrelevant to their query).
  // - FCW flips with the sort direction (A-Z = top, Z-A = bottom).
  // - CC stays glued to the end regardless of direction — it's the album
  //   appendix, not a sortable section.
  const showFCW = !((hasFilter || hasSearch) && visibleFCW.length === 0);
  const showCC  = !((hasFilter || hasSearch) && visibleCC.length === 0);
  const azDirection = sortMode.startsWith('az');

  let body: React.ReactNode;
  if (viewMode === 'countries') {
    // Flat alphabetical list. FCW + CC bracket the team list at top/bottom in
    // A-Z, swap to bottom/top in Z-A.
    const sortedTeams = sortTeamsByName(ALL_TEAMS, sortMode);
    const teamNodes = sortedTeams.map((team) => {
      const visibleCodes = teamVisible.get(team.code) ?? null;
      return (
        <TeamSection
          key={team.code}
          team={team}
          visibleCodes={visibleCodes}
          sortMode={sortMode}
        />
      );
    });
    body = (
      <>
        {azDirection && showFCW && renderFCW()}
        {teamNodes}
        {!azDirection && showFCW && renderFCW()}
        {showCC && renderCC()}
      </>
    );
  } else {
    // Groups view. Group order respects sortMode (A-Z = A→L, Z-A = L→A); the
    // teams INSIDE each group keep their original order so positions like
    // "MEX is first in Group A" stay stable. Each group can be collapsed to
    // show only its header.
    const groupKeys = sortGroupKeys(Object.keys(GROUPS), sortMode);
    const groupNodes = groupKeys.map((groupId) => {
      const teams = GROUPS[groupId]; // original order, no sort
      const isCollapsed = collapsedGroups.has(groupId);
      const anyVisibleTeam = teams.some((t) => (teamVisible.get(t.code)?.size ?? Infinity) > 0);
      if ((hasFilter || hasSearch) && !anyVisibleTeam) return null;
      return (
        <div key={groupId}>
          <div
            ref={registerRef(groupId)}
            className="px-3 py-2 mt-2 bg-zinc-100 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 scroll-mt-56 flex items-center gap-2"
          >
            <button
              onClick={() => toggleAlbumGroupCollapsed(groupId)}
              className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 active:text-[#00B8D4]"
              aria-label={isCollapsed ? 'Expandir grupo' : 'Colapsar grupo'}
            >
              <Chevron open={!isCollapsed} />
              <span className="text-[13px] font-bold uppercase tracking-widest">
                Grupo {groupId}
              </span>
            </button>
            <span className="ml-auto text-[11px] text-zinc-400 dark:text-zinc-500">
              {teams.map((t) => t.code).join(' · ')}
            </span>
          </div>
          {!isCollapsed && teams.map((team) => {
            const visibleCodes = teamVisible.get(team.code) ?? null;
            return (
              <TeamSection
                key={team.code}
                team={team}
                visibleCodes={visibleCodes}
                sortMode={sortMode}
              />
            );
          })}
        </div>
      );
    });
    body = (
      <>
        {azDirection && showFCW && renderFCW()}
        {groupNodes}
        {!azDirection && showFCW && renderFCW()}
        {showCC && renderCC()}
      </>
    );
  }

  return (
    <div>
      {body}
      <div className="h-4" />

      {/* Floating quick-scroll sidebar */}
      <QuickScrollBar onSelect={scrollToGroupFn} />

      {/* Confirm dialogs */}
      {confirmAction?.type === 'complete' && (
        <ConfirmDialog
          message={`¿Completar la sección ${confirmAction.section}? Se marcará 1 para cada figurita faltante.`}
          confirmLabel="Completar"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction?.type === 'clear' && (
        <ConfirmDialog
          message={`¿Vaciar la sección ${confirmAction.section}? Se pondrá 0 a todas sus figuritas.`}
          confirmLabel="Vaciar"
          danger
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

/* ── Eager team-stickers map ────────────────────────────────────────────────
   Built once at module load so the per-render filter loop above doesn't have
   to re-scan ALL_STICKERS for each team. */
import { ALL_STICKERS } from '@/lib/stickers';
const ALL_TEAMS_TO_STICKERS: Record<string, StickerInfo[]> = (() => {
  const map: Record<string, StickerInfo[]> = {};
  for (const t of ALL_TEAMS) map[t.code] = [];
  for (const s of ALL_STICKERS) {
    if (s.section === 'team' && s.teamCode && map[s.teamCode]) {
      map[s.teamCode].push(s);
    }
  }
  return map;
})();
