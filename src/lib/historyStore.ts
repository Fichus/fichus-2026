/**
 * Tiny undo history for single-sticker actions.
 *
 * Each entry records the sticker code, a human-readable label, and a
 * `before` snapshot of the collection entry (null = the sticker had no row
 * yet). Undoing restores that snapshot — either by writing it back or by
 * clearing the entry to count 0 if it didn't exist before.
 *
 * Lives at module level so the Header button can pop entries without needing
 * to thread state through context. Capped at HISTORY_LIMIT to keep memory
 * bounded; older entries fall off the bottom as new ones arrive.
 *
 * Only single-tap actions (add / remove / favorite) push to history. Bulk
 * operations (completeTeam, clearAll, import, etc.) intentionally do NOT —
 * undoing those one-by-one would be more confusing than useful.
 */
import { useSyncExternalStore } from 'react';
import type { CollectionEntry } from './types';

export interface HistoryEntry {
  id: number;
  ts: number;
  code: string;
  label: string;        // e.g. "+1 URU-5" / "-1 ARG-3" / "♥ MEX-1"
  before: CollectionEntry | null;
}

const HISTORY_LIMIT = 30;
let _nextId = 1;
let _entries: HistoryEntry[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export function pushHistoryEntry(args: { code: string; label: string; before: CollectionEntry | null }) {
  const entry: HistoryEntry = {
    id: _nextId++,
    ts: Date.now(),
    code: args.code,
    label: args.label,
    before: args.before,
  };
  // Newest first. Slice rather than pop so React's diffing sees a fresh array.
  _entries = [entry, ..._entries].slice(0, HISTORY_LIMIT);
  emit();
}

export function removeHistoryEntry(id: number) {
  const next = _entries.filter((e) => e.id !== id);
  if (next.length === _entries.length) return;
  _entries = next;
  emit();
}

export function clearHistory() {
  if (_entries.length === 0) return;
  _entries = [];
  emit();
}

export function getHistory(): readonly HistoryEntry[] {
  return _entries;
}

export function useHistory(): readonly HistoryEntry[] {
  return useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    () => _entries,
    () => _entries,
  );
}
