'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, clearHistory, type HistoryEntry } from '@/lib/historyStore';
import { useCollection } from '@/contexts/CollectionContext';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';
import { STICKER_MAP } from '@/lib/stickers';

/**
 * Header-mounted undo history. Shows a clock icon next to the lock; opening it
 * reveals the last N single-tap actions newest-first. Tapping an entry restores
 * the captured "before" snapshot via CollectionContext.undoHistoryEntry, which
 * also pops the entry off the stack so the same undo can't fire twice.
 *
 * Bulk operations (completeAll, importCollection, etc.) deliberately don't
 * appear here — undoing them one-by-one would be more confusing than useful,
 * and "Vaciar álbum" already has its own confirm flow.
 */
export default function HistoryButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const history = useHistory();
  const { undoHistoryEntry } = useCollection();

  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Historial de últimos cambios"
        className="relative w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      >
        {/* Clock-with-arrow icon: implies "go back" rather than just "time". */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <polyline points="3 4 3 10 9 10" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
        {history.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#00B8D4] text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {history.length > 99 ? '99+' : history.length}
          </span>
        )}
      </button>
      {open && mounted && (
        <HistorySheet
          history={history}
          onUndo={undoHistoryEntry}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function HistorySheet({
  history, onUndo, onClose,
}: {
  history: readonly HistoryEntry[];
  onUndo: (e: HistoryEntry) => void;
  onClose: () => void;
}) {
  useAvoidTutorial(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '85svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Historial
            </h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 underline-offset-2 hover:underline"
              >
                Vaciar
              </button>
            )}
          </div>
          <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
            Últimos cambios. Tocá uno para volver atrás.
          </p>
        </div>
        <div
          className="flex-1 overflow-y-auto px-3 pb-3"
          style={{ overscrollBehavior: 'contain' }}
        >
          {history.length === 0 ? (
            <p className="text-[12.5px] text-zinc-400 text-center py-8">
              Sin cambios recientes
            </p>
          ) : (
            <ul className="space-y-1">
              {history.map((entry) => {
                const info = STICKER_MAP.get(entry.code);
                const subtitle = info?.section === 'team'
                  ? `${info.teamName} — ${info.role}`
                  : info?.role || '';
                return (
                  <li key={entry.id}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUndo(entry);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors text-left"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 14 4 9 9 4" />
                          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                        </svg>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                          {entry.label}
                        </span>
                        {subtitle && (
                          <span className="block text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                            {subtitle}
                          </span>
                        )}
                      </span>
                      <span className="flex-shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {formatTime(entry.ts)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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

/** Relative-ish timestamp: "ahora", "5 min", "1 h", or HH:MM for older. */
function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 30_000) return 'ahora';
  if (diff < 60 * 60_000) return `${Math.round(diff / 60_000)} min`;
  if (diff < 6 * 60 * 60_000) return `${Math.round(diff / 3600_000)} h`;
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
