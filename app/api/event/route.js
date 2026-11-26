import { getDb } from '@/lib/mongodb';
import { clientIp, isJson, rateLimit, readJson, sameOrigin } from '@/lib/guard';

export const runtime = 'nodejs';

// Anonymous engagement events. Nothing personal is stored: a random session id, the event, and a time.
const TYPES = new Set(['page_view', 'lens_used', 'pair_opened', 'chaos_submitted', 'contact_shared', 'linkedin_clicked']);
const KEYS = new Set(['brand', 'messaging', 'operations', 'people']);

export async function POST(request) {
  if (!sameOrigin(request) || !isJson(request)) return new Response(null, { status: 403 });
  if (!rateLimit(`event:${clientIp(request)}`, 60, 60 * 1000)) return new Response(null, { status: 429 });
  const { body, tooLarge } = await readJson(request, 1000);
  if (tooLarge) return new Response(null, { status: 413 });
  if (!body) return new Response(null, { status: 400 });

  const { type, session, pair, area } = body;
  if (!TYPES.has(type) || typeof session !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(session)) {
    return new Response(null, { status: 400 });
  }

  const doc = { type, session, createdAt: new Date() };
  if (KEYS.has(pair)) doc.pair = pair;
  if (KEYS.has(area)) doc.area = area;

  try {
    const db = await getDb();
    if (db) await db.collection('events').insertOne(doc);
  } catch (err) {
    console.error('Could not save event:', err.message);
  }
  return new Response(null, { status: 204 });
}
