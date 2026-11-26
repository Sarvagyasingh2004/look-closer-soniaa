import { getDb } from '@/lib/mongodb';
import { notifyNewCard } from '@/lib/notify';
import { createHash } from 'node:crypto';
import { clean, clientIp, isJson, rateLimit, readJson, sameOrigin } from '@/lib/guard';

export const runtime = 'nodejs';

// Saves a visitor's clarity card when they choose to send it to Soniaa.
const AREAS = new Set(['brand', 'messaging', 'operations', 'people']);
// Letters, digits and . _ % + - before the @; a normal domain after it. No spaces, commas, quotes or brackets.
const EMAIL = /^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

function fail(status, error) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request) {
  if (!sameOrigin(request) || !isJson(request)) return fail(403, 'Please send your card from the site itself.');
  const ip = clientIp(request);

  const { body, tooLarge } = await readJson(request, 4000);
  if (tooLarge) return fail(413, 'That message is too long.');
  if (!body) return fail(400, 'Something went wrong with the form. Please try again.');

  const chaos = clean(body.chaos, 400);
  const area = body.area;
  const name = clean(body.name, 80);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const session = typeof body.session === 'string' ? body.session.slice(0, 64) : null;

  // Hidden field that people never see. Bots fill it in; pretend it worked.
  if (body.website) return Response.json({ ok: true });

  if (chaos.length < 12 || chaos.length > 200) return fail(400, 'Your sentence needs to be between 12 and 200 characters.');
  if (typeof area !== 'string' || !AREAS.has(area)) return fail(400, 'Pick where the problem lives.');
  if (!EMAIL.test(email) || email.length > 120) return fail(400, 'That email doesn’t look right yet.');
  if (body.consent !== true) return fail(400, 'Tick the box so Soniaa can see what you shared.');
  // Count only complete, valid sends, so someone fixing a typo isn't locked out.
  if (!rateLimit(`connect:${ip}`, 5, 60 * 60 * 1000)) return fail(429, 'You’ve sent a few already. Please try again in a while.');

  // A one-way fingerprint of the visitor's network address, so repeat sends can be limited
  // across server instances without storing the address itself.
  const ipHash = createHash('sha256').update(`${process.env.INBOX_PASSWORD || 'look-closer'}:${ip}`).digest('hex').slice(0, 32);

  try {
    const db = await getDb();
    if (!db) return fail(503, 'Saving isn’t switched on yet. Please connect on LinkedIn instead.');
    const subs = db.collection('submissions');
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await subs.countDocuments({ $or: [{ ipHash }, { email }], createdAt: { $gt: hourAgo } });
    if (recent >= 5) return fail(429, 'You’ve sent a few already. Please try again in a while.');
    const { insertedId } = await subs.insertOne({ chaos, area, name, email, session, ipHash, createdAt: new Date() });

    // Email the card to NOTIFY_EMAIL. The card is already saved, so a failed email never fails the request.
    try {
      const sent = await Promise.race([
        notifyNewCard({ chaos, area, name, email }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('email timed out')), 8000)),
      ]);
      if (sent) await subs.updateOne({ _id: insertedId }, { $set: { emailedAt: new Date() } });
    } catch (err) {
      console.error('Card saved, but the email failed:', err.message);
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Could not save submission:', err.message);
    return fail(500, 'That didn’t reach Soniaa. Your card is still here, so try again.');
  }
}
