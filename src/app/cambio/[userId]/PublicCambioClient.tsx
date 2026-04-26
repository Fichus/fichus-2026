'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { STICKER_MAP, ALL_STICKERS } from '@/lib/stickers';

interface Props {
  targetUserId: string;
  targetCollection: Record<string, number>;
  viewerCollection: Record<string, number>;
  isViewer: boolean;
  targetOwned: number;
  targetTotal: number;
  targetUsername: string | null;
}

export default function PublicCambioClient({
  targetUserId,
  targetCollection,
  viewerCollection,
  isViewer,
  targetOwned,
  targetTotal,
  targetUsername,
}: Props) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 py-6">
      {/* Header */}
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
            Fichus<span className="text-[#00B8D4]">2026</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Página de cambio</p>
        </div>

        {/* Target stats */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Colección de {targetUsername
                ? <span className="text-[#00B8D4]">{targetUsername}</span>
                : 'este usuario'}
            </p>
            <span className="text-lg font-black text-[#00B8D4]">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00B8D4] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{targetOwned} / {targetTotal} figuritas</p>
        </div>

        {isViewer ? (
          <>
            {/* Te sirven */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
                Te sirven
              </h2>
              <p className="text-xs text-zinc-400 mb-3">
                Repetidas de {displayName} que a vos te faltan ({theyHaveViewerNeeds.length})
              </p>
              {theyHaveViewerNeeds.length === 0 ? (
                <p className="text-xs text-zinc-400">Ninguna en común 🤷</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {theyHaveViewerNeeds.map((s) => (
                    <span
                      key={s.code}
                      className="px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] text-xs font-semibold"
                    >
                      {s.code}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Le sirven */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
                Le sirven
              </h2>
              <p className="text-xs text-zinc-400 mb-3">
                Tus repetidas que le faltan a {displayName} ({viewerNeedsTheyHave.length})
              </p>
              {viewerNeedsTheyHave.length === 0 ? (
                <p className="text-xs text-zinc-400">Ninguna en común 🤷</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {viewerNeedsTheyHave.map((s) => (
                    <span
                      key={s.code}
                      className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold"
                    >
                      {s.code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Not logged in: show target's duplicates & missing */}
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
      </div>
    </div>
  );
}
