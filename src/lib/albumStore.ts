/**
 * Module-level store for the album page filter + scroll-to-group.
 * Allows Header (in layout) and album/page.tsx to share state
 * without a common ancestor context provider.
 */
import { useSyncExternalStore } from 'react';
import type { FilterType } from './types';

// ── Filter ────────────────────────────────────────────────────────────────────
let _filter: FilterType = 'all';
const _filterListeners = new Set<() => void>();

function _getFilter() { return _filter; }
function _subscribeFilter(fn: () => void) {
  _filterListeners.add(fn);
  return () => { _filterListeners.delete(fn); };
}

export function setAlbumFilter(f: FilterType) {
  _filter = f;
  _filterListeners.forEach((fn) => fn());
}

export function useAlbumFilter(): [FilterType, (f: FilterType) => void] {
  const value = useSyncExternalStore(_subscribeFilter, _getFilter, _getFilter);
  return [value, setAlbumFilter];
}

// ── Scroll-to-group ───────────────────────────────────────────────────────────
let _scrollToGroupFn: ((group: string) => void) | null = null;

/** Called by album/page.tsx to register its scroll handler. */
export function registerScrollToGroup(fn: ((group: string) => void) | null) {
  _scrollToGroupFn = fn;
}

/** Called by Header to trigger scrolling on the album page. */
export function scrollToGroup(group: string) {
  _scrollToGroupFn?.(group);
}
