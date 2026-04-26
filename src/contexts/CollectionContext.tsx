'use client';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  | { type: 'CLEAR_ALL' };

function reducer(state: CollectionState, action: Action): CollectionState {
  switch (action.type) {
    case 'LOAD':
      return Object.fromEntries(action.payload.map((e) => [e.sticker_num, e]));
    case 'SET':
      return { ...state, [action.payload.sticker_num]: action.payload };
    case 'CLEAR_ALL':
      return {};
    default:
      return state;
  }
}

interface CollectionContextType {
  collection: CollectionState;
  loading: boolean;
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
  const isGuest = !userId;
  const supabase = createClient();
  const pendingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

    const load = async () => {
      // Import guest data if any (works for Google OAuth too)
      const raw = (() => { try { return localStorage.getItem(GUEST_KEY); } catch { return null; } })();
      if (raw) {
        try {
          const entries = JSON.parse(raw) as CollectionEntry[];
          if (Array.isArray(entries) && entries.length > 0) {
            const CHUNK = 500;
            let importOk = true;
            for (let i = 0; i < entries.length; i += CHUNK) {
              const { error } = await supabase.from('collection').upsert(
                entries.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
                { onConflict: 'user_id,sticker_num' }
              );
              if (error) { importOk = false; console.error('[guest import]', error); }
            }
            // Only clear localStorage if import succeeded
            if (importOk) {
              try { localStorage.removeItem(GUEST_KEY); } catch {}
            }
          } else {
            // Empty array — nothing to import, clear it
            try { localStorage.removeItem(GUEST_KEY); } catch {}
          }
        } catch (e) {
          console.error('[guest import parse]', e);
        }
      }

      const { data } = await supabase
        .from('collection')
        .select('sticker_num,count,history_taps,max_dups,is_favorite')
        .eq('user_id', userId);
      if (data) dispatch({ type: 'LOAD', payload: data as CollectionEntry[] });
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`collection:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collection', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            dispatch({ type: 'SET', payload: payload.new as CollectionEntry });
          }
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

  // ── Sync a single entry to Supabase (no-op for guests) ───────────────────
  const syncEntry = useCallback(
    (entry: CollectionEntry) => {
      if (isGuest) return; // guest: persisted by useEffect above
      if (pendingRef.current[entry.sticker_num]) {
        clearTimeout(pendingRef.current[entry.sticker_num]);
      }
      pendingRef.current[entry.sticker_num] = setTimeout(async () => {
        const { error } = await supabase.from('collection').upsert(
          { user_id: userId, ...entry },
          { onConflict: 'user_id,sticker_num' }
        );
        if (error) console.error('[upsert error]', error.code, error.message, error.details);
      }, 400);
    },
    [userId, supabase, isGuest]
  );

  const addSticker = useCallback(
    (code: string) => {
      const cur = collection[code];
      const newCount = (cur?.count ?? 0) + 1;
      const newEntry: CollectionEntry = {
        sticker_num: code,
        count: newCount,
        history_taps: (cur?.history_taps ?? 0) + 1,
        max_dups: Math.max(cur?.max_dups ?? 0, newCount),
        is_favorite: cur?.is_favorite ?? false,
      };
      dispatch({ type: 'SET', payload: newEntry });
      syncEntry(newEntry);
    },
    [collection, syncEntry]
  );

  const removeSticker = useCallback(
    (code: string) => {
      const cur = collection[code];
      if (!cur || cur.count <= 0) return;
      const newEntry: CollectionEntry = { ...cur, count: cur.count - 1 };
      dispatch({ type: 'SET', payload: newEntry });
      syncEntry(newEntry);
    },
    [collection, syncEntry]
  );

  const toggleFavorite = useCallback(
    (code: string) => {
      const cur = collection[code];
      const newEntry: CollectionEntry = {
        sticker_num: code,
        count: cur?.count ?? 0,
        history_taps: cur?.history_taps ?? 0,
        max_dups: cur?.max_dups ?? 0,
        is_favorite: !(cur?.is_favorite ?? false),
      };
      dispatch({ type: 'SET', payload: newEntry });
      syncEntry(newEntry);
    },
    [collection, syncEntry]
  );

  const completeTeam = useCallback(
    async (teamCode: string) => {
      const teamStickers = getTeamStickers(teamCode);
      const updates: CollectionEntry[] = teamStickers.map((s) => {
        const cur = collection[s.code];
        const newCount = Math.max(cur?.count ?? 0, 1);
        return {
          sticker_num: s.code,
          count: newCount,
          history_taps: (cur?.history_taps ?? 0) + (cur?.count === 0 ? 1 : 0),
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      });
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      if (isGuest) return;
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase, isGuest]
  );

  const completeCodes = useCallback(
    async (codes: string[]) => {
      const updates: CollectionEntry[] = codes.map((code) => {
        const cur = collection[code];
        const newCount = Math.max(cur?.count ?? 0, 1);
        return {
          sticker_num: code,
          count: newCount,
          history_taps: (cur?.history_taps ?? 0) + (cur?.count === 0 ? 1 : 0),
          max_dups: Math.max(cur?.max_dups ?? 0, newCount),
          is_favorite: cur?.is_favorite ?? false,
        };
      });
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      if (isGuest) return;
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase, isGuest]
  );

  const clearCodes = useCallback(
    async (codes: string[]) => {
      const updates: CollectionEntry[] = codes.map((code) => ({
        ...(collection[code] ?? { history_taps: 0, max_dups: 0, is_favorite: false }),
        sticker_num: code,
        count: 0,
      })) as CollectionEntry[];
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      if (isGuest) return;
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase, isGuest]
  );

  const clearTeam = useCallback(
    async (teamCode: string) => {
      const teamStickers = getTeamStickers(teamCode);
      const updates: CollectionEntry[] = teamStickers.map((s) => ({
        ...(collection[s.code] ?? { history_taps: 0, max_dups: 0, is_favorite: false }),
        sticker_num: s.code,
        count: 0,
      })) as CollectionEntry[];
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      if (isGuest) return;
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase, isGuest]
  );

  const clearAll = useCallback(async () => {
    const updates = Object.values(collection).map((e) => ({
      ...e,
      count: 0,
      max_dups: 0,
      is_favorite: false,
    }));
    dispatch({ type: 'LOAD', payload: updates });
    if (isGuest) return;
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase, isGuest]);

  const completeAll = useCallback(async () => {
    const updates: CollectionEntry[] = ALL_STICKERS.map((s) => {
      const cur = collection[s.code];
      const newCount = Math.max(cur?.count ?? 0, 1);
      return {
        sticker_num: s.code,
        count: newCount,
        history_taps: (cur?.history_taps ?? 0) + (cur?.count === 0 ? 1 : 0),
        max_dups: Math.max(cur?.max_dups ?? 0, newCount),
        is_favorite: cur?.is_favorite ?? false,
      };
    });
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    if (isGuest) return;
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase, isGuest]);

  const addOneAll = useCallback(async () => {
    const updates: CollectionEntry[] = ALL_STICKERS.map((s) => {
      const cur = collection[s.code];
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
    if (isGuest) return;
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase, isGuest]);

  const removeOneAll = useCallback(async () => {
    const updates: CollectionEntry[] = Object.values(collection)
      .filter((e) => e.count > 0)
      .map((e) => ({ ...e, count: e.count - 1 }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    if (isGuest) return;
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase, isGuest]);

  const clearStats = useCallback(async () => {
    const updates = Object.values(collection).map((e) => ({
      ...e,
      history_taps: 0,
    }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    if (isGuest) return;
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase, isGuest]);

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
