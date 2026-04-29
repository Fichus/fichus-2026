'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCollection } from '@/contexts/CollectionContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { triggerOnboarding } from '@/lib/onboardingStore';
import type { CollectionEntry } from '@/lib/types';

type Section = 'main' | 'profile' | 'howto' | 'support';

export default function ConfigPage() {
  const [section, setSection] = useState<Section>('main');
  const [userEmail, setUserEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameMsg, setDisplayNameMsg] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [confirm, setConfirm] = useState<'clearAll' | 'completeAll' | 'addOneAll' | 'removeOneAll' | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { clearAll, completeAll, addOneAll, removeOneAll, collection, isGuest, importCollection } = useCollection();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '');
      setDisplayName(data.user?.user_metadata?.display_name ?? '');
    });
    // Read ?section= from URL
    const params = new URLSearchParams(window.location.search);
    const s = params.get('section');
    if (s === 'support' || s === 'howto' || s === 'profile') setSection(s as Section);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSaveDisplayName = async () => {
    setDisplayNameSaving(true);
    setDisplayNameMsg('');
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    // Also sync to profiles table so cambio page can show the name
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, username: displayName }, { onConflict: 'id' });
    }
    setDisplayNameSaving(false);
    setDisplayNameMsg(error ? 'Error al guardar.' : '¡Guardado!');
    setTimeout(() => setDisplayNameMsg(''), 2500);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { setPasswordMsg('Ingresá tu contraseña actual.'); return; }
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg('');
    // Verify current password
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (signInErr) {
      setPasswordSaving(false);
      setPasswordMsg('Contraseña actual incorrecta.');
      setTimeout(() => setPasswordMsg(''), 3000);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordMsg('Error: ' + error.message);
    } else {
      setPasswordMsg('¡Contraseña actualizada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleForgotPassword = async () => {
    if (!userEmail) return;
    await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const exportData = () => {
    const data = JSON.stringify(collection, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichus2026_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Record<string, CollectionEntry>;
        await importCollection(data);
      } catch {
        alert('Error al importar el archivo. Asegurate de que sea un JSON válido.');
      }
    };
    input.click();
  };

  // ── Sub-section: Editar Perfil ───────────────────────────────────────────
  if (section === 'profile') {
    const pwMsgIsError = passwordMsg.includes('Error') || passwordMsg.includes('incorrecta') || passwordMsg.includes('coinciden');
    return (
      <div className="px-4 pt-4 pb-4">
        <button onClick={() => setSection('main')} className="text-[#00B8D4] text-sm mb-4">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">👤 Editar Perfil</h1>

        {/* Username */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">Nombre de usuario</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
            />
            <button
              onClick={handleSaveDisplayName}
              disabled={displayNameSaving}
              className="px-3 py-2 rounded-xl bg-[#00B8D4] text-white text-xs font-semibold disabled:opacity-50"
            >
              {displayNameSaving ? '…' : 'Guardar'}
            </button>
          </div>
          {displayNameMsg && (
            <p className="text-xs mt-1.5 text-[#00B8D4]">{displayNameMsg}</p>
          )}
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">Cambiar contraseña</h2>
          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual"
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
            />
            <button
              onClick={handleChangePassword}
              disabled={passwordSaving || !newPassword || !currentPassword}
              className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm disabled:opacity-40"
            >
              {passwordSaving ? 'Guardando…' : 'Actualizar contraseña'}
            </button>
            {passwordMsg && (
              <p className={`text-xs ${pwMsgIsError ? 'text-red-500' : 'text-[#00B8D4]'}`}>
                {passwordMsg}
              </p>
            )}
            <button
              onClick={handleForgotPassword}
              disabled={forgotSent}
              className="text-xs text-zinc-400 hover:text-[#00B8D4] text-left transition-colors disabled:opacity-60 pt-1"
            >
              {forgotSent ? '✓ Mail de recuperación enviado' : '¿Olvidaste tu contraseña? Enviar mail de recuperación'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sub-section: Cómo usar ────────────────────────────────────────────────
  if (section === 'howto') {
    return (
      <div className="px-4 pt-4">
        <button onClick={() => setSection('main')} className="text-[#00B8D4] text-sm mb-4">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">❓ Cómo usar</h1>

        {/* Re-launch the same onboarding flow shown on first run. */}
        <button
          onClick={() => triggerOnboarding()}
          className="w-full mb-4 py-3 rounded-xl bg-[#00B8D4] text-white text-sm font-semibold active:scale-[0.99] transition-transform"
        >
          ▶ Ver tutorial
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm text-sm text-zinc-700 dark:text-zinc-300 space-y-3">
          <p>📌 <strong>Tocar una figurita</strong> suma 1. Usá los botones + y − para ajustar la cantidad.</p>
          <p>🔵 <strong>El círculo de arriba a la derecha</strong> muestra cuántas repetidas tenés de esa figurita.</p>
          <p>🤍 <strong>Usá el ♡</strong> para marcar una figurita como favorita.</p>
          <p>🔍 <strong>Filtros</strong> Todas / Faltan / Repes muestran solo lo que necesitás.</p>
          <p>📂 <strong>Vista</strong> elegí entre &ldquo;Por grupos&rdquo; (con headers A-L) o &ldquo;Por países&rdquo; (lista plana alfabética).</p>
          <p>↕ <strong>Orden</strong> A-Z o Z-A para los países/grupos, y 1→20 o 20→1 para los números dentro de cada equipo.</p>
          <p>✓ <strong>Completar / Vaciar</strong> (en cada sección) marca o limpia todas las figuritas del grupo.</p>
          <p>⭐ <strong>Extrastickers</strong> — 21 jugadores especiales con 4 versiones cada uno: Base, Bronce, Plata y Oro.</p>
          <p>🔄 <strong>Cambio</strong> genera un QR o link para compartir, o escaneás el de otra persona para comparar colecciones.</p>
          <p>📊 <strong>Stats</strong> — encontrás tu progreso general.</p>
        </div>
      </div>
    );
  }

  // ── Sub-section: Apoyar ───────────────────────────────────────────────────
  if (section === 'support') {
    return (
      <div className="px-4 pt-4">
        <button onClick={() => setSection('main')} className="text-[#00B8D4] text-sm mb-4">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">💙 Apoyar el proyecto</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Si Fichus2026 te es útil, podés apoyar el desarrollo de la app:
        </p>
        <div className="space-y-3">
          {[
            { flag: '🇺🇾', label: 'Mercado Pago Uruguay', value: '1006726768654', key: 'uy' },
            { flag: '🇦🇷', label: 'Mercado Pago Argentina', value: 'facumaro24', key: 'ar' },
          ].map(({ flag, label, value, key }) => (
            <div key={key} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{flag}</span>
                <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{label}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-2">Facundo Marozzi</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  {value}
                </code>
                <button
                  onClick={() => copy(value, key)}
                  className="px-3 py-2 rounded-xl bg-[#00B8D4] text-white text-xs font-semibold"
                >
                  {copiedKey === key ? '✓' : 'Copiar'}
                </button>
              </div>
            </div>
          ))}

          {/* PayPal — rest of the world */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌍</span>
              <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">Resto del mundo — PayPal</span>
            </div>
            <p className="text-xs text-zinc-500 mb-3">Facundo Marozzi</p>
            <a
              href="https://www.paypal.com/donate/?business=fichus00%40gmail.com&currency_code=USD"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 rounded-xl bg-[#0070BA] text-white text-sm font-semibold text-center mb-2"
            >
              💙 Donar con PayPal
            </a>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all">
                fichus00@gmail.com
              </code>
              <button
                onClick={() => copy('fichus00@gmail.com', 'paypal-email')}
                className="px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
              >
                {copiedKey === 'paypal-email' ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">⚙️ Configuración</h1>

      {/* Profile card */}
      {isGuest ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl select-none flex-shrink-0">
            👤
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-zinc-900 dark:text-white">Modo invitado</p>
            <p className="text-xs text-zinc-400 mt-0.5">Iniciá sesión para guardar tu progreso</p>
          </div>
          <a
            href="/login"
            className="px-3 py-2 rounded-xl bg-[#00B8D4] text-white text-xs font-bold flex-shrink-0"
          >
            Entrar
          </a>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00B8D4]/15 flex items-center justify-center text-2xl select-none flex-shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-zinc-900 dark:text-white truncate">
              {displayName || 'Sin nombre'}
            </p>
            <p className="text-xs text-zinc-400 truncate">{userEmail || 'Cargando…'}</p>
          </div>
          {/* Logout — to the right of the user info, replaces the standalone
              button that used to live at the bottom of the page. */}
          <button
            onClick={handleLogout}
            className="flex-shrink-0 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold text-xs"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Navigation links */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm mb-4 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {[
          ...(!isGuest ? [{ label: '👤 Editar Perfil', action: () => setSection('profile') }] : []),
          { label: '❓ Cómo usar',          action: () => setSection('howto') },
          { label: '💙 Apoyar el proyecto', action: () => setSection('support') },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full text-left px-4 py-3.5 text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-between"
          >
            {label}
            <span className="text-zinc-300 dark:text-zinc-600">›</span>
          </button>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-2">✉️ Contacto</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-700 dark:text-zinc-300 select-all">
            fichus00@gmail.com
          </code>
          <button
            onClick={() => copy('fichus00@gmail.com', 'contact')}
            className="px-3 py-2 rounded-xl bg-[#00B8D4] text-white text-sm font-semibold"
          >
            {copiedKey === 'contact' ? '✓' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">Importar / Exportar</h2>
        <div className="flex gap-2">
          <button onClick={exportData} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
            ⬇️ Exportar
          </button>
          <button onClick={importData} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
            ⬆️ Importar
          </button>
        </div>
      </div>

      {/* Album actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-3">Álbum</h2>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setConfirm('completeAll')} className="flex-1 py-2.5 rounded-xl bg-[#00B8D4]/10 text-[#00B8D4] font-medium text-sm">
            ✓ Completar todo
          </button>
          <button onClick={() => setConfirm('clearAll')} className="flex-1 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 font-medium text-sm">
            ✕ Vaciar todo
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setConfirm('addOneAll')} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
            +1 Sumar 1 a todas
          </button>
          <button onClick={() => setConfirm('removeOneAll')} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-sm">
            −1 Restar 1 a todas
          </button>
        </div>
      </div>

      {/* Login/register CTAs only for guests — logged-in users have the
          "Cerrar sesión" button inline with their user card above. */}
      {isGuest && (
        <div className="flex gap-2 mb-4">
          <a
            href="/login"
            className="flex-1 py-2.5 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm text-center"
          >
            Iniciar sesión
          </a>
          <a
            href="/register"
            className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm text-center"
          >
            Registrarse
          </a>
        </div>
      )}

      {/* Confirm dialogs */}
      {confirm === 'clearAll' && (
        <ConfirmDialog
          message="¿Vaciar todo el álbum? Esta acción no se puede deshacer."
          confirmLabel="Vaciar todo"
          danger
          onConfirm={() => { clearAll(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'completeAll' && (
        <ConfirmDialog
          message="¿Completar todo el álbum? Se marcará 1 para cada figurita faltante."
          confirmLabel="Completar todo"
          onConfirm={() => { completeAll(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'addOneAll' && (
        <ConfirmDialog
          message="¿Sumar 1 a todas las figuritas? Cada una tendrá +1 en su conteo actual."
          confirmLabel="+1 a todas"
          onConfirm={() => { addOneAll(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'removeOneAll' && (
        <ConfirmDialog
          message="¿Restar 1 a todas las figuritas? Las que están en 0 no cambian."
          confirmLabel="−1 a todas"
          onConfirm={() => { removeOneAll(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
