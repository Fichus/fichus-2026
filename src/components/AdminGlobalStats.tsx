'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { STICKER_MAP } from '@/lib/stickers';
import Flag from './Flag';

/**
 * Admin-only block that surfaces aggregate stats across the WHOLE collection
 * table — not just the viewer's own. Renders below "Progreso por grupo" in
 * /stats. Three full-width sections, each with internal scroll so the page
 * stays scannable:
 *
 *   1. 🔥 Top 500 más repetidas (global)       — what everyone has too many of.
 *   2. 🍀 Top 50 más difíciles de repetir       — barely anyone gets these as extras.
 *   3. 🌍 Países de más difícil a más fácil    — per-team aggregate.
 *
 * The three queries run as Supabase RPC functions defined in SQL. They use
 * SECURITY INVOKER + the existing "Public read collection" RLS policy, so
 * no row-level data is leaked — only aggregates ever leave the database.
 *
 * Admin gating is intentionally simple (email whitelist). When more roles
 * are needed we'll move this to a `profiles.is_admin` column.
 */

const ADMIN_EMAILS = [
  'maro.facu@gmail.com',
];

interface StickerRow {
  sticker_num: string;
  total_repes: number;
  owners: number;
}

interface CountryRow {
  team_code: string;
  avg_repes: number;
  total_owners: number;
  total_repes: number;
}

export default function AdminGlobalStats() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [topRepes, setTopRepes] = useState<StickerRow[]>([]);
  const [hardestRepes, setHardestRepes] = useState<StickerRow[]>([]);
  const [hardestCountries, setHardestCountries] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const admin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
      if (cancelled) return;
      setIsAdmin(admin);
      if (!admin) return;

      setLoading(true);
      try {
        const [a, b, c] = await Promise.all([
          supabase.rpc('global_top_repeated'),
          supabase.rpc('global_hardest_repes'),
          supabase.rpc('global_hardest_countries'),
        ]);
        if (cancelled) return;
        if (a.error || b.error || c.error) {
          setError((a.error || b.error || c.error)?.message ?? 'Error');
          setLoading(false);
          return;
        }
        setTopRepes((a.data as StickerRow[]) ?? []);
        setHardestRepes((b.data as StickerRow[]) ?? []);
        setHardestCountries((c.data as CountryRow[]) ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (isAdmin === null || isAdmin === false) return null;

  return (
    <div className="space-y-3 mb-4">
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300/40 dark:border-amber-700/40 rounded-2xl px-4 py-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold text-sm text-amber-900 dark:text-amber-200">
            🛠️ Stats globales <span className="text-amber-600 dark:text-amber-400">· admin</span>
          </h2>
          <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70">Solo vos ves esto</span>
        </div>
        <p className="text-[11.5px] text-amber-800/80 dark:text-amber-300/80 leading-snug mt-0.5">
          Datos HISTÓRICOS (cuenta cada vez que apareció la figu, no solo lo que está vivo hoy).
        </p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
          <p className="text-[12px] text-zinc-400 text-center">Cargando stats globales…</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3 text-[12px] text-red-600 dark:text-red-400 shadow-sm">
          ⚠️ {error}
          <p className="text-[10px] mt-1 text-red-500/70">
            ¿Corriste las funciones SQL? Revisá Supabase → SQL Editor.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <StickerSection
            title="🔥 Top 500 más repetidas (histórico)"
            subtitle="Las que más veces aparecieron como repe en toda la historia (suma de extras de todos los users)."
            rows={topRepes}
            valueLabel="repes"
            color="text-[#00B8D4]"
          />
          <StickerSection
            title="🍀 Top 50 más difíciles de repetir (histórico)"
            subtitle="Las que casi nadie consiguió como repe en toda la historia (mínimo 3 dueños)."
            rows={hardestRepes}
            valueLabel="repes"
            color="text-emerald-600 dark:text-emerald-400"
          />
          <CountrySection rows={hardestCountries} />
        </>
      )}
    </div>
  );
}

