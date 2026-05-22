'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseShareTextForImport } from '@/lib/shareText';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';

export type UnmentionedMode = 'leave' | 'owned-1' | 'missing-0';

interface Props {
  onClose: () => void;
  onConfirm: (parsed: Record<string, number>, mode: UnmentionedMode) => Promise<void> | void;
}

/**
 * Bottom-sheet modal that lets the user paste a Figuritas-style list and
 * choose what to do with stickers NOT mentioned in the text. Replaces the
 * previous "read clipboard / file picker only" flow which couldn't show the
 * user what they were about to import.
 *
 *   - 'leave'        → merge mode. Only the codes in the text are updated.
 *   - 'owned-1'      → assume the rest are owned with count = 1. Useful for
 *                      restoring a "complete backup" where stickers in
 *                      count=1 were elided to keep the text short.
 *   - 'missing-0'    → assume the rest are missing. Aggressive replace,
 *                      typically when you want a pristine snapshot.
 *
 * Renders via portal so the sticky header / backdrop-filter context doesn't
 * trap its `position: fixed`.
 */
export default function ImportTextModal({ onClose, onConfirm }: Props) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<UnmentionedMode>('leave');
  const [working, setWorking] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useAvoidTutorial(onClose);

  // Try to pre-fill from clipboard on mount — most users got here via the
  // "Importar texto" button right after copying a list. If it fails (iOS
  // permission, insecure context) the textarea stays empty and they can
  // paste manually.
  useEffect(() => {
    (async () => {
      try {
        const clip = await navigator.clipboard.readText();
        if (clip && clip.trim()) setText(clip);
      } catch { /* permission denied — fall back to manual paste */ }
    })();
  }, []);

  const parsed = text.trim() ? parseShareTextForImport(text) : {};
  const parsedCount = Object.keys(parsed).length;
  const missingCount = Object.values(parsed).filter((c) => c === 0).length;
  const repesCount   = Object.values(parsed).filter((c) => c >  1).length;

  const handlePasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
    } catch {}
  };

  const handlePickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setText(await file.text());
    };
    input.click();
  };

  const handleConfirm = async () => {
    if (parsedCount === 0) return;
    setWorking(true);
    try {
      await onConfirm(parsed, mode);
    } finally {
      setWorking(false);
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
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-1">
            Importar texto
          </h2>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 text-center">
            Pegá una lista con secciones &ldquo;Me faltan&rdquo; / &ldquo;Repetidas&rdquo;.
          </p>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 py-3"
          style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-2 mb-2">
            <button
              onClick={handlePasteFromClipboard}
              className="flex-1 py-2 rounded-xl bg-[#00B8D4] text-white text-[13px] font-semibold"
            >
              📋 Pegar
            </button>
            <button
              onClick={handlePickFile}
              className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[13px] font-semibold"
            >
              📂 Desde archivo
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
            placeholder={'Ejemplo:\n\nMe faltan\nMEX: 1, 5, 12\nARG: 3, 7\n\nRepetidas\nBRA: 2, 9(x2)'}
            rows={8}
            className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-[12px] font-mono px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/40 resize-none"
          />

          {text.trim() && (
            <p className="mt-2 text-[11.5px] text-zinc-500 dark:text-zinc-400 text-center">
              Detecté <strong>{parsedCount}</strong> figuritas en el texto
              {parsedCount > 0 && (
                <> · <span className="text-violet-500">{missingCount} faltantes</span>
                  {' · '}
                  <span className="text-[#00B8D4]">{repesCount} repetidas</span>
                </>
              )}
            </p>
          )}

          {text.trim() && parsedCount === 0 && (
            <p className="mt-2 text-[11.5px] text-amber-600 dark:text-amber-400 text-center">
              No detecté líneas válidas. Asegurate de que tenga secciones &ldquo;Me faltan&rdquo; o &ldquo;Repetidas&rdquo; con códigos tipo MEX: 1, 2, 3.
            </p>
          )}

          {parsedCount > 0 && (
            <div className="mt-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3">
              <p className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200 mb-2">
                ¿Qué hacer con las figuritas no mencionadas?
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 leading-snug">
                La mayoría de la gente solo lista sus faltantes y repes. Las que no aparezcan, ¿qué hago?
              </p>
              <div className="space-y-1.5">
                <Radio
                  selected={mode === 'owned-1'}
                  onClick={() => setMode('owned-1')}
                  title="Marcarlas como que las tengo (1)"
                  sub="Asume que las no mencionadas las tenés, una sola vez. Ideal si te pasaron su lista completa."
                />
                <Radio
                  selected={mode === 'leave'}
                  onClick={() => setMode('leave')}
                  title="Dejarlas como están"
                  sub="Solo actualiza las figuritas listadas. Más seguro si te pasaron solo una parte."
                />
                <Radio
                  selected={mode === 'missing-0'}
                  onClick={() => setMode('missing-0')}
                  title="Marcarlas como faltantes (0)"
                  sub="Reemplaza tu álbum completo: lo que no está en el texto se pone en 0."
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-5 pt-2 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={parsedCount === 0 || working}
            className="flex-[2] py-2.5 rounded-xl bg-[#00B8D4] text-white text-sm font-bold disabled:opacity-40"
          >
            {working ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Radio({
  selected, onClick, title, sub,
}: { selected: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg border-2 transition-colors ${
        selected
          ? 'border-[#00B8D4] bg-[#00B8D4]/5'
          : 'border-zinc-200 dark:border-zinc-700 bg-transparent'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded-full border-2 transition-colors ${
          selected ? 'border-[#00B8D4] bg-[#00B8D4]' : 'border-zinc-400 dark:border-zinc-500'
        }`}>
          {selected && (
            <span className="block w-1.5 h-1.5 m-auto mt-[3px] rounded-full bg-white" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[12.5px] font-semibold leading-tight ${selected ? 'text-[#00B8D4]' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {title}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
            {sub}
          </p>
        </div>
      </div>
    </button>
  );
}
