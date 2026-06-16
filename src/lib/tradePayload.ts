/**
 * Compact, URL-safe encoder for trade payloads exchanged through QR codes.
 *
 * Flow: friend pastes their list on the public /cambio/[ownerUserId] page →
 * we build {n: missing, h: repeated} → encode here → embed in a QR pointing
 * to /cambio/match?d=<payload>. Owner scans with their phone, lands on the
 * match page, and the encoder/decoder lives in one place so both sides stay
 * in sync.
 *
 * Why base64url and not plain query params: a comma-joined string would work
 * for small lists, but URL-encoding `,` triples the payload size for big
 * trades (50+ codes per side). Base64url avoids any URL-encoding overhead
 * (`-` and `_` are URL-safe) and lets us pack ~1KB of JSON into a QR that
 * still scans reliably on phones.
 *
 * Why JSON and not a hand-rolled format: codes already follow a regular
 * shape (TEAM-NUM, FWC-NN, etc.) so JSON's per-item overhead is negligible
 * once base64'd, and we get evolvability for free if we want to add more
 * fields later (e.g. a `t:` timestamp or `u:` username).
 */

export interface TradePayload {
  /** Sticker codes the OTHER PERSON is missing (owner gives if they have spares). */
  missing: string[];
  /** Sticker codes the OTHER PERSON has repeated (owner receives if they're missing). */
  repeated: string[];
}

/** Encode for inclusion in a URL `?d=` param. Returns a URL-safe base64 string. */
export function encodeTradePayload(p: TradePayload): string {
  // Empty lists are stored as empty arrays — not omitted — so the decoder can
  // assert shape without dealing with undefined.
  const json = JSON.stringify({ n: p.missing, h: p.repeated });
  // btoa only handles Latin-1; codes are ASCII so this is safe. We then make
  // the output URL-safe by swapping the two characters base64 uses that need
  // percent-encoding in URLs.
  const b64 = btoa(json);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Inverse of encodeTradePayload. Returns null if the payload is malformed. */
export function decodeTradePayload(raw: string): TradePayload | null {
  try {
    // Re-introduce standard base64 alphabet + pad to a multiple of 4 so atob
    // accepts it. We deliberately don't trust the input length — friends might
    // share URLs through messaging apps that trim trailing characters.
    let s = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const json = atob(s);
    const parsed = JSON.parse(json) as { n?: unknown; h?: unknown };
    const n = Array.isArray(parsed.n) ? parsed.n.filter((x): x is string => typeof x === 'string') : [];
    const h = Array.isArray(parsed.h) ? parsed.h.filter((x): x is string => typeof x === 'string') : [];
    return { missing: n, repeated: h };
  } catch {
    return null;
  }
}
