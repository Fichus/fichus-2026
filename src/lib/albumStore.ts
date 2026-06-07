/**
 * Module-level store for the album page.
 *
 * Lives outside React so the sticky Header (mounted once in the layout) and
 * album/page.tsx (mounted under the layout) can share state without a common
 * ancestor provider. useSyncExternalStore subscribes each consumer.
 */
import { useSyncExternalStore } from 'react';
import type { FilterType } from './types';

// Generic helper to build a tiny pub-sub store with a typed getter/setter.
function makeStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: T) => {
      if (next === value) return;
      value = next;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}

// ── Filter (Todas / Faltan / Repes) ───────────────────────────────────────────
const filterStore = makeStore<FilterType>('all');
export function setAlbumFilter(f: FilterType) { filterStore.set(f); }
export function useAlbumFilter(): [FilterType, (f: FilterType) => void] {
  return [useSyncExternalStore(filterStore.subscribe, filterStore.get, filterStore.get), setAlbumFilter];
}

// ── View mode (Por Grupos / Por Países) ───────────────────────────────────────
export type ViewMode = 'groups' | 'countries';
const viewModeStore = makeStore<ViewMode>('groups');
export function setAlbumViewMode(v: ViewMode) { viewModeStore.set(v); }
export function useAlbumViewMode(): [ViewMode, (v: ViewMode) => void] {
  return [useSyncExternalStore(viewModeStore.subscribe, viewModeStore.get, viewModeStore.get), setAlbumViewMode];
}

// ── Sort mode ─────────────────────────────────────────────────────────────────
// Country direction (A-Z vs Z-A) × sticker-num direction within each country.
// "min" = 1→20, "max" = 20→1 within a country.
export type SortMode =
  | 'az-min'   // countries A-Z, stickers 1→20
  | 'az-max'   // countries A-Z, stickers 20→1
  | 'za-min'   // countries Z-A, stickers 1→20
  | 'za-max';  // countries Z-A, stickers 20→1
const sortModeStore = makeStore<SortMode>('az-min');
export function setAlbumSortMode(s: SortMode) { sortModeStore.set(s); }
export function useAlbumSortMode(): [SortMode, (s: SortMode) => void] {
  return [useSyncExternalStore(sortModeStore.subscribe, sortModeStore.get, sortModeStore.get), setAlbumSortMode];
}

// ── Search ────────────────────────────────────────────────────────────────────
const searchStore = makeStore<string>('');
export function setAlbumSearch(q: string) { searchStore.set(q); }
export function useAlbumSearch(): [string, (q: string) => void] {
  return [useSyncExternalStore(searchStore.subscribe, searchStore.get, searchStore.get), setAlbumSearch];
}

// ── Collapsed groups ──────────────────────────────────────────────────────────
// Set of group keys ('FWC', 'A', ..., 'L', 'CC') that are collapsed (only the
// header shows; teams are hidden). Stored as a Set for O(1) membership checks.
const collapsedStore = makeStore<ReadonlySet<string>>(new Set());
export function toggleAlbumGroupCollapsed(group: string) {
  const cur = collapsedStore.get();
  const next = new Set(cur);
  if (next.has(group)) next.delete(group);
  else next.add(group);
  collapsedStore.set(next);
}
export function useAlbumCollapsedGroups(): ReadonlySet<string> {
  return useSyncExternalStore(collapsedStore.subscribe, collapsedStore.get, collapsedStore.get);
}

// ── Collapsed teams ───────────────────────────────────────────────────────────
// Same pattern but per individual team (3-letter FIFA code). Used to hide a
// single country's sticker grid while keeping the team header visible.
const collapsedTeamsStore = makeStore<ReadonlySet<string>>(new Set());
export function toggleAlbumTeamCollapsed(teamCode: string) {
  const cur = collapsedTeamsStore.get();
  const next = new Set(cur);
  if (next.has(teamCode)) next.delete(teamCode);
  else next.add(teamCode);
  collapsedTeamsStore.set(next);
}
export function useAlbumCollapsedTeams(): ReadonlySet<string> {
  return useSyncExternalStore(collapsedTeamsStore.subscribe, collapsedTeamsStore.get, collapsedTeamsStore.get);
}

