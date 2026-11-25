'use client';

import { useEffect, useRef } from 'react';
import { mark } from '@/lib/journey';

// Scene 01 · Notice
// Two layers: blurry chaos underneath, sharp clarity on top.
// The clarity layer is clipped to a circle (the lens) and scaled up around it (the magnification).
// Scrolling grows the circle until clarity fills the screen.

// A chaotic phrase, and the clear version that sits exactly under it.
const PAIRS = [
  { c: 'noise', k: 'signal', x: 9, y: 15, s: 50, r: -7 },
  { c: 'mixed messages', k: 'one clear message', x: 33, y: 11, s: 24, r: 4 },
  { c: 'silos', k: 'connected teams', x: 67, y: 14, s: 44, r: 9 },
  { c: 'too many priorities', k: 'what the business truly needs', x: 84, y: 31, s: 21, r: -5 },
  { c: 'unclear brand', k: 'a brand people can feel', x: 12, y: 33, s: 30, r: 6 },
  { c: 'leaky funnel', k: 'prospect → lead → customer', x: 13, y: 53, s: 26, r: -9 },
  { c: 'misaligned teams', k: 'aligned teams', x: 86, y: 53, s: 30, r: -4 },
  { c: 'busy, not moving', k: 'steps that move things forward', x: 13, y: 73, s: 25, r: 5 },
  { c: 'the gaps', k: 'noticed', x: 33, y: 85, s: 52, r: -6 },
  { c: 'the confusion', k: 'made sense of', x: 67, y: 79, s: 34, r: 4 },
  { c: 'fragmented', k: 'simpler, purposeful, aligned', x: 86, y: 91, s: 22, r: 6 },
];

// Pure noise: under the lens these simply disappear.
const NOISE = [
  { c: '??', x: 50, y: 22, s: 64, r: 10 },
  { c: 'urgent!!', x: 24, y: 22, s: 18, r: -12, mono: true },
  { c: 'reports nobody reads', x: 58, y: 30, s: 18, r: -3 },
  { c: 'who owns this?', x: 52, y: 72, s: 20, r: 6 },
  { c: 'v7_final_FINAL', x: 88, y: 69, s: 16, r: 8, mono: true },
  { c: 'meetings about meetings', x: 24, y: 64, s: 17, r: 7 },
  { c: 'quick fixes', x: 94, y: 41, s: 19, r: -6 },
  { c: 'why isn’t this converting?', x: 60, y: 96, s: 17, r: 3 },
  { c: 'too many tools', x: 6, y: 92, s: 18, r: -4 },
  { c: 'noise', x: 93, y: 8, s: 26, r: 14 },
  { c: '?', x: 4, y: 45, s: 56, r: 0 },
  { c: 'the unspoken story', x: 40, y: 94, s: 22, r: -2 },
];

const WORDS = PAIRS.map((p) => ({ ...p, mono: false })).concat(NOISE);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t) => t * t * t;

// Font size that scales with the screen but never gets tiny or huge.
const fluid = (px) => `clamp(${Math.round(px * 0.5)}px, ${(px / 14.4).toFixed(2)}vw, ${Math.round(px * 1.1)}px)`;

