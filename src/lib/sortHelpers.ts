import type { StickerInfo, TeamDef } from './types';
import type { SortMode } from './albumStore';

/**
 * Extracts the trailing numeric suffix from a sticker code.
 *
 * Codes look like `URU-7`, `FCW-12`, `CC-03`, `EXT-04-ORO`. We always sort by
 * the FIRST run of digits after the first dash. For EXT codes (which carry a
 * variant suffix) the player index is what we want — the variant grouping is
 * handled separately by the album page.
 */
function suffixNum(code: string): number {
  const m = code.match(/-(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Sort stickers by their numeric suffix in min→max or max→min order. */
export function sortStickersBySuffix(stickers: StickerInfo[], mode: SortMode): StickerInfo[] {
  const ascending = mode.endsWith('-min');
  const out = [...stickers];
  out.sort((a, b) => (ascending ? 1 : -1) * (suffixNum(a.code) - suffixNum(b.code)));
  return out;
}

/** Sort teams alphabetically by display name in A→Z or Z→A order. */
export function sortTeamsByName(teams: TeamDef[], mode: SortMode): TeamDef[] {
  const ascending = mode.startsWith('az');
  const out = [...teams];
  out.sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name, 'es'));
  return out;
}

/** Sort group keys (A..L) alphabetically. FCW/CC are handled outside this. */
export function sortGroupKeys(keys: string[], mode: SortMode): string[] {
  const ascending = mode.startsWith('az');
  const out = [...keys];
  out.sort((a, b) => (ascending ? 1 : -1) * a.localeCompare(b));
  return out;
}
