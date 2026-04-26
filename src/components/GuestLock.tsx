'use client';
import React from 'react';
import Link from 'next/link';
import { useCollection } from '@/contexts/CollectionContext';

interface Props {
  children: React.ReactNode;
}

export default function GuestLock({ children }: Props) {
  const { isGuest } = useCollection();

  if (!isGuest) return <>{children}</>;

  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred background preview */}
      <div className="pointer-events-none select-none blur-sm opacity-25 overflow-hidden max-h-[60vh]">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-xl w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#00B8D4]/10 flex items-center justify-center text-3xl">
            🔒
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
              Iniciá sesión para acceder
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tus figuritas del álbum se importan automáticamente al crear tu cuenta
            </p>
          </div>
          <Link
            href="/login"
            className="w-full py-3 rounded-xl bg-[#00B8D4] text-white font-bold text-sm text-center block"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm text-[#00B8D4] font-semibold"
          >
            ¿No tenés cuenta? Registrate gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
