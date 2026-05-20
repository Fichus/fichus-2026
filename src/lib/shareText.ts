/**
 * Builds the plain-text export of a collection for sharing via clipboard.
 *
 * Format compatible with the Figuritas app text export so users can paste
 * lists between apps:
 *
 *   Fichus2026 - Lista
 *
 *   Me faltan
 *   FWC 🏆: 0, 4, 7
 *   MEX 🇲🇽: 1, 2, 3, 4, 5
 *   RSA 🇿🇦: 1, 2, 3, ...
 *
 *   Repetidas
 *   MEX 🇲🇽: 1(x2), 5(x3)
 *
 *   https://misfichus.com
 *
 * The mode parameter picks which sections to include.
 */

import { ALL_TEAMS, getFCWStickers, getCCStickers, getTeamStickers } from './stickers';
import type { CollectionEntry } from './types';

export type ShareMode = 'both' | 'missing' | 'repeated';

// Emoji flag mapping — uses the same FIFA→ISO2 table as the Flag component but
// emits the regional-indicator emoji rather than an <img>. Most chat apps
// (WhatsApp, Telegram, Instagram DM) render these correctly on every modern
// device; Windows desktop is the only common surface where they fall back to
// the ISO letters, and in that case the team code right next to it keeps the
// line readable.
const FIFA_TO_ISO2: Record<string, string> = {
  MEX: 'MX', RSA: 'ZA', KOR: 'KR', CZE: 'CZ',
  CAN: 'CA', BIH: 'BA', QAT: 'QA', SUI: 'CH',
  BRA: 'BR', MAR: 'MA', HAI: 'HT',
  USA: 'US', PAR: 'PY', AUS: 'AU', TUR: 'TR',
  GER: 'DE', CUW: 'CW', CIV: 'CI', ECU: 'EC',
  NED: 'NL', JPN: 'JP', SWE: 'SE', TUN: 'TN',
  BEL: 'BE', EGY: 'EG', IRN: 'IR', NZL: 'NZ',
  ESP: 'ES', CPV: 'CV', KSA: 'SA', URU: 'UY',
  FRA: 'FR', SEN: 'SN', IRQ: 'IQ', NOR: 'NO',
  ARG: 'AR', ALG: 'DZ', AUT: 'AT', JOR: 'JO',
  POR: 'PT', COD: 'CD', UZB: 'UZ', COL: 'CO',
  CRO: 'HR', GHA: 'GH', PAN: 'PA',
};

const SUBDIVISION_EMOJI: Record<string, string> = {
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  SCO: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
};

function flagEmoji(code: string): string {
  if (SUBDIVISION_EMOJI[code]) return SUBDIVISION_EMOJI[code];
  const iso = FIFA_TO_ISO2[code];
  if (!iso) return '';
  const RIS = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  return String.fromCodePoint(RIS + iso.charCodeAt(0) - A, RIS + iso.charCodeAt(1) - A);
}