/* ── Sub-sections ───────────────────────────────────────────────────────── */

/**
 * Full-width section for a long sticker leaderboard. Internal scroll caps
 * the visible height at ~420px so the page stays scannable even with 500
 * rows; the chip in the header always shows the full count so the user
 * knows the list is complete.
 */
function StickerSection({
  title, subtitle, rows, valueLabel, color,
}: {
  title: string; subtitle: string; rows: StickerRow[];
  valueLabel: string; color: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      if (r.sticker_num.toLowerCase().includes(q)) return true;
      const info = STICKER_MAP.get(r.sticker_num);
      if (info?.section === 'team') {
        if (info.teamName?.toLowerCase().includes(q)) return true;
        if (info.role?.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [rows, search]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={`font-bold text-[13.5px] ${color}`}>{title}</h3>
          <span className="text-[10.5px] font-bold text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            {rows.length} figus
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
          {subtitle}
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar país o jugador…"
          className="w-full mt-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 text-[12px] px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#00B8D4]/40"
        />
      </div>

      <div
        className="overflow-y-auto"
        style={{ maxHeight: '420px', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {filtered.length === 0 ? (
          <p className="text-[12px] text-zinc-400 text-center py-6">Sin resultados</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((r, i) => {
              const info = STICKER_MAP.get(r.sticker_num);
              const teamCode = r.sticker_num.split('-')[0];
              const name = info?.section === 'team'
                ? `${info.teamName} — ${info.role}`
                : info?.role || r.sticker_num;
              return (
                <li key={r.sticker_num} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 w-6 text-right shrink-0">
                    {i + 1}
                  </span>
                  <Flag code={teamCode} height={11} />
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 w-14 shrink-0">
                    {r.sticker_num}
                  </span>
                  <span className="text-[11.5px] text-zinc-700 dark:text-zinc-200 truncate flex-1">
                    {name}
                  </span>
                  <span className={`text-[11px] font-bold ${color} flex-shrink-0`}>
                    {r.total_repes} {valueLabel}
                  </span>
                  <span className="text-[10px] text-zinc-400 flex-shrink-0">
                    · {r.owners}👥
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Country leaderboard. Bars visualize the avg_repes (relative to the easiest
 * country in the list) so the user can compare visually as well as by number.
 */
function CountrySection({ rows }: { rows: CountryRow[] }) {
  const maxAvg = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.avg_repes), 0.01),
    [rows]
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-bold text-[13.5px] text-violet-600 dark:text-violet-400">
            🌍 Países: más difícil → más fácil
          </h3>
          <span className="text-[10.5px] font-bold text-zinc-400 dark:text-zinc-500 flex-shrink-0">
            {rows.length} selecciones
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
          Promedio histórico de repes por dueño — el primero es el más esquivo, el último el más intercambiable.
        </p>
      </div>

      <div
        className="overflow-y-auto"
        style={{ maxHeight: '420px', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {rows.length === 0 ? (
          <p className="text-[12px] text-zinc-400 text-center py-6">Sin resultados</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r, i) => {
              const barPct = Math.min(100, Math.round((r.avg_repes / maxAvg) * 100));
              // First half = harder (violet), second half = easier (cyan).
              // Gradient as you go down the list.
              const isHard = i < rows.length / 2;
              return (
                <li key={r.team_code} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] font-bold text-zinc-400 w-6 text-right shrink-0">
                    {i + 1}
                  </span>
                  <Flag code={r.team_code} height={12} />
                  <span className="text-[11.5px] font-bold text-zinc-700 dark:text-zinc-200 w-12 shrink-0">
                    {r.team_code}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isHard ? 'bg-violet-500' : 'bg-[#00B8D4]'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold w-9 text-right ${isHard ? 'text-violet-600 dark:text-violet-400' : 'text-[#00B8D4]'}`}>
                      {r.avg_repes}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 w-12 text-right flex-shrink-0">
                    {r.total_owners}👥
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
