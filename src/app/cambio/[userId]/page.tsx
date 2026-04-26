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

  // Fetch target user's collection
  const { data: targetData } = await supabase
    .from('collection')
    .select('sticker_num,count,is_favorite')
    .eq('user_id', userId);

  // Fetch current viewer's collection (may be null if not logged in)
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  let viewerData: CollectionEntry[] = [];
  if (viewer && viewer.id !== userId) {
    const { data } = await supabase
      .from('collection')
      .select('sticker_num,count,history_taps,max_dups,is_favorite')
      .eq('user_id', viewer.id);
    viewerData = (data as CollectionEntry[]) ?? [];
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
      targetOwned={targetOwned}
      targetTotal={targetTotal}
      targetUsername={targetUsername}
    />
  );
}