/** Extracts the trailing numeric suffix from a sticker code (e.g. "URU-7" → 7). */
function suffixNum(code: string): number {
  const m = code.match(/-(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Returns the missing sticker numbers for a list of stickers (count === 0). */
function missingNumbers(
  stickers: { code: string }[],
  collection: Record<string, CollectionEntry>,
): number[] {
  return stickers
    .filter((s) => (collection[s.code]?.count ?? 0) === 0)
    .map((s) => suffixNum(s.code))
    .sort((a, b) => a - b);
}

/** Returns "n(xK)" tokens for stickers with count > 1 (K = extras). */
function repeatedTokens(
  stickers: { code: string }[],
  collection: Record<string, CollectionEntry>,
): string[] {
  return stickers
    .filter((s) => (collection[s.code]?.count ?? 0) > 1)
    .map((s) => {
      const n = suffixNum(s.code);
      const extras = (collection[s.code]?.count ?? 0) - 1;
      return extras > 1 ? `${n}(x${extras})` : `${n}`;
    })
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

export function buildShareText(
  mode: ShareMode,
  collection: Record<string, CollectionEntry>,
): string {
  const lines: string[] = ['Fichus2026 - Lista', ''];

  const buildSection = (label: 'Me faltan' | 'Repetidas') => {
    const sectionLines: string[] = [];

    // FWC (one combined section — our app doesn't sub-divide them)
    const fcw = getFCWStickers();
    const fcwNums = label === 'Me faltan'
      ? missingNumbers(fcw, collection)
      : repeatedTokens(fcw, collection);
    if (fcwNums.length > 0) sectionLines.push(`FWC 🏆: ${fcwNums.join(', ')}`);

    // Teams in alphabetical order by FIFA code so the output is stable
    // regardless of the user's current sort preference.
    const teamsByCode = [...ALL_TEAMS].sort((a, b) => a.code.localeCompare(b.code));
    for (const t of teamsByCode) {
      const stickers = getTeamStickers(t.code);
      const nums = label === 'Me faltan'
        ? missingNumbers(stickers, collection)
        : repeatedTokens(stickers, collection);
      if (nums.length === 0) continue;
      const flag = flagEmoji(t.code);
      sectionLines.push(`${t.code} ${flag}: ${nums.join(', ')}`);
    }

    // CC at the end
    const cc = getCCStickers();
    const ccNums = label === 'Me faltan'
      ? missingNumbers(cc, collection)
      : repeatedTokens(cc, collection);
    if (ccNums.length > 0) sectionLines.push(`CC 🥤: ${ccNums.join(', ')}`);

    if (sectionLines.length === 0) return;
    lines.push(label);
    lines.push(...sectionLines);
    lines.push('');
  };

  if (mode === 'missing' || mode === 'both') buildSection('Me faltan');
  if (mode === 'repeated' || mode === 'both') buildSection('Repetidas');

  lines.push('Generado con Fichus2026');
  lines.push('https://misfichus.com');

  return lines.join('\n');
}

/* ── Parsing the inverse direction ──────────────────────────────────────────
   Accepts the text format produced by `buildShareText` above OR by the
   Figuritas app (same layout: "Me faltan" section header followed by lines
   like "FWC 🏆: 1, 2, 3" or "MEX 🇲🇽: 1(x2)"). Returns the sticker codes
   keyed in OUR canonical form (DB still uses FCW-XX even though we display
   FWC), so callers can cross-reference against `collection` directly.
*/

/** Maps a parsed prefix + number to our canonical sticker code. */
function toStickerCode(prefix: string, n: number): string {
  // FWC text → FCW DB key. The DB historically uses FCW, only the UI shows FWC.
  if (prefix === 'FWC' || prefix === 'FCW') return `FCW-${String(n).padStart(2, '0')}`;
  if (prefix === 'CC') return `CC-${String(n).padStart(2, '0')}`;
  return `${prefix}-${n}`;
}

export interface ParsedShareList {
  missing: string[];   // sticker codes the OTHER person is missing
  repeated: string[];  // sticker codes the OTHER person has repeated
}

export function parseShareText(text: string): ParsedShareList {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  let section: 'missing' | 'repeated' | null = null;
  const missing: string[] = [];
  const repeated: string[] = [];

  // Section headers used both by us and by the Figuritas app. Case-insensitive
  // match to be lenient with copy/paste accidents.
  const MISSING_HEADERS = ['me faltan', 'faltantes', 'me faltan:'];
  const REPEATED_HEADERS = ['repetidas', 'repes', 'repetidas:'];

  // A sticker line looks like:
  //   FWC 🏆: 1, 2, 3
  //   MEX 🇲🇽: 1, 5, 12
  //   CC 🥤: 1(x2), 7
  //   POR 🇵🇹: 3(x2), 5
  // Prefix = 2-4 uppercase letters. Anything between prefix and ':' is the
  // optional flag/emoji and is ignored. Everything after ':' is parsed as
  // numbers, with optional (xN) suffixes ignored — we only care WHICH
  // stickers, not the extras count.
  const LINE_RE = /^([A-Z]{2,4})\s*[^A-Z:]*:\s*(.+?)\s*$/;
  const NUM_RE = /(\d+)/g;

  for (const line of lines) {
    if (!line) continue;
    const lower = line.toLowerCase();
    if (MISSING_HEADERS.includes(lower))  { section = 'missing';  continue; }
    if (REPEATED_HEADERS.includes(lower)) { section = 'repeated'; continue; }
    if (!section) continue;

    const m = LINE_RE.exec(line);
    if (!m) continue;
    const [, prefix, rest] = m;
    let numMatch: RegExpExecArray | null;
    NUM_RE.lastIndex = 0;
    while ((numMatch = NUM_RE.exec(rest)) !== null) {
      // Skip the "x2" / "x3" multiplier suffixes by checking whether the
      // digits are immediately preceded by 'x' (inside the (xN) markup).
      const start = numMatch.index;
      const prevChar = rest[start - 1];
      if (prevChar === 'x' || prevChar === 'X') continue;
      const n = parseInt(numMatch[1], 10);
      const code = toStickerCode(prefix, n);
      (section === 'missing' ? missing : repeated).push(code);
    }
  }

  return { missing, repeated };
}
