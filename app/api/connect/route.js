import { getDb } from '@/lib/mongodb';
import { notifyNewCard } from '@/lib/notify';

export const runtime = 'nodejs';

// Saves a visitor's clarity card when they choose to send it to Sonia.
const AREAS = new Set(['brand', 'messaging', 'operations', 'people']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(status, error) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request) {
  let body;
  try {
    const text = await request.text();
    if (text.length > 4000) return fail(413, 'That message is too long.');
    body = JSON.parse(text);
  } catch {
    return fail(400, 'Something went wrong with the form. Please try again.');
  }

  const chaos = typeof body.chaos === 'string' ? body.chaos.trim() : '';
  const area = body.area;
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const session = typeof body.session === 'string' ? body.session.slice(0, 64) : null;

  // Hidden field that people never see. Bots fill it in; pretend it worked.
  if (body.website) return Response.json({ ok: true });

  if (chaos.length < 12 || chaos.length > 200) return fail(400, 'Your sentence needs to be between 12 and 200 characters.');
  if (!AREAS.has(area)) return fail(400, 'Pick where the problem lives.');
  if (!EMAIL.test(email) || email.length > 120) return fail(400, 'That email doesn’t look right yet.');
  if (body.consent !== true) return fail(400, 'Tick the box so Sonia can see what you shared.');

  try {
    const db = await getDb();
    if (!db) return fail(503, 'Saving isn’t switched on yet. Please connect on LinkedIn instead.');
    const { insertedId } = await db.collection('submissions').insertOne({ chaos, area, name, email, session, createdAt: new Date() });

    // Email the card to NOTIFY_EMAIL. The card is already saved, so a failed email never fails the request.
    try {
      const sent = await Promise.race([
        notifyNewCard({ chaos, area, name, email }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('email timed out')), 8000)),
      ]);
      if (sent) await db.collection('submissions').updateOne({ _id: insertedId }, { $set: { emailedAt: new Date() } });
    } catch (err) {
      console.error('Card saved, but the email failed:', err.message);
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Could not save submission:', err.message);
    return fail(500, 'That didn’t reach Sonia. Your card is still here, so try again.');
  }
}
