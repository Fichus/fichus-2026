'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '@/contexts/CollectionContext';
import { buildShareText, type ShareMode } from '@/lib/shareText';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';

interface Props {
  onClose: () => void;
}

const OPTIONS: { mode: ShareMode; title: string; subtitle: string; icon: string }[] = [
  { mode: 'both',     title: 'Faltantes y repetidas', subtitle: 'Toda mi lista para intercambiar',         icon: '📋' },
  { mode: 'missing',  title: 'Solo faltantes',        subtitle: 'Las que necesito conseguir',              icon: '🔍' },
  { mode: 'repeated', title: 'Solo repetidas',        subtitle: 'Las que tengo de sobra para regalar/cambiar', icon: '📦' },
];

/**
 * Bottom-sheet modal triggered from the header. Lets the user copy their
 * collection state as plain text in three flavors, using a Figuritas-app-
 * compatible format so lists can be pasted between apps.
 *
 * After a successful copy, we use the Web Share API if available (mobile) to
 * pop the native share sheet pre-filled with the text. On desktop, we just
 * confirm the copy with a small "Copiado" indicator.
 */
export default function ShareModal({ onClose }: Props) {
  const { collection } = useCollection();
  const [copied, setCopied] = useState<ShareMode | null>(null);
  // Portal-mount flag: avoids "document is not defined" during SSR. The
  // portal is needed because this modal used to be rendered inside the
  // sticky <header> which has backdrop-blur — and `backdrop-filter`
  // creates a containing block, which makes `position: fixed` resolve
  // against the header instead of the viewport. Result: the modal got
  // cropped to the header's height. Rendering at document.body sidesteps
  // any ancestor with transform/filter/backdrop-filter.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useAvoidTutorial(onClose);

  const handlePick = async (mode: ShareMode) => {
    const text = buildShareText(mode, collection);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mode);
    } catch {
      // Clipboard can fail in insecure contexts; fall through to share-only.
    }
    // Prefer the native share sheet on mobile.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: { text: string }) => Promise<void> }).share({ text });
        onClose();
        return;
      } catch {
        // User cancelled or share failed — leave the modal open so they can
        // see the "Copiado" feedback or try another option.
      }
    }
    setTimeout(() => setCopied(null), 1800);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl p-5 pb-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-1">
          Compartir figuritas
        </h2>
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 text-center mb-4">
          Elegí qué incluir. Se copia como texto compatible con otras apps.
        </p>
        <div className="flex flex-col gap-2">
          {OPTIONS.map((o) => {
            const isCopied = copied === o.mode;
            return (
              <button
                key={o.mode}
                onClick={() => handlePick(o.mode)}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors text-left"
              >
                <span className="text-xl">{o.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                    {o.title}
                  </p>
                  <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    {o.subtitle}
                  </p>
                </div>
                {isCopied && (
                  <span className="text-[11px] font-bold text-[#00B8D4]">✓ Copiado</span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}
