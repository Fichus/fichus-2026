'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCollection } from '@/contexts/CollectionContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImportTextModal, { type UnmentionedMode } from '@/components/ImportTextModal';
import { triggerOnboarding } from '@/lib/onboardingStore';
import { buildShareText } from '@/lib/shareText';
import { ALL_STICKERS } from '@/lib/stickers';
import type { CollectionEntry } from '@/lib/types';

type Section = 'main' | 'profile' | 'howto' | 'support' | 'news';

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
  const [importOpen, setImportOpen] = useState(false);
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
    if (s === 'support' || s === 'howto' || s === 'profile' || s === 'news') setSection(s as Section);
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

  /* ── Export / import — text-first ────────────────────────────────────────
     Text export is way easier to share on mobile (paste into WhatsApp /
     notes / email) than a JSON file download, and the format is the same one
     used in Cambio so users can swap between apps fluently. JSON is still
     offered as a "backup completo" because the text format is lossy:
     EXT-* (extrastickers), history_taps, max_dups and is_favorite are not
     captured in the share text.
  */
  const exportAsText = async () => {
    const text = buildShareText('both', collection);
    // Try clipboard first (mobile users almost always prefer paste over
    // file download). Fall back to file download when clipboard fails.
    try {
      await navigator.clipboard.writeText(text);
      alert('Tu lista fue copiada al portapapeles. Pegala donde quieras guardarla.');
      return;
    } catch {
      // fall through
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichus2026_lista_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromText = () => setImportOpen(true);

  const exportAsJson = () => {
    const data = JSON.stringify(collection, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichus2026_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromJson = () => {
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

  /* Applies a parsed text import using the unmentioned-mode picked in the
     modal. Always preserves extras (EXT-*) and the rest of the metadata
     (favorites, history_taps) of stickers we touch — only `count` is
     overwritten. Builds the final map and hands it to importCollection.
  */
  const applyTextImport = async (parsed: Record<string, number>, mode: UnmentionedMode) => {
    const merged: Record<string, CollectionEntry> = { ...collection };

    // 1. Apply explicit values from the parsed text.
    for (const [code, count] of Object.entries(parsed)) {
      const cur = merged[code];
      merged[code] = {
        sticker_num: code,
        count,
        history_taps: cur?.history_taps ?? count,
        max_dups: Math.max(cur?.max_dups ?? 0, count),
        is_favorite: cur?.is_favorite ?? false,
      };
    }

    // 2. Apply the policy for unmentioned stickers. Extras (EXT-*) are always
    //    left alone — the share-text format doesn't cover them so applying
    //    any blanket rule would wipe data the user can't even see in the
    //    pasted list.
    if (mode !== 'leave') {
      const defaultCount = mode === 'owned-1' ? 1 : 0;
      for (const s of ALL_STICKERS) {
        if (s.section === 'extra') continue;
        if (parsed[s.code] !== undefined) continue;
        const cur = merged[s.code];
        merged[s.code] = {
          sticker_num: s.code,
          count: defaultCount,
          history_taps: cur?.history_taps ?? defaultCount,
          max_dups: Math.max(cur?.max_dups ?? 0, defaultCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      }
    }

    await importCollection(merged);
    setImportOpen(false);
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

  // ── Sub-section: Novedades ────────────────────────────────────────────────
  // Static log of the latest changes, ordered newest-first. Keep the entries
  // short and concrete — this is where users land after dismissing the
  // floating bell, so the content should mirror what the bell already said.
  if (section === 'news') {
    return (
      <div className="px-4 pt-4 pb-8">
        <button onClick={() => setSection('main')} className="text-[#00B8D4] text-sm mb-4">
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">✨ Novedades</h1>
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-4">
          Lo último que sumamos a Fichus2026.
        </p>

        <div className="space-y-3">
          <NewsCard
            date="Mayo 2026"
            title="Tour guiado por toda la app"
            items={[
              'Tutorial nuevo que recorre cada pantalla (Álbum, Cambio, Stats, Favoritas, Config).',
              'Banner chiquito abajo durante el recorrido — podés ver la app real detrás.',
              'Volvé a verlo desde "Cómo usar" cuando quieras.',
            ]}
          />
          <NewsCard
            date="Mayo 2026"
            title="Comparar listas sin necesidad de cuenta"
            items={[
              'El QR de Cambio lleva a una página pública donde tus amigos pegan su lista de texto.',
              'Detecta automáticamente qué pueden intercambiar.',
              'Reconoce formato Figuritas y listas en inglés también.',
            ]}
          />
          <NewsCard
            date="Mayo 2026"
            title="Menú de 3 puntos en Álbum"
            items={[
              'Completar / Vaciar / Eliminar repes desde un solo lugar.',
              'Ocultar la sección Coca-Cola si no la coleccionás.',
              'Modo de toque: sumar o restar (útil para bajar stock).',
              'Cambiar tema y cerrar sesión a mano.',
            ]}
          />
          <NewsCard
            date="Mayo 2026"
            title="Más control en Álbum"
            items={[
              'Vista por grupos o por países, con orden A-Z / Z-A y 1→20 / 20→1.',
              'Colapsar cada equipo (no solo el grupo).',
              'Candado en el header para bloquear toques accidentales.',
              'Botón compartir → copiar tus faltantes/repes como texto.',
            ]}
          />
          <NewsCard
            date="Mayo 2026"
            title="Stats: ranking de menos repetidas"
            items={[
              'Las figuritas que tocaste pero (casi) nunca te salieron repe — para saber tus rachas suertudas.',
              'Tabla "Ver grupos" — referencia rápida de qué país está en cada grupo.',
            ]}
          />
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
          { label: '✨ Novedades',          action: () => setSection('news') },
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

      {/* Data — text is the primary path (easy to paste on mobile). JSON
          is offered below as a "backup completo" option for users who want
          full lossless restore including extras / history / favorites. */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-1">Importar / Exportar</h2>
        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mb-3 leading-snug">
          Como texto es más fácil de pasar por WhatsApp o pegar acá. JSON guarda todo (extras, favoritas, stats).
        </p>
        <div className="flex gap-2 mb-3">
          <button onClick={exportAsText} className="flex-1 py-2.5 rounded-xl bg-[#00B8D4] text-white font-semibold text-sm">
            📋 Exportar texto
          </button>
          <button onClick={importFromText} className="flex-1 py-2.5 rounded-xl bg-[#00B8D4]/10 text-[#00B8D4] font-semibold text-sm">
            📥 Importar texto
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAsJson} className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-[12.5px]">
            ⬇️ Backup JSON
          </button>
          <button onClick={importFromJson} className="flex-1 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium text-[12.5px]">
            ⬆️ Restaurar JSON
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
      {importOpen && (
        <ImportTextModal
          onClose={() => setImportOpen(false)}
          onConfirm={applyTextImport}
        />
      )}
    </div>
  );
}

/**
 * Single entry in the Novedades log. Title + bulleted list of changes, all
 * styled like a card so the section can host many entries while staying
 * readable. Kept inline here because it's only used in this file.
 */
function NewsCard({ date, title, items }: { date: string; title: string; items: string[] }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
      <p className="text-[10.5px] uppercase tracking-wider font-bold text-[#00B8D4] mb-1">
        {date}
      </p>
      <h3 className="text-[14.5px] font-bold text-zinc-900 dark:text-white mb-2 leading-tight">
        {title}
      </h3>
      <ul className="space-y-1 text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-snug">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
