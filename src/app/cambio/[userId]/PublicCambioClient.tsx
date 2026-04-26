'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STICKER_MAP, ALL_STICKERS } from '@/lib/stickers';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import type { CollectionEntry } from '@/lib/types';

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

interface Props {
  targetUserId: string;
  targetCollection: Record<string, number>;
  viewerCollection: Record<string, number>;
  isViewer: boolean;
  viewerUserId: string | null;
  targetOwned: number;
  targetTotal: number;
  targetUsername: string | null;
}

export default function PublicCambioClient({
  targetUserId,
  targetCollection,
  viewerCollection,
  isViewer,
  viewerUserId,
  targetOwned,
  targetTotal,
  targetUsername,
}: Props) {
  const router = useRouter();
  const { toggleTheme } = useTheme();

  // Trade selection state
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(new Set());
  const [selectedGive, setSelectedGive] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const regularStickers = useMemo(
    () => ALL_STICKERS.filter((s) => s.section !== 'extra'),
    []
  );

  // "Te sirven": target has duplicates that viewer is missing
  const theyHaveViewerNeeds = useMemo(() => {
    if (!isViewer) return [];
    return regularStickers.filter((s) => {
      const targetCount = targetCollection[s.code] ?? 0;
      const viewerCount = viewerCollection[s.code] ?? 0;
      return targetCount > 1 && viewerCount === 0;
    });
  }, [isViewer, regularStickers, targetCollection, viewerCollection]);

  // "Le sirven": viewer has duplicates that target is missing
  const viewerNeedsTheyHave = useMemo(() => {
    if (!isViewer) return [];
    return regularStickers.filter((s) => {
      const targetCount = targetCollection[s.code] ?? 0;
      const viewerCount = viewerCollection[s.code] ?? 0;
      return viewerCount > 1 && targetCount === 0;
    });
  }, [isViewer, regularStickers, targetCollection, viewerCollection]);

  // Just show target's duplicates if viewer not logged in
  const targetDuplicates = useMemo(() => {
    if (isViewer) return [];
    return regularStickers.filter((s) => (targetCollection[s.code] ?? 0) > 1);
  }, [isViewer, regularStickers, targetCollection]);

  const targetMissing = useMemo(() => {
    if (isViewer) return [];
    return regularStickers.filter((s) => (targetCollection[s.code] ?? 0) === 0);
  }, [isViewer, regularStickers, targetCollection]);

  const pct = targetTotal > 0 ? Math.round((targetOwned / targetTotal) * 100) : 0;
  const displayName = targetUsername || 'este usuario';

  const toggleReceive = (code: string) => {
    setSelectedReceive((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
    setDone(false);
  };

  const toggleGive = (code: string) => {
    setSelectedGive((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
    setDone(false);
  };

  const handleConfirm = async () => {
    if (!viewerUserId || (selectedReceive.size === 0 && selectedGive.size === 0)) return;
    setConfirming(true);
    try {
      const supabase = createClient();

      const codesToUpdate = [
        ...Array.from(selectedReceive).map((code) => ({ code, delta: +1 })),
        ...Array.from(selectedGive).map((code) => ({ code, delta: -1 })),
      ];

      // Fetch current entries for the stickers we need to update
      const { data: currentEntries } = await supabase
        .from('collection')
        .select('sticker_num,count,history_taps,max_dups,is_favorite')
        .eq('user_id', viewerUserId)
        .in('sticker_num', codesToUpdate.map((x) => x.code));

      const entryMap: Record<string, CollectionEntry> = {};
      for (const e of (currentEntries ?? []) as CollectionEntry[]) {
        entryMap[e.sticker_num] = e;
      }

      const updates = codesToUpdate.map(({ code, delta }) => {
        const cur = entryMap[code];
        const newCount = Math.max(0, (cur?.count ?? 0) + delta);
        return {
          user_id: viewerUserId,
          sticker_num: code,
          count: newCount,
          history_taps: cur?.history_taps ?? 0,
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      });

      await supabase.from('collection').upsert(updates, { onConflict: 'user_id,sticker_num' });

      setSelectedReceive(new Set());
      setSelectedGive(new Set());
      setDone(true);
      router.refresh();
    } catch (err) {
      console.error('[trade confirm]', err);
    }
    setConfirming(false);
  };

  const hasSelection = selectedReceive.size > 0 || selectedGive.size > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 py-6 pb-28">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/album">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
              Fichus<span className="text-[#00B8D4]">2026</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Página de cambio</p>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            aria-label="Cambiar tema"
          >
            <span className="dark:hidden"><MoonIcon /></span>
            <span className="hidden dark:inline-flex"><SunIcon /></span>
          </button>
        </div>

        {/* Target stats */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Colección de{' '}
              {targetUsername
                ? <span className="text-[#00B8D4]">{targetUsername}</span>
                : 'este usuario'}
            </p>
            <span className="text-lg font-black text-[#00B8D4]">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#00B8D4] rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{targetOwned} / {targetTotal} figuritas</p>
        </div>

        {isViewer ? (
          <>
            {/* Trade hint */}
            <div className="bg-[#00B8D4]/8 dark:bg-[#00B8D4]/10 rounded-2xl px-4 py-3 mb-4">
              <p className="text-xs text-[#00a0b8] dark:text-[#00B8D4]">
                💡 Tocá las figuritas para marcar el intercambio. Después confirmá para actualizar tu álbum.
              </p>
            </div>

            {/* Te sirven */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
                Te sirven{' '}
                {selectedReceive.size > 0 && (
                  <span className="text-[#00B8D4]">· {selectedReceive.size} seleccionadas</span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mb-3">
                Repetidas de {displayName} que a vos te faltan ({theyHaveViewerNeeds.length})
              </p>
              {theyHaveViewerNeeds.length === 0 ? (
                <p className="text-xs text-zinc-400">Ninguna en común 🤷</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {theyHaveViewerNeeds.map((s) => {
                    const sel = selectedReceive.has(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => toggleReceive(s.code)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          sel
                            ? 'bg-[#00B8D4] text-white ring-2 ring-[#00B8D4] ring-offset-1'
                            : 'bg-[#00B8D4]/10 text-[#00B8D4]'
                        }`}
                      >
                        {sel ? '✓ ' : ''}{s.code}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Le sirven */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
                Le sirven{' '}
                {selectedGive.size > 0 && (
                  <span className="text-violet-500">· {selectedGive.size} seleccionadas</span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 mb-3">
                Tus repetidas que le faltan a {displayName} ({viewerNeedsTheyHave.length})
              </p>
              {viewerNeedsTheyHave.length === 0 ? (
                <p className="text-xs text-zinc-400">Ninguna en común 🤷</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {viewerNeedsTheyHave.map((s) => {
                    const sel = selectedGive.has(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => toggleGive(s.code)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          sel
                            ? 'bg-violet-500 text-white ring-2 ring-violet-500 ring-offset-1'
                            : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        {sel ? '✓ ' : ''}{s.code}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {done && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 mb-4">
                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                  ✓ ¡Cambio registrado! Tu álbum fue actualizado.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Not logged in */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                💡 Iniciá sesión para ver qué podés intercambiar con {displayName}
              </p>
              <Link
                href={`/login?next=/cambio/${targetUserId}`}
                className="mt-2 inline-block px-4 py-2 rounded-xl bg-[#00B8D4] text-white text-sm font-semibold"
              >
                Iniciar sesión
              </Link>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">
                Sus repetidas ({targetDuplicates.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {targetDuplicates.map((s) => (
                  <span
                    key={s.code}
                    className="px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] text-xs font-semibold"
                  >
                    {s.code} ×{targetCollection[s.code]}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">
                Le faltan ({targetMissing.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {targetMissing.map((s) => (
                  <span
                    key={s.code}
                    className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold"
                  >
                    {s.code}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sticky confirm bar — always visible for logged-in viewers */}
        {isViewer && (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-sm px-4 pb-6 pointer-events-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex items-center gap-3">
                <div className="flex-1 text-xs leading-tight">
                  <span className={selectedReceive.size > 0 ? 'text-[#00B8D4] font-semibold' : 'text-zinc-400 dark:text-zinc-500'}>
                    +{selectedReceive.size} recibís
                  </span>
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  <span className={selectedGive.size > 0 ? 'text-violet-500 font-semibold' : 'text-zinc-400 dark:text-zinc-500'}>
                    −{selectedGive.size} das
                  </span>
                </div>
                <button
                  onClick={handleConfirm}
                  disabled={!hasSelection || confirming}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 transition-colors ${
                    hasSelection
                      ? 'bg-[#00B8D4] text-white'
                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {confirming ? 'Confirmando…' : '🔄 Cambiar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-6 pb-8 flex flex-col items-center gap-3">
          <Link
            href="/album"
            className="w-full py-3 rounded-xl bg-[#00B8D4] text-white font-bold text-sm text-center"
          >
            Abrir mi álbum →
          </Link>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Fichus2026 — Tu colección del Mundial 2026
          </p>
        </div>

      </div>
    </div>
  );
}
