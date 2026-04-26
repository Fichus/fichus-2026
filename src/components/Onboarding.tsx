'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const STEPS = [
  {
    emoji: '👋',
    title: '¡Bienvenido a Fichus2026!',
    desc: 'Tu app para llevar el control del álbum del Mundial 2026. Marcá tus figuritas, seguí tu progreso y encontrá con quién intercambiar.',
    tip: null,
  },
  {
    emoji: '📌',
    title: 'Marcá tus figuritas',
    desc: 'Tocá una carta para sumar +1. Usá los botones + y − para ajustar. El círculo de arriba a la derecha muestra cuántas repetidas tenés.',
    tip: '💡 Mantené apretada una carta para ver su detalle completo.',
  },
  {
    emoji: '🤍',
    title: 'Favoritas y Filtros',
    desc: 'Usá el ♡ para marcar una figurita como favorita. Los filtros Todas / Faltan / Repes muestran solo lo que necesitás.',
    tip: '💡 Los botones de grupo (A, B, C…) te llevan directo a cada sección del álbum.',
  },
  {
    emoji: '⭐',
    title: 'Extrastickers',
    desc: '21 jugadores especiales con 4 versiones cada uno: Base, Bronce, Plata y Oro. ¡Son 84 figuritas especiales para coleccionar!',
    tip: '💡 Aparecen al final del álbum en su propia sección.',
  },
  {
    emoji: '🔄',
    title: 'Cambio y Stats',
    desc: 'Cambio genera un QR o link para compartir: otros pueden ver tus repetidas y lo que te falta para coordinar intercambios. En Stats encontrás tu progreso general.',
    tip: null,
  },
];

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Otro',
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        // Pre-fill username with the part before @ if not already set
        const existingName = user.user_metadata?.display_name;
        if (!existingName && user.email) {
          setUsername(user.email.split('@')[0]);
        } else if (existingName) {
          setUsername(existingName);
        }
        if (!user.user_metadata?.hasSeenOnboarding) setShow(true);
      } else {
        if (!localStorage.getItem('hasSeenOnboarding')) setShow(true);
      }
    };
    check();
  }, []);

  const finish = async () => {
    if (isLoggedIn) {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { hasSeenOnboarding: true } });
    }
    try { localStorage.setItem('hasSeenOnboarding', 'true'); } catch {}
    setShow(false);
  };

  const handleSaveSetup = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const meta: Record<string, string> = {};
      if (username.trim()) meta.display_name = username.trim();
      if (country) meta.country = country;
      if (age) meta.age = age;
      if (Object.keys(meta).length > 0) {
        await supabase.auth.updateUser({ data: meta });
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profileUpdate: Record<string, string | number> = { id: user.id };
        if (username.trim()) profileUpdate.username = username.trim();
        if (country) profileUpdate.country = country;
        if (age) profileUpdate.age = parseInt(age, 10);
        await supabase.from('profiles').upsert(profileUpdate, { onConflict: 'id' });
      }
    } catch {}
    setSaving(false);
    finish();
  };

  if (!show) return null;

  // ── Setup form ────────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl p-6 pb-8 shadow-xl">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-0.5">Configuración inicial</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Completá tus datos para personalizar la app.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="¿Cómo te llaman?"
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                País
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
              >
                <option value="">Seleccioná tu país…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                Edad
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Tu edad"
                min={1}
                max={120}
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-[#00B8D4]/50"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSetup}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#00B8D4] text-white text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : '¡Listo! →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Onboarding carousel ───────────────────────────────────────────────────
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl overflow-hidden">
        {/* Progress bar */}
        <div className="flex gap-1.5 justify-center pt-5 px-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'flex-[2] bg-[#00B8D4]'
                  : i < step
                  ? 'flex-1 bg-[#00B8D4]/40'
                  : 'flex-1 bg-zinc-200 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Step counter */}
        <p className="text-center text-xs text-zinc-400 mt-2">
          {step + 1} de {STEPS.length}
        </p>

        {/* Content */}
        <div className="px-6 py-5 text-center">
          <div className="text-5xl mb-4 select-none">{current.emoji}</div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">
            {current.title}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {current.desc}
          </p>
          {current.tip && (
            <div className="mt-3 bg-[#00B8D4]/10 rounded-xl px-4 py-2.5">
              <p className="text-sm text-[#00a0b8] dark:text-[#00B8D4] leading-relaxed">
                {current.tip}
              </p>
            </div>
          )}
        </div>

        {/* Support CTA — only on last step */}
        {isLast && (
          <div className="px-6 pb-2">
            <a
              href="/config?section=support"
              onClick={finish}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#00B8D4] to-[#0098b8] text-white text-sm font-bold shadow-[0_4px_16px_rgba(0,184,212,0.45)] active:scale-95 transition-transform"
            >
              💙 Apoyar el proyecto
            </a>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 px-6 pb-8 pt-2">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-semibold"
            >
              ← Anterior
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-sm font-semibold"
            >
              Saltar
            </button>
          )}
          <button
            onClick={isLast ? (isLoggedIn ? () => setShowSetup(true) : finish) : () => setStep(step + 1)}
            className={`py-3 rounded-xl text-sm font-bold ${isLast ? 'flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 'flex-[2] bg-[#00B8D4] text-white'}`}
          >
            {isLast ? (isLoggedIn ? 'Continuar →' : 'Empezar →') : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
