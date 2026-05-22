'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  useAlbumFilter,
  useAlbumViewMode,
  useAlbumSortMode,
  useAlbumSearch,
  useAlbumLocked,
  type ViewMode,
  type SortMode,
} from '@/lib/albumStore';
import { useCollection } from '@/contexts/CollectionContext';
import DropdownSelect from '@/components/DropdownSelect';
import ShareModal from '@/components/ShareModal';
import HeaderMenu from '@/components/HeaderMenu';
import type { FilterType } from '@/lib/types';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'missing', label: 'Faltan' },
  { key: 'repeated', label: 'Repes' },
];

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'groups',    label: 'Por grupos' },
  { value: 'countries', label: 'Por países' },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'az-min', label: 'A-Z · 1→20' },
  { value: 'az-max', label: 'A-Z · 20→1' },
  { value: 'za-min', label: 'Z-A · 1→20' },
  { value: 'za-max', label: 'Z-A · 20→1' },
];

export default function Header() {
  const pathname = usePathname();
  const isAlbum = pathname === '/album';
  const [filter, setFilter] = useAlbumFilter();
  const [viewMode, setViewMode] = useAlbumViewMode();
  const [sortMode, setSortMode] = useAlbumSortMode();
  const [search, setSearch] = useAlbumSearch();
  const [locked, setLocked] = useAlbumLocked();
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSaving, isGuest, saveError } = useCollection();

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      {/* DB error banner — only when a write fails. */}
      {saveError && (
        <div className="bg-red-500 text-white text-[11px] font-mono px-3 py-1.5 leading-snug break-all">
          ⚠️ {saveError}
        </div>
      )}

      {/* Row 1: Brand + theme toggle */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-1.5">
          <div className="font-bold text-base text-zinc-900 dark:text-white tracking-tight">
            Fichus<span className="text-[#00B8D4]">2026</span>
          </div>
          <div className="text-[9px] font-bold bg-[#00B8D4] text-white px-1.5 py-0.5 rounded-sm leading-none">
            BETA
          </div>
          {!isGuest && isSaving && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Guardando
            </div>
          )}
        </div>
        {/* Right-side action cluster — lock + share + theme.
            Lock is album-only; share is album-only (uses the collection).
            Theme is always available. */}
        <div className="flex items-center gap-1.5">
          {isAlbum && (
            <button
              onClick={() => setLocked(!locked)}
              aria-label={locked ? 'Desbloquear toques' : 'Bloquear toques'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                locked
                  ? 'bg-[#00B8D4] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {locked ? (
                /* Closed padlock — anti-mistap mode active */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                /* Open padlock */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              )}
            </button>
          )}
          {isAlbum && (
            <button
              onClick={() => setShareOpen(true)}
              aria-label="Compartir colección"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {/* Minimalist share icon (three connected dots) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
          {/* Kebab (3-dots) — opens the action menu (theme, hide CC, tap
              mode, complete/empty album, logout, etc). Replaced the
              standalone theme toggle to keep the header from feeling
              crowded once lock + share landed. */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            aria-label="Más acciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Album-only rows: filter pills, sticky search, view+sort dropdowns.
          Search sits ABOVE the dropdowns so the user lands on it without
          scanning past the metadata controls every time they want to filter. */}
      {isAlbum && (
        <>
          {/* Row 2: Filter pills (Todas / Faltan / Repes) */}
          <div className="flex justify-center gap-2 px-4 pb-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-[#00B8D4] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Row 3: Sticky search */}
          <div className="px-3 pb-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador, código…"
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm px-4 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
            />
          </div>

          {/* Row 4: View + Sort dropdowns (custom, not native <select>) */}
          <div className="flex items-center gap-2 px-3 pb-2">
            <DropdownSelect<ViewMode>
              value={viewMode}
              options={VIEW_OPTIONS}
              onChange={setViewMode}
              ariaLabel="Vista"
            />
            <DropdownSelect<SortMode>
              value={sortMode}
              options={SORT_OPTIONS}
              onChange={setSortMode}
              ariaLabel="Orden"
            />
          </div>
        </>
      )}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {menuOpen && <HeaderMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}
