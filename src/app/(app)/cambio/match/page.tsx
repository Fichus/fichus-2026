'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCollection } from '@/contexts/CollectionContext';
import { decodeTradePayload } from '@/lib/tradePayload';
import { STICKER_MAP } from '@/lib/stickers';

/**
 * Trade-confirmation page for the album owner. Reached by scanning the QR
 * that the public /cambio/[userId] page generates AFTER a visitor pastes
 * their list there. The QR encodes the visitor's missing + repeated codes
 * into `?d=<base64url>`; here we decode them, intersect with the owner's
 * own collection, let them tick what they're actually trading, and apply
 * the delta atomically through addSticker / removeSticker.
 *
 * Why this exists at all: the public page only has read access to the
 * owner's collection (RLS). To mutate the owner's stock we need to be IN
 * the owner's session — i.e. this route, inside the (app) auth group with
 * CollectionProvider mounted.
 *
 * Sits as a sibling of (app)/cambio/page.tsx → the static `match` segment
 * wins over the dynamic `[userId]` route at /cambio/[id] for this exact
 * literal, so no clash.
 */
export default function CambioMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { collection, addSticker, removeSticker, isGuest } = useCollection();

  const [selectedGive, setSelectedGive]       = useState<Set<string>>(new Set());
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);

  // ── Parse the payload ───────────────────────────────────────────────────
  // Guard against malformed/expired links (someone shares an old QR via a
  // chat that mangles the URL). decodeTradePayload returns null on parse
  // failure rather than throwing so we can render a friendly fallback.
  const payload = useMemo(() => {
    const raw = searchParams.get('d');
    if (!raw) return null;
    return decodeTradePayload(raw);
  }, [searchParams]);

  // ── Compute matches against MY collection ────────────────────────────────
  // From the owner's POV:
  //   - payload.missing  → codes the visitor needs → I give if I have spares.
  //   - payload.repeated → codes the visitor has spare → I receive if I'm at 0.
  const matches = useMemo(() => {
    if (!payload) return { iGive: [] as string[], iReceive: [] as string[] };
    const iGive    = payload.missing.filter((code) => (collection[code]?.count ?? 0) > 1);
    const iReceive = payload.repeated.filter((code) => (collection[code]?.count ?? 0) === 0);
    return { iGive, iReceive };
  }, [payload, collection]);

  // Prune selections that no longer apply — same defensive cleanup as the
  // PasteTradeModal in case the collection mutates underneath us (e.g. the
  // owner taps the album, or a realtime event lands).
  useEffect(() => {
    setSelectedGive((prev) => {
      const next = new Set<string>();
      for (const c of prev) if (matches.iGive.includes(c)) next.add(c);
      return next.size === prev.size ? prev : next;
    });
    setSelectedReceive((prev) => {
      const next = new Set<string>();
      for (const c of prev) if (matches.iReceive.includes(c)) next.add(c);
      return next.size === prev.size ? prev : next;
    });
  }, [matches]);

  const toggleGive    = (code: string) => { setDone(false); setSelectedGive(toggleSet(code)); };
  const toggleReceive = (code: string) => { setDone(false); setSelectedReceive(toggleSet(code)); };

  const handleConfirm = () => {
    for (const code of selectedGive)    removeSticker(code);
    for (const code of selectedReceive) addSticker(code);
    setSelectedGive(new Set());
    setSelectedReceive(new Set());
    setDone(true);
  };

  const hasSelection = selectedGive.size > 0 || selectedReceive.size > 0;

  // ── Guest? Send them through login first ────────────────────────────────
  // CollectionProvider will still mount with userId=null so we render, but
  // any confirm would just write to localStorage. Better to surface a hard
  // CTA so they don't think it worked and then find no DB change.
  if (isGuest) {
    return (
      <div className="px-4 pt-6 pb-10">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          🔄 Cambio rápido
        </h1>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4">
          <p className="text-[13px] text-amber-800 dark:text-amber-300">
            Para aplicar el cambio a tu stock necesitás estar logueado. Iniciá sesión y volvé a escanear el QR.
          </p>
          <Link
            href="/login?next=/album"
            className="mt-3 inline-block px-4 py-2 rounded-xl bg-[#00B8D4] text-white text-sm font-semibold"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="px-4 pt-6 pb-10">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
          🔄 Cambio rápido
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
          <p className="text-[13px] text-red-700 dark:text-red-400">
            El QR está vacío o el link está mal formado. Pedile a la otra persona que vuelva a pegar su lista y te muestre un QR nuevo.
          </p>
          <button
            onClick={() => router.push('/album')}
            className="mt-3 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-semibold"
          >
            Volver al álbum
          </button>
        </div>
      </div>
    );
  }

  const totalReceived = payload.repeated.length;
  const totalNeeded   = payload.missing.length;

  return (
    <div className="px-4 pt-4 pb-32">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
        🔄 Cambio rápido
      </h1>
      <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-4 leading-snug">
        Lista detectada del otro: {totalNeeded} faltante{totalNeeded === 1 ? '' : 's'} · {totalReceived} repetida{totalReceived === 1 ? '' : 's'}. Marcá lo que realmente se intercambia y confirmá.
      </p>

      {/* Le doy */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-3">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
          🎁 Le doy
          {selectedGive.size > 0 && (
            <span className="ml-1 text-violet-500">· {selectedGive.size} seleccionada{selectedGive.size === 1 ? '' : 's'}</span>
          )}
        </h2>
        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mb-2">
          Le faltan al otro y yo tengo repetidas ({matches.iGive.length})
        </p>
        {matches.iGive.length === 0 ? (
          <p className="text-[12px] text-zinc-400">No tengo nada de lo que le falta 🤷</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {matches.iGive.map((code) => (
              <ChipButton
                key={code}
                code={code}
                selected={selectedGive.has(code)}
                onClick={() => toggleGive(code)}
                idle="bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                active="bg-violet-500 text-white ring-2 ring-violet-500 ring-offset-1"
              />
            ))}
          </div>
        )}
      </div>

      {/* Me da */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-3">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">
          🤝 Me da
          {selectedReceive.size > 0 && (
            <span className="ml-1 text-[#00B8D4]">· {selectedReceive.size} seleccionada{selectedReceive.size === 1 ? '' : 's'}</span>
          )}
        </h2>
        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mb-2">
          Tiene de repe y yo no la tengo ({matches.iReceive.length})
        </p>
        {matches.iReceive.length === 0 ? (
          <p className="text-[12px] text-zinc-400">Nada que no tenga ya 🤷</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {matches.iReceive.map((code) => (
              <ChipButton
                key={code}
                code={code}
                selected={selectedReceive.has(code)}
                onClick={() => toggleReceive(code)}
                idle="bg-[#00B8D4]/10 text-[#00B8D4]"
                active="bg-[#00B8D4] text-white ring-2 ring-[#00B8D4] ring-offset-1"
              />
            ))}
          </div>
        )}
      </div>

      {done && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 mb-3">
          <p className="text-[13px] text-green-700 dark:text-green-400 font-semibold">
            ✓ Cambio aplicado a tu stock. Si te equivocaste, deshacelo desde el historial del álbum.
          </p>
        </div>
      )}

      {/* Sticky confirm bar — same pattern as /cambio/[userId] so the gesture
          is familiar across the trade flows. */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-[480px] px-4 pb-6 pointer-events-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex items-center gap-3">
            <div className="flex-1 text-[12px] leading-tight">
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
              disabled={!hasSelection}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 transition-colors ${
                hasSelection
                  ? 'bg-[#00B8D4] text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              🔄 Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────────── */

/** Functional-update helper so the toggle callbacks stay one-liners above. */
function toggleSet(code: string) {
  return (prev: Set<string>) => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    return next;
  };
}

function ChipButton({
  code, selected, onClick, idle, active,
}: {
  code: string; selected: boolean; onClick: () => void; idle: string; active: string;
}) {
  const info = STICKER_MAP.get(code);
  const sub = info?.section === 'team'
    ? `${info.teamName} — ${info.role}`
    : info?.role || '';
  return (
    <button
      onClick={onClick}
      title={sub}
      className={`px-2 py-1 rounded-lg text-[12px] font-semibold transition-all active:scale-95 ${selected ? active : idle}`}
    >
      {selected ? '✓ ' : ''}{code}
    </button>
  );
}
