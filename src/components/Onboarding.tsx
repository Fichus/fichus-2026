'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerOnboardingTrigger } from '@/lib/onboardingStore';
import { useTutorialPushedUp, closeAllAvoidingTutorial } from '@/lib/tutorialAvoidStore';

/**
 * Tutorial step. When `page` is set, advancing to this step pushes the router
 * there so the user sees the live UI while reading the hint. `layout`
 * decides whether the hint renders as a centered hero card (welcome/final)
 * or a small bottom banner (in-page tour, so the actual app stays visible).
 */
interface Step {
  emoji: string;
  title: string;
  desc: string;
  tip?: string | null;
  page?: string;
  layout: 'center' | 'bottom';
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: '¡Bienvenido a Fichus2026!',
    desc: 'Tu app para el álbum del Mundial 2026. Te muestro rápido cómo se usa. Vamos a recorrer las pantallas — apretá Siguiente y mirá lo que aparece detrás.',
    layout: 'center',
  },
  {
    emoji: '📌',
    title: 'Tu álbum',
    desc: 'Tocá una carta para sumar +1. Los botones + y − ajustan la cantidad. El círculo arriba a la derecha de cada figu muestra las repetidas.',
    tip: '💡 El ♡ marca favoritas.',
    page: '/album',
    layout: 'bottom',
  },
  {
    emoji: '🔍',
    title: 'Filtros arriba',
    desc: 'Todas / Faltan / Repes son los filtros principales. El buscador encuentra por nombre o código.',
    page: '/album',
    layout: 'bottom',
  },
  {
    emoji: '📂',
    title: 'Vista y orden',
    desc: 'Cambiá entre "Por grupos" o "Por países", y ordená A-Z o Z-A. Los números dentro de cada equipo también ordenan 1→20 o 20→1.',
    page: '/album',
    layout: 'bottom',
  },
  {
    emoji: '⋮',
    title: 'Más acciones',
    desc: 'El menú de 3 puntos arriba a la derecha tiene: completar álbum, eliminar repes, ocultar Coca-Cola, modo tap (sumar/restar), ver tutorial de nuevo, cerrar sesión.',
    tip: '💡 Tocá el candado para bloquear los toques cuando solo querés scrollear.',
    page: '/album',
    layout: 'bottom',
  },
  {
    emoji: '📋',
    title: 'Compartir tu lista',
    desc: 'El ícono de compartir genera un texto con tus faltantes o repetidas para mandar por WhatsApp.',
    page: '/album',
    layout: 'bottom',
  },
  {
    emoji: '🔄',
    title: 'Cambio',
    desc: 'Generá tu QR para que amigos lo escaneen — ellos no necesitan cuenta para ver qué intercambiar con vos. También podés escanear el QR de otro o pegar su lista de texto.',
    tip: '💡 Si todavía no creaste cuenta, podés escanear y pegar listas igual.',
    page: '/cambio',
    layout: 'bottom',
  },
  {
    emoji: '📊',
    title: 'Stats',
    desc: 'Progreso general, top de más tocadas, más repetidas, menos repetidas, y la tabla con todos los grupos para consulta rápida.',
    page: '/stats',
    layout: 'bottom',
  },
  {
    emoji: '🤍',
    title: 'Favoritas',
    desc: 'Las figuritas que marcaste con ♡ aparecen acá juntas.',
    page: '/favoritas',
    layout: 'bottom',
  },
  {
    emoji: '⚙️',
    title: 'Config',
    desc: 'Tu perfil, password, importar/exportar backup, y volver a ver este tutorial cuando quieras.',
    page: '/config',
    layout: 'bottom',
  },
  {
    emoji: '🎉',
    title: '¡Listo!',
    desc: 'Eso es todo por ahora. Coleccioná, intercambiá y disfrutá el Mundial. ¡Suerte con el álbum!',
    page: '/album',
    layout: 'center',
  },
];

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras',
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela', 'Otro',
];

