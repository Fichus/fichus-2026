'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Landing page for the "Forgot password" email link.
 *
 * Flow:
 *   1. User clicks the link in the email.
 *   2. Supabase routes them to /auth/callback?next=/reset-password with a
 *      one-time `code` param. The callback exchanges it for a session, then
 *      redirects here.
 *   3. This page expects a logged-in session and offers a "set new password"
 *      form. If there's no session (link expired, exchange failed, opened in
 *      a different browser), we bounce to /login with a helpful error.
 *
 * Keeping this page client-only — the password update happens entirely on
 * the client via the recovered session, so no server roundtrip is needed.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgIsError, setMsgIsError] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecking(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg('La contraseña debe tener al menos 6 caracteres.');
      setMsgIsError(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('Las contraseñas no coinciden.');
      setMsgIsError(true);
      return;
    }
    setSaving(true);
    setMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      setMsg('Error: ' + error.message);
      setMsgIsError(true);
      return;
    }
    setMsg('¡Contraseña actualizada! Redirigiendo…');
    setMsgIsError(false);
    setTimeout(() => router.push('/album'), 1500);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <p className="text-zinc-500">Verificando…</p>
      </div>
    );
  }

  // Bounce out if the recovery session wasn't established. Usually means
  // the email link expired or was opened in a different browser.
  if (!hasSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          Link inválido o vencido
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mb-6">
          El enlace para recuperar la contraseña no funcionó. Probá pedirlo de nuevo desde la pantalla de login.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm"
        >
          Volver al login
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
          Crear nueva contraseña
        </p>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Nueva contraseña</h2>
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5">
          Elegí una contraseña nueva para tu cuenta.
        </p>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
            msgIsError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (mín. 6)"
            required
            minLength={6}
            autoFocus
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repetir nueva contraseña"
            required
            className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
