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
  addSticker: (code: string) => void;
  removeSticker: (code: string) => void;
  toggleFavorite: (code: string) => void;
  completeTeam: (teamCode: string) => Promise<void>;
  clearTeam: (teamCode: string) => Promise<void>;
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
  userId: string;
}) {
  const [collection, dispatch] = useReducer(reducer, {});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // Track pending upserts to debounce rapid taps
  const pendingRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Load collection on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('collection')
        .select('sticker_num,count,history_taps,max_dups,is_favorite')
        .eq('user_id', userId);
      if (data) dispatch({ type: 'LOAD', payload: data as CollectionEntry[] });
      setLoading(false);
    };
    load();

    // Realtime subscription
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncEntry = useCallback(
    (entry: CollectionEntry) => {
      if (pendingRef.current[entry.sticker_num]) {
        clearTimeout(pendingRef.current[entry.sticker_num]);
      }
      pendingRef.current[entry.sticker_num] = setTimeout(async () => {
        const { error } = await supabase.from('collection').upsert(
          {
            user_id: userId,
            sticker_num: entry.sticker_num,
            count: entry.count,
            history_taps: entry.history_taps,
            max_dups: entry.max_dups,
            is_favorite: entry.is_favorite,
          },
          { onConflict: 'user_id,sticker_num' }
        );
        if (error) console.error('[upsert error]', error.code, error.message, error.details);
      }, 400);
    },
    [userId, supabase]
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
      const newCount = cur.count - 1;
      const newEntry: CollectionEntry = { ...cur, count: newCount };
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
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase]
  );

  const clearTeam = useCallback(
    async (teamCode: string) => {
      const teamStickers = getTeamStickers(teamCode);
      const updates: CollectionEntry[] = teamStickers.map((s) => ({
        ...(collection[s.code] ?? {
          history_taps: 0,
          max_dups: 0,
          is_favorite: false,
        }),
        sticker_num: s.code,
        count: 0,
      })) as CollectionEntry[];
      updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
      await supabase.from('collection').upsert(
        updates.map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    },
    [collection, userId, supabase]
  );

  const clearAll = useCallback(async () => {
    // Reset counts but KEEP history_taps (so "más tocadas" ranking persists)
    const updates = Object.values(collection).map((e) => ({
      ...e,
      count: 0,
      max_dups: 0,
      is_favorite: false,
    }));
    dispatch({ type: 'LOAD', payload: updates });
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase]);

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
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({
          user_id: userId,
          ...e,
        })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase]);

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
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase]);

  const removeOneAll = useCallback(async () => {
    const updates: CollectionEntry[] = Object.values(collection)
      .filter((e) => e.count > 0)
      .map((e) => ({ ...e, count: e.count - 1 }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase]);

  const clearStats = useCallback(async () => {
    // Only reset history_taps — max_dups reflects the current album state
    const updates = Object.values(collection).map((e) => ({
      ...e,
      history_taps: 0,
    }));
    updates.forEach((e) => dispatch({ type: 'SET', payload: e }));
    const CHUNK = 500;
    for (let i = 0; i < updates.length; i += CHUNK) {
      await supabase.from('collection').upsert(
        updates.slice(i, i + CHUNK).map((e) => ({ user_id: userId, ...e })),
        { onConflict: 'user_id,sticker_num' }
      );
    }
  }, [collection, userId, supabase]);

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
        addSticker,
        removeSticker,
        toggleFavorite,
        completeTeam,
        clearTeam,
        clearAll,
        completeAll,
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
