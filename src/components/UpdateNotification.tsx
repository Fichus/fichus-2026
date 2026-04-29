'use client';
import React, { useEffect, useRef, useState } from 'react';

/**
 * One-time floating "what's new" popover for the views+sort update.
 *
 * Lifecycle:
 *  - On mount, checks localStorage. If the dismissal flag is missing, shows
 *    a small yellow bell button bottom-right.
 *  - Tapping the bell anchors a small panel right above it (no full-screen
 *    overlay, no backdrop blur — bottom nav and the rest of the page stay
 *    fully visible and tappable).
 *  - Click outside the panel closes it (without dismissing).
 *  - The ✕ button dismisses permanently — sets the flag, the user never
 *    sees the bell again on this device.
 *
 * The flag key includes a feature tag (`views-sort-v1`) so a future update
 * can ship its own notification with a different key without colliding.
 */

const DISMISS_KEY = 'update-notice-views-sort-v1';

export default function UpdateNotification() {
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setAvailable(true);
    } catch {
      // localStorage can throw in private mode — silently skip the toast.
    }
  }, []);

  // Close on outside click while open. Bell click is excluded explicitly so
  // that tapping the bell to open doesn't immediately re-close it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (bellRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setAvailable(false);
    setOpen(false);
  };

  if (!available) return null;

  // Both bell and panel anchor to the same right offset so the panel sits
  // visually attached to the bell. The bell is bottom-20 (above the bottom
  // nav, h-16 + safe area), the panel is bottom-36 so its bottom edge sits
  // ~16px above the bell.
  const rightOffset = 'max(1rem, calc((100vw - 480px) / 2 + 1rem))';

  return (
    <>
      {/* Floating bell — z-40, same level as floating UI but BELOW any modal. */}
      <button
        ref={bellRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Ver novedades"
        className="fixed z-40 bottom-20 w-12 h-12 rounded-full bg-amber-300 text-amber-900 shadow-[0_4px_18px_rgba(252,211,77,0.55)] flex items-center justify-center active:scale-95 transition-transform"
        style={{ right: rightOffset }}
      >
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-amber-300" />
      </button>

      {open && (
        <div
          ref={panelRef}
          // Anchored popover: fixed bottom-right, ~16px above the bell, capped
          // at 320px wide and never wider than the viewport minus margins. No
          // backdrop, no blur — bottom nav stays interactive.
          className="fixed z-40 bottom-36 rounded-2xl bg-amber-50 dark:bg-amber-950/95 border border-amber-200 dark:border-amber-800 p-4 pr-9 shadow-xl"
          style={{
            right: rightOffset,
            width: 'min(320px, calc(100vw - 2rem))',
          }}
        >
          <button
            onClick={dismiss}
            aria-label="Cerrar y no mostrar más"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-100 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
          <p className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300 mb-1">
            Novedades
          </p>
          <h3 className="text-[15px] font-bold text-amber-900 dark:text-amber-100 mb-2 leading-tight">
            Nuevas formas de ver tu álbum
          </h3>
          <ul className="space-y-1.5 text-[12.5px] text-amber-900/90 dark:text-amber-100/90 leading-snug">
            <li>📂 Filtrá <strong>Por grupos</strong> o <strong>Por países</strong>.</li>
            <li>↕ Ordená <strong>A-Z</strong> o <strong>Z-A</strong> y los números <strong>1→20</strong> o <strong>20→1</strong>.</li>
            <li>🔍 Buscador y filtros fijos arriba.</li>
          </ul>
          <p className="mt-2.5 text-[10.5px] text-amber-700/80 dark:text-amber-400/80">
            Tocá la ✕ para no volver a ver este aviso.
          </p>
        </div>
      )}
    </>
  );
}
