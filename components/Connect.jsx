'use client';

import { useEffect, useRef } from 'react';
import { ICONS } from '@/components/icons';
import { pairOpened } from '@/lib/journey';

// Scene 02 · Connecting the dots
// The six words fly in from the edges as chaos, settle into a map, and connect one by one as you scroll.
// Noise symbols on a canvas turn into dots that flow along each connection.

const EVIDENCE = {
  brand: {
    label: 'Brand → Revenue', stat: '',
    caption: 'Brand Tadkaa · Lasersec Technologies',
    fact: 'Helped Brand Tadkaa build pipeline and revenue as an advisor. At Lasersec, built frameworks that clarified messaging and improved market reach.',
    quote: 'Crafting brands people can feel.',
  },
  messaging: {
    label: 'Messaging → Conversion', stat: '1,200 → 100',
    caption: 'new opportunities → closed deals · ShowMeLeads, 2014',
    fact: 'Lead scoring and nurture campaigns that moved people from prospect to lead to customer.',
    quote: 'Human messaging, clear strategy & meaningful growth.',
  },
  operations: {
    label: 'Operations → Execution', stat: '5×',
    caption: 'company value in 18 months · Appirio',
    fact: 'Promoted from Sr. Demand Generation Manager to Director within 6 months.',
    quote: 'I bring structure without chaos.',
  },
  people: {
    label: 'People → Everything', stat: '0 → 15',
    caption: 'people · Jaipur Marketing Center, Appirio',
    fact: 'Built the team from hiring to training. Later led 20+ marketers at Lasersec.',
    quote: 'I help teams feel more confident and connected in what they’re building.',
  },
};

const NODES = [
  { key: 'brand', pair: 'brand', label: 'Brand' },
  { key: 'messaging', pair: 'messaging', label: 'Messaging' },
  { key: 'operations', pair: 'operations', label: 'Operations' },
  { key: 'revenue', pair: 'brand', label: 'Revenue' },
  { key: 'execution', pair: 'operations', label: 'Execution' },
  { key: 'conversion', pair: 'messaging', label: 'Conversion' },
  { key: 'people', pair: 'people', label: 'People' },
];
const STEPS = [
  { key: 'brand', label: 'Brand → Revenue' },
  { key: 'messaging', label: 'Messaging → Conversion' },
  { key: 'operations', label: 'Operations → Execution' },
  { key: 'people', label: 'People → Everything' },
];

