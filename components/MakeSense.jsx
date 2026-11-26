'use client';

import { useEffect, useRef } from 'react';
import { ICONS, LensIcon } from '@/components/icons';
import { mark, reachedOut, sessionId, you } from '@/lib/journey';
import { pulseBridge } from '@/lib/pulseBridge';
import { LINKEDIN } from '@/components/Closing';

// Scene 04 · Make sense of it
// The visitor's words turn into floating noise as they type; only the words under the lens are sharp.
// On submit, the lens grows into the clarity card and the words land in place as one clean sentence.
// Sending saves the card (/api/connect), then the card shrinks into a dot that flies into the Pulse funnel.

const AREA = {
  brand: { from: 'Brand', to: 'Revenue', toIcon: 'revenue', principle: 'Crafting brands people can feel.',
    proof: <>Helped <b>Brand Tadkaa</b> build pipeline and revenue as an advisor.</> },
  messaging: { from: 'Messaging', to: 'Conversion', toIcon: 'conversion', principle: 'Human messaging, clear strategy & meaningful growth.',
    proof: <><b>1,200</b> new opportunities → <b>100</b> closed deals at ShowMeLeads.</> },
  operations: { from: 'Operations', to: 'Execution', toIcon: 'execution', principle: 'I bring structure without chaos.',
    proof: <>A key role in growing Appirio’s company value <b>5×</b> in 18 months.</> },
  people: { from: 'People', to: 'Everything', toIcon: null, principle: 'I help teams feel more confident and connected in what they’re building.',
    proof: <>Built a <b>15-person</b> team from zero at Appirio, from hiring to training.</> },
};
const KEYWORDS = {
  people: ['team', 'hire', 'hiring', 'people', 'culture', 'founder', 'align', 'confiden', 'manager', 'motivat', 'burnout', 'cofounder'],
  operations: ['process', 'operation', 'ops', 'tool', 'workflow', 'bottleneck', 'execut', 'slow', 'deadline', 'system', 'priorit', 'busy', 'chaos', 'scale'],
  messaging: ['message', 'messaging', 'copy', 'website', 'email', 'lead', 'convert', 'conversion', 'content', 'story', 'pitch', 'sales', 'customer'],
  brand: ['brand', 'logo', 'identity', 'position', 'visib', 'awareness', 'reputation', 'trust', 'noticed'],
};
const ORBS = ['brand', 'messaging', 'operations', 'people'];
const ORB_HOME = { brand: [13, 42], messaging: [87, 36], operations: [11, 64], people: [89, 60] };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function guessArea(t) {
  const s = (t || '').toLowerCase();
  for (const key of ['people', 'operations', 'messaging', 'brand']) {
    if (KEYWORDS[key].some((w) => s.includes(w))) return key;
  }
  return null;
}
function cleanText(t) {
  let s = t.trim().replace(/\s+/g, ' ');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?…]$/.test(s)) s += '.';
  return s;
}

