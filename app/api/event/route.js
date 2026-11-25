import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

// Anonymous engagement events. Nothing personal is stored: a random session id, the event, and a time.
const TYPES = new Set(['page_view', 'lens_used', 'pair_opened', 'chaos_submitted', 'contact_shared', 'linkedin_clicked']);
const KEYS = new Set(['brand', 'messaging', 'operations', 'people']);

export async function POST(request) {
  let body;
  try {
    const text = await request.text();
    if (text.length > 1000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const { type, session, pair, area } = body || {};
  if (!TYPES.has(type) || typeof session !== 'string' || session.length < 8 || session.length > 64) {
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
