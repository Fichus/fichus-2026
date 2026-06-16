'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '@/contexts/CollectionContext';
import { parseShareText } from '@/lib/shareText';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';
import { STICKER_MAP } from '@/lib/stickers';

interface Props {
  onClose: () => void;
}

/**
 * Lets the user paste another person's faltantes/repetidas (in the same
 * Figuritas-compatible text format we export) and surfaces two cross-
 * referenced lists:
 *
 *   - "Le puedo dar"  → stickers THEY are missing AND I have repeated.
 *   - "Me puede dar"  → stickers I am missing AND THEY have repeated.
 *
 * Both lists are tappable. Selecting a code marks it for the trade; the
 * confirm button at the bottom applies the deltas to MY collection
 * (give = removeSticker, receive = addSticker). Each tap goes through the
 * regular collection actions so the moves land in the undo history.
 *
 * Read-only filter logic — the OTHER person's collection is never touched
 * here, since we don't know who they are. (The QR-scan flow handles that
 * via `apply_trade` on the public cambio page.)
 *
 * Rendered via portal so the sticky header / backdrop-blur ancestors don't
 * trap its `position: fixed`.
 */
export default function PasteTradeModal({ onClose }: Props) {
  const { collection, addSticker, removeSticker } = useCollection();
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedGive, setSelectedGive] = useState<Set<string>>(new Set());
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  useEffect(() => setMounted(true), []);
  useAvoidTutorial(onClose);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    return parseShareText(text);
  }, [text]);

  const matches = useMemo(() => {
    if (!parsed) return { iCanGive: [] as string[], theyCanGive: [] as string[] };
    // I can give: they need it AND my count > 1 (have at least one spare).
    const iCanGive = parsed.missing.filter((code) => (collection[code]?.count ?? 0) > 1);
    // They can give: they have spares AND I have 0.
    const theyCanGive = parsed.repeated.filter((code) => (collection[code]?.count ?? 0) === 0);
    return { iCanGive, theyCanGive };
  }, [parsed, collection]);

  // If the underlying collection changes mid-flow (e.g. I tap a sticker on the
  // album behind the modal) prune selections that no longer make sense, so we
  // don't end up "confirming" a trade against stale state.
  useEffect(() => {
    setSelectedGive((prev) => {
      const next = new Set<string>();
      for (const c of prev) if (matches.iCanGive.includes(c)) next.add(c);
      return next.size === prev.size ? prev : next;
    });
    setSelectedReceive((prev) => {
      const next = new Set<string>();
      for (const c of prev) if (matches.theyCanGive.includes(c)) next.add(c);
      return next.size === prev.size ? prev : next;
    });
  }, [matches]);

  const toggleGive = (code: string) => {
    setDone(false);
    setSelectedGive((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleReceive = (code: string) => {
    setDone(false);
    setSelectedReceive((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText(clip);
    } catch {
      // Clipboard read often requires a user gesture + permission; on iOS
      // and some browsers it fails silently. The textarea is always there
      // as the manual fallback.
    }
  };

  const handleConfirm = () => {
    // Apply one delta per selected code: give → -1, receive → +1. We rely on
    // the regular addSticker / removeSticker so the moves debounce-sync to the
    // DB AND show up in the undo history, just like manual taps on the album.
    for (const code of selectedGive)    removeSticker(code);
    for (const code of selectedReceive) addSticker(code);
    setSelectedGive(new Set());
    setSelectedReceive(new Set());
    setDone(true);
  };

  const hasSelection = selectedGive.size > 0 || selectedReceive.size > 0;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '90svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-1">
            Comparar listas
          </h2>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 text-center">
            Pegá las faltantes y repetidas de otra persona, marcá las que se cambian y confirmá — tu stock se actualiza.
          </p>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-3"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-2 mb-3">
            <button
              onClick={handlePasteFromClipboard}
              className="flex-1 py-2 rounded-xl bg-[#00B8D4] text-white text-[13px] font-semibold"
            >
              📋 Pegar del portapapeles
            </button>
            {text && (
              <button
                onClick={() => setText('')}
                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[13px] font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Ejemplo:\n\nMe faltan\nMEX 🇲🇽: 1, 5, 12\nARG 🇦🇷: 3, 7\n\nRepetidas\nBRA 🇧🇷: 2, 9\n'}
            rows={6}
            className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-[12px] font-mono px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/40 resize-none"
          />

          {parsed && (parsed.missing.length > 0 || parsed.repeated.length > 0) && (
            <div className="mt-4 space-y-3">
              <SelectableBlock
                title="🎁 Le puedo dar"
                subtitle="Necesita y yo tengo repetidas — marcá las que le entregás"
                codes={matches.iCanGive}
                selected={selectedGive}
                onToggle={toggleGive}
                selectedColor="bg-violet-500 text-white ring-2 ring-violet-500 ring-offset-1"
                idleColor="bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                titleColor="text-violet-500"
                empty="No tengo nada de lo que necesita."
              />
              <SelectableBlock
                title="🤝 Me puede dar"
                subtitle="Tiene repetidas y yo no la tengo — marcá las que recibís"
                codes={matches.theyCanGive}
                selected={selectedReceive}
                onToggle={toggleReceive}
                selectedColor="bg-[#00B8D4] text-white ring-2 ring-[#00B8D4] ring-offset-1"
                idleColor="bg-[#00B8D4]/10 text-[#00B8D4]"
                titleColor="text-[#00B8D4]"
                empty="No tiene nada de lo que me falta."
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
                Detecté {parsed.missing.length} faltante{parsed.missing.length === 1 ? '' : 's'} y {parsed.repeated.length} repetida{parsed.repeated.length === 1 ? '' : 's'} en el texto.
              </p>
            </div>
          )}

          {parsed && parsed.missing.length === 0 && parsed.repeated.length === 0 && (
            <p className="mt-3 text-[12px] text-amber-600 dark:text-amber-400 text-center">
              No detecté líneas válidas. Asegurate de que tenga secciones &ldquo;Me faltan&rdquo; o &ldquo;Repetidas&rdquo; con códigos tipo MEX-1.
            </p>
          )}

          {done && (
            <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
              <p className="text-[12.5px] text-green-700 dark:text-green-400 font-semibold text-center">
                ✓ Cambio aplicado. Si te equivocaste, deshacelo desde el historial.
              </p>
            </div>
          )}
        </div>

        {/* Fixed footer — confirm bar mirrors the public-cambio sticky bar so
            the gesture is familiar across both flows. */}
        <div className="flex-shrink-0 px-5 pt-2 pb-5 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
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
              className={`px-4 py-2 rounded-xl font-bold text-[13px] transition-colors ${
                hasSelection
                  ? 'bg-[#00B8D4] text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              🔄 Confirmar
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[13px] font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Selectable result block ────────────────────────────────────────────────
   A leaderboard-style list where each code is a toggleable chip. Selection is
   driven by the parent (controlled), so the confirm bar reads from a single
   source of truth and can apply the trade atomically. */
function SelectableBlock({
  title, subtitle, codes, selected, onToggle, selectedColor, idleColor, titleColor, empty,
}: {
  title: string;
  subtitle: string;
  codes: string[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  selectedColor: string;
  idleColor: string;
  titleColor: string;
  empty: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className={`font-bold text-[13px] ${titleColor}`}>
          {title}
          {selected.size > 0 && (
            <span className="ml-1.5 text-[11px] font-semibold opacity-80">
              · {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
            </span>
          )}
        </h3>
        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
          {codes.length}
        </span>
      </div>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2 leading-tight">{subtitle}</p>
      {codes.length === 0 ? (
        <p className="text-[12px] text-zinc-400">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {codes.map((code) => {
            const info = STICKER_MAP.get(code);
            const sub = info?.section === 'team'
              ? info.teamName
              : info?.section === 'extra'
              ? info.extraPlayerName
              : '';
            const isSel = selected.has(code);
            return (
              <button
                key={code}
                onClick={() => onToggle(code)}
                title={sub}
                className={`px-2 py-1 rounded-lg text-[11.5px] font-semibold transition-all active:scale-95 ${
                  isSel ? selectedColor : idleColor
                }`}
              >
                {isSel ? '✓ ' : ''}{code}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
