'use client';

import { useEffect, useRef, useState } from 'react';
import { you } from '@/lib/journey';
import { pulseBridge } from '@/lib/pulseBridge';

// Scene 05 · Pulse
// Pinned. As you scroll, the camera pans from the far left to the far right while the funnel is drawn gate by gate,
// like a marquee. Then it pulls back to show the whole funnel and visitors start flowing through it.
// Numbers are always real (/api/pulse). While there are only a few visits, the drawing keeps a typical funnel
// shape and says "early days"; a clearly labelled switch shows it with sample numbers.

const STAGES = [
  { key: 'arrived', name: 'Arrived', short: 'Arrived', desc: 'opened the page' },
  { key: 'lens', name: 'Looked closer', short: 'Looked', desc: 'used the lens' },
  { key: 'dots', name: 'Connected the dots', short: 'Connected', desc: 'watched a link form' },
  { key: 'shared', name: 'Shared their chaos', short: 'Shared', desc: 'made a clarity card' },
  { key: 'reached', name: 'Reached out', short: 'Reached', desc: 'sent a card or opened LinkedIn' },
];
const GX = [0.05, 0.28, 0.5, 0.72, 0.93]; // gate positions across the funnel
const SHAPE = [100, 80, 55, 18, 6]; // typical funnel shape, used for the drawing only
const SAMPLE = { n: [248, 196, 131, 37, 12], topPair: 'People → Everything', topArea: 'Messaging' };
const EARLY = 20; // below this many visitors, real numbers are too few to shape the drawing
const MARQUEE = 'ARRIVED  →  LOOKED CLOSER  →  CONNECTED THE DOTS  →  SHARED THEIR CHAOS  →  REACHED OUT  →  ';
const MONO = '"Geist Mono Variable", ui-monospace, monospace';
const SANS = '"Geist Variable", system-ui, sans-serif';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a, b, t) => a + (b - a) * t;

