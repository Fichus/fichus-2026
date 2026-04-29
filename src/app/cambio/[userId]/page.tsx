import { createClient } from '@/lib/supabase/server';
import { STICKER_MAP, ALL_STICKERS } from '@/lib/stickers';
import type { CollectionEntry } from '@/lib/types';
import PublicCambioClient from './PublicCambioClient';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function PublicCambioPage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch target user's collection.
  // Paginate to bypass PostgREST's 1000-row default cap — full collections
  // exceed 1000 once enough teams + repeats are tracked, and the lex tail
  // (URU/USA/UZB) was getting silently dropped.
  const PAGE = 1000;
  const targetData: { sticker_num: string; count: number; is_favorite: boolean }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: chunk } = await supabase
      .from('collection')
      .select('sticker_num,count,is_favorite')
      .eq('user_id', userId)
      .range(from, from + PAGE - 1);
    if (!chunk) break;
    targetData.push(...chunk);
    if (chunk.length < PAGE) break;
  }

  // Fetch current viewer's collection (may be null if not logged in)
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const viewerData: CollectionEntry[] = [];
  if (viewer && viewer.id !== userId) {
    for (let from = 0; ; from += PAGE) {
      const { data: chunk } = await supabase
        .from('collection')
        .select('sticker_num,count,history_taps,max_dups,is_favorite')
        .eq('user_id', viewer.id)
        .range(from, from + PAGE - 1);
      if (!chunk) break;
      viewerData.push(...(chunk as CollectionEntry[]));
      if (chunk.length < PAGE) break;
    }
  }

  const targetCollection: Record<string, number> = {};
  for (const row of (targetData ?? []) as { sticker_num: string; count: number }[]) {
    targetCollection[row.sticker_num] = row.count;
  }

  const viewerCollection: Record<string, number> = {};
  for (const row of viewerData) {
    viewerCollection[row.sticker_num] = row.count;
  }

  // Compute totals for target
  const targetOwned = Object.values(targetCollection).filter((c) => c > 0).length;
  const targetTotal = ALL_STICKERS.filter((s) => s.section !== 'extra').length;

  // Fetch target user's display name from profiles
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();
  const targetUsername = profileData?.username ?? null;

  return (
    <PublicCambioClient
      targetUserId={userId}
      targetCollection={targetCollection}
      viewerCollection={viewerCollection}
      isViewer={!!viewer && viewer.id !== userId}
      viewerUserId={viewer && viewer.id !== userId ? viewer.id : null}
      targetOwned={targetOwned}
      targetTotal={targetTotal}
      targetUsername={targetUsername}
    />
  );
}