export default function Hero() {
  const stageRef = useRef(null);
  const stickyRef = useRef(null);
  const wordRefs = useRef([]);
  const meterFill = useRef(null);
  const meterVal = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const sticky = stickyRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let vw = window.innerWidth;
    let vh = sticky.clientHeight || window.innerHeight;
    const onResize = () => {
      vw = window.innerWidth;
      vh = sticky.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Where the lens wants to go.
    let tx = vw / 2, ty = vh / 2, mx = tx, my = ty;
    let hasPointer = false, lastMove = 0, travelled = 0, lastX = null, lastY = null;

    const moveTo = (x, y) => {
      tx = x; ty = y; hasPointer = true; lastMove = performance.now();
      // Counts as "looked closer" once the lens has really been moved around the hero.
      if (stage.getBoundingClientRect().bottom > 0) {
        if (lastX !== null) travelled += Math.hypot(x - lastX, y - lastY);
        lastX = x; lastY = y;
        if (travelled > 400) mark('lens');
      }
    };
    const onPointer = (e) => { if (e.pointerType !== 'touch') moveTo(e.clientX, e.clientY); };
    const onTouch = (e) => { if (e.touches && e.touches[0]) moveTo(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    const nodes = WORDS.map((w, i) => ({
      el: wordRefs.current[i], x: w.x, y: w.y, r: w.r,
      ph: i * 1.7, f: 0.0011 + (i % 5) * 0.00023, d: 0.4 + (i % 4) * 0.3,
    }));

    let ps = 0, id;
    const frame = (t) => {
      // Drift slowly until someone moves the lens (and on touch screens, when left alone).
      const idle = !hasPointer || (coarse && t - lastMove > 2500);
      if (idle && !reduce) {
        tx = vw * (0.5 + 0.27 * Math.sin(t * 0.00033));
        ty = vh * (0.48 + 0.2 * Math.sin(t * 0.00051 + 1.2));
      }
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;

      // 0 = chaos, 1 = clarity, from how far you've scrolled through the pinned stage.
      const rect = stage.getBoundingClientRect();
      const total = stage.offsetHeight - vh;
      const p = clamp(-rect.top / (total || 1), 0, 1);
      ps += (p - ps) * 0.2;

      const c = easeInOut(clamp(ps / 0.6, 0, 1));
      const x = mx + (vw / 2 - mx) * c;
      const y = my + (vh / 2 - my) * c;
      const r0 = clamp(Math.min(vw, vh) * 0.17, 92, 155);
      const r = r0 + (Math.hypot(vw, vh) - r0) * easeIn(clamp(ps / 0.92, 0, 1));
      const m = 1.75 - 0.75 * smooth(0.2, 0.95, ps);

      const st = sticky.style;
      st.setProperty('--x', `${x.toFixed(1)}px`);
      st.setProperty('--y', `${y.toFixed(1)}px`);
      st.setProperty('--r', `${r.toFixed(1)}px`);
      st.setProperty('--m', m.toFixed(3));
      st.setProperty('--rim', (1 - smooth(0.55, 0.82, ps)).toFixed(3));
      st.setProperty('--handle', (1 - smooth(0.08, 0.32, ps)).toFixed(3));
      st.setProperty('--hint', (1 - smooth(0, 0.08, ps)).toFixed(3));
      st.setProperty('--end', smooth(0.86, 0.99, ps).toFixed(3));
      st.setProperty('--chaos', (1 - smooth(0.3, 0.8, ps)).toFixed(3));
      st.cursor = ps < 0.25 && !coarse ? 'none' : 'auto';

      // Chaos jitters, leans away from the lens, then scatters outward as clarity grows.
      const scatter = smooth(0.25, 0.9, ps);
      const px = (mx - vw / 2) / vw, py = (my - vh / 2) / vh;
      for (const n of nodes) {
        if (!n.el) continue;
        const jx = reduce ? 0 : Math.sin(t * n.f + n.ph) * 3.2;
        const jy = reduce ? 0 : Math.cos(t * n.f * 1.3 + n.ph) * 2.6;
        const wob = reduce ? 0 : Math.sin(t * n.f * 0.8 + n.ph) * 1.4;
        const dx = ((n.x - 50) / 100) * vw * 0.75 * scatter - px * 18 * n.d + jx;
        const dy = ((n.y - 50) / 100) * vh * 0.75 * scatter - py * 14 * n.d + jy;
        n.el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(n.r + wob).toFixed(2)}deg)`;
      }

      const pct = Math.round(ps * 100);
      if (meterFill.current) meterFill.current.style.width = `${pct}%`;
      if (meterVal.current) meterVal.current.textContent = `${pct}%`;

      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <section className="hero-stage" ref={stageRef} id="notice" aria-labelledby="hero-title">
      <div className="hero-sticky" ref={stickyRef}>
        <h1 id="hero-title" className="sr-only">
          I notice what others don’t. The gaps, the confusion, the unspoken story, and I help make sense of it. Soniaa S., Fractional CMO.
        </h1>

        <div className="chaos" aria-hidden="true">
          {WORDS.map((w, i) => (
            <span
              key={i}
              ref={(el) => (wordRefs.current[i] = el)}
              className={w.mono ? 'cw mono' : 'cw'}
              style={{
                left: `${w.x}%`,
                top: `${w.y}%`,
                fontSize: fluid(w.s),
                opacity: 0.35 + ((i * 37) % 30) / 100,
                filter: `blur(${(1 + (i % 3) * 0.6).toFixed(1)}px)`,
              }}
            >
              {w.c}
            </span>
          ))}
        </div>

        <div className="clarity" aria-hidden="true">
          <div className="clarity-inner">
            {PAIRS.map((p) => (
              <span
                key={p.k}
                className="kw"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  fontSize: `clamp(11px, ${((8 + p.s * 0.22) / 14.4).toFixed(2)}vw, 18px)`,
                }}
              >
                {p.k}
              </span>
            ))}
            <div className="hero-center">
              <span className="eyebrow">Soniaa S. · in her own words</span>
              <p className="hero-quote">
                I notice
                <br />
                what others don’t.
              </p>
              <p className="hero-sub">The gaps, the confusion, the unspoken story, and I help make sense of it.</p>
              <div className="hero-sig">
                <span className="hero-sig-name">Soniaa S.</span>
                <span className="hero-sig-role">Fractional CMO · Crafting brands people can feel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lens" aria-hidden="true">
          <div className="lens-handle">
            <span className="lens-collar" />
            <span className="lens-grip" />
          </div>
          <div className="lens-glass" />
        </div>

        <div className="hero-ui" aria-hidden="true">
          <div className="hero-top">
            <span className="hero-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5L21 21" />
              </svg>
              Soniaa S.
            </span>
            <span>Fractional CMO</span>
          </div>
          <div className="hero-bottom">
            <span className="meter">
              Chaos
              <span className="meter-track">
                <span className="meter-fill" ref={meterFill} />
              </span>
              Clarity <span className="meter-val" ref={meterVal}>0%</span>
            </span>
            <span className="hero-hint">
              <span>Move to look closer · Scroll to make sense of it</span>
              <span className="hint-line" />
            </span>
            <span className="meter meter-ghost">Chaos <span className="meter-track" /> Clarity 000%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
