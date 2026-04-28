'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      // Auto-confirm active: already logged in, go straight to album so guest import runs
      router.push('/album');
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-6 text-center">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          ¡Revisá tu email!
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
          Te mandamos un enlace de confirmación. Hacé click en él para activar tu cuenta.
        </p>
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 max-w-xs text-left">
          <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold mb-1">⚠️ Importante si tenés figus cargadas</p>
          <p className="text-amber-600 dark:text-amber-500 text-xs leading-relaxed">
            Abrí el link de confirmación en <strong>este mismo navegador</strong> para no perder las figuritas que ya cargaste.
          </p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 px-6 py-3 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm"
        >
          Ir al login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white">
          Fichus<span className="text-[#00B8D4]">2026</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Tu colección del Mundial 2026
        </p>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-5">Crear cuenta</h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            minLength={6}
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repetir contraseña"
            required
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-[#00B8D4] font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
