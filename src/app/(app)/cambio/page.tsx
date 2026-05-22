'use client';
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useCollection } from '@/contexts/CollectionContext';
import QrScanner from '@/components/QrScanner';
import PasteTradeModal from '@/components/PasteTradeModal';
import { createClient } from '@/lib/supabase/client';
import { ALL_STICKERS, STICKER_MAP } from '@/lib/stickers';

export default function CambioPage() {
  const { collection, isGuest } = useCollection();
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const tradeUrl = userId ? `${siteOrigin}/cambio/${userId}` : '';

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

  /* When the scanner reads a QR, accept either a full /cambio/<uuid> URL or
     just a bare UUID. Anything else gets discarded with an alert so users
     don't end up navigating to unrelated sites. */
  const handleScan = (raw: string) => {
    setScanning(false);
    const text = raw.trim();
    const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = text.match(uuidRe);
    if (!match) {
      alert('QR no reconocido. Asegurate de escanear un QR de Fichus2026.');
      return;
    }
    router.push(`/cambio/${match[0]}`);
  };

  // Guest mode used to be blocked entirely (GuestLock wrapper). That made the
  // app feel locked-out — and the tutorial promised "sin cuenta" features
  // that guests couldn't access. New behaviour: render the full page for
  // guests too, but lock the genuinely account-bound bits (QR generation —
  // needs a userId — and the URL/copy widgets that derive from it). Escanear
  // and Pegar lista still work, and the repes/missing lists show whatever's
  // in localStorage.

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🔄 Mi Cambio</h1>

      {/* QR + Trade link. For guests the QR slot is replaced with a soft
          login CTA; the link bar shows a placeholder. Escanear and Pegar
          stay enabled — they don't require a userId. */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-3">
          {isGuest
            ? 'Para que otros te encuentren con QR necesitás cuenta. Igual podés escanear el QR de un amigo o pegar su lista acá abajo.'
            : 'Compartí este QR o link para que otros puedan comparar su colección con la tuya'}
        </p>
        {isGuest ? (
          <Link
            href="/login?next=/cambio"
            className="flex flex-col items-center justify-center mb-3 w-[186px] h-[186px] mx-auto rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-center px-4 active:scale-[0.99] transition-transform"
          >
            <svg
              width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="text-zinc-400 dark:text-zinc-500 mb-2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 leading-tight">
              Iniciá sesión para<br/>generar tu QR
            </p>
            <span className="mt-1.5 text-[10px] font-bold text-[#00B8D4]">Iniciar sesión →</span>
          </Link>
        ) : tradeUrl ? (
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
        <button
          onClick={() => setScanning(true)}
          className="w-full mb-2 py-2.5 rounded-xl bg-[#00B8D4] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          aria-label="Escanear código QR"
        >
          {/* Minimalist line-style camera icon */}
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Escanear código
        </button>
        {/* Secondary action: paste another person's text list to detect
            matchable trades without needing their QR. Subtle styling so it
            doesn't compete with the primary Escanear button. */}
        <button
          onClick={() => setPasteOpen(true)}
          className="w-full mb-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          aria-label="Pegar lista de un amigo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          Pegar lista de un amigo
        </button>
        {/* Link + Copy bar — only meaningful when there's a real trade URL,
            so we drop it entirely for guests instead of showing a stale
            "Cargando…" forever. */}
        {!isGuest && (
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-[13px] text-zinc-600 dark:text-zinc-300 truncate font-mono">
            {tradeUrl || 'Cargando…'}
          </div>
          <button
            onClick={copyUrl}
            disabled={!tradeUrl}
            className="px-4 py-2 rounded-xl bg-[#00B8D4] text-white text-[13px] font-semibold disabled:opacity-40"
          >
            {copied ? '✓' : 'Copiar'}
          </button>
        </div>
        )}
      </div>

      {/* My duplicates */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">
          Mis repetidas{' '}
          <span className="text-zinc-400 font-normal">({myDuplicates.length} figuritas)</span>
        </h2>
        {myDuplicates.length === 0 ? (
          <p className="text-[13px] text-zinc-400">Sin repetidas por ahora</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {myDuplicates.map((e) => (
              <div
                key={e.sticker_num}
                className="px-2 py-1 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] text-[13px] font-semibold"
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
                className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-[13px] font-semibold"
              >
                {s.code}
              </div>
            ))}
          </div>
        )}
      </div>

      {scanning && (
        <QrScanner onResult={handleScan} onClose={() => setScanning(false)} />
      )}
      {pasteOpen && (
        <PasteTradeModal onClose={() => setPasteOpen(false)} />
      )}
    </div>
  );
}
