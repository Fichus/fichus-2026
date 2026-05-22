'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

/**
 * Confirmation modal rendered via portal at document.body with a very high
 * z-index. Both choices matter:
 *  - Portal escapes any ancestor that establishes a containing block
 *    (backdrop-filter on the sticky header, transforms, etc.) which would
 *    otherwise trap `position: fixed` inside a small region.
 *  - z-[100] makes it sit ABOVE every other modal we ship (kebab menu /
 *    share / paste / scanner all use z-[60]), so confirming from inside one
 *    of those still shows this dialog on top, not behind.
 */
export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  danger = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useAvoidTutorial(onCancel);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
        <p className="text-zinc-800 dark:text-zinc-100 text-base text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-medium text-white ${
              danger ? 'bg-red-500 active:bg-red-600' : 'bg-[#00B8D4] active:bg-[#0097b2]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