const LINES = ['brand', 'messaging', 'operations'];
const EFFECT_OF = { brand: 'revenue', messaging: 'conversion', operations: 'execution' };
// When each connection draws, as progress through the pinned scene.
const WINDOWS = { brand: [0.34, 0.46], messaging: [0.49, 0.61], operations: [0.64, 0.76], people: [0.8, 0.92] };
const JUMP = { brand: 0.48, messaging: 0.63, operations: 0.78, people: 0.95 };
// Home spots in % of the board. Effects are shuffled so the lines cross.
const HOME = {
  brand: [14, 16], messaging: [14, 50], operations: [14, 84],
  revenue: [86, 16], execution: [86, 50], conversion: [86, 84],
  people: [50, 39],
};
// Where each word enters from (fractions of the screen, off the edges).
const START = {
  brand: [-0.22, 0.12], messaging: [0.42, -0.25], operations: [-0.18, 1.18],
  revenue: [1.22, 0.06], execution: [0.62, 1.26], conversion: [1.2, 1.08], people: [0.5, 0.5],
};
const SPOKE_TO = ['brand', 'messaging', 'operations', 'revenue', 'execution', 'conversion'];
const GLYPHS = ['?', '!', '%', '#', '@', '→', '×', '~', '$', '*', '//', '…', '??', '!!'];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const mix = (a, b, t) => a + (b - a) * t;

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function Connect() {
  const stageRef = useRef(null);
  const stickyRef = useRef(null);
  const boardRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const cardRef = useRef(null);
  const hintRef = useRef(null);
  const hintTextRef = useRef(null);
  const nodeRefs = useRef({});
  const lineRefs = useRef({});
  const spokeRefs = useRef([]);
  const stepRefs = useRef({});

  useEffect(() => {
    const dStage = stageRef.current;
    const dSticky = stickyRef.current;
    const boardEl = boardRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const svg = svgRef.current;
    const evCard = cardRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let vh = window.innerHeight;
    let mx = -9999, my = -9999, hasPointer = false;
    const onPointer = (e) => { if (e.pointerType !== 'touch') { mx = e.clientX; my = e.clientY; hasPointer = true; } };
    window.addEventListener('pointermove', onPointer);

    const nodes = {};
    NODES.forEach((n, i) => {
      nodes[n.key] = {
        el: nodeRefs.current[n.key], key: n.key, pair: n.pair, x: 0, y: 0,
        f1: 0.00031 + i * 0.000047, f2: 0.00043 + i * 0.000039, ph1: i * 2.1, ph2: i * 1.3 + 0.7, rot: (i % 2 ? 1 : -1) * (14 + i * 3),
      };
    });

    let W = 0, H = 0, B = { x: 0, y: 0, w: 1, h: 1 }, narrow = false;
    let particles = [];
    function layout() {
      vh = window.innerHeight;
      W = dSticky.clientWidth; H = dSticky.clientHeight;
      narrow = W < 760;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      B = { x: boardEl.offsetLeft, y: boardEl.offsetTop, w: boardEl.offsetWidth, h: boardEl.offsetHeight };
      // Keep the map clear of the heading above it, whatever the screen height.
      const head = dSticky.querySelector('.dhead');
      const headBottom = head ? head.offsetTop + head.offsetHeight : 0;
      const top = Math.max(B.y, headBottom + (narrow ? 34 : 48));
      const bottom = narrow ? B.y + B.h : H - 40;
      B = { x: B.x, y: top, w: B.w, h: Math.max(narrow ? 170 : 260, bottom - top) };
      particles = [];
      const k = narrow ? 0.55 : 1;
      const add = (group, n) => {
        for (let i = 0; i < n; i++) {
          const seed = particles.length * 9.73;
          particles.push({
            group,
            u0: (i / n + (seed % 1) * 0.07) % 1,
            sp: 0.00006 + ((seed * 3.1) % 1) * 0.00006,
            x0: (seed * 0.618) % 1, y0: (seed * 0.371 + 0.13) % 1,
            ax: 0.04 + ((seed * 1.7) % 1) * 0.08, ay: 0.04 + ((seed * 2.3) % 1) * 0.08,
            fx: 0.0004 + ((seed * 0.9) % 1) * 0.0006, fy: 0.0004 + ((seed * 1.3) % 1) * 0.0006,
            ph: seed, g: GLYPHS[Math.floor((seed * 7.7) % GLYPHS.length)],
            size: 10 + Math.floor(((seed * 5.1) % 1) * 9), ox: 0, oy: 0,
          });
        }
      };
      LINES.forEach((l) => add(l, Math.round(20 * k)));
      for (let s = 0; s < 6; s++) add('s' + s, Math.round(7 * k));
      add('dust', Math.round(46 * k));
    }
    layout();
    window.addEventListener('resize', layout);

    const homeOf = (key) => {
      const h = HOME[key];
      let hx = h[0];
      if (narrow && key !== 'people') hx = h[0] < 50 ? 23 : 77;
      return { x: B.x + (hx / 100) * B.w, y: B.y + (h[1] / 100) * B.h };
    };
    const ctrl = (x1, y1, x2, y2) => { const dx = (x2 - x1) * 0.45; return [x1, y1, x1 + dx, y1, x2 - dx, y2, x2, y2]; };
    const bez = (c, u) => {
      const v = 1 - u;
      return {
        x: v * v * v * c[0] + 3 * v * v * u * c[2] + 3 * v * u * u * c[4] + u * u * u * c[6],
        y: v * v * v * c[1] + 3 * v * v * u * c[3] + 3 * v * u * u * c[5] + u * u * u * c[7],
      };
    };
    const pathD = (c) => `M${c[0].toFixed(1)} ${c[1].toFixed(1)} C${c[2].toFixed(1)} ${c[3].toFixed(1)}, ${c[4].toFixed(1)} ${c[5].toFixed(1)}, ${c[6].toFixed(1)} ${c[7].toFixed(1)}`;

    // Evidence panel
    let shownKey = null, manualKey = null, lastStageKey = null;
    const countUp = (el) => {
      const target = el.textContent;
      if (reduce || !/\d/.test(target)) return;
      const nums = target.match(/\d[\d,]*/g).map((s) => parseInt(s.replace(/,/g, ''), 10));
      const t0 = performance.now();
      const step = (now) => {
        const k = easeOut(clamp((now - t0) / 900, 0, 1));
        let i = 0;
        el.textContent = target.replace(/\d[\d,]*/g, () => Math.round(nums[i++] * k).toLocaleString('en-US'));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    function renderEvidence(key) {
      if (key === shownKey) return;
      shownKey = key;
      const e = EVIDENCE[key];
      let html;
      if (!e) {
        html = '<span class="ev-label plain">Evidence</span><p class="ev-fact">As each connection forms, one piece of proof from her work appears here.</p><div class="ev-wait" aria-hidden="true"><span></span><span></span><span></span><span></span></div>';
      } else {
        html = `<span class="ev-label${key === 'people' ? ' amber' : ''}">${escapeHtml(e.label)}</span>`;
        if (e.stat) html += `<span class="ev-stat">${escapeHtml(e.stat)}</span>`;
        html += `<span class="ev-caption">${escapeHtml(e.caption)}</span>`;
        html += `<p class="ev-fact">${escapeHtml(e.fact)}</p>`;
        html += `<p class="ev-quote">“${escapeHtml(e.quote)}”</p>`;
        html += '<span class="ev-source">In her own words</span>';
      }
      evCard.innerHTML = html;
      evCard.classList.remove('swap'); void evCard.offsetWidth; evCard.classList.add('swap');
      const stat = evCard.querySelector('.ev-stat');
      if (stat) countUp(stat);
      Object.values(nodes).forEach((n) => n.el.classList.toggle('is-current', !!e && n.pair === key));
      Object.keys(stepRefs.current).forEach((k) => stepRefs.current[k].classList.toggle('current', k === key));
    }
    renderEvidence('intro');

    const drawn = { brand: 0, messaging: 0, operations: 0, people: 0 };

    // Clicking a connected word or a step shows that proof; an unconnected one scrolls you to it.
    function jumpTo(key) {
      const total = dStage.offsetHeight - H;
      const y = window.scrollY + dStage.getBoundingClientRect().top + JUMP[key] * total;
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.4 });
      else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
    const cleanups = [];
    const on = (el, type, fn) => { el.addEventListener(type, fn); cleanups.push(() => el.removeEventListener(type, fn)); };
    Object.values(nodes).forEach((n) => {
      on(n.el, 'click', () => {
        if (drawn[n.pair] > 0.9) { manualKey = n.pair; renderEvidence(n.pair); } else jumpTo(n.pair);
      });
      on(n.el, 'pointerenter', () => lineRefs.current[n.pair]?.classList.add('hl'));
      on(n.el, 'pointerleave', () => lineRefs.current[n.pair]?.classList.remove('hl'));
    });
    Object.keys(stepRefs.current).forEach((k) => {
      const btn = stepRefs.current[k].querySelector('button');
      on(btn, 'click', () => {
        if (drawn[k] > 0.9) { manualKey = k; renderEvidence(k); } else jumpTo(k);
      });
    });

    let dp = 0, id;
    function frame(t) {
      id = requestAnimationFrame(frame);
      const rect = dStage.getBoundingClientRect();
      if (rect.top > vh * 1.1 || rect.bottom < -60) return;
      const tt = reduce ? 0 : t;

      const entry = easeOut(clamp((H - rect.top) / (H * 0.9), 0, 1));
      const total = dStage.offsetHeight - H;
      const p = clamp(-rect.top / (total || 1), 0, 1);
      dp += (p - dp) * 0.22;
      const order = easeInOut(smooth(0.04, 0.3, dp));

      LINES.forEach((l) => { drawn[l] = smooth(WINDOWS[l][0], WINDOWS[l][1], dp); });
      drawn.people = smooth(WINDOWS.people[0], WINDOWS.people[1], dp);
      LINES.concat(['people']).forEach((l) => { if (drawn[l] > 0.95) pairOpened(l); });

      const sr = dSticky.getBoundingClientRect();
      const pxs = mx - sr.left, pys = my - sr.top;
      const pointerLive = hasPointer && !coarse;

      // Words: fly in from the edges, wander as chaos, then settle into the map.
      Object.values(nodes).forEach((n) => {
        const h = homeOf(n.key);
        if (n.key === 'people') {
          n.x = h.x; n.y = h.y;
          const pf = drawn.people;
          n.el.style.opacity = pf.toFixed(3);
          n.el.style.transform = `translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%, -50%) scale(${(0.6 + 0.4 * easeOut(pf)).toFixed(3)})`;
          n.el.style.pointerEvents = pf > 0.6 ? 'auto' : 'none';
          n.el.tabIndex = pf > 0.6 ? 0 : -1;
          return;
        }
        const wx = W * (0.5 + 0.38 * Math.sin(tt * n.f1 + n.ph1));
        const wy = H * (0.52 + 0.34 * Math.sin(tt * n.f2 + n.ph2));
        const sx = START[n.key][0] * W, sy = START[n.key][1] * H;
        const cx = mix(sx, wx, entry), cy = mix(sy, wy, entry);
        let x = mix(cx, h.x, order), y = mix(cy, h.y, order);
        // Once settled, words lean slightly toward the cursor.
        if (pointerLive && order > 0.95) {
          const d = Math.hypot(pxs - x, pys - y);
          if (d < 160) { const k = (1 - d / 160) * 0.12; x += (pxs - x) * k; y += (pys - y) * k; }
        }
        const first = n.x === 0 && n.y === 0;
        n.x += (x - n.x) * (first ? 1 : 0.35);
        n.y += (y - n.y) * (first ? 1 : 0.35);
        const rot = (1 - order) * n.rot * Math.sin(tt * 0.0009 + n.ph1);
        const blur = (1 - order) * 3;
        n.el.style.transform = `translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg)`;
        n.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
        n.el.style.opacity = ((0.45 + 0.55 * order) * entry).toFixed(3);
        n.el.classList.toggle('is-on', drawn[n.pair] > 0.97);
      });

      // Lines draw in, scrubbed by scroll.
      const curves = {};
      LINES.forEach((l) => {
        const a = nodes[l], b = nodes[EFFECT_OF[l]];
        const c = ctrl(a.x, a.y, b.x, b.y);
        curves[l] = c;
        const el = lineRefs.current[l];
        el.setAttribute('d', pathD(c));
        el.style.strokeDashoffset = (1 - drawn[l]).toFixed(4);
      });
      const pn = nodes.people;
      const spokeCurves = SPOKE_TO.map((k, i) => {
        const o = nodes[k];
        const c = [pn.x, pn.y, mix(pn.x, o.x, 0.33), mix(pn.y, o.y, 0.33), mix(pn.x, o.x, 0.66), mix(pn.y, o.y, 0.66), o.x, o.y];
        const el = spokeRefs.current[i];
        el.setAttribute('d', pathD(c));
        el.style.strokeDashoffset = (1 - drawn.people).toFixed(4);
        return c;
      });

      // Particles: glyph noise that turns into flowing dots along each connection.
      ctx.clearRect(0, 0, W, H);
      const amp = 1 - 0.65 * order;
      for (const q of particles) {
        let chx = (q.x0 + q.ax * amp * Math.sin(tt * q.fx + q.ph)) * W;
        let chy = (q.y0 + q.ay * amp * Math.cos(tt * q.fy + q.ph)) * H;
        if (pointerLive) {
          const dx = chx + q.ox - pxs, dy = chy + q.oy - pys, dd = Math.hypot(dx, dy);
          if (dd < 120 && dd > 0.1) { const f = ((120 - dd) / 120) * 7; q.ox += (dx / dd) * f; q.oy += (dy / dd) * f; }
        }
        q.ox *= 0.94; q.oy *= 0.94;
        chx += q.ox; chy += q.oy;

        let lvl = 0, curve = null, amber = false;
        if (q.group === 'dust') lvl = 0;
        else if (q.group.charAt(0) === 's') { lvl = drawn.people; curve = spokeCurves[+q.group.slice(1)]; amber = true; }
        else { lvl = drawn[q.group]; curve = curves[q.group]; }
        const b = easeInOut(smooth(0, 0.4, lvl));
        let x = chx, y = chy;
        if (b > 0 && curve) {
          const u = ((q.u0 + tt * q.sp) % 1) * lvl;
          const pt = bez(curve, u);
          x = mix(chx, pt.x, b); y = mix(chy, pt.y, b);
        }
        const baseA = entry * (q.group === 'dust' ? 0.5 - 0.3 * order : 0.55);
        if (b < 1) {
          ctx.globalAlpha = baseA * (1 - b);
          ctx.fillStyle = '#6B7385';
          ctx.font = `400 ${q.size}px "Geist Mono Variable", ui-monospace, monospace`;
          ctx.fillText(q.g, x, y);
        }
        if (b > 0) {
          ctx.globalAlpha = 0.16 * b * entry;
          ctx.fillStyle = amber ? '#FFB86B' : '#7CF2C0';
          ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.95 * b * entry;
          ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Steps and evidence follow the scroll; a click can pin one until the scroll moves on.
      Object.keys(stepRefs.current).forEach((k) => stepRefs.current[k].classList.toggle('done', drawn[k] > 0.9));
      let stageKey = 'intro';
      if (drawn.brand > 0.6) stageKey = 'brand';
      if (drawn.messaging > 0.6) stageKey = 'messaging';
      if (drawn.operations > 0.6) stageKey = 'operations';
      if (drawn.people > 0.6) stageKey = 'people';
      if (stageKey !== lastStageKey) { manualKey = null; lastStageKey = stageKey; }
      renderEvidence(manualKey || stageKey);

      const hintOn = dp < 0.3 ? 1 : dp > 0.94 ? 1 : 0;
      hintRef.current.style.opacity = (entry * hintOn).toFixed(2);
      const msg = dp > 0.94 ? 'Tap any word to see its proof again' : 'Scroll to connect the dots';
      if (hintTextRef.current.textContent !== msg) hintTextRef.current.textContent = msg;
    }
    id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', layout);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <section className="dots-stage" id="dots" ref={stageRef} aria-labelledby="dots-title">
      <div className="dots-sticky grid-bg" ref={stickyRef}>
        <svg className="dlinks" ref={svgRef} aria-hidden="true">
          {SPOKE_TO.map((k, i) => (
            <path key={k} className="sp" pathLength="1" ref={(el) => (spokeRefs.current[i] = el)} />
          ))}
          {LINES.map((l) => (
            <path key={l} className="dl" pathLength="1" ref={(el) => (lineRefs.current[l] = el)} />
          ))}
        </svg>
        <canvas ref={canvasRef} aria-hidden="true" />

        <header className="dhead">
          <span className="eyebrow">How she makes sense of it</span>
          <h2 className="dots-title" id="dots-title">connecting the dots</h2>
          <p className="dots-lede">
            Her strength, she says, is <em>“seeing the whole picture”</em>: what moves what. Keep scrolling and watch it come together.
          </p>
        </header>

        {/* The evidence cards are drawn while you scroll; this is the same evidence as plain text */}
        <dl className="sr-only">
          {Object.values(EVIDENCE).map((e) => (
            <div key={e.label}>
              <dt>{e.label}</dt>
              <dd>{e.stat ? `${e.stat} ${e.caption}. ` : `${e.caption}. `}{e.fact} “{e.quote}”</dd>
            </div>
          ))}
        </dl>

        <div className="board" ref={boardRef} aria-hidden="true" />

        {NODES.map((n) => (
          <button
            key={n.key}
            type="button"
            className={n.key === 'people' ? 'node people' : 'node'}
            data-node={n.key}
            ref={(el) => (nodeRefs.current[n.key] = el)}
            tabIndex={n.key === 'people' ? -1 : 0}
          >
            {ICONS[n.key]}
            {n.label}
          </button>
        ))}

        <aside className="dpanel" aria-live="polite">
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.key} className={s.key === 'people' ? 'people' : undefined} ref={(el) => (stepRefs.current[s.key] = el)}>
                <button type="button">
                  <span className="sdot" />
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
          <div className="ev-card" ref={cardRef} />
        </aside>

        <div className="dhint" ref={hintRef}>
          <span ref={hintTextRef}>Scroll to connect the dots</span>
          <span className="hint-line" />
        </div>
      </div>
    </section>
  );
}
