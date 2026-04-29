'use client';
import React from 'react';

/**
 * SVG flag rendered from `flagcdn.com`. Replaces emoji flags because Windows
 * (Segoe UI Emoji) doesn't ship the regional-indicator flag glyphs nor the
 * subdivision flag sequences (England / Scotland), so the emoji fallback was
 * showing up as raw 2-letter siglas (CO, UZ, CD) and a black flag for ENG.
 *
 * flagcdn provides every ISO 3166-1 country and selected ISO 3166-2
 * subdivisions as SVG without an API key. SVGs scale crisply to any size.
 */

const FIFA_TO_ISO2: Record<string, string> = {
  // Group A
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  // Group B
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  // Group C
  BRA: 'br', MAR: 'ma', HAI: 'ht',
  // Group D
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  // Group E
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  // Group F
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  // Group G
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  // Group H
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  // Group I
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  // Group J
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  // Group K
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  // Group L
  CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

// flagcdn supports a subset of ISO 3166-2 subdivisions for the UK constituent
// countries. These render the proper Saint George cross / Saltire / etc.
const SUBDIVISION: Record<string, string> = {
  ENG: 'gb-eng',
  SCO: 'gb-sct',
};

interface Props {
  /** FIFA 3-letter code (e.g. "ARG"). */
  code: string;
  /** Height in px. Width is auto from the flag's intrinsic aspect ratio. */
  height?: number;
  className?: string;
}

export default function Flag({ code, height = 12, className = '' }: Props) {
  const slug = SUBDIVISION[code] ?? FIFA_TO_ISO2[code];
  if (!slug) return null;
  return (
    // Plain <img> not next/image: Next's <Image> needs the host whitelisted
    // in next.config and a fixed numeric width/height. For inline 12-14px
    // flags scattered across 48 sections, raw <img> with lazy loading is
    // simpler and the network cost is negligible (each SVG ~1-3 KB, cached).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${slug}.svg`}
      alt={`Bandera ${code}`}
      style={{ height, width: 'auto' }}
      className={`inline-block rounded-[2px] ${className}`}
      loading="lazy"
      draggable={false}
    />
  );
}
