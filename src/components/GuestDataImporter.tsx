'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const GUEST_KEY = 'guest_collection';

export default function GuestDataImporter({ userId }: { userId: string }) {
  useEffect(() => {
    const importIfNeeded = async () => {
      let raw: string | null = null;
      try { raw = localStorage.getItem(GUEST_KEY); } catch {}
      if (!raw) return;

      try {
        const entries = JSON.parse(raw);
        if (!Array.isArray(entries) || entries.length === 0) {
          localStorage.removeItem(GUEST_KEY);
          return;
        }

        const supabase = createClient();
        const CHUNK = 500;
        for (let i = 0; i < entries.length; i += CHUNK) {
          await supabase.from('collection').upsert(
            entries.slice(i, i + CHUNK).map((e: Record<string, unknown>) => ({ user_id: userId, ...e })),
            { onConflict: 'user_id,sticker_num' }
          );
        }
        localStorage.removeItem(GUEST_KEY);
        // Reload so CollectionContext picks up the imported data from Supabase
        window.location.reload();
      } catch (err) {
        console.error('[GuestDataImporter]', err);
      }
    };

    importIfNeeded();
  }, [userId]);

  return null;
}