export default function MakeSense() {
  const r = useRef({});
  const ref = (name) => (el) => { r.current[name] = el; };
  const lensRows = useRef({});

  useEffect(() => {
    const $ = r.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const orbEls = ORBS.map((k) => $['orb_' + k]);
    const cleanups = [];
    const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };

    let W = 1, H = 1, narrow = false;
    let fWords = [];
    let manualArea = null, guessed = null, phase = 'type', current = null;
    let lx = null, ly = null, pointer = false, px = 0, py = 0;
    const timers = [];

    const orbsWrap = $.sticky.querySelector('.sorbs');
    let orbsBottom = null;
    function layout() {
      W = $.sticky.clientWidth; H = $.sticky.clientHeight;
      narrow = W < 760;
      $.tetherSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    }
    layout();
    on(window, 'resize', layout);

    // Where the n-th word floats: the open middle of the screen, away from the title and the input.
    function slotFor(i) {
      const cols = narrow ? 3 : 5, rows = narrow ? 6 : 5;
      const order = (i * 7) % (cols * rows);
      const c = order % cols, row = Math.floor(order / cols);
      const x0 = narrow ? 0.12 : 0.22, x1 = narrow ? 0.88 : 0.78;
      const y0 = narrow ? 0.3 : 0.36, y1 = narrow ? 0.62 : 0.72;
      const jx = (((i * 37) % 10) / 10 - 0.5) * 0.08, jy = (((i * 53) % 10) / 10 - 0.5) * 0.06;
      return { x: (x0 + ((x1 - x0) * (c + 0.5)) / cols + jx) * W, y: (y0 + ((y1 - y0) * (row + 0.5)) / rows + jy) * H };
    }
    function barOrigin() {
      const b = $.barRow.getBoundingClientRect(), s = $.sticky.getBoundingClientRect();
      return { x: b.left - s.left + b.width / 2, y: b.top - s.top };
    }
    function syncWords() {
      const v = $.input.value.trim();
      const parts = v ? v.split(/\s+/) : [];
      const o = barOrigin();
      parts.forEach((part, i) => {
        let w = fWords[i];
        if (!w) {
          const el = document.createElement('span');
          el.className = 'fw';
          $.field.appendChild(el);
          const slot = slotFor(i);
          w = { el, x: o.x, y: o.y, tx: slot.x, ty: slot.y, ph: i * 1.9, f: 0.0012 + (i % 5) * 0.0002 };
          fWords.push(w);
        }
        if (w.el.textContent !== part) w.el.textContent = part;
      });
      while (fWords.length > parts.length) fWords.pop().el.remove();
    }
    function clearWords() { fWords.forEach((w) => w.el.remove()); fWords = []; }

    function paintOrbs() {
      orbEls.forEach((o) => {
        const k = o.dataset.area;
        o.setAttribute('aria-pressed', manualArea === k ? 'true' : 'false');
        o.classList.toggle('suggested', !manualArea && guessed === k);
      });
    }
    function setHint(html) { $.hint.innerHTML = html; }
    const DEFAULT_HINT = 'One honest sentence · no need to be polished';

    on($.input, 'input', () => {
      if (phase !== 'type') return;
      const v = $.input.value;
      $.count.textContent = `${v.length} / 200`;
      guessed = guessArea(v);
      if (v.trim().length >= 12) {
        if (manualArea) setHint(`<span class="ok">Reading it through ${AREA[manualArea].from}</span> · press Enter`);
        else if (guessed) setHint(`<span class="ok">Sounds like ${AREA[guessed].from}</span> · tap another if not`);
        else setHint('Not sure where it lives · it’ll be read through People, since people affect everything · or tap one');
      } else {
        $.hint.textContent = DEFAULT_HINT;
      }
      paintOrbs();
      syncWords();
    });
    orbEls.forEach((o) => on(o, 'click', () => {
      manualArea = manualArea === o.dataset.area ? null : o.dataset.area;
      paintOrbs();
      $.input.dispatchEvent(new Event('input')); // refresh the hint under the input
    }));
    on($.sticky, 'pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const s = $.sticky.getBoundingClientRect();
      px = e.clientX - s.left; py = e.clientY - s.top; pointer = true;
    });
    on($.sticky, 'pointerleave', () => { pointer = false; });


    function fillCard(cleaned, area) {
      $.chaos.innerHTML = '';
      cleaned.split(' ').forEach((word) => {
        const s = document.createElement('span');
        s.className = 'slot';
        s.textContent = word;
        $.chaos.appendChild(s);
      });
      Object.keys(lensRows.current).forEach((k) => {
        const el = lensRows.current[k];
        if (el) el.hidden = !(k === area || k === `${area}_proof`);
      });
      $.principle.textContent = `“${AREA[area].principle}”`;
    }

    on($.bar, 'submit', (e) => {
      e.preventDefault();
      if (phase !== 'type') return;
      const text = $.input.value.trim();
      if (text.length < 12) {
        setHint('<span class="err">A few more words, please. At least 12 characters.</span>');
        $.barRow.classList.remove('nudge'); void $.barRow.offsetWidth; $.barRow.classList.add('nudge');
        $.input.focus();
        return;
      }
      const area = manualArea || guessArea(text) || 'people';
      current = { cleaned: cleanText(text), area };
      mark('shared', { area });
      resolve();
    });

    // The lens becomes the card; the floating words land in their places in the sentence.
    function resolve() {
      phase = 'resolve';
      $.input.blur();
      syncWords();
      fillCard(current.cleaned, current.area);
      $.sticky.classList.add('resolving');
      $.card.classList.remove('show', 'sending');
      $.card.style.visibility = 'hidden';
      const sr = $.sticky.getBoundingClientRect();
      const cr = $.card.getBoundingClientRect();
      const slots = Array.from($.chaos.querySelectorAll('.slot'));
      const lr = $.lens.offsetWidth / 2;
      const cx = lx ?? W / 2, cy = ly ?? H / 2;

      if (reduce) {
        clearWords();
        $.card.style.visibility = '';
        $.card.classList.add('show');
        phase = 'card';
        return;
      }
      const m = $.morph;
      m.classList.remove('go');
      Object.assign(m.style, { left: `${cx - lr}px`, top: `${cy - lr}px`, width: `${lr * 2}px`, height: `${lr * 2}px`, borderRadius: '50%', opacity: '1', backgroundColor: 'rgba(18,24,41,0.6)' });
      void m.offsetWidth;
      m.classList.add('go');
      Object.assign(m.style, {
        left: `${cr.left - sr.left}px`, top: `${cr.top - sr.top}px`, width: `${cr.width}px`, height: `${cr.height}px`,
        borderRadius: '0px', backgroundColor: 'rgba(18,24,41,0.97)',
      });

      const fsFloat = fWords.length ? parseFloat(getComputedStyle(fWords[0].el).fontSize) : 24;
      const fsSlot = slots.length ? parseFloat(getComputedStyle(slots[0]).fontSize) : 20;
      const k = fsSlot / fsFloat;
      fWords.forEach((w, i) => {
        const slot = slots[i];
        if (!slot) { w.el.style.opacity = '0'; return; }
        w.el.textContent = slot.textContent;
        const b = slot.getBoundingClientRect();
        w.el.classList.add('landing');
        w.el.classList.remove('sharp');
        w.el.style.transitionDelay = `${120 + i * 28}ms`;
        w.el.style.transform = `translate(${(b.left - sr.left).toFixed(1)}px,${(b.top - sr.top).toFixed(1)}px) scale(${k.toFixed(3)})`;
      });
      timers.push(setTimeout(() => {
        $.card.style.visibility = '';
        $.card.classList.add('show');
        clearWords();
        m.style.opacity = '0';
        phase = 'card';
      }, 1150 + fWords.length * 28));
    }

    function reset() {
      phase = 'type';
      $.sticky.classList.remove('resolving');
      $.card.classList.remove('show', 'sending');
      $.card.style.visibility = 'hidden';
      $.morph.classList.remove('go'); $.morph.style.opacity = '0';
      $.done.hidden = true;
      clearWords();
      $.input.value = ''; $.count.textContent = '0 / 200';
      $.hint.textContent = DEFAULT_HINT;
      manualArea = null; guessed = null; paintOrbs();
      $.email.value = ''; $.name.value = ''; $.consent.checked = false; $.website.value = '';
      $.sendError.hidden = true;
      $.sendBtn.disabled = false; $.sendLabel.textContent = 'Send to Soniaa';
      current = null;
      $.input.focus({ preventScroll: true });
    }
    on($.again, 'click', reset);
    on($.again2, 'click', reset);

    on($.sendBtn, 'click', async () => {
      const email = $.email.value.trim().toLowerCase();
      let msg = '';
      if (!email) msg = 'Add your email so Soniaa can reply.';
      // Same rule as the server, so the visitor sees the problem before sending.
      else if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(email)) msg = 'That email doesn’t look right yet. Check for a typo.';
      else if (!$.consent.checked) msg = 'Tick the box so Soniaa can see what you shared.';
      if (msg) { $.sendError.textContent = msg; $.sendError.hidden = false; return; }
      $.sendError.hidden = true;
      $.sendBtn.disabled = true;
      $.sendLabel.textContent = 'Sending…';
      try {
        const res = await fetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chaos: current.cleaned, area: current.area, name: $.name.value.trim(), email,
            consent: true, website: $.website.value, session: sessionId(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'That didn’t reach Soniaa. Your card is still here, so try again.');
        reachedOut('send');
        flyToFunnel();
      } catch (err) {
        $.sendError.textContent = err.message;
        $.sendError.hidden = false;
        $.sendBtn.disabled = false;
        $.sendLabel.textContent = 'Try again';
      }
    });

    // The card shrinks into a dot that flies down into the funnel's "Reached out" stage.
    function flyToFunnel() {
      phase = 'sending';
      const cr = $.card.getBoundingClientRect();
      const start = { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2 };
      $.card.classList.add('sending');
      const land = () => {
        you.reached = true;
        pulseBridge.burst();
        $.card.classList.remove('show', 'sending');
        $.card.style.visibility = 'hidden';
        $.done.hidden = false;
        phase = 'done';
      };
      if (reduce || !pulseBridge.section) { land(); return; }
      const dot = document.createElement('span');
      dot.className = 'flydot';
      dot.style.transform = `translate(${start.x}px,${start.y}px)`;
      document.body.appendChild(dot);
      // Scroll to where the funnel is fully built, then land the dot in it.
      const top = pulseBridge.scrollTarget
        ? pulseBridge.scrollTarget()
        : window.scrollY + pulseBridge.section.getBoundingClientRect().top;
      timers.push(setTimeout(() => {
        if (window.__lenis) window.__lenis.scrollTo(top, { duration: 2.2 });
        else window.scrollTo({ top, behavior: 'smooth' });
      }, 350));
      const t0 = performance.now() + 350, dur = 2500;
      const step = (now) => {
        const k = clamp((now - t0) / dur, 0, 1);
        const e = easeInOut(k);
        const tg = pulseBridge.target() || { x: start.x, y: window.innerHeight };
        const mx = (start.x + tg.x) / 2 + (tg.x > start.x ? -80 : 80);
        const my = Math.min(start.y, tg.y) - 60;
        const x = (1 - e) * (1 - e) * start.x + 2 * (1 - e) * e * mx + e * e * tg.x;
        const y = (1 - e) * (1 - e) * start.y + 2 * (1 - e) * e * my + e * e * tg.y;
        dot.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${(1 + Math.sin(k * Math.PI) * 0.6).toFixed(2)})`;
        if (k < 1) requestAnimationFrame(step);
        else { dot.remove(); land(); }
      };
      requestAnimationFrame(step);
    }

    let id;
    function frame(t) {
      id = requestAnimationFrame(frame);
      const rect = $.sticky.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      const tt = reduce ? 0 : t;

      // The lens follows the cursor, or drifts on its own.
      let tx, ty;
      if (pointer && !coarse) { tx = px; ty = py; }
      else if (narrow) {
        // Phones: drift in the open band between the hint and the chips, never over the text.
        const r0 = $.lens.offsetWidth / 2;
        const sr = $.sticky.getBoundingClientRect();
        const hb = $.shint.getBoundingClientRect().bottom - sr.top;
        const ob = Math.min(...orbEls.map((o) => o.getBoundingClientRect().top)) - sr.top;
        const mid = (hb + ob) / 2 - r0 * 0.45; // the handle hangs below, so sit a little higher
        const room = Math.max(0, (ob - hb - r0 * 2.9) / 2 - 6);
        tx = W * (0.5 + 0.22 * Math.sin(tt * 0.0004));
        ty = mid + room * Math.sin(tt * 0.0006 + 1);
      }
      else { tx = W * (0.5 + 0.2 * Math.sin(tt * 0.0004)); ty = H * (0.52 + 0.1 * Math.sin(tt * 0.0006 + 1)); }
      // Keep the whole lens, handle included, inside this scene, so the next section never cuts it off.
      const r = $.lens.offsetWidth / 2, reach = r * 1.9; // the handle sticks out down and to the right
      tx = Math.min(Math.max(tx, r + 8), W - r * 2.1 - 8);
      ty = Math.min(Math.max(ty, r + 8), H - reach - 8);
      if (lx === null) { lx = tx; ly = ty; }
      lx += (tx - lx) * 0.14; ly += (ty - ly) * 0.14;
      if (phase === 'type') {
        $.lens.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px)`;
      }
      // The lens is the cursor while typing; the normal pointer comes back only once the card is showing.
      $.sticky.style.cursor = phase === 'type' && pointer && !coarse ? 'none' : '';
      const lr = $.lens.offsetWidth / 2;

      // Floating words drift as noise; only the ones under the lens are sharp.
      if (phase === 'type') {
        $.shint.style.opacity = fWords.length ? 0 : 1;
        fWords.forEach((w) => {
          const jx = reduce ? 0 : Math.sin(tt * w.f + w.ph) * 10;
          const jy = reduce ? 0 : Math.cos(tt * w.f * 1.2 + w.ph) * 7;
          w.x += (w.tx + jx - w.x) * 0.07;
          w.y += (w.ty + jy - w.y) * 0.07;
          const rot = reduce ? 0 : Math.sin(tt * w.f * 0.7 + w.ph) * 8;
          const sharp = Math.hypot(w.x - lx, w.y - ly) < lr * 0.95;
          w.el.classList.toggle('sharp', sharp);
          w.el.style.filter = sharp ? 'none' : 'blur(2.4px)';
          w.el.style.transform = `translate(${w.x.toFixed(1)}px,${w.y.toFixed(1)}px) translate(-50%, -50%) rotate(${(sharp ? 0 : rot).toFixed(2)}deg)`;
        });
      }

      // On phones the ideas sit in a row just above the input; keep a clear gap even when the hint below it wraps.
      if (narrow) {
        const gapBottom = Math.round(H - $.bar.offsetTop + 16);
        if (gapBottom !== orbsBottom) { orbsBottom = gapBottom; orbsWrap.style.bottom = gapBottom + 'px'; }
      } else if (orbsBottom !== null) { orbsBottom = null; orbsWrap.style.bottom = ''; }

      // The four ideas float at the sides; the matching one is tied to the input with a thread.
      const active = manualArea || guessed;
      let activeOrb = null;
      orbEls.forEach((o, i) => {
        const k = o.dataset.area;
        if (narrow) return;
        const h = ORB_HOME[k];
        const ox = (h[0] / 100) * W + (reduce ? 0 : Math.sin(tt * 0.0007 + i * 1.7) * 10);
        const oy = (h[1] / 100) * H + (reduce ? 0 : Math.cos(tt * 0.0006 + i * 2.3) * 8);
        // Under the lens, an idea grows, as if magnified.
        const under = phase === 'type' && pointer && !coarse && Math.hypot(ox - lx, oy - ly) < lr + 24;
        o.mag = (o.mag || 1) + ((under ? 1.22 : 1) - (o.mag || 1)) * 0.2;
        o.classList.toggle('magnified', under);
        o.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) translate(-50%, -50%) scale(${o.mag.toFixed(3)})`;
        if (k === active) activeOrb = { x: ox, y: oy };
      });
      if (activeOrb && phase === 'type') {
        const o2 = barOrigin();
        const mx = (activeOrb.x + o2.x) / 2, my = Math.max(activeOrb.y, o2.y) + 20;
        $.tether.setAttribute('d', `M${activeOrb.x.toFixed(1)} ${(activeOrb.y + 22).toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${o2.x.toFixed(1)} ${o2.y.toFixed(1)}`);
        $.tether.classList.add('show');
      } else {
        $.tether.classList.remove('show');
      }
    }
    id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(id);
      cleanups.forEach((fn) => fn());
      timers.forEach(clearTimeout);
      clearWords();
    };
  }, []);

  return (
    <section className="sense-stage" id="sense" aria-labelledby="sense-title">
      <div className="sense-sticky grid-bg" ref={ref('sticky')}>
        <header className="shead">
          <span className="eyebrow">Your turn · Make sense of it</span>
          <h2 className="stitle" id="sense-title">What feels messy for you right now?</h2>
          <p className="squote">“I’m always open to connecting with people who are building, learning, or growing.”<span>Soniaa S.</span></p>
        </header>

        <svg className="stether" ref={ref('tetherSvg')} aria-hidden="true"><path ref={ref('tether')} /></svg>
        <div className="sfield" ref={ref('field')} aria-hidden="true" />
        <p className="shint" ref={ref('shint')} aria-hidden="true">Type below · watch your words turn into noise</p>
        {/* Same magnifying glass as the hero, a little smaller */}
        <span className="slens" ref={ref('lens')} aria-hidden="true">
          <span className="lens-handle"><span className="lens-collar" /><span className="lens-grip" /></span>
          <span className="lens-glass" />
        </span>

        <div className="sorbs" role="group" aria-label="Where does it live?">
          {ORBS.map((k) => (
            <button key={k} type="button" className="orb" data-area={k} aria-pressed="false" ref={ref('orb_' + k)}>
              {ICONS[k]}
              {AREA[k].from}
            </button>
          ))}
        </div>

        <form className="sbar" ref={ref('bar')} noValidate>
          <label className="sr-only" htmlFor="chaosInput">What feels messy for you right now? One sentence.</label>
          <div className="sbar-row" ref={ref('barRow')}>
            <LensIcon />
            <input id="chaosInput" ref={ref('input')} type="text" maxLength={200} autoComplete="off" placeholder="Our team is busy, but nothing moves forward…" />
            <button type="submit" className="btn-primary">
              <span>Make sense</span><span className="long">&nbsp;of it</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
          <div className="sbar-meta">
            <span ref={ref('hint')} aria-live="polite">One honest sentence · no need to be polished</span>
            <span ref={ref('count')}>0 / 200</span>
          </div>
        </form>

        <span className="smorph" ref={ref('morph')} aria-hidden="true" />

        <article className="scard" ref={ref('card')} aria-live="polite" data-lenis-prevent style={{ visibility: 'hidden' }}>
          <div className="cc-top"><span>Clarity card</span><LensIcon /></div>
          <div className="cc-row first">
            <span className="cc-k">Your chaos, made clear</span>
            <p className="cc-chaos" ref={ref('chaos')} style={{ margin: 0 }} />
          </div>
          <div className="cc-row">
            <span className="cc-k">The lens</span>
            {ORBS.map((k) => (
              <span key={k} className="cc-lens" hidden ref={(el) => { lensRows.current[k] = el; }}>
                {ICONS[k]}{AREA[k].from}<span className="arrow">→</span>{AREA[k].toIcon ? ICONS[AREA[k].toIcon] : null}{AREA[k].to}
              </span>
            ))}
          </div>
          <div className="cc-row">
            <span className="cc-k">Soniaa’s principle</span>
            <p className="cc-principle" ref={ref('principle')} />
          </div>
          <div className="cc-row">
            <span className="cc-k">Where she’s done it</span>
            {ORBS.map((k) => (
              <p key={k} className="cc-proof" hidden ref={(el) => { lensRows.current[k + '_proof'] = el; }}>{AREA[k].proof}</p>
            ))}
          </div>
          <div className="ssend">
            <span className="ssend-title">Send this to Soniaa</span>
            <div className="ssend-row">
              <label className="sr-only" htmlFor="sendEmail">Your email</label>
              <input id="sendEmail" ref={ref('email')} type="email" autoComplete="email" maxLength={120} placeholder="Your email, so she can reply" />
              <label className="sr-only" htmlFor="sendName">Your name (optional)</label>
              <input id="sendName" ref={ref('name')} type="text" autoComplete="name" maxLength={80} placeholder="Name · optional" />
            </div>
            {/* Left empty by people; bots fill it in */}
            <input ref={ref('website')} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
            <label className="consent"><input type="checkbox" ref={ref('consent')} />I agree to share this with Soniaa</label>
            <p className="form-error" ref={ref('sendError')} role="alert" hidden />
            <div className="ssend-actions">
              <button type="button" className="btn-primary" ref={ref('sendBtn')}>
                <span ref={ref('sendLabel')}>Send to Soniaa</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
              <a className="btn-ghost" href={LINKEDIN} target="_blank" rel="noopener" onClick={() => reachedOut('linkedin')}>LinkedIn ↗</a>
              <button type="button" className="text-link" ref={ref('again')}>Start over</button>
            </div>
          </div>
        </article>

        <div className="sdone" ref={ref('done')} hidden role="status">
          <span className="sdone-title">Received.</span>
          <p>Clarity starts with saying it out loud. Soniaa will see your card, and you just joined her funnel, below.</p>
          <div className="ssend-actions" style={{ justifyContent: 'center' }}>
            <a className="btn-ghost" href={LINKEDIN} target="_blank" rel="noopener" onClick={() => reachedOut('linkedin')}>Connect on LinkedIn ↗</a>
            <button type="button" className="text-link" ref={ref('again2')}>Write another</button>
          </div>
        </div>
      </div>
    </section>
  );
}
