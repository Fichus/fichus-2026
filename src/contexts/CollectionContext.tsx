'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CollectionEntry } from '@/lib/types';
import { ALL_STICKERS, getTeamStickers } from '@/lib/stickers';

const GUEST_KEY = 'guest_collection';

type CollectionState = Record<string, CollectionEntry>;

type Action =
  | { type: 'LOAD'; payload: CollectionEntry[] }
  | { type: 'SET'; payload: CollectionEntry }
  | { type: 'INCREMENT'; payload: string }
  | { type: 'DECREMENT'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'CLEAR_ALL' };

function reducer(state: CollectionState, action: Action): CollectionState {
  switch (action.type) {
    case 'LOAD': {
      // Use an accumulator instead of Object.fromEntries so that if the DB
      // returns duplicate rows for the same sticker_num (no unique constraint),
      // we always keep the row with the highest count rather than a random one.
      const map: CollectionState = {};
      for (const e of action.payload) {
        const cur = map[e.sticker_num];
        if (!cur || e.count > cur.count) map[e.sticker_num] = e;
      }
      return map;
    }
    case 'SET':
      return { ...state, [action.payload.sticker_num]: action.payload };
    case 'INCREMENT': {
      const cur = state[action.payload];
      const newCount = (cur?.count ?? 0) + 1;
      return {
        ...state,
        [action.payload]: {
          sticker_num: action.payload,
          count: newCount,
          history_taps: (cur?.history_taps ?? 0) + 1,
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        },
      };
    }
    case 'DECREMENT': {
      const cur = state[action.payload];
      if (!cur || cur.count <= 0) return state;
      return { ...state, [action.payload]: { ...cur, count: cur.count - 1 } };
    }
    case 'TOGGLE_FAVORITE': {
      const cur = state[action.payload];
      return {
        ...state,
        [action.payload]: {
          sticker_num: action.payload,
          count: cur?.count ?? 0,
          history_taps: cur?.history_taps ?? 0,
          max_dups: cur?.max_dups ?? 0,
          is_favorite: !(cur?.is_favorite ?? false),
        },
      };
    }
    case 'CLEAR_ALL':
      return {};
    default:
      return state;
  }
}

interface CollectionContextType {
  collection: CollectionState;
  loading: boolean;
  isSaving: boolean;
  saveError: string | null;
  isGuest: boolean;
  addSticker: (code: string) => void;
  removeSticker: (code: string) => void;
  toggleFavorite: (code: string) => void;
  completeTeam: (teamCode: string) => Promise<void>;
  clearTeam: (teamCode: string) => Promise<void>;
  completeCodes: (codes: string[]) => Promise<void>;
  clearCodes: (codes: string[]) => Promise<void>;
  clearAll: () => Promise<void>;
  completeAll: () => Promise<void>;
  addOneAll: () => Promise<void>;
  removeOneAll: () => Promise<void>;
  clearStats: () => Promise<void>;
  importCollection: (data: Record<string, CollectionEntry>) => Promise<void>;
  getCount: (code: string) => number;
  isFavorite: (code: string) => boolean;
}

const CollectionContext = createContext<CollectionContextType | null>(null);

