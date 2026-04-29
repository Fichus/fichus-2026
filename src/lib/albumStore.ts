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
// Set of group keys ('FCW', 'A', ..., 'L', 'CC') that are collapsed (only the
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

// ── Visible groups (computed by album/page, read by Header for the right-bar) ─
// The album page knows which groups have any visible content under the current
// filter/search; it publishes that set so the right-side QuickScrollBar can
// hide groups with nothing to show. Default = all groups visible.
const visibleGroupsStore = makeStore<ReadonlySet<string> | null>(null);
export function setAlbumVisibleGroups(groups: ReadonlySet<string> | null) { visibleGroupsStore.set(groups); }
export function useAlbumVisibleGroups(): ReadonlySet<string> | null {
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