export default function Pulse() {
  const [data, setData] = useState({ state: 'loading', n: null, topPair: null, topArea: null });
  const [sample, setSample] = useState(false);
  const stageRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef({});
  const hintRef = useRef(null);
  const hintTextRef = useRef(null);
  const youRef = useRef(null);
  const shownRef = useRef(null); // numbers to print, or null for "—"
  const shapeRef = useRef(SHAPE); // numbers that shape the drawing
  const recountRef = useRef(0); // bumps when the printed numbers change, so they count up again

  // Live totals, refreshed every 30 seconds.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/pulse', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error('unavailable');
        if (!cancelled) setData({ state: 'live', n: json.stages.map((s) => s.n), topPair: json.topPair, topArea: json.topArea });
      } catch {
        if (!cancelled) setData((d) => (d.state === 'live' ? d : { state: 'resting', n: null, topPair: null, topArea: null }));
      }
    }
    load();
    const timer = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const early = data.state === 'live' && data.n[0] < EARLY;
  const shown = sample ? SAMPLE.n : data.state === 'live' ? data.n : null;
  const shownKey = shown ? shown.join(',') : '';
  useEffect(() => {
    shownRef.current = shown;
    shapeRef.current = sample ? SAMPLE.n : data.state === 'live' && !early ? data.n.map((v) => Math.max(v, 0.5)) : SHAPE;
    recountRef.current += 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey, sample, early]);

  // The scene itself
  useEffect(() => {
    const stageEl = stageRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const tip = tipRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let SW = 1, SH = 1, narrow = false, marqueeW = 0;
    const cam = { c: 0, z: 1, zy: 1, cy: 0, zo: 0 };
    function layout() {
      SW = sticky.clientWidth; SH = sticky.clientHeight;
      narrow = SW < 760;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(SW * dpr); canvas.height = Math.round(SH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${narrow ? 24 : 44}px ${MONO}`;
      marqueeW = ctx.measureText(MARQUEE).width;
    }
    layout();
    window.addEventListener('resize', layout);

    let gh = [];
    const gx = (i) => GX[i] * SW;
    const halfAt = (x) => {
      if (x <= gx(0)) return gh[0];
      for (let i = 0; i < GX.length - 1; i++) {
        if (x <= gx(i + 1)) { let t = (x - gx(i)) / (gx(i + 1) - gx(i)); t = t * t * (3 - 2 * t); return mix(gh[i], gh[i + 1], t); }
      }
      return gh[gh.length - 1];
    };
    const sx = (x) => (x - cam.c) * cam.z + SW / 2;
    const sy = (off) => cam.cy + off * cam.zy;
    const youStage = () => { let idx = 0; STAGES.forEach((s, i) => { if (you[s.key]) idx = i; }); return idx; };

    // Scene 04 flies a sent card in here.
    let burstT = 0;
    pulseBridge.section = stageEl;
    pulseBridge.scrollTarget = () => window.scrollY + stageEl.getBoundingClientRect().top + 0.95 * (stageEl.offsetHeight - window.innerHeight);
    pulseBridge.target = () => {
      const r = canvas.getBoundingClientRect();
      return { x: r.left + sx(gx(4) + 22), y: r.top + sy(0) };
    };
    pulseBridge.burst = () => { burstT = performance.now(); };

    // Hover (or tap) a stage once the funnel is built.
    let hover = -1;
    const stageAt = (clientX, clientY) => {
      if (cam.zo < 0.95 || !gh.length) return -1;
      const r = canvas.getBoundingClientRect();
      const wx = (clientX - r.left - SW / 2) / cam.z + cam.c;
      if (Math.abs(clientY - r.top - cam.cy) > halfAt(wx) * cam.zy + 60) return -1;
      let idx = -1;
      for (let i = 0; i < GX.length; i++) if (wx >= gx(i) - 6) idx = i;
      return idx;
    };
    const onMove = (e) => { if (e.pointerType !== 'touch') hover = stageAt(e.clientX, e.clientY); };
    const onLeave = () => { hover = -1; };
    const onDown = (e) => { if (e.pointerType === 'touch') { const s = stageAt(e.clientX, e.clientY); hover = s === hover ? -1 : s; } };
    sticky.addEventListener('pointermove', onMove);
    sticky.addEventListener('pointerleave', onLeave);
    sticky.addEventListener('pointerdown', onDown);

    const revealT = [0, 0, 0, 0, 0];
    let seenRecount = recountRef.current;
    let flow = [], youX = null, last = 0, pp = 0, id;

    function frame(t) {
      id = requestAnimationFrame(frame);
      const dt = Math.min(50, t - (last || t)); last = t;
      const n = shapeRef.current;
      const shownN = shownRef.current;
      const hmax = SH * (narrow ? 0.13 : 0.16);
      gh = n.map((v) => Math.max(4, hmax * Math.sqrt(v / n[0])));
      if (recountRef.current !== seenRecount) {
        seenRecount = recountRef.current;
        revealT.forEach((v, i) => { if (v) revealT[i] = t; }); // count the new numbers up again
      }

      // Camera, worked out even off screen so a flying card always knows where to land.
      const rect = stageEl.getBoundingClientRect();
      const total = stageEl.offsetHeight - SH;
      const p = clamp(-rect.top / (total || 1), 0, 1);
      pp += (p - pp) * 0.2;
      const ZP = narrow ? 3.2 : 2.4;
      const pan = smooth(0.06, 0.68, pp);
      const zo = reduce ? 1 : easeInOut(smooth(0.7, 0.84, pp));
      const cPan = mix(SW / (2 * ZP), SW - SW / (2 * ZP), pan);
      cam.z = mix(ZP, 1, zo);
      cam.c = mix(cPan, SW / 2, zo);
      cam.zy = mix(Math.min(ZP, 1.3), 1, zo);
      cam.cy = SH * (narrow ? 0.64 : 0.66);
      cam.zo = zo;
      // While the camera pans, the lede steps back so the big labels never run into it.
      sticky.classList.toggle('panning', pp > 0.06 && zo < 0.95);
      const head = reduce ? SW : clamp(mix((cPan + (SW * 0.2) / ZP) * smooth(0, 0.06, pp), SW, zo), 0, SW);

      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      const tt = reduce ? 0 : t;
      const formed = zo > 0.95;
      const ys = youStage();
      if (youRef.current && youRef.current.textContent !== STAGES[ys].name) youRef.current.textContent = STAGES[ys].name;

      ctx.clearRect(0, 0, SW, SH);

      // The marquee behind it all: stage names moving with the camera, drifting once built.
      const off = -(cam.c * cam.z * 0.35) - tt * 0.03;
      ctx.font = `500 ${narrow ? 24 : 44}px ${MONO}`;
      ctx.fillStyle = 'rgba(42,50,72,0.32)';
      ctx.textBaseline = 'middle';
      for (let x = (((off % marqueeW) + marqueeW) % marqueeW) - marqueeW; x < SW; x += marqueeW) ctx.fillText(MARQUEE, x, cam.cy);
      ctx.textBaseline = 'alphabetic';

      // Funnel body, drawn up to the moving head.
      const step = 6 / cam.z;
      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= head; x += step) {
        const yv = sy(-halfAt(x));
        if (!started) { ctx.moveTo(sx(x), yv); started = true; } else ctx.lineTo(sx(x), yv);
      }
      ctx.lineTo(sx(head), sy(-halfAt(head)));
      ctx.lineTo(sx(head), sy(halfAt(head)));
      for (let x = head; x >= 0; x -= step) ctx.lineTo(sx(x), sy(halfAt(x)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(124,242,192,0.05)'; ctx.fill();
      ctx.strokeStyle = 'rgba(124,242,192,0.28)'; ctx.lineWidth = 1; ctx.stroke();

      if (formed && hover >= 0) {
        const a0 = gx(hover), a1 = hover < 4 ? gx(hover + 1) : SW;
        ctx.beginPath();
        for (let x = a0; x <= a1; x += 4) ctx.lineTo(sx(x), sy(-halfAt(x)));
        for (let x = a1; x >= a0; x -= 4) ctx.lineTo(sx(x), sy(halfAt(x)));
        ctx.closePath();
        ctx.fillStyle = hover === 4 ? 'rgba(255,184,107,0.10)' : 'rgba(124,242,192,0.09)';
        ctx.fill();
      }

      // The drawing head: a glowing scan line while it builds.
      if (head < SW - 1 && head > 0) {
        const hx = sx(head), hh = halfAt(head) * cam.zy;
        const grad = ctx.createLinearGradient(hx - 60, 0, hx, 0);
        grad.addColorStop(0, 'rgba(124,242,192,0)'); grad.addColorStop(1, 'rgba(124,242,192,0.22)');
        ctx.fillStyle = grad;
        ctx.fillRect(hx - 60, cam.cy - hh, 60, hh * 2);
        ctx.strokeStyle = '#7CF2C0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(hx, cam.cy - hh - 10); ctx.lineTo(hx, cam.cy + hh + 10); ctx.stroke();
        ctx.fillStyle = 'rgba(124,242,192,0.2)'; ctx.beginPath(); ctx.arc(hx, cam.cy, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7CF2C0'; ctx.beginPath(); ctx.arc(hx, cam.cy, 3, 0, Math.PI * 2); ctx.fill();
      }

      // Gates: each appears as the head passes it, its number counting up.
      const ls = Math.min(cam.z, narrow ? 2.2 : 1.7);
      for (let i = 0; i < STAGES.length; i++) {
        const g = gx(i);
        if (head < g) continue;
        if (!revealT[i]) revealT[i] = t;
        const gxs = sx(g);
        if (gxs < -200 || gxs > SW + 200) continue;
        const hgt = gh[i] * cam.zy;
        const on = formed && hover === i;
        ctx.setLineDash(on ? [] : [3, 6]);
        ctx.strokeStyle = on ? (i === 4 ? '#FFB86B' : '#7CF2C0') : '#3A4560';
        ctx.lineWidth = on ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(gxs, cam.cy - hgt - 16); ctx.lineTo(gxs, cam.cy + hgt + 16); ctx.stroke();
        ctx.setLineDash([]);
        const k = reduce ? 1 : easeOut(clamp((t - revealT[i]) / 900, 0, 1));
        const num = shownN ? Math.round(shownN[i] * k).toLocaleString('en-US') : '—';
        const nameSize = (narrow ? 10 : 14) * ls, numSize = (narrow ? 16 : 30) * ls;
        const top = cam.cy - hgt - 22;
        ctx.globalAlpha = Math.max(k, 0.001);
        ctx.fillStyle = i === 4 ? '#FFB86B' : '#F2EDE4';
        ctx.font = `400 ${numSize.toFixed(1)}px ${MONO}`;
        ctx.fillText(num, gxs + 8, top - nameSize - 8);
        ctx.fillStyle = on ? '#F2EDE4' : '#C9CED8';
        ctx.font = `500 ${nameSize.toFixed(1)}px ${SANS}`;
        ctx.fillText(narrow && cam.z < 1.5 ? STAGES[i].short : STAGES[i].name, gxs + 8, top);
        if (i > 0 && shownN && shownN[i - 1] > 0) {
          ctx.fillStyle = '#7CF2C0';
          ctx.font = `400 ${((narrow ? 9 : 11) * ls).toFixed(1)}px ${MONO}`;
          ctx.fillText(`${Math.round((shownN[i] / shownN[i - 1]) * 100)}%`, gxs + 8, cam.cy + hgt + 22 + 10 * ls);
        }
        ctx.globalAlpha = 1;
      }

      // Visitors flow through once it's built; at each gate some continue and some drift away.
      const rate = reduce ? 0 : smooth(0.8, 0.9, pp) * 0.42;
      if (Math.random() < rate && flow.length < 260) {
        flow.push({ x: -4, yr: (Math.random() * 2 - 1) * 0.85, v: 0.07 + Math.random() * 0.06, s: 0, drop: false, dy: 0, vy: 0, a: 1 });
      }
      for (let q = flow.length - 1; q >= 0; q--) {
        const d = flow[q];
        const nx = d.x + d.v * dt;
        if (!d.drop && d.s < STAGES.length - 1 && nx >= gx(d.s + 1)) {
          if (Math.random() < n[d.s + 1] / n[d.s]) d.s++;
          else { d.drop = true; d.vy = 0.01; }
        }
        d.x = nx;
        if (d.drop) { d.vy += 0.00025 * dt; d.dy += d.vy * dt; d.a -= 0.0012 * dt; d.v *= 0.985; }
        if (d.x > SW + 6 || d.a <= 0) { flow.splice(q, 1); continue; }
        const x = sx(d.x), y = sy(d.yr * halfAt(d.x) * 0.9) + d.dy;
        const col = d.s >= STAGES.length - 1 ? '255,184,107' : '124,242,192';
        const lit = formed && hover === d.s && !d.drop;
        ctx.fillStyle = `rgba(${col},${((lit ? 0.3 : 0.16) * d.a).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, lit ? 5 : 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${d.drop ? '107,115,133' : col},${(0.95 * d.a).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, lit ? 2.2 : 1.5, 0, Math.PI * 2); ctx.fill();
      }

      // You
      const ya = reduce ? 1 : smooth(0.84, 0.92, pp);
      if (ya > 0 || burstT) {
        const target = gx(ys) + 22;
        youX = youX === null ? target : youX + (target - youX) * 0.06;
        const yx = sx(youX), yy = sy(0);
        const pr = reduce ? 0 : (Math.sin(t * 0.004) + 1) / 2;
        const fin = ys === STAGES.length - 1;
        ctx.globalAlpha = Math.max(ya, burstT ? 1 : 0);
        ctx.strokeStyle = fin ? 'rgba(255,184,107,0.5)' : 'rgba(124,242,192,0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(yx, yy, 9 + pr * 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = fin ? '#FFB86B' : '#F2EDE4';
        ctx.beginPath(); ctx.arc(yx, yy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.font = `500 11px ${MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText('YOU', yx, yy - 22);
        ctx.textAlign = 'start';
        ctx.globalAlpha = 1;
        if (burstT && t - burstT < 1400) {
          const bk = (t - burstT) / 1400;
          ctx.strokeStyle = `rgba(255,184,107,${(1 - bk).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(yx, yy, 8 + bk * 70, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // Tooltip for the hovered stage
      if (formed && hover >= 0) {
        const s0 = STAGES[hover];
        tip.name.textContent = s0.name;
        tip.n.textContent = shownN ? `${shownN[hover].toLocaleString('en-US')} ${shownN[hover] === 1 ? 'visitor' : 'visitors'}` : 'Numbers are resting';
        tip.rate.textContent = hover === 0 ? 'Everyone starts here'
          : shownN && shownN[hover - 1] > 0 ? `${Math.round((shownN[hover] / shownN[hover - 1]) * 100)}% of the stage before` : '';
        tip.desc.textContent = `They ${s0.desc}.`;
        const tipX = narrow ? clamp(sx(gx(hover)) + 30, 100, SW - 100) : sx(gx(hover));
        tip.box.style.left = `${tipX.toFixed(0)}px`;
        tip.box.style.top = `${(cam.cy - gh[hover] * cam.zy - 70).toFixed(0)}px`;
        tip.box.hidden = false;
      } else if (!tip.box.hidden) {
        tip.box.hidden = true;
      }
      sticky.style.cursor = formed && hover >= 0 ? 'pointer' : '';

      const msg = pp > 0.9 ? (coarse ? 'Tap a stage to look closer' : 'Hover a stage to look closer') : 'Scroll to build the funnel';
      if (hintTextRef.current.textContent !== msg) hintTextRef.current.textContent = msg;
      hintRef.current.style.opacity = pp < 0.06 || pp > 0.9 ? 1 : 0;
    }
    id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', layout);
      sticky.removeEventListener('pointermove', onMove);
      sticky.removeEventListener('pointerleave', onLeave);
      sticky.removeEventListener('pointerdown', onDown);
      pulseBridge.section = null;
      pulseBridge.scrollTarget = null;
      pulseBridge.target = () => null;
      pulseBridge.burst = () => {};
    };
  }, []);

  const flag = sample
    ? 'Sample numbers, for illustration'
    : data.state === 'loading' ? 'Loading live numbers…'
      : data.state === 'resting' ? 'Pulse is resting · numbers will be back shortly'
        : null;
  const topPair = sample ? SAMPLE.topPair : data.topPair;
  const topArea = sample ? SAMPLE.topArea : data.topArea;

  return (
    <>
      <section className="pulse-stage" id="pulse" ref={stageRef} aria-labelledby="pulse-title">
        <div className="pulse-sticky grid-bg" ref={stickyRef}>
          <header className="phead">
            <div className="pulse-flags">
              <span className="eyebrow">How she measures</span>
              {!sample && data.state === 'live' && <span className="live"><span className="live-dot" />Live</span>}
              {flag && <span className="sample-flag">{flag}</span>}
            </div>
            <h2 className="pulse-title" id="pulse-title">This page, measured the way she measures campaigns.</h2>
            <p className="pulse-lede">
              She builds funnels that move people <em>from prospect to lead to customer</em>. Scroll, and watch this page’s own funnel take shape. The bright dot is you.
            </p>
            <div className="pulse-flags">
              {!sample && early && (
                <span className="pulse-count">Early days · <b>{data.n[0].toLocaleString('en-US')}</b> {data.n[0] === 1 ? 'visitor' : 'visitors'} so far</span>
              )}
              {data.state !== 'loading' && (
                <button type="button" className="pulse-mode" aria-pressed={sample} onClick={() => setSample((s) => !s)}>
                  {sample ? 'Back to live numbers' : 'See it with sample numbers'}
                </button>
              )}
            </div>
          </header>
          <canvas className="pcanvas" ref={canvasRef} aria-hidden="true" />
          <ul className="sr-only">
            {STAGES.map((s, i) => (
              <li key={s.key}>{s.name}: {shown ? shown[i] : 'not available'}</li>
            ))}
          </ul>
          <div className="ptip" ref={(el) => (tipRef.current.box = el)} hidden>
            <span className="ptip-name" ref={(el) => (tipRef.current.name = el)} />
            <span className="ptip-n" ref={(el) => (tipRef.current.n = el)} />
            <span className="ptip-rate" ref={(el) => (tipRef.current.rate = el)} />
            <span className="ptip-desc" ref={(el) => (tipRef.current.desc = el)} />
          </div>
          <div className="phint" ref={hintRef}>
            <span ref={hintTextRef}>Scroll to build the funnel</span>
            <span className="hint-line" />
          </div>
        </div>
      </section>

      <section className="pulse-after" aria-label="Funnel highlights">
        <div className="pulse-inner">
          <div className="tiles">
            <div className="tile"><span className="k">You reached</span><span className="v mint" ref={youRef}>Arrived</span></div>
            <div className="tile"><span className="k">Most explored connection</span><span className="v amber">{topPair || 'Not enough visits yet'}</span></div>
            <div className="tile"><span className="k">Most common chaos</span><span className="v">{topArea || 'Not enough visits yet'}</span></div>
          </div>
          <p className="privacy">Anonymous. No cookies. A name or email is only kept if you choose to send your card.</p>
        </div>
      </section>
    </>
  );
}
