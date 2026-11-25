// What this visitor has done on the page, plus anonymous tracking.
// Scenes mark progress here; the Pulse scene reads it to place the "YOU" dot.
// Each step is also sent once to /api/event so the funnel totals are real.

const SESSION_KEY = 'lc_session';
let memoryId = null;

export const you = {
  arrived: false,
  lens: false,
  dots: false,
  shared: false,
  reached: false,
};

export function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = makeId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    if (!memoryId) memoryId = makeId();
    return memoryId;
  }
}

function makeId() {
  try {
    return window.crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// Send one anonymous event. `meta` may carry { pair } or { area }.
export function track(type, meta = {}) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({ type, session: sessionId(), ...meta });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }))) return;
  } catch {
    // fall back to fetch below
  }
  fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
}

// Mark a funnel step for this visitor (sent once per page load).
const EVENT_FOR = {
  arrived: 'page_view',
  lens: 'lens_used',
  shared: 'chaos_submitted',
};
export function mark(step, meta) {
  if (you[step]) return;
  you[step] = true;
  if (EVENT_FOR[step]) track(EVENT_FOR[step], meta);
}

// Pairs opened and ways of reaching out are tracked individually.
const pairsSent = new Set();
export function pairOpened(pair) {
  you.dots = true;
  if (pairsSent.has(pair)) return;
  pairsSent.add(pair);
  track('pair_opened', { pair });
}
export function reachedOut(how) {
  you.reached = true;
  track(how === 'linkedin' ? 'linkedin_clicked' : 'contact_shared');
}
