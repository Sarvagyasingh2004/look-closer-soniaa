import { NextResponse } from 'next/server';

// Protects the private inbox with a password (the browser shows its own sign-in box).
// Set INBOX_PASSWORD in .env and on Vercel. Without it, the inbox stays locked.

export const config = { matcher: ['/inbox', '/inbox/:path*'] };

const PRIVATE = {
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex, nofollow',
};

function locked(message, status = 401) {
  const headers = { ...PRIVATE };
  if (status === 401) headers['WWW-Authenticate'] = 'Basic realm="Look Closer inbox", charset="UTF-8"';
  return new NextResponse(message, { status, headers });
}

// Compares two strings in the same amount of time whether they match or not,
// so the password can't be guessed one character at a time by measuring response times.
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// Slows down password guessing: 10 wrong tries per address every 15 minutes (per server instance).
const fails = new Map();
const WINDOW = 15 * 60 * 1000;
function tooManyFails(ip) {
  const now = Date.now();
  const list = (fails.get(ip) || []).filter((t) => now - t < WINDOW);
  fails.set(ip, list);
  return list.length >= 10;
}
function recordFail(ip) {
  const list = fails.get(ip) || [];
  list.push(Date.now());
  fails.set(ip, list);
  if (fails.size > 2000) fails.clear();
}

export function middleware(request) {
  const password = process.env.INBOX_PASSWORD;
  if (!password) return locked('The inbox is locked. Set INBOX_PASSWORD to open it.');

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (tooManyFails(ip)) return locked('Too many attempts. Try again in 15 minutes.', 429);

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return locked('Sign in to see the inbox.');

  let given = '';
  try {
    const decoded = atob(encoded);
    given = decoded.slice(decoded.indexOf(':') + 1); // any username, this password
  } catch {
    recordFail(ip);
    return locked('Sign in to see the inbox.');
  }
  if (!safeEqual(given, password)) {
    recordFail(ip);
    return locked('That password didn’t match.');
  }
  const res = NextResponse.next();
  Object.entries(PRIVATE).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}
