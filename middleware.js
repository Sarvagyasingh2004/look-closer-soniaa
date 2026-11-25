import { NextResponse } from 'next/server';

// Protects the private inbox with a password (the browser shows its own sign-in box).
// Set INBOX_PASSWORD in .env.local and on Vercel. Without it, the inbox stays locked.

export const config = { matcher: ['/inbox'] };

function locked(message) {
  return new NextResponse(message, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Look Closer inbox", charset="UTF-8"' },
  });
}

export function middleware(request) {
  const password = process.env.INBOX_PASSWORD;
  if (!password) return locked('The inbox is locked. Set INBOX_PASSWORD to open it.');

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return locked('Sign in to see the inbox.');

  let given = '';
  try {
    const decoded = atob(encoded);
    given = decoded.slice(decoded.indexOf(':') + 1); // any username, this password
  } catch {
    return locked('Sign in to see the inbox.');
  }
  if (given !== password) return locked('That password didn’t match.');
  return NextResponse.next();
}
