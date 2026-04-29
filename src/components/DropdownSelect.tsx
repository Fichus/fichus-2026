'use client';
import React, { useEffect, useRef, useState } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}

/**
 * Replaces the native <select> with a button + floating panel so we control
 * the entire visual: rounded corners on the open menu, no system border, soft
 * gray background, hover/active states. Native <select> open menus are
 * OS-themed and can't be styled — they were the source of the "cuadrada con
 * borde negro" look the user disliked.
 *
 * Closes on outside click and Escape. The popup is positioned relative to the
 * button (absolute, full width below) — fine for the short option lists we
 * have. Generic over T so the value type is preserved end-to-end.
 */
export default function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouse);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouse);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-medium px-3 py-2 flex items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#00B8D4]/40"
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          className={`flex-shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        // Panel: noticeably gray (zinc-200 / zinc-700) so it stands out from
        // the near-white app background. Earlier version used zinc-50 which
        // was almost invisible against the page; user couldn't see the panel
        // edge or read the options. Selected item is the cyan accent over the
        // gray; unselected items deepen on hover.
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 shadow-lg ring-1 ring-zinc-300 dark:ring-zinc-600 overflow-hidden z-50"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={String(o.value)} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors ${
                    selected
                      ? 'bg-[#00B8D4] text-white'
                      : 'text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
