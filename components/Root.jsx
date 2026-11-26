'use client';

import { useEffect, useRef } from 'react';

// Scene 03 · From the root
// Education grows down as roots; every role grows up as trunk, branches and canopy, in the order it happened.
// Coordinates are in a 1000 × 1000 drawing; "win" is when each part grows, as progress through the pinned scene.

const CHAPTER = { root: 'Roots · education', twig: 'Trunk · foundation', branch: 'Branches · growth', canopy: 'Canopy · today' };
const BASE_W = { trunk: 9, root: 5, twig: 3.2, branch: 4, canopy: 3 };
const TREE = [
  { id: 'school', kind: 'root', d: 'M500 640 C 470 680, 400 700, 330 735', win: [0.03, 0.1], node: [330, 735], side: 'l', year: 1999,
    title: 'School', meta: '1999–2002', story: 'Debates, dance, and national volleyball team participation.' },
  { id: 'be', kind: 'root', d: 'M500 640 C 520 690, 600 720, 680 760', win: [0.08, 0.16], node: [680, 760], side: 'r', year: 2002,
    title: 'B.E. Electronics & Telecom', meta: '2002–2006 · Maharshi Dayanand University', story: 'An engineer first. She was also on the fest organising team and ran the monthly newspaper.' },
  { id: 'trunk1', kind: 'trunk', d: 'M500 640 C 497 590, 503 500, 500 430', win: [0.16, 0.42], linear: true },
  { id: 'bosch', kind: 'twig', d: 'M499 605 C 470 604, 440 604, 400 600', win: [0.19, 0.25], node: [400, 600], side: 'l', year: 2006,
    title: 'Bosch', meta: '2006–2008 · India & Hong Kong', story: 'Marketing Management Trainee, then Marketing Specialist. Product launches from idea to implementation.', sparks: ['Best Presenter Award · 2007'] },
  { id: 'iim', kind: 'root', d: 'M500 640 C 490 705, 452 765, 405 812', win: [0.23, 0.3], node: [405, 812], side: 'l', year: 2007,
    title: 'Executive MBA, Marketing', meta: '2007–2008 · IIM Bangalore', story: 'Marketing strategy, including a strategy project with Carnegie Mellon University.' },
  { id: 'symbiosis', kind: 'root', d: 'M500 640 C 515 730, 560 810, 610 880', win: [0.26, 0.33], node: [610, 880], side: 'r', year: 2007,
    title: 'PGDBM, Marketing & Sales', meta: '2007–2009 · Symbiosis', story: 'Marketing and sales management, plus personal development programmes.' },
  { id: 'faro', kind: 'twig', d: 'M501 562 C 540 558, 580 550, 610 545', win: [0.3, 0.36], node: [610, 545], side: 'r', year: 2008,
    title: 'FARO Technologies', meta: '2008–2010 · India, then Asia', story: 'Marketing & Communication Manager. Turned prospect, customer and market data into actionable decisions.', sparks: ['Best Employer · 2008'] },
  { id: 'creaform', kind: 'twig', d: 'M500 497 C 465 494, 425 487, 390 480', win: [0.35, 0.41], node: [390, 480], side: 'l', year: 2010,
    title: 'Creaform', meta: '2010–2013 · Head of Marketing and Sales', story: 'Lead nurturing that turned existing prospects into sales-qualified leads.', sparks: ['Marketing Leadership · 2011', 'Sales Operations Professional of the Year · 2012'] },
  { id: 'trunk2', kind: 'trunk', d: 'M500 430 C 498 370, 502 290, 500 230', win: [0.41, 0.64], linear: true },
  { id: 'tadkaa', kind: 'branch', d: 'M500 430 C 450 425, 360 415, 300 400', win: [0.42, 0.47], node: [300, 400], side: 'l', year: 2013,
    title: 'Brand Tadkaa', meta: '2013 · Founder & CEO', story: 'Started her own company, then advised it for years, helping build pipeline and revenue.' },
  { id: 'showmeleads', kind: 'branch', d: 'M500 428 C 560 426, 640 420, 690 410', win: [0.44, 0.49], node: [690, 410], side: 'r', year: 2013,
    title: 'ShowMeLeads', meta: '2013–2014 · San Francisco Bay Area', story: '1,200 new opportunities and 100 closed deals through demand generation and lead management.' },
  { id: 'appirio', kind: 'branch', d: 'M501 395 C 560 375, 640 345, 700 330', win: [0.48, 0.53], node: [700, 330], side: 'r', year: 2014,
    title: 'Appirio', meta: '2014–2015 · Director', story: 'Promoted to Director within 6 months. Built the 15-person Jaipur Marketing Center from zero.', sparks: ['#13 · Top Demand Generation Experts · 2014'] },
  { id: 'lasersec1', kind: 'branch', d: 'M499 372 C 450 357, 380 333, 330 320', win: [0.51, 0.56], node: [330, 320], side: 'l', year: 2016,
    title: 'Lasersec Technologies', meta: '2016–2018 · VP Global Sales Marketing', story: 'Owned demand generation for the fast-growing packaging industry, leading 20+ marketers.' },
  { id: 'specialist', kind: 'branch', d: 'M500 330 C 470 312, 440 286, 420 270', win: [0.54, 0.59], node: [420, 270], side: 'l', year: 2016,
    title: 'Sonia Specialist', meta: '2016 → now · Free consultancy', story: 'Helping startups and organisations become “Modern Marketers”, free of charge.' },
  { id: 'roundglass', kind: 'branch', d: 'M500 312 C 545 302, 600 282, 640 265', win: [0.56, 0.61], node: [640, 265], side: 'r', year: 2018,
    title: 'RoundGlass', meta: '2018–2020 · Digital Marketing Director', story: 'Marketing with a focus on clarity, purpose, and measurable outcomes.' },
  { id: 'ismokestack', kind: 'canopy', d: 'M500 230 C 500 160, 500 100, 500 40', win: [0.64, 0.69], node: [500, 40], side: 'r', year: 2020,
    title: 'i-SmokeStack', meta: '2020 → now · Chief Marketing Officer', story: 'Helping early-stage startups turn fragmented teams into aligned, confident growth engines.' },
  { id: 'datt', kind: 'canopy', d: 'M500 230 C 450 225, 390 215, 350 205', win: [0.66, 0.71], node: [350, 205], side: 'l', year: 2020,
    title: 'Datt Mediproducts', meta: '2020 → now · Fractional CMO', story: 'Clear growth direction, faster execution and better decisions across teams.' },
  { id: 'lasersec2', kind: 'canopy', d: 'M500 230 C 550 225, 610 215, 650 205', win: [0.69, 0.74], node: [650, 205], side: 'r', year: 2021,
    title: 'Lasersec Technologies', meta: '2021 → now · VP Product Marketing', story: 'Simplifying complex strategies into plans that teams across global markets can act on.' },
  { id: 'ayuinc', kind: 'canopy', d: 'M500 230 C 440 200, 350 160, 300 135', win: [0.72, 0.77], node: [300, 135], side: 'l', year: 2023,
    title: 'AYU Inc USA', meta: '2023 → now · Boston', story: 'Chief Marketing & Operations Advisor, building structures and processes from the ground up.' },
  { id: 'ayulife', kind: 'canopy', d: 'M500 230 C 560 200, 650 160, 700 135', win: [0.75, 0.8], node: [700, 135], side: 'r', year: 2025,
    title: 'AYU Lifescience', meta: '2025 → now · Dubai', story: 'Building a clean, TGA-aligned brand experience for UAE’s medical buyers.' },
  { id: 'celestial', kind: 'canopy', d: 'M500 230 C 470 160, 430 100, 400 70', win: [0.78, 0.83], node: [400, 70], side: 'l', year: 2025,
    title: 'Celestial AI', meta: '2025 → now · Noida', story: 'Marketing and operations strategy for a new startup, with a structured, human-first approach.' },
];
const ROOTLETS = [
  'M500 640 C 480 700, 470 760, 455 800', 'M500 640 C 530 670, 560 690, 590 700', 'M420 716 C 400 740, 380 770, 360 800',
  'M600 735 C 630 770, 650 800, 660 830', 'M462 780 C 450 805, 440 830, 432 855', 'M560 690 C 580 710, 600 715, 630 720',
];
const FINALE_AT = 0.88;
const CB = { x: 120, y: 15, w: 760, h: 900 }; // the part of the drawing to fit on screen
const SVGNS = 'http://www.w3.org/2000/svg';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a, b, t) => a + (b - a) * t;

