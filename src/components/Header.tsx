'use client';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useAlbumFilter,
  useAlbumViewMode,
  useAlbumSortMode,
  useAlbumSearch,
  type ViewMode,
  type SortMode,
} from '@/lib/albumStore';
import { useCollection } from '@/contexts/CollectionContext';
import DropdownSelect from '@/components/DropdownSelect';
import type { FilterType } from '@/lib/types';

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

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
  const { toggleTheme } = useTheme();
  const pathname = usePathname();
  const isAlbum = pathname === '/album';
  const [filter, setFilter] = useAlbumFilter();
  const [viewMode, setViewMode] = useAlbumViewMode();
  const [sortMode, setSortMode] = useAlbumSortMode();
  const [search, setSearch] = useAlbumSearch();
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
        {/*
          Both icons always in the DOM; Tailwind dark: classes pick which one
          shows. Server and client render identically → no hydration mismatch.
        */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          aria-label="Cambiar tema"
        >
          <span className="dark:hidden"><MoonIcon /></span>
          <span className="hidden dark:inline-flex"><SunIcon /></span>
        </button>
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
    </header>
  );
}
