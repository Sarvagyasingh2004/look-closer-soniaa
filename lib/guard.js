// Small request checks shared by the API routes.
//
// - sameOrigin: only accept posts from this site's own pages (blocks other websites
//   from submitting forms on a visitor's behalf, i.e. CSRF).
// - isJson: the API only takes JSON, which browsers can't send cross-site without permission.
// - rateLimit: a simple per-visitor limit kept in memory. On Vercel each server instance
//   has its own memory, so this is a first line of defence; /api/connect also checks the database.
// - clean: removes invisible control characters and line breaks from text people type.

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients send no Origin; the rate limits still apply
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function isJson(request) {
  return (request.headers.get('content-type') || '').toLowerCase().includes('application/json');
}

const buckets = new Map();
export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    // keep memory bounded: drop the oldest keys
    for (const k of buckets.keys()) { buckets.delete(k); if (buckets.size <= 4000) break; }
  }
  return hits.length <= limit;
}

// Control characters (including line breaks and zero-width or direction-changing marks) become plain spaces.
// Written with character codes so no invisible characters live in this file.
function invisible(code) {
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) || (code >= 0x2060 && code <= 0x206f) || code === 0xfeff;
}
export function clean(value, max) {
  if (typeof value !== 'string') return '';
  let out = '';
  for (const ch of value.normalize('NFC')) out += invisible(ch.codePointAt(0)) ? ' ' : ch;
  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

// Reads a small JSON body safely. Returns an object, or null if it isn't one.
export async function readJson(request, maxBytes) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) return { tooLarge: true };
  const text = await request.text();
  if (text.length > maxBytes) return { tooLarge: true };
  try {
    const body = JSON.parse(text);
    return body && typeof body === 'object' && !Array.isArray(body) ? { body } : { body: null };
  } catch {
    return { body: null };
  }
}
