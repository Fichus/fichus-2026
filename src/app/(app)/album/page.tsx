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
  useAlbumLocked,
  useAlbumShowCC,
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
  const [locked] = useAlbumLocked();
  const [showCC] = useAlbumShowCC();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const [confirmAction, setConfirmAction] = useState<{ section: 'FWC' | 'CC'; type: 'complete' | 'clear' } | null>(null);

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

  /* ── Visible groups / letters for the QuickScrollBar ────────────────────
     Builds the right-side list according to view mode:
       - groups view: group keys (FWC, A..L, CC) that have visible content
       - countries view: first letters of country names (A, B, C, ...) that
         have at least one visible team, plus FWC at the top and CC at the
         bottom when those sections are visible. Letters point to scroll
         anchors registered on the FIRST team starting with each letter. */
  useEffect(() => {
    const fcwVisible = !((hasFilter || hasSearch) && visibleFCW.length === 0);
    // CC sidebar entry only shows if the section itself is showing AND has
    // visible content under the active filter.
    const ccVisible  = showCC && !((hasFilter || hasSearch) && visibleCC.length === 0);

    if (viewMode === 'countries') {
      const lettersOrdered: string[] = [];
      const seen = new Set<string>();
      const sortedTeams = [...ALL_TEAMS].sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const teamsToWalk = sortMode.startsWith('za') ? [...sortedTeams].reverse() : sortedTeams;
      for (const t of teamsToWalk) {
        const set = teamVisible.get(t.code);
        const hasContent = set ? set.size > 0 : true;
        if (!hasContent) continue;
        const letter = (t.name[0] || '').toUpperCase();
        if (!letter || seen.has(letter)) continue;
        seen.add(letter);
        lettersOrdered.push(letter);
      }
      const list: string[] = [];
      // Match the on-page order: FWC at top in A-Z, swapped under Z-A.
      const azDir = sortMode.startsWith('az');
      if (azDir && fcwVisible) list.push('FWC');
      list.push(...lettersOrdered);
      if (!azDir && fcwVisible) list.push('FWC');
      if (ccVisible) list.push('CC');
      setAlbumVisibleGroups(list);
      return;
    }

    // Groups view — group keys in their on-page order.
    const azDir = sortMode.startsWith('az');
    const orderedGroups = (azDir ? Object.keys(GROUPS) : [...Object.keys(GROUPS)].reverse());
    const list: string[] = [];
    if (azDir && fcwVisible) list.push('FWC');
    for (const groupId of orderedGroups) {
      const teams = GROUPS[groupId];
      const anyVisible = teams.some((t) => (teamVisible.get(t.code)?.size ?? Infinity) > 0);
      if (anyVisible) list.push(groupId);
    }
    if (!azDir && fcwVisible) list.push('FWC');
    if (ccVisible) list.push('CC');
    setAlbumVisibleGroups(list);
  }, [viewMode, sortMode, hasFilter, hasSearch, visibleFCW.length, visibleCC.length, teamVisible, showCC]);

  // On unmount, reset so other pages (or returning here) start clean.
  useEffect(() => () => setAlbumVisibleGroups(null), []);

  /* ── Confirm handler for FCW/CC ─────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const codes = confirmAction.section === 'FWC'
      ? fcwStickers.map((s) => s.code)
      : ccStickers.map((s) => s.code);
    if (confirmAction.type === 'complete') await completeCodes(codes);
    else await clearCodes(codes);
    setConfirmAction(null);
  };

  /* ── Layout pieces ──────────────────────────────────────────────────────── */
  const renderFCW = () => (
    <div ref={registerRef('FWC')} className="px-3 mb-2 mt-2 scroll-mt-56">
      <div className="flex items-center gap-1.5 py-1 mb-1">
        <h2 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 flex-1">
          🏆 FWC — Especiales
        </h2>
        {!locked && fcwOwned < fcwStickers.length && (
          <button
            onClick={() => setConfirmAction({ section: 'FWC', type: 'complete' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {!locked && fcwOwned > 0 && (
          <button
            onClick={() => setConfirmAction({ section: 'FWC', type: 'clear' })}
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
        {!locked && ccOwned < ccStickers.length && (
          <button
            onClick={() => setConfirmAction({ section: 'CC', type: 'complete' })}
            className="text-[13px] px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] font-semibold"
          >
            ✓ Completar
          </button>
        )}
        {!locked && ccOwned > 0 && (
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
  // CC section: user toggle takes precedence — if they hid it from the menu,
  // it's gone regardless of filter; otherwise we apply the standard "hide if
  // search/filter returned nothing" rule.
  const showCCSection = showCC && !((hasFilter || hasSearch) && visibleCC.length === 0);
  const azDirection = sortMode.startsWith('az');

  let body: React.ReactNode;
  if (viewMode === 'countries') {
    // Flat alphabetical list. FCW + CC bracket the team list at top/bottom in
    // A-Z, swap to bottom/top in Z-A. As we walk the sorted teams we attach a
    // scroll anchor to the FIRST team of each starting letter — that's what
    // the right-side QuickScrollBar jumps to when the user taps a letter.
    const sortedTeams = sortTeamsByName(ALL_TEAMS, sortMode);
    const lettersAnchored = new Set<string>();
    const teamNodes = sortedTeams.map((team) => {
      const visibleCodes = teamVisible.get(team.code) ?? null;
      const hasContent = visibleCodes ? visibleCodes.size > 0 : true;
      const letter = (team.name[0] || '').toUpperCase();
      // Only the first VISIBLE team of each letter gets the anchor — otherwise
      // a filtered-out team would silently capture the scroll target.
      const shouldAnchor = hasContent && letter && !lettersAnchored.has(letter);
      if (shouldAnchor) lettersAnchored.add(letter);
      return (
        <div
          key={team.code}
          ref={shouldAnchor ? registerRef(letter) : undefined}
          className={shouldAnchor ? 'scroll-mt-56' : undefined}
        >
          <TeamSection
            team={team}
            visibleCodes={visibleCodes}
            sortMode={sortMode}
          />
        </div>
      );
    });
    body = (
      <>
        {azDirection && showFCW && renderFCW()}
        {teamNodes}
        {!azDirection && showFCW && renderFCW()}
        {showCCSection && renderCC()}
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
        {showCCSection && renderCC()}
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
