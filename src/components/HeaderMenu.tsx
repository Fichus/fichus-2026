'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useCollection } from '@/contexts/CollectionContext';
import {
  useAlbumShowCC,
  useAlbumTapMode,
} from '@/lib/albumStore';
import { triggerOnboarding } from '@/lib/onboardingStore';
import { useAvoidTutorial } from '@/lib/tutorialAvoidStore';
import { createClient } from '@/lib/supabase/client';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  onClose: () => void;
}

type Confirm =
  | { kind: 'completeAll' }
  | { kind: 'clearAll' }
  | { kind: 'clearRepeated' }
  | { kind: 'logout' }
  | null;

/**
 * Bottom-sheet "kebab" (⋮) menu that replaces the old standalone dark/light
 * toggle in the header. Houses album-level actions (complete / empty / drop
 * repes), UI toggles (theme, hide CC, tap-mode), the tutorial replay, and
 * logout — everything that's too rarely-used to deserve a dedicated icon but
 * users still need access to.
 *
 * Destructive actions go through ConfirmDialog so a tap can't silently wipe
 * the user's album. Logout is also confirmed because it requires re-login.
 *
 * Renders via portal so the header's backdrop-filter doesn't trap the
 * fixed-position overlay.
 */
export default function HeaderMenu({ onClose }: Props) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { completeAll, clearAll, clearRepeated, isGuest } = useCollection();
  const [showCC, setShowCC] = useAlbumShowCC();
  const [tapMode, setTapMode] = useAlbumTapMode();
  const [mounted, setMounted] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  useEffect(() => setMounted(true), []);
  // Slide the tutorial banner up while open + register onClose so
  // tutorial Next/Prev auto-closes the kebab before changing step.
  useAvoidTutorial(onClose);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push('/login');
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    switch (confirm.kind) {
      case 'completeAll':   await completeAll();   break;
      case 'clearAll':      await clearAll();      break;
      case 'clearRepeated': await clearRepeated(); break;
      case 'logout':        await handleLogout();  break;
    }
    setConfirm(null);
    if (confirm.kind !== 'logout') onClose();
  };

  if (!mounted) return null;

  const items: {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick: () => void;
    danger?: boolean;
    hide?: boolean;
  }[] = [
    {
      icon: theme === 'dark' ? <SunIcon /> : <MoonIcon />,
      label: theme === 'dark' ? 'Modo claro' : 'Modo oscuro',
      onClick: () => { toggleTheme(); /* keep menu open so user sees change */ },
    },
    {
      icon: <EyeIcon open={showCC} />,
      label: showCC ? 'Ocultar Coca-Cola' : 'Mostrar Coca-Cola',
      sub: 'Las CC siguen guardadas, solo se ocultan en la vista.',
      onClick: () => setShowCC(!showCC),
    },
    {
      icon: tapMode === 'add' ? <MinusCircleIcon /> : <PlusCircleIcon />,
      label: tapMode === 'add' ? 'Modo de toque: restar' : 'Modo de toque: sumar',
      sub: tapMode === 'add'
        ? 'Tocar la carta restará en vez de sumar (útil para bajar stock).'
        : 'Tocar la carta volverá a sumar +1.',
      onClick: () => setTapMode(tapMode === 'add' ? 'subtract' : 'add'),
    },
    {
      icon: <TrashIcon />,
      label: 'Eliminar repetidas',
      sub: 'Pone en 1 todas las que tengan más copias (mantenés el álbum completo).',
      onClick: () => setConfirm({ kind: 'clearRepeated' }),
      hide: isGuest,
    },
    {
      icon: <CheckIcon />,
      label: 'Completar álbum',
      sub: 'Marca con 1 cada figurita que tengas en 0.',
      onClick: () => setConfirm({ kind: 'completeAll' }),
      hide: isGuest,
    },
    {
      icon: <XCircleIcon />,
      label: 'Vaciar álbum',
      sub: 'Pone en 0 todas las figuritas. No se puede deshacer.',
      onClick: () => setConfirm({ kind: 'clearAll' }),
      danger: true,
      hide: isGuest,
    },
    {
      icon: <BookIcon />,
      label: 'Ver tutorial',
      onClick: () => { onClose(); triggerOnboarding(); },
    },
    {
      icon: <LogoutIcon />,
      label: 'Cerrar sesión',
      onClick: () => setConfirm({ kind: 'logout' }),
      danger: true,
      hide: isGuest,
    },
  ];

  return createPortal(
    <>
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
            <h2 className="text-base font-bold text-zinc-900 dark:text-white text-center">
              Más acciones
            </h2>
          </div>
          <div
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ overscrollBehavior: 'contain' }}
          >
            <ul className="space-y-1">
              {items.filter((i) => !i.hide).map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={(e) => {
                      // Belt-and-suspenders: the inner sheet already stops the
                      // event from bubbling to the backdrop, but on some mobile
                      // browsers we were still seeing the modal close when
                      // tapping toggle items. Explicit stop here guarantees
                      // toggles (theme / CC / tap mode) keep the sheet open so
                      // the user can see the state change.
                      e.stopPropagation();
                      item.onClick();
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors text-left"
                  >
                    <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${item.danger ? 'text-red-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[14px] font-semibold leading-tight ${item.danger ? 'text-red-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="block text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                          {item.sub}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
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
      </div>

      {confirm && (
        <ConfirmDialog
          message={confirmMessage(confirm)}
          confirmLabel={confirmLabel(confirm)}
          danger={confirm.kind !== 'completeAll'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>,
    document.body
  );
}

function confirmMessage(c: Exclude<Confirm, null>): string {
  switch (c.kind) {
    case 'completeAll':   return '¿Marcar con 1 todas las figuritas que tengas en 0? Las que ya tenés mantienen su cantidad.';
    case 'clearAll':      return '¿Vaciar el álbum completo? Se pondrá 0 a todas las figuritas. No se puede deshacer.';
    case 'clearRepeated': return '¿Eliminar todas las repetidas? Cada figurita con más de una copia quedará en 1.';
    case 'logout':        return '¿Cerrar sesión? Vas a tener que volver a iniciar sesión para acceder a tus figuritas.';
  }
}

function confirmLabel(c: Exclude<Confirm, null>): string {
  switch (c.kind) {
    case 'completeAll':   return 'Completar';
    case 'clearAll':      return 'Vaciar';
    case 'clearRepeated': return 'Eliminar repes';
    case 'logout':        return 'Cerrar sesión';
  }
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

function MoonIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
}
function SunIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;
}
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  );
}
function PlusCircleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
}
function MinusCircleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
}
function TrashIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
}
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function XCircleIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}
function BookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
}
function LogoutIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