// ── Lock (anti-mistap) ────────────────────────────────────────────────────────
// When true, sticker taps are no-ops so the user can scroll without
// accidentally incrementing counts. +/− buttons and the favorite heart still
// work — only the body-of-card tap is locked.
const lockedStore = makeStore<boolean>(false);
export function setAlbumLocked(v: boolean) { lockedStore.set(v); }
export function useAlbumLocked(): [boolean, (v: boolean) => void] {
  return [useSyncExternalStore(lockedStore.subscribe, lockedStore.get, lockedStore.get), setAlbumLocked];
}

// ── Show CC (Coca-Cola) section ───────────────────────────────────────────────
// Toggle from the kebab menu. When false, the CC group is hidden everywhere
// (album rendering + right-side sidebar). Stickers in the DB are NOT touched —
// flipping this back to true reveals the existing counts as they were.
//
// Persisted to localStorage so the choice survives reloads and new sessions.
// The store always defaults to `true` for SSR so server-rendered output matches
// the first client paint; `hydrateAlbumShowCC()` is called once on mount from
// Header to apply the stored preference (a tiny CC flash on first paint is the
// trade-off for keeping SSR/CSR markup in sync).
const SHOW_CC_KEY = 'fichus:showCC';
const showCCStore = makeStore<boolean>(true);
export function setAlbumShowCC(v: boolean) {
  showCCStore.set(v);
  try { if (typeof window !== 'undefined') localStorage.setItem(SHOW_CC_KEY, v ? '1' : '0'); } catch {}
}
export function hydrateAlbumShowCC() {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(SHOW_CC_KEY);
    if (raw === '0') showCCStore.set(false);
    else if (raw === '1') showCCStore.set(true);
  } catch {}
}
export function useAlbumShowCC(): [boolean, (v: boolean) => void] {
  return [useSyncExternalStore(showCCStore.subscribe, showCCStore.get, showCCStore.get), setAlbumShowCC];
}

// ── Tap mode (add vs subtract) ────────────────────────────────────────────────
// Switches what the body-of-card tap does. Default is 'add' (increments the
// count, the natural collecting mode). 'subtract' decrements — useful for
// bulk de-stocking after a swap session. The +/−/heart buttons keep their
// fixed behavior; only the card body is affected.
export type TapMode = 'add' | 'subtract';
const tapModeStore = makeStore<TapMode>('add');
export function setAlbumTapMode(m: TapMode) { tapModeStore.set(m); }
export function useAlbumTapMode(): [TapMode, (m: TapMode) => void] {
  return [useSyncExternalStore(tapModeStore.subscribe, tapModeStore.get, tapModeStore.get), setAlbumTapMode];
}

// ── Visible groups / sidebar items (read by QuickScrollBar) ──────────────────
// The album page publishes an ORDERED list of keys to display in the right-
// side QuickScrollBar. The keys vary by view mode:
//   - "Por grupos": ['FWC', 'A', 'B', ..., 'L', 'CC']
//   - "Por países": ['FWC', 'A', 'B', 'C', 'E', ..., 'U', 'CC']  (only the
//     letters that have at least one visible team in the current filter)
// Sending `null` means "no list published yet" — QuickScrollBar falls back to
// the default group list. Keeps the prop a single ordered list so we don't
// have to special-case ordering inside the sidebar.
const visibleGroupsStore = makeStore<ReadonlyArray<string> | null>(null);
export function setAlbumVisibleGroups(groups: ReadonlyArray<string> | null) { visibleGroupsStore.set(groups); }
export function useAlbumVisibleGroups(): ReadonlyArray<string> | null {
  return useSyncExternalStore(visibleGroupsStore.subscribe, visibleGroupsStore.get, visibleGroupsStore.get);
}

// ── Scroll-to-group ───────────────────────────────────────────────────────────
let _scrollToGroupFn: ((group: string) => void) | null = null;
export function registerScrollToGroup(fn: ((group: string) => void) | null) {
  _scrollToGroupFn = fn;
}
export function scrollToGroup(group: string) {
  _scrollToGroupFn?.(group);
}