export default function Onboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  // Slides the bottom banner up to the top whenever a bottom-sheet modal
  // (kebab, share, paste, confirm…) mounts. Otherwise the banner sits over
  // the modal and the user can't see what the step is teaching them about.
  const pushedUp = useTutorialPushedUp();

  // Whenever the active step has a `page` set AND we're not already there,
  // navigate to it so the user sees the live UI behind the hint. Runs while
  // the tour is visible — outside of `show`, we stay where the user is.
  useEffect(() => {
    if (!show || showSetup) return;
    const target = STEPS[step]?.page;
    if (target && pathname !== target) {
      router.push(target);
    }
  }, [show, showSetup, step, pathname, router]);

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

    // Register a hook so other parts of the app (e.g. Config → "Cómo usar")
    // can replay the tutorial without us exposing a ref.
    registerOnboardingTrigger(() => {
      setStep(0);
      setShowSetup(false);
      setShow(true);
    });
    return () => registerOnboardingTrigger(null);
  }, []);

  const finish = async () => {
    // Close any open modal so the post-tutorial landing screen is clean.
    closeAllAvoidingTutorial();
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

  // ── Tutorial walkthrough ──────────────────────────────────────────────────
  // Two layouts:
  //   'center' → big hero modal (welcome + ¡Listo!). Dims the whole screen,
  //              user can't see the page underneath. Used for framing steps.
  //   'bottom' → small bottom card (in-page tour). Page stays visible above,
  //              user sees the actual UI being described. The kebab + bottom
  //              nav remain accessible so they can poke at things if curious.
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isBottom = current.layout === 'bottom';

  // Every step transition closes any modals that were open during the
  // previous step. Two reasons:
  //   - The next step may be on a different page, and we don't want a
  //     ghost modal from /album lingering when the router lands on /stats.
  //   - Even same-page steps usually focus on different parts of the UI;
  //     starting clean is friendlier than carrying state forward.
  const advance = (delta: 1 | -1) => {
    closeAllAvoidingTutorial();
    setStep(step + delta);
  };
  const goNext = () => {
    if (!isLast) { advance(1); return; }
    closeAllAvoidingTutorial();
    if (isLoggedIn) setShowSetup(true);
    else finish();
  };
  const goPrev = () => {
    if (step > 0) advance(-1);
  };

  /* Progress bar shared between both layouts. */
  const ProgressBar = () => (
    <div className="flex gap-1 justify-center w-full">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === step
              ? 'flex-[2] bg-[#00B8D4]'
              : i < step
              ? 'flex-1 bg-[#00B8D4]/40'
              : 'flex-1 bg-zinc-200 dark:bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );

  if (isBottom) {
    // In-page tour: page is visible, banner anchored above the bottom nav.
    // No backdrop — the user has to be able to scroll and observe the
    // actual feature being described.
    return (
      // Default: z-[55] — above figus' z-10 buttons but below kebab/share/
      // paste/import/groups modals (z-[60]) so opening any of those covers
      // the banner cleanly.
      //
      // When `pushedUp` (a bottom-sheet is open): bump to z-[65] so the
      // banner sits on TOP of the modal, not behind it — the user can keep
      // reading the hint AND interact with the Next/Prev buttons while the
      // modal stays open below. ConfirmDialog still wins at z-[100] for
      // destructive confirmations.
      //
      // Position also flips: bottom-anchored → top-anchored so the lifted
      // banner clears the bottom sheet. Animated with transition-all 300ms.
      <div
        className={`fixed left-0 right-0 px-3 pointer-events-none transition-all duration-300 ease-out ${pushedUp ? 'z-[65]' : 'z-[55]'}`}
        style={pushedUp
          ? { top: 'calc(0.75rem + env(safe-area-inset-top))', bottom: 'auto' }
          : { bottom: 'calc(6rem + env(safe-area-inset-bottom))', top: 'auto' }}
      >
        <div className="max-w-[480px] mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-zinc-200 dark:border-zinc-800 px-4 pt-3 pb-3 pointer-events-auto">
          <div className="mb-2"><ProgressBar /></div>
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl leading-none select-none flex-shrink-0">{current.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-0.5">
                <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white leading-tight">
                  {current.title}
                </h3>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-2 flex-shrink-0">
                  {step + 1}/{STEPS.length}
                </span>
              </div>
              <p className="text-[12.5px] text-zinc-600 dark:text-zinc-400 leading-snug">
                {current.desc}
              </p>
              {current.tip && (
                <p className="mt-1.5 text-[11.5px] text-[#00a0b8] dark:text-[#00B8D4] leading-snug">
                  {current.tip}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={finish}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold text-zinc-500 dark:text-zinc-400"
            >
              Saltar
            </button>
            {step > 0 && (
              <button
                onClick={goPrev}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                ←
              </button>
            )}
            <button
              onClick={goNext}
              className="flex-1 py-2 rounded-lg text-[12.5px] font-bold bg-[#00B8D4] text-white"
            >
              {isLast ? 'Terminar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Centered hero (welcome / final).
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl overflow-hidden">
        <div className="pt-5 px-6"><ProgressBar /></div>
        <p className="text-center text-xs text-zinc-400 mt-2">
          {step + 1} de {STEPS.length}
        </p>

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

        <div className="flex gap-2 px-6 pb-8 pt-2">
          {step > 0 ? (
            <button
              onClick={goPrev}
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
            onClick={goNext}
            className={`py-3 rounded-xl text-sm font-bold ${isLast ? 'flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 'flex-[2] bg-[#00B8D4] text-white'}`}
          >
            {isLast ? (isLoggedIn ? 'Continuar →' : 'Empezar →') : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
}
