import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Funnel totals for the Pulse scene: how many distinct visitors reached each step.
const STEPS = [
  { key: 'arrived', types: ['page_view'] },
  { key: 'lens', types: ['lens_used'] },
  { key: 'dots', types: ['pair_opened'] },
  { key: 'shared', types: ['chaos_submitted'] },
  { key: 'reached', types: ['contact_shared', 'linkedin_clicked'] },
];
const LABEL = {
  brand: 'Brand → Revenue',
  messaging: 'Messaging → Conversion',
  operations: 'Operations → Execution',
  people: 'People → Everything',
};
const AREA = { brand: 'Brand', messaging: 'Messaging', operations: 'Operations', people: 'People' };

async function distinctSessions(events, types) {
  const rows = await events
    .aggregate([{ $match: { type: { $in: types } } }, { $group: { _id: '$session' } }, { $count: 'n' }])
    .toArray();
  return rows[0]?.n ?? 0;
}

async function topValue(events, type, field) {
  const rows = await events
    .aggregate([
      { $match: { type, [field]: { $exists: true } } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 1 },
    ])
    .toArray();
  return rows[0]?._id ?? null;
}

export async function GET() {
  try {
    const db = await getDb();
    if (!db) return Response.json({ ok: false, error: 'not-connected' }, { status: 503 });
    const events = db.collection('events');
    const counts = await Promise.all(STEPS.map((s) => distinctSessions(events, s.types)));
    const [pair, area] = await Promise.all([topValue(events, 'pair_opened', 'pair'), topValue(events, 'chaos_submitted', 'area')]);
    return Response.json(
      {
        ok: true,
        stages: STEPS.map((s, i) => ({ key: s.key, n: counts[i] })),
        topPair: pair ? LABEL[pair] : null,
        topArea: area ? AREA[area] : null,
        updatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Pulse failed:', err.message);
    return Response.json({ ok: false, error: 'unavailable' }, { status: 503 });
  }
}
