/**
 * Maps FIFA 3-letter country codes (used throughout `stickers.ts`) to ISO
 * 3166-1 alpha-2 codes so we can build Unicode flag emoji on the fly.
 *
 * Building emoji from ISO2: each ASCII letter is offset to its Regional
 * Indicator Symbol codepoint (U+1F1E6 + (letter - 'A')). Two of those side by
 * side render as a flag on every modern OS.
 *
 * SCO (Scotland) and ENG (England) are not separate ISO entities. We use the
 * special "subdivision" flag emojis (🏴󠁧󠁢󠁥󠁮󠁧󠁿 / 🏴󠁧󠁢󠁳󠁣󠁴󠁿). Some platforms render
 * them as a black flag fallback — acceptable.
 */

const FIFA_TO_ISO2: Record<string, string> = {
  // Group A
  MEX: 'MX', RSA: 'ZA', KOR: 'KR', CZE: 'CZ',
  // Group B
  CAN: 'CA', BIH: 'BA', QAT: 'QA', SUI: 'CH',
  // Group C (SCO is special, see below)
  BRA: 'BR', MAR: 'MA', HAI: 'HT',
  // Group D
  USA: 'US', PAR: 'PY', AUS: 'AU', TUR: 'TR',
  // Group E
  GER: 'DE', CUW: 'CW', CIV: 'CI', ECU: 'EC',
  // Group F
  NED: 'NL', JPN: 'JP', SWE: 'SE', TUN: 'TN',
  // Group G
  BEL: 'BE', EGY: 'EG', IRN: 'IR', NZL: 'NZ',
  // Group H
  ESP: 'ES', CPV: 'CV', KSA: 'SA', URU: 'UY',
  // Group I
  FRA: 'FR', SEN: 'SN', IRQ: 'IQ', NOR: 'NO',
  // Group J
  ARG: 'AR', ALG: 'DZ', AUT: 'AT', JOR: 'JO',
  // Group K
  POR: 'PT', COD: 'CD', UZB: 'UZ', COL: 'CO',
  // Group L (ENG is special, see below)
  CRO: 'HR', GHA: 'GH', PAN: 'PA',
};

// Subdivision flags — UK constituent countries don't have ISO2 entries, but
// Unicode 10 added these special tag-sequence flag emojis.
const SPECIAL: Record<string, string> = {
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  SCO: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
};

export function getFlagEmoji(fifa: string): string {
  if (SPECIAL[fifa]) return SPECIAL[fifa];
  const iso = FIFA_TO_ISO2[fifa];
  if (!iso || iso.length !== 2) return '🏳️';
  const A = 'A'.charCodeAt(0);
  const RIS = 0x1F1E6; // Regional Indicator Symbol "A"
  const code1 = RIS + iso.charCodeAt(0) - A;
  const code2 = RIS + iso.charCodeAt(1) - A;
  return String.fromCodePoint(code1, code2);
}