export function CollectionProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [collection, dispatch] = useReducer(reducer, {});
  const [loading, setLoading] = useState(true);
  // Count of in-flight writes (pending debounces + active upserts).
  // Exposed as `isSaving` so the UI can show a "Guardando..." indicator.
  const [savingCount, setSavingCount] = useState(0);
  // Last upsert error — shown in the UI so we can diagnose DB issues.
  const [saveError, setSaveError] = useState<string | null>(null);
  const isGuest = !userId;
  // Memoized so the same client instance is reused across re-renders.
  // Re-creating on every render was causing auth/closure issues with debounce timers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  // Debounce timers keyed by sticker code
  const pendingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Tracks codes that are mid-upsert so real-time events don't overwrite them
  const syncingRef = useRef<Set<string>>(new Set());
  // After bulk ops, suppress real-time events briefly to avoid stale queue interference
  const suppressUntilRef = useRef(0);

  // Always-current snapshot of collection — updated every render, safe to read
  // from async callbacks. Bulk ops and scheduleSync use this instead of the
  // stale closure value captured at callback-creation time.
  const collectionRef = useRef<CollectionState>({});
  collectionRef.current = collection;

  // ── Cancel all pending debounced syncs ────────────────────────────────────
  // Call this before any bulk operation so stale single-sticker debounces
  // can't race against the batch upsert and overwrite with old data.
  const cancelAllPending = useCallback(() => {
    const n = Object.keys(pendingRef.current).length;
    Object.values(pendingRef.current).forEach(clearTimeout);
    pendingRef.current = {};
    // Each cancelled timer was counted as "saving"; remove those from the counter.
    if (n > 0) setSavingCount((c) => Math.max(0, c - n));
  }, []);

  // ── Load collection on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (isGuest) {
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CollectionEntry[];
          if (Array.isArray(parsed)) dispatch({ type: 'LOAD', payload: parsed });
        }
      } catch {}
      setLoading(false);
      return;
    }

    // ── Login transition safety net ─────────────────────────────────────────
    // When userId changes (guest → logged in, or account A → account B),
    // immediately clear local state and cancel pending writes BEFORE the
    // network load. Otherwise, during the ~500ms window while the SELECT is
    // in flight, the in-memory state still holds the previous user's data —
    // any tap or stale debounced upsert that fires in that window would write
    // those previous values to the new user's DB rows, silently overwriting
    // the canonical online data. Clearing localStorage here too prevents the
    // import block below from running on a partial guest snapshot.
    Object.values(pendingRef.current).forEach(clearTimeout);
    pendingRef.current = {};
    syncingRef.current.clear();
    setSavingCount(0);
    dispatch({ type: 'CLEAR_ALL' });
    setLoading(true);

    const load = async () => {
      // Import guest data ONLY into empty collections (brand-new accounts).
      // Importing into an existing account would overwrite real data with stale
      // guest values, and if the import fails the localStorage is never cleared,
      // causing the corrupt import to repeat on every reload.
      const raw = (() => { try { return localStorage.getItem(GUEST_KEY); } catch { return null; } })();
      if (raw) {
        try {
          const entries = JSON.parse(raw) as CollectionEntry[];
          // Check whether this account already has collection rows in the DB
          const { count: existingCount } = await supabase
            .from('collection')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          const isNewAccount = existingCount === 0;
          if (isNewAccount && Array.isArray(entries) && entries.length > 0) {
            const CHUNK = 500;
            const now = new Date().toISOString();
            for (let i = 0; i < entries.length; i += CHUNK) {
              const { error } = await supabase.from('collection').upsert(
                entries.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e, updated_at: now })),
                { onConflict: 'user_id,sticker_num' }
              );
              if (error) {
                console.error('[guest import]', error);
                setSaveError(`Error importando: ${error.message} (${error.code})`);
              }
            }
          }
        } catch (e) {
          console.error('[guest import parse]', e);
        }
        // Always clear localStorage — whether or not the import ran or succeeded.
        // This prevents stale guest data from being re-imported on every reload.
        try { localStorage.removeItem(GUEST_KEY); } catch {}
      }

      // Ensure profile row exists (handles re-login after profile deletion)
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('id', userId).single();
      if (!profile) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').upsert({
            id: userId,
            username: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
          }, { onConflict: 'id' });
        }
      }

      // Paginate: Supabase/PostgREST caps responses at 1000 rows by default.
      // A full collection has > 1000 rows once enough teams are completed +
      // repeats are tracked, so the tail (lexicographic order) gets silently
      // dropped — that was the "TUR-19+, U* don't load" bug. Fetch in chunks
      // of 1000 until we get a short page.
      const PAGE = 1000;
      const dbRows: CollectionEntry[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data: chunk, error } = await supabase
          .from('collection')
          .select('sticker_num,count,history_taps,max_dups,is_favorite')
          .eq('user_id', userId)
          .range(from, from + PAGE - 1);
        if (error) {
          console.error('[load collection]', error.code, error.message);
          setSaveError(`Error cargando colección: ${error.message} (${error.code})`);
          break;
        }
        if (!chunk) break;
        dbRows.push(...(chunk as CollectionEntry[]));
        if (chunk.length < PAGE) break;
      }
      {
        // Preserve any optimistic updates the user made while the DB query was
        // in flight. If we just dispatch LOAD with raw DB rows, those rows
        // overwrite the in-memory state and the pending debounce timers then
        // fire with entry=undefined → no upsert → data silently lost.
        const inFlight = new Set([
          ...Object.keys(pendingRef.current),
          ...syncingRef.current,
        ]);

        if (inFlight.size === 0) {
          // Fast path: nothing pending, just load DB rows directly.
          dispatch({ type: 'LOAD', payload: dbRows });
        } else {
          // Merge path: keep local optimistic values for stickers with pending
          // timers or mid-upsert, use DB values for everything else.
          const snap = collectionRef.current; // captured before LOAD wipes it
          const dbMap = new Map(dbRows.map((e) => [e.sticker_num, e]));
          const merged: CollectionEntry[] = dbRows.map((e) =>
            inFlight.has(e.sticker_num) ? (snap[e.sticker_num] ?? e) : e
          );
          // Also re-add local-only entries that aren't in the DB yet
          // (brand-new stickers that have a pending INSERT in the queue).
          for (const code of inFlight) {
            if (!dbMap.has(code) && snap[code]) merged.push(snap[code]);
          }
          dispatch({ type: 'LOAD', payload: merged });
        }
      }
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`collection:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          const entry = payload.new as CollectionEntry;
          // Ignore if: a bulk op just ran (suppress window), sticker has a pending
          // debounce, or sticker is currently being upserted.
          if (Date.now() < suppressUntilRef.current) return;
          if (pendingRef.current[entry.sticker_num]) return;
          if (syncingRef.current.has(entry.sticker_num)) return;
          dispatch({ type: 'SET', payload: entry });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist guest collection to localStorage on every change ─────────────
  useEffect(() => {
    if (!isGuest || loading) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(Object.values(collection)));
    } catch {}
  }, [collection, isGuest, loading]);

  // ── Schedule a debounced DB sync for a single sticker ────────────────────
  // Reads the entry from collectionRef AFTER the delay so all rapid taps are
  // batched into one write. pendingRef stays set during the upsert so real-time
  // events can't overwrite local state while the network request is in flight.
  const scheduleSync = useCallback(
    (code: string) => {
      if (isGuest) return;
      // If re-scheduling (rapid taps), the old timer is being replaced — don't
      // double-count the saving increment.
      const isReschedule = !!pendingRef.current[code];
      if (isReschedule) clearTimeout(pendingRef.current[code]);
      else setSavingCount((c) => c + 1); // new write entering the queue
      pendingRef.current[code] = setTimeout(async () => {
        delete pendingRef.current[code];
        const entry = collectionRef.current[code];
        if (!entry) {
          // Entry was wiped by a concurrent LOAD (very rare after merge fix).
          setSavingCount((c) => Math.max(0, c - 1));
          return;
        }
        syncingRef.current.add(code);
        try {
          const { error } = await supabase.from('collection').upsert(
            { user_id: userId, ...entry },
            { onConflict: 'user_id,sticker_num' }
          );
          if (error) {
            console.error('[upsert error]', error.code, error.message, error.details);
            setSaveError(`Error guardando ${code}: ${error.message} (${error.code})`);
          }
        } finally {
          syncingRef.current.delete(code);
          setSavingCount((c) => Math.max(0, c - 1));
        }
      }, 300);
    },
    [userId, supabase, isGuest]
  );

  // ── Single-sticker actions ────────────────────────────────────────────────
  // INCREMENT / DECREMENT / TOGGLE_FAVORITE live in the reducer so rapid
  // sequential dispatches always accumulate correctly — the reducer always
  // receives the latest state, never a stale closure value.

  const addSticker = useCallback(
    (code: string) => {
      dispatch({ type: 'INCREMENT', payload: code });
      scheduleSync(code);
    },
    [scheduleSync]
  );

  const removeSticker = useCallback(
    (code: string) => {
      // Let the reducer handle the count > 0 guard — avoids stale-closure
      // issues when + and − are tapped rapidly before a re-render.
      dispatch({ type: 'DECREMENT', payload: code });
      scheduleSync(code);
    },
    [scheduleSync]
  );

  const toggleFavorite = useCallback(
    (code: string) => {
      dispatch({ type: 'TOGGLE_FAVORITE', payload: code });
      scheduleSync(code);
    },
    [scheduleSync]
  );

  // ── Bulk write helper ────────────────────────────────────────────────────
  // Avoids the need for a unique constraint by using DELETE + INSERT.
  // Real-time DELETE events are already ignored in the subscription handler.
  const bulkSave = useCallback(
    async (entries: CollectionEntry[], label: string) => {
      if (!entries.length || isGuest) return;
      const codes = entries.map((e) => e.sticker_num);
      const CHUNK = 500;
      for (let i = 0; i < entries.length; i += CHUNK) {
        const { error } = await supabase.from('collection').upsert(
          entries.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
          { onConflict: 'user_id,sticker_num' }
        );
        if (error) {
          console.error(`[${label} error]`, error.code, error.message);
          setSaveError(`Error ${label}: ${error.message} (${error.code})`);
        }
      }
    },
    [userId, supabase, isGuest]
  );

  // ── Bulk operations ───────────────────────────────────────────────────────
  // Each one cancels pending debounces first so stale single-sticker syncs
  // can't overwrite the bulk upsert result.

  const completeTeam = useCallback(
    async (teamCode: string) => {
      cancelAllPending();
      suppressUntilRef.current = Date.now() + 3000;
      const teamStickers = getTeamStickers(teamCode);
      const updates: CollectionEntry[] = teamStickers.map((s) => {
        const cur = collectionRef.current[s.code];
        const newCount = Math.max(cur?.count ?? 0, 1);
        return {
          sticker_num: s.code,
          count: newCount,
          history_taps: (cur?.history_taps ?? 0) + ((cur?.count ?? 0) === 0 ? 1 : 0),
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      });
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      await bulkSave(updates, 'completeTeam');
    },
    [cancelAllPending, bulkSave]
  );

  const completeCodes = useCallback(
    async (codes: string[]) => {
      cancelAllPending();
      suppressUntilRef.current = Date.now() + 3000;
      const updates: CollectionEntry[] = codes.map((code) => {
        const cur = collectionRef.current[code];
        const newCount = Math.max(cur?.count ?? 0, 1);
        return {
          sticker_num: code,
          count: newCount,
          history_taps: (cur?.history_taps ?? 0) + ((cur?.count ?? 0) === 0 ? 1 : 0),
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      });
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      await bulkSave(updates, 'completeCodes');
    },
    [cancelAllPending, bulkSave]
  );

  const clearCodes = useCallback(
    async (codes: string[]) => {
      cancelAllPending();
      suppressUntilRef.current = Date.now() + 3000;
      const updates: CollectionEntry[] = codes.map((code) => ({
        ...(collectionRef.current[code] ?? { history_taps: 0, max_dups: 0, is_favorite: false }),
        sticker_num: code,
        count: 0,
      })) as CollectionEntry[];
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      await bulkSave(updates, 'clearCodes');
    },
    [cancelAllPending, bulkSave]
  );

  const clearTeam = useCallback(
    async (teamCode: string) => {
      cancelAllPending();
      suppressUntilRef.current = Date.now() + 3000;
      const teamStickers = getTeamStickers(teamCode);
      const updates: CollectionEntry[] = teamStickers.map((s) => ({
        ...(collectionRef.current[s.code] ?? { history_taps: 0, max_dups: 0, is_favorite: false }),
        sticker_num: s.code,
        count: 0,
      })) as CollectionEntry[];
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      await bulkSave(updates, 'clearTeam');
    },
    [cancelAllPending, bulkSave]
  );

  const clearAll = useCallback(async () => {
    cancelAllPending();
    suppressUntilRef.current = Date.now() + 5000;
    const updates = Object.values(collectionRef.current).map((e) => ({
      ...e,
      count: 0,
      max_dups: 0,
      is_favorite: false,
    }));
    dispatch({ type: 'LOAD', payload: updates });
    await bulkSave(updates, 'clearAll');
  }, [cancelAllPending, bulkSave]);

  const completeAll = useCallback(async () => {
    cancelAllPending();
    suppressUntilRef.current = Date.now() + 5000;
    const updates: CollectionEntry[] = ALL_STICKERS.map((s) => {
      const cur = collectionRef.current[s.code];
      const newCount = Math.max(cur?.count ?? 0, 1);
      return {
        sticker_num: s.code,
        count: newCount,
        history_taps: (cur?.history_taps ?? 0) + ((cur?.count ?? 0) === 0 ? 1 : 0),
        max_dups: Math.max(cur?.max_dups ?? 0, newCount),
        is_favorite: cur?.is_favorite ?? false,
      };
    });
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    await bulkSave(updates, 'completeAll');
  }, [cancelAllPending, bulkSave]);

  const addOneAll = useCallback(async () => {
    cancelAllPending();
    suppressUntilRef.current = Date.now() + 5000;
    const updates: CollectionEntry[] = ALL_STICKERS.map((s) => {
      const cur = collectionRef.current[s.code];
      const newCount = (cur?.count ?? 0) + 1;
      return {
        sticker_num: s.code,
        count: newCount,
        history_taps: (cur?.history_taps ?? 0) + 1,
        max_dups: Math.max(cur?.max_dups ?? 0, newCount),
        is_favorite: cur?.is_favorite ?? false,
      };
    });
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    await bulkSave(updates, 'addOneAll');
  }, [cancelAllPending, bulkSave]);

  const removeOneAll = useCallback(async () => {
    cancelAllPending();
    suppressUntilRef.current = Date.now() + 5000;
    const updates: CollectionEntry[] = Object.values(collectionRef.current)
      .filter((e) => e.count > 0)
      .map((e) => ({ ...e, count: e.count - 1 }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    await bulkSave(updates, 'removeOneAll');
  }, [cancelAllPending, bulkSave]);

  const clearStats = useCallback(async () => {
    cancelAllPending();
    suppressUntilRef.current = Date.now() + 5000;
    const updates = Object.values(collectionRef.current).map((e) => ({
      ...e,
      history_taps: 0,
    }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    await bulkSave(updates, 'clearStats');
  }, [cancelAllPending, bulkSave]);

  // ── Import from backup ────────────────────────────────────────────────────
  // Cancels pending debounces first (prevents stale syncs racing the import),
  // updates local state immediately, upserts to DB, then reloads from DB for
  // a clean authoritative state — no page reload needed.
  const importCollection = useCallback(
    async (data: Record<string, CollectionEntry>) => {
      cancelAllPending();
      suppressUntilRef.current = Date.now() + 8000;
      const entries = Object.values(data).filter((e) => e.sticker_num).map((e) => ({
        sticker_num: e.sticker_num,
        count: e.count ?? 0,
        history_taps: e.history_taps ?? 0,
        max_dups: e.max_dups ?? 0,
        is_favorite: e.is_favorite ?? false,
      } as CollectionEntry));
      dispatch({ type: 'LOAD', payload: entries });
      await bulkSave(entries, 'import');
      // Reload from DB to get the definitive state after all chunks settled.
      // Paginate to dodge the 1000-row PostgREST cap.
      if (!isGuest) {
        const PAGE = 1000;
        const fresh: CollectionEntry[] = [];
        for (let from = 0; ; from += PAGE) {
          const { data: chunk } = await supabase
            .from('collection')
            .select('sticker_num,count,history_taps,max_dups,is_favorite')
            .eq('user_id', userId)
            .range(from, from + PAGE - 1);
          if (!chunk) break;
          fresh.push(...(chunk as CollectionEntry[]));
          if (chunk.length < PAGE) break;
        }
        dispatch({ type: 'LOAD', payload: fresh });
      }
    },
    [cancelAllPending, bulkSave, userId, supabase, isGuest]
  );

  const getCount = useCallback((code: string) => collection[code]?.count ?? 0, [collection]);
  const isFavorite = useCallback(
    (code: string) => collection[code]?.is_favorite ?? false,
    [collection]
  );

  return (
    <CollectionContext.Provider
      value={{
        collection,
        loading,
        isSaving: savingCount > 0,
        saveError,
        isGuest,
        addSticker,
        removeSticker,
        toggleFavorite,
        completeTeam,
        clearTeam,
        clearAll,
        completeAll,
        completeCodes,
        clearCodes,
        addOneAll,
        removeOneAll,
        clearStats,
        importCollection,
        getCount,
        isFavorite,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used inside CollectionProvider');
  return ctx;
}
