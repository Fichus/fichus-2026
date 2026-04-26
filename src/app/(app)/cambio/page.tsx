'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useCollection } from '@/contexts/CollectionContext';
import { createClient } from '@/lib/supabase/client';
import { ALL_STICKERS, STICKER_MAP } from '@/lib/stickers';

export default function CambioPage() {
  const { collection } = useCollection();
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tradeUrl = userId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cambio/${userId}`
    : '';

  // Stickers with more than 1 copy → tradeable (count - 1 extras)
  const myDuplicates = useMemo(() => {
    return Object.values(collection)
      .filter((e) => e.count > 1)
      .sort((a, b) => (b.count - 1) - (a.count - 1))
      .map((e) => ({ ...e, extras: e.count - 1, info: STICKER_MAP.get(e.sticker_num) }));
  }, [collection]);

  // Stickers with count 0 (using ALL_STICKERS as source of truth, exclude extras)
  const myMissing = useMemo(() => {
    return ALL_STICKERS
      .filter((s) => s.section !== 'extra')
      .filter((s) => (collection[s.code]?.count ?? 0) === 0);
  }, [collection]);

  const copyUrl = () => {
    navigator.clipboard.writeText(tradeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🔄 Mi Cambio</h1>

      {/* QR + Trade link */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Compartí este QR o link para que otros puedan comparar su colección con la tuya
        </p>
        {tradeUrl ? (
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <QRCodeSVG value={tradeUrl} size={160} />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className="w-[186px] h-[186px] bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 truncate font-mono">
            {tradeUrl || 'Cargando…'}
          </div>
          <button
            onClick={copyUrl}
            disabled={!tradeUrl}
            className="px-4 py-2 rounded-xl bg-[#00B8D4] text-white text-xs font-semibold disabled:opacity-40"
          >
            {copied ? '✓' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* My duplicates */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">
          Mis repetidas{' '}
          <span className="text-zinc-400 font-normal">({myDuplicates.length} figuritas)</span>
        </h2>
        {myDuplicates.length === 0 ? (
          <p className="text-xs text-zinc-400">Sin repetidas por ahora</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {myDuplicates.map((e) => (
              <div
                key={e.sticker_num}
                className="px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] text-xs font-semibold"
              >
                {e.sticker_num} ×{e.extras}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My missing */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">
          Me faltan{' '}
          <span className="text-zinc-400 font-normal">({myMissing.length})</span>
        </h2>
        {myMissing.length === 0 ? (
          <p className="text-xs text-green-500 font-semibold">¡Álbum completo! 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {myMissing.map((s) => (
              <div
                key={s.code}
                className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold"
              >
                {s.code}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