export default function Root() {
  const stageRef = useRef(null);
  const stickyRef = useRef(null);
  const areaRef = useRef(null);
  const treeRef = useRef(null);
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const rootletsRef = useRef(null);
  const baseRef = useRef(null);
  const coreRef = useRef(null);
  const msRef = useRef(null);
  const seedRef = useRef(null);
  const upRef = useRef(null);
  const downRef = useRef(null);
  const cardRef = useRef(null);
  const yearRef = useRef(null);
  const capRef = useRef(null);
  const hintRef = useRef(null);
  const hintTextRef = useRef(null);

  useEffect(() => {
    const rStage = stageRef.current;
    const rSticky = stickyRef.current;
    const treeArea = areaRef.current;
    const treeEl = treeRef.current;
    const treeSvg = svgRef.current;
    const tCanvas = canvasRef.current;
    const tctx = tCanvas.getContext('2d');
    const msLayer = msRef.current;
    const rcard = cardRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let vw = window.innerWidth, vh = window.innerHeight;
    let mx = -9999, my = -9999, hasPointer = false;
    const onPointer = (e) => { if (e.pointerType !== 'touch') { mx = e.clientX; my = e.clientY; hasPointer = true; } };
    window.addEventListener('pointermove', onPointer);

    // Build the drawing (cleared first, so a re-run never doubles it).
    [rootletsRef.current, baseRef.current, coreRef.current].forEach((g) => { while (g.firstChild) g.removeChild(g.firstChild); });
    msLayer.innerHTML = '';
    const mk = (tag, attrs, parent) => {
      const el = document.createElementNS(SVGNS, tag);
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
      parent.appendChild(el);
      return el;
    };
    const rootletEls = ROOTLETS.map((d) => mk('path', { d, class: 'rootlet', pathLength: '1' }, rootletsRef.current));

    let rManual = null;
    const items = TREE.map((src) => {
      const it = { ...src };
      const cls = it.kind === 'root' ? ' root' : '';
      it.base = mk('path', { d: it.d, class: 'br-base' + cls, pathLength: '1', 'stroke-width': BASE_W[it.kind] }, baseRef.current);
      it.core = mk('path', { d: it.d, class: 'br-core' + cls, pathLength: '1' }, coreRef.current);
      it.len = it.core.getTotalLength();
      it.g = 0;
      it.sap = (it.node ? [0, 0.33, 0.66] : [0, 0.5]).map((u, i) => ({ u0: u, sp: 0.00009 + i * 0.00002 }));
      if (!it.node) return it;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ms' + cls;
      b.dataset.side = it.side;
      b.setAttribute('aria-label', `${it.title}, ${it.meta}`);
      const dot = document.createElement('span'); dot.className = 'ms-dot'; b.appendChild(dot);
      const label = document.createElement('span'); label.className = 'ms-label';
      const bt = document.createElement('b'); bt.textContent = it.title;
      const it2 = document.createElement('i'); it2.textContent = it.meta.split(' · ')[0];
      label.appendChild(bt); label.appendChild(it2); b.appendChild(label);
      (it.sparks || []).forEach((s, i) => {
        const sp = document.createElement('span');
        sp.className = 'spk';
        sp.style.left = (it.side === 'l' ? 4 + i * 11 : 26 - i * 11) + 'px';
        sp.style.top = (2 - i * 2) + 'px';
        b.appendChild(sp);
      });
      msLayer.appendChild(b);
      it.btn = b;
      const pick = () => { rManual = it.id; renderRoot(it.id); };
      b.addEventListener('pointerenter', () => { it.core.classList.add('hl'); if (it.g > 0.9) pick(); });
      b.addEventListener('pointerleave', () => it.core.classList.remove('hl'));
      b.addEventListener('focus', () => { if (it.g > 0.9) pick(); });
      b.addEventListener('click', pick);
      it.leaves = [];
      const nLeaves = it.kind === 'canopy' ? 11 : it.kind === 'branch' ? 6 : it.kind === 'twig' ? 3 : 0;
      for (let i = 0; i < nLeaves; i++) {
        const seed = it.node[0] * 13.7 + it.node[1] * 7.3 + i * 37.1;
        it.leaves.push({
          a: ((seed % 360) * Math.PI) / 180, r: 12 + ((seed * 0.37) % 22), ph: seed % 6.28,
          rot: (seed * 1.3) % 3.14, len: 4 + ((seed * 0.11) % 3), amber: it.kind === 'canopy' && i % 4 === 0,
        });
      }
      return it;
    });

    let rS = 1, rOX = 0, rOY = 0, AW = 1, AH = 1;
    const px = (x, y) => ({ x: rOX + x * rS, y: rOY + y * rS });
    function layout() {
      vw = window.innerWidth; vh = window.innerHeight;
      AW = treeArea.clientWidth; AH = treeArea.clientHeight;
      rS = Math.min(AW / CB.w, AH / CB.h);
      rOX = (AW - CB.w * rS) / 2 - CB.x * rS;
      rOY = (AH - CB.h * rS) / 2 - CB.y * rS;
      treeSvg.setAttribute('viewBox', `${(-rOX / rS).toFixed(2)} ${(-rOY / rS).toFixed(2)} ${(AW / rS).toFixed(2)} ${(AH / rS).toFixed(2)}`);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      tCanvas.width = Math.round(AW * dpr); tCanvas.height = Math.round(AH * dpr);
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      items.forEach((it) => {
        if (!it.btn) return;
        const q = px(it.node[0], it.node[1]);
        it.btn.style.left = q.x.toFixed(1) + 'px';
        it.btn.style.top = q.y.toFixed(1) + 'px';
        it.btn.dataset.side = it.side;
      });
      const s0 = px(500, 640);
      seedRef.current.style.left = s0.x + 'px'; seedRef.current.style.top = s0.y + 'px';
      const u = px(150, 618), dn = px(150, 664);
      upRef.current.style.left = u.x + 'px'; upRef.current.style.top = u.y + 'px';
      downRef.current.style.left = dn.x + 'px'; downRef.current.style.top = dn.y + 'px';
    }
    layout();
    window.addEventListener('resize', layout);

    // The story card and the year counter
    let rShown = null, rLastAuto = null, rYearShown = null;
    const chip = (s, plain) => {
      const el = document.createElement('span');
      el.className = 'rchip' + (plain ? ' plain' : '');
      el.textContent = s;
      return el;
    };
    // Fills a card element with one chapter's content; returns the year and caption for it.
    function fillCard(target, key) {
      target.innerHTML = '';
      const add = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; el.textContent = text; target.appendChild(el); return el; };
      let year, cap;
      if (key === 'intro') {
        add('span', 'rchap amber', 'Roots · education');
        add('span', 'rname', 'It starts below the ground.');
        add('p', 'rstory', 'Keep scrolling. Her education grows first, then every role above it.');
        year = '1999'; cap = 'Where it starts';
      } else if (key === 'finale') {
        add('span', 'rchap', 'Today');
        add('span', 'rname serif', 'Many branches, one root.');
        add('p', 'rstory', 'Six companies across India, Dubai and the US, all grown from the same habit: understanding things deeply and fixing them from the root.');
        const chips = add('div', 'rchips', '');
        chips.appendChild(chip('Hindi · English · Punjabi · French · German', true));
        chips.appendChild(chip('Marketo Certified Expert', true));
        year = 'Now'; cap = 'Many branches, one root';
      } else {
        const it = items.find((x) => x.id === key);
        add('span', 'rchap' + (it.kind === 'root' ? ' amber' : ''), CHAPTER[it.kind]);
        add('span', 'rname', it.title);
        add('span', 'rmeta', it.meta);
        add('p', 'rstory', it.story);
        if (it.sparks) {
          const chips = add('div', 'rchips', '');
          it.sparks.forEach((s) => chips.appendChild(chip(s)));
        }
        year = String(it.year); cap = it.title;
      }
      return [year, cap];
    }

    // On phones the card sits under the tree. Size it once for its tallest chapter,
    // and end the tree just above it, so the roots are never hidden and nothing jumps.
    function fitCardOnPhone() {
      if (window.innerWidth > 760) { rcard.style.minHeight = ''; treeArea.style.bottom = ''; treeArea.style.top = ''; return; }
      const probe = rcard.cloneNode(false);
      probe.removeAttribute('aria-live');
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', left: '0', top: '0', width: rcard.offsetWidth + 'px', minHeight: '0', margin: '0' });
      rcard.parentNode.appendChild(probe);
      let maxH = 0;
      ['intro', 'finale', ...items.filter((x) => x.title).map((x) => x.id)].forEach((k) => {
        fillCard(probe, k);
        maxH = Math.max(maxH, probe.offsetHeight);
      });
      probe.remove();
      rcard.style.minHeight = Math.ceil(maxH) + 'px';
      // Offsets, not screen rects: the card's entrance animation moves it for a moment.
      const top = rcard.parentNode.offsetTop + rcard.offsetTop;
      treeArea.style.bottom = Math.max(0, Math.round(stickyRef.current.clientHeight - top + 10)) + 'px';
      // ...and start it below the heading, however tall the heading is on this screen.
      const head = rcard.parentNode.querySelector('.rhead');
      if (head) treeArea.style.top = Math.round(rcard.parentNode.offsetTop + head.offsetTop + head.offsetHeight + 8) + 'px';
    }

    function renderRoot(key) {
      if (key === rShown) return;
      rShown = key;
      const [year, cap] = fillCard(rcard, key);
      rcard.classList.remove('swap'); void rcard.offsetWidth; rcard.classList.add('swap');
      if (year !== rYearShown) {
        rYearShown = year;
        yearRef.current.textContent = year;
        yearRef.current.classList.remove('tick'); void yearRef.current.offsetWidth; yearRef.current.classList.add('tick');
      }
      capRef.current.textContent = cap;
      items.forEach((x) => x.btn && x.btn.classList.toggle('current', x.id === key));
      keepLabelOnScreen();
    }

    // On phones only the current label shows; if it would run off the edge, put it on the other side.
    function keepLabelOnScreen() {
      const it = items.find((x) => x.btn && x.btn.classList.contains('current'));
      if (!it) return;
      it.btn.dataset.side = it.side;
      const lab = it.btn.querySelector('.ms-label');
      if (!lab) return;
      const r = lab.getBoundingClientRect();
      if (r.width && (r.left < 4 || r.right > window.innerWidth - 4)) it.btn.dataset.side = it.side === 'l' ? 'r' : 'l';
    }
    renderRoot('intro');
    const refit = () => { fitCardOnPhone(); layout(); keepLabelOnScreen(); };
    refit();
    window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

    let rp = 0, id;
    function frame(t) {
      id = requestAnimationFrame(frame);
      const rect = rStage.getBoundingClientRect();
      const H3 = rSticky.clientHeight || vh;
      if (rect.top > vh * 1.1 || rect.bottom < -60) return;
      const tt = reduce ? 0 : t;
      const total = rStage.offsetHeight - H3;
      const p = clamp(-rect.top / (total || 1), 0, 1);
      rp += (p - rp) * 0.2;

      // Camera: starts close on the seed and roots, pulls back as the tree grows.
      const zf = easeInOut(smooth(0.02, 0.42, rp));
      const z = reduce ? 1 : mix(vw < 760 ? 1.35 : 1.7, 1, zf);
      const F = px(500, mix(700, 465, zf));
      const txz = AW / 2 - F.x * z, tyz = AH / 2 - F.y * z;
      treeEl.style.transform = `translate(${txz.toFixed(1)}px,${tyz.toFixed(1)}px) scale(${z.toFixed(4)})`;

      // Grow each part with scroll.
      let auto = 'intro';
      items.forEach((it) => {
        const g = it.linear ? clamp((rp - it.win[0]) / (it.win[1] - it.win[0]), 0, 1) : smooth(it.win[0], it.win[1], rp);
        it.g = g;
        const off = (1 - g).toFixed(4);
        it.core.style.strokeDashoffset = off;
        it.base.style.strokeDashoffset = off;
        if (it.btn) {
          it.btn.classList.toggle('shown', g > 0.6);
          it.btn.classList.toggle('lit', g > 0.95);
          if (g > 0.95) auto = it.id;
        }
      });
      const rl = smooth(0.05, 0.33, rp);
      rootletEls.forEach((el) => { el.style.strokeDashoffset = (1 - rl).toFixed(4); });
      if (rp > FINALE_AT) auto = 'finale';
      if (auto !== rLastAuto) { rManual = null; rLastAuto = auto; }
      renderRoot(rManual || auto);

      upRef.current.style.opacity = smooth(0.17, 0.24, rp).toFixed(2);
      downRef.current.style.opacity = smooth(0.03, 0.08, rp).toFixed(2);

      // Leaves and sap, drawn in the tree's own coordinates.
      tctx.clearRect(0, 0, AW, AH);
      const ar = treeArea.getBoundingClientRect();
      const lpx = (mx - ar.left - txz) / z, lpy = (my - ar.top - tyz) / z;
      const finale = smooth(FINALE_AT, 0.97, rp);
      items.forEach((it) => {
        // Sap: roots draw up toward the seed, everything else flows outward.
        if (it.g > 0.25) {
          it.sap.forEach((s) => {
            const u = (s.u0 + tt * s.sp) % 1;
            const along = it.kind === 'root' ? (1 - u) * it.g : u * it.g;
            const pt = it.core.getPointAtLength(it.len * along);
            const q = px(pt.x, pt.y);
            const col = it.kind === 'root' ? '255,184,107' : '124,242,192';
            tctx.fillStyle = `rgba(${col},0.18)`;
            tctx.beginPath(); tctx.arc(q.x, q.y, 4, 0, Math.PI * 2); tctx.fill();
            tctx.fillStyle = `rgba(${col},0.95)`;
            tctx.beginPath(); tctx.arc(q.x, q.y, 1.5, 0, Math.PI * 2); tctx.fill();
          });
        }
        if (!it.leaves || !it.leaves.length) return;
        const lg = smooth(0.7, 1, it.g);
        if (lg <= 0) return;
        const c = px(it.node[0], it.node[1]);
        const near = hasPointer && !coarse && Math.hypot(lpx - c.x, lpy - c.y) < 70;
        it.leaves.forEach((L) => {
          const sway = Math.sin(tt * 0.0016 + L.ph) * (near ? 0.5 : 0.12);
          const a = L.a + sway * 0.4;
          const lx = c.x + Math.cos(a) * L.r * rS * lg * 1.6;
          const ly = c.y + Math.sin(a) * L.r * rS * lg * 1.6;
          tctx.save();
          tctx.translate(lx, ly);
          tctx.rotate(L.rot + sway);
          tctx.globalAlpha = (0.32 + 0.35 * finale) * lg;
          tctx.fillStyle = L.amber ? '#FFB86B' : '#7CF2C0';
          tctx.beginPath();
          tctx.ellipse(0, 0, L.len * lg, L.len * 0.42 * lg, 0, 0, Math.PI * 2);
          tctx.fill();
          tctx.restore();
        });
      });
      tctx.globalAlpha = 1;

      // Always visible: first how to move through it, then how to explore it.
      const verb = window.matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Hover';
      const msg = rp < 0.05 ? 'Scroll to grow her story'
        : rp > 0.93 ? `${verb} any branch for its education or work story`
        : `${verb} a dot to read that chapter`;
      if (hintTextRef.current.textContent !== msg) hintTextRef.current.textContent = msg;
    }
    id = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', layout);
      window.removeEventListener('resize', refit);
      msLayer.innerHTML = '';
    };
  }, []);

  return (
    <section className="root-stage" id="root" ref={stageRef} aria-labelledby="root-title">
      <div className="root-sticky grid-bg" ref={stickyRef}>
        {/* One left column: heading, hint, then the story card pinned to the bottom, so none of them can overlap */}
        <div className="rcol">
        <header className="rhead">
          <span className="eyebrow">Where it all grew from</span>
          <h2 className="rtitle" id="root-title">from the root</h2>
          <p className="rlede">
            She likes to <em>“understand things deeply and fix them from the root.”</em> So her story grows like one: education below the ground, every role above it.
          </p>
          <div className="ryear-row" aria-hidden="true">
            <span className="ryear" ref={yearRef}>1999</span>
            <span className="ryear-cap" ref={capRef}>Where it starts</span>
          </div>
          {/* The hint lives here, in the text column, so it never covers the tree's labels */}
          <div className="rhint" ref={hintRef}>
            <span className="hint-line" />
            <span ref={hintTextRef}>Scroll to grow her story</span>
          </div>
        </header>
        <article className="rcard" ref={cardRef} aria-live="polite" />
        </div>

        {/* The tree is drawn, so screen readers and search engines get the same story as a plain list */}
        <ol className="sr-only" aria-label="Her journey, from school to today">
          {TREE.filter((t) => t.title).sort((a, b) => a.year - b.year).map((t) => (
            <li key={t.id}>
              <strong>{t.title}</strong>, {t.meta}. {t.story}
              {t.sparks ? ` Recognition: ${t.sparks.join('; ')}.` : ''}
            </li>
          ))}
        </ol>

        <div className="tree-area" ref={areaRef}>
          <div className="tree" ref={treeRef}>
            <svg ref={svgRef} aria-hidden="true">
              <line className="ground" x1="140" y1="640" x2="860" y2="640" />
              <g ref={rootletsRef} />
              <g ref={baseRef} />
              <g ref={coreRef} />
            </svg>
            <canvas ref={canvasRef} aria-hidden="true" />
            <span className="glabel up" ref={upRef}>Experience ↑</span>
            <span className="glabel down" ref={downRef}>Education ↓</span>
            <span className="seed" ref={seedRef} />
            <div ref={msRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
