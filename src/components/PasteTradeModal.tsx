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
 * Figuritas-compatible text format we export) and see two cross-referenced
 * lists:
 *
 *   - "Le puedo dar"  → stickers THEY are missing AND I have repeated.
 *   - "Me puede dar"  → stickers I am missing AND THEY have repeated.
 *
 * Read-only suggestion engine — does not modify either collection. The user
 * still has to negotiate the actual swap. The match logic compares against
 * `collection[code].count`: > 1 means I have a spare, === 0 means I lack it.
 *
 * Rendered via portal so the sticky header / backdrop-blur ancestors don't
 * trap its `position: fixed`.
 */
export default function PasteTradeModal({ onClose }: Props) {
  const { collection } = useCollection();
  const [text, setText] = useState('');
  const [mounted, setMounted] = useState(false);
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
            Pegá las faltantes y repetidas de otra persona — te muestro qué pueden intercambiar.
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
              <ResultBlock
                title="🎁 Le puedo dar"
                subtitle="Necesita y yo tengo repetidas"
                codes={matches.iCanGive}
                color="text-[#00B8D4]"
                bg="bg-[#00B8D4]/10"
                empty="No tengo nada de lo que necesita."
              />
              <ResultBlock
                title="🤝 Me puede dar"
                subtitle="Tiene repetidas y yo no la tengo"
                codes={matches.theyCanGive}
                color="text-violet-500"
                bg="bg-violet-100 dark:bg-violet-900/20"
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
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 px-5 pt-2 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ResultBlock({
  title, subtitle, codes, color, bg, empty,
}: {
  title: string; subtitle: string; codes: string[]; color: string; bg: string; empty: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className={`font-bold text-[13px] ${color}`}>{title}</h3>
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
            const display = code;
            const sub = info?.section === 'team'
              ? info.teamName
              : info?.section === 'extra'
              ? info.extraPlayerName
              : '';
            return (
              <span
                key={code}
                title={sub}
                className={`px-2 py-1 rounded-lg ${bg} ${color} text-[11.5px] font-semibold`}
              >
                {display}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
