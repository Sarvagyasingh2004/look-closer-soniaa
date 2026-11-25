import { getDb } from '@/lib/mongodb';

// Private: every clarity card visitors chose to send. Protected by the password in middleware.js.
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Inbox · Look Closer',
  robots: { index: false, follow: false },
};

const AREA = { brand: 'Brand → Revenue', messaging: 'Messaging → Conversion', operations: 'Operations → Execution', people: 'People → Everything' };

function when(date) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date);
}

export default async function Inbox() {
  let cards = [];
  let visitors = null;
  let problem = null;
  try {
    const db = await getDb();
    if (!db) {
      problem = 'The database isn’t connected yet. Add MONGODB_URI to .env.local (or on Vercel) and reload.';
    } else {
      cards = await db.collection('submissions').find({}, { projection: { session: 0 } }).sort({ createdAt: -1 }).limit(200).toArray();
      const rows = await db.collection('events').aggregate([{ $match: { type: 'page_view' } }, { $group: { _id: '$session' } }, { $count: 'n' }]).toArray();
      visitors = rows[0]?.n ?? 0;
    }
  } catch (err) {
    problem = 'Couldn’t reach the database just now. Reload in a moment.';
    console.error('Inbox failed:', err.message);
  }

  return (
    <main className="inbox grid-bg">
      <div className="inbox-inner">
        <header className="inbox-head">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="eyebrow">Look Closer · private</span>
            <h1 className="inbox-title">Inbox</h1>
          </div>
          <div className="inbox-stats">
            <span className="inbox-stat"><b>{cards.length}</b> cards sent</span>
            {visitors !== null && <span className="inbox-stat"><b>{visitors}</b> visitors</span>}
          </div>
        </header>

        {problem ? (
          <p className="inbox-empty">{problem}</p>
        ) : cards.length === 0 ? (
          <p className="inbox-empty">No cards yet. When someone sends their clarity card, it shows up here.</p>
        ) : (
          <ol className="inbox-list">
            {cards.map((c) => (
              <li className="inbox-item" key={String(c._id)}>
                <div className="inbox-meta">
                  <span className="inbox-area">{AREA[c.area] || c.area}</span>
                  <span>{when(c.createdAt)}</span>
                </div>
                <p className="inbox-chaos">{c.chaos}</p>
                <span className="inbox-from">{c.name ? `${c.name} · ` : ''}{c.email}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="inbox-note">Only people who ticked the consent box are listed. Showing the latest 200.</p>
      </div>
    </main>
  );
}
