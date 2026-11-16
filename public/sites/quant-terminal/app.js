/* Quant Terminal — simulated live markets + SMA backtester. No dependencies. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
  };

  /* ================= random helpers ================= */
  function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ================= markets ================= */
  const SYMS = [
    { id: 'ORBX', name: 'Orbit', px: 64210, dec: 2, sd: .00011, vol: .9, annual: .62, seed: 11 },
    { id: 'KSTR', name: 'Kestrel', px: 3412.5, dec: 2, sd: .00013, vol: 14, annual: .74, seed: 23 },
    { id: 'VOLT', name: 'Voltage', px: 182.4, dec: 2, sd: .00017, vol: 260, annual: .95, seed: 37 },
    { id: 'NOVA', name: 'Nova', px: 27.912, dec: 3, sd: .0002, vol: 1900, annual: 1.05, seed: 41 },
    { id: 'QNTM', name: 'Quantum', px: 1.2841, dec: 4, sd: .00022, vol: 52000, annual: 1.15, seed: 53 },
    { id: 'HLX', name: 'Helix', px: .73421, dec: 5, sd: .00025, vol: 98000, annual: 1.3, seed: 67 }
  ];
  const HIST = 6 * 3600; // 6h of 1-second ticks
  const LEVELS = 18;
  const now0 = Math.floor(Date.now() / 1000);
  SYMS.forEach(S => {
    const r = mulberry32(S.seed);
    const t = new Array(HIST), p = new Array(HIST), v = new Array(HIST);
    let price = S.px, regime = .5;
    // walk backwards-agnostic: generate forward then rescale so the last tick equals S.px
    for (let i = 0; i < HIST; i++) {
      regime = Math.min(1, Math.max(0, regime + (r() - .5) * .02));
      const sig = S.sd * (.55 + regime * 1.1);
      const jump = r() < .0008 ? gauss(r) * sig * 12 : 0;
      const z = gauss(r);
      price *= Math.exp(z * sig + jump);
      t[i] = now0 - HIST + i + 1; p[i] = price;
      v[i] = S.vol * Math.exp(gauss(r) * .6) * (1 + Math.abs(z) * .8 + Math.abs(jump) / sig * .2) * (.6 + regime);
    }
    const k = S.px / p[HIST - 1];
    for (let i = 0; i < HIST; i++) p[i] *= k;
    Object.assign(S, { t, p, v, regime, open: p[0], rng: Math.random, cache: {} });
    S.book = makeBook(S);
    S.trades = [];
    S.daily = makeDaily(S);
  });

  function fmt(x, dec) { return x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  const fmtP = (S, x) => fmt(x, S.dec);
  function fmtBig(x) { const a = Math.abs(x); return a >= 1e9 ? (x / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (x / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (x / 1e3).toFixed(1) + 'K' : x.toFixed(a < 10 ? 3 : 1); }
  const pct = (x, d = 2) => (x >= 0 ? '+' : '') + (x * 100).toFixed(d) + '%';
  const hhmmss = s => new Date(s * 1000).toTimeString().slice(0, 8);

  /* ================= state ================= */
  let cur = SYMS[0];
  let iv = store.get('qt-iv', 60);
  let paused = false;
  const view = { count: 110, offset: 0 }; // offset in candles from the live edge
  const show = { fast: true, slow: true };
  const SMA = { fast: 9, slow: 21 };

  /* ================= candles ================= */
  function candles(S, I) {
    const key = I; let c = S.cache[key];
    if (!c || c.n !== S.t.length) {
      if (c && c.n < S.t.length) { // incremental
        for (let i = c.n; i < S.t.length; i++) addTick(c.arr, S.t[i], S.p[i], S.v[i], I);
      } else {
        c = { arr: [] };
        for (let i = 0; i < S.t.length; i++) addTick(c.arr, S.t[i], S.p[i], S.v[i], I);
      }
      c.n = S.t.length; S.cache[key] = c;
    }
    return c.arr;
  }
  function addTick(arr, t, p, v, I) {
    const b = Math.floor(t / I) * I, last = arr[arr.length - 1];
    if (last && last.t === b) { last.h = Math.max(last.h, p); last.l = Math.min(last.l, p); last.c = p; last.v += v; }
    else arr.push({ t: b, o: last ? last.c : p, h: Math.max(p, last ? last.c : p), l: Math.min(p, last ? last.c : p), c: p, v });
  }
  function sma(arr, n, key = 'c') {
    const out = new Array(arr.length).fill(null); let s = 0;
    for (let i = 0; i < arr.length; i++) { s += arr[i][key] ?? arr[i]; if (i >= n) s -= arr[i - n][key] ?? arr[i - n]; if (i >= n - 1) out[i] = s / n; }
    return out;
  }

  /* ================= live feed ================= */
  function tickAll() {
    const t = Math.floor(Date.now() / 1000);
    SYMS.forEach(S => {
      const last = S.p[S.p.length - 1];
      S.regime = Math.min(1, Math.max(0, S.regime + (Math.random() - .5) * .04));
      const sig = S.sd * (.55 + S.regime * 1.1);
      const z = gauss(Math.random), jump = Math.random() < .002 ? gauss(Math.random) * sig * 10 : 0;
      const p = last * Math.exp(z * sig + jump);
      const v = S.vol * Math.exp(gauss(Math.random) * .6) * (1 + Math.abs(z) * .8) * (.6 + S.regime);
      S.t.push(t <= S.t[S.t.length - 1] ? S.t[S.t.length - 1] + 1 : t); S.p.push(p); S.v.push(v);
      stepBook(S, p);
      const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) {
        const side = Math.random() < (p >= last ? .62 : .38) ? 'b' : 's';
        S.trades.unshift({ p: side === 'b' ? S.book.asks[0].p : S.book.bids[0].p, q: v / n * Math.exp(gauss(Math.random) * .5), s: side, t });
      }
      S.trades.length = Math.min(S.trades.length, 40);
    });
  }

  /* ================= order book ================= */

  function makeBook(S) {
    const r = mulberry32(S.seed + 1), sz = () => S.vol * (.4 + r() * 2.2);
    const b = { bidQ: [], askQ: [], bids: [], asks: [] };
    for (let i = 0; i < LEVELS; i++) { b.bidQ.push(sz() * (1 + i * .12)); b.askQ.push(sz() * (1 + i * .12)); }
    layoutBook(S, b, S.p[S.p.length - 1]); return b;
  }
  function layoutBook(S, b, mid) {
    const step = mid * .00009, half = step * (.6 + Math.random() * .9);
    b.bids = b.bidQ.map((q, i) => ({ p: mid - half - i * step, q }));
    b.asks = b.askQ.map((q, i) => ({ p: mid + half + i * step, q }));
  }
  function stepBook(S, mid) {
    const b = S.book; b.changed = new Set();
    const mut = (arr, side) => arr.forEach((q, i) => {
      if (Math.random() < .35) { arr[i] = Math.max(S.vol * .05, q * (.7 + Math.random() * .6)); b.changed.add(side + i); }
      if (Math.random() < .04) { arr[i] = S.vol * (.4 + Math.random() * 3) * (1 + i * .12); b.changed.add(side + i); }
    });
    mut(b.bidQ, 'b'); mut(b.askQ, 'a'); layoutBook(S, b, mid);
  }

  /* ================= canvas helpers ================= */
  function fit(cv) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w, h };
  }
  let C = {};
  function readColors() { const cs = getComputedStyle(document.documentElement); ['--up', '--down', '--grid', '--cross', '--muted', '--dim', '--text', '--panel', '--panel-2', '--line', '--line-2', '--s-fast', '--s-slow', '--s-eq', '--s-bh', '--div-neg', '--div-mid', '--div-pos', '--accent', '--accent-ink'].forEach(k => C[k.slice(2)] = cs.getPropertyValue(k).trim()); }
  readColors();
  function niceStep(range, target) { const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag; return (n < 1.5 ? 1 : n < 2.25 ? 2 : n < 3.5 ? 2.5 : n < 7 ? 5 : 10) * mag; }
  const MONO = '11px "IBM Plex Mono", monospace';
  function alpha(hex, a) { if (hex.startsWith('#') && hex.length === 7) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; } return hex; }

  /* ================= main chart ================= */
  const chartCv = $('#chart'), chartTip = $('#chart-tip');
  let hover = null; // {x,y}
  let chartGeom = null;
  function drawChart() {
    const { c, w, h } = fit(chartCv);
    c.clearRect(0, 0, w, h);
    if (w < 50 || h < 50) return;
    const all = candles(cur, iv);
    const fastA = sma(all, SMA.fast), slowA = sma(all, SMA.slow);
    view.count = Math.max(20, Math.min(view.count, all.length));
    view.offset = Math.max(0, Math.min(view.offset, all.length - view.count));
    const end = all.length - Math.round(view.offset), start = Math.max(0, end - Math.round(view.count));
    const vis = all.slice(start, end);
    const AX = 68, BX = 22, padT = 10;
    const pw = w - AX, ph = h - BX - padT;
    const volH = Math.round(ph * .18), gap = 8, priceH = ph - volH - gap;
    const cw = pw / Math.round(view.count);
    let lo = Infinity, hi = -Infinity, vmax = 0;
    vis.forEach((k, i) => { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); vmax = Math.max(vmax, k.v);
      const gi = start + i; if (show.fast && fastA[gi]) { lo = Math.min(lo, fastA[gi]); hi = Math.max(hi, fastA[gi]); } if (show.slow && slowA[gi]) { lo = Math.min(lo, slowA[gi]); hi = Math.max(hi, slowA[gi]); } });
    const pad = (hi - lo) * .08 || hi * .001; lo -= pad; hi += pad;
    const y = p => padT + (hi - p) / (hi - lo) * priceH;
    const x = i => (i + .5) * cw + (pw - vis.length * cw);
    const yv = v => padT + priceH + gap + volH - v / vmax * volH;
    chartGeom = { start, vis, cw, pw, x, y, lo, hi, padT, priceH, AX, w, h, BX, fastA, slowA };

    // grid + y axis
    c.font = MONO; c.textBaseline = 'middle'; c.lineWidth = 1;
    const st = niceStep(hi - lo, Math.max(3, Math.floor(priceH / 46)));
    c.fillStyle = C.muted;
    for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
      const yy = Math.round(y(v)) + .5; c.strokeStyle = C.grid; c.beginPath(); c.moveTo(0, yy); c.lineTo(pw, yy); c.stroke();
      c.fillText(fmt(v, st < 1 ? Math.min(cur.dec, Math.max(0, -Math.floor(Math.log10(st)))) : cur.dec > 2 ? 2 : 0), pw + 8, yy);
    }
    // x axis labels
    const everyN = Math.max(1, Math.ceil(90 / cw));
    c.textAlign = 'center'; c.textBaseline = 'top';
    vis.forEach((k, i) => { if ((start + i) % everyN) return; const xx = Math.round(x(i)) + .5;
      c.strokeStyle = C.grid; c.beginPath(); c.moveTo(xx, padT); c.lineTo(xx, padT + ph); c.stroke();
      if (xx > 24 && xx < pw - 24) { c.fillStyle = C.muted; c.fillText(iv >= 60 ? hhmmss(k.t).slice(0, 5) : hhmmss(k.t), xx, h - BX + 5); } });
    c.textAlign = 'left';
    // separators
    c.strokeStyle = C.line; c.beginPath(); c.moveTo(pw + .5, 0); c.lineTo(pw + .5, h - BX); c.moveTo(0, h - BX + .5); c.lineTo(w, h - BX + .5); c.stroke();

    // volume
    const bw = Math.max(1, Math.min(14, cw * .68));
    vis.forEach((k, i) => { const up = k.c >= k.o; c.fillStyle = alpha(up ? C.up : C.down, .35); const yy = yv(k.v); c.fillRect(Math.round(x(i) - bw / 2), yy, Math.max(1, Math.round(bw)), padT + priceH + gap + volH - yy); });
    // candles
    vis.forEach((k, i) => {
      const up = k.c >= k.o, col = up ? C.up : C.down, xx = Math.round(x(i));
      c.strokeStyle = col; c.fillStyle = col;
      c.beginPath(); c.moveTo(xx + .5, Math.round(y(k.h))); c.lineTo(xx + .5, Math.round(y(k.l))); c.stroke();
      const top = Math.round(y(Math.max(k.o, k.c))), bot = Math.round(y(Math.min(k.o, k.c)));
      const bx = Math.round(xx - bw / 2 + .5);
      c.fillRect(bx, top, Math.max(1, Math.round(bw)), Math.max(1, bot - top));
    });
    // SMAs
    const line = (arr, col) => { c.strokeStyle = col; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath(); let m = false;
      vis.forEach((_, i) => { const v = arr[start + i]; if (v == null) return; const xx = x(i), yy = y(v); if (!m) { c.moveTo(xx, yy); m = true; } else c.lineTo(xx, yy); }); c.stroke(); c.lineWidth = 1; };
    if (show.slow) line(slowA, C['s-slow']);
    if (show.fast) line(fastA, C['s-fast']);
    // last price line
    const lastK = all[all.length - 1], lp = lastK.c, ly = y(lp);
    if (ly > padT - 2 && ly < padT + priceH + 2) {
      const col = lastK.c >= lastK.o ? C.up : C.down;
      c.setLineDash([3, 3]); c.strokeStyle = col; c.beginPath(); c.moveTo(0, Math.round(ly) + .5); c.lineTo(pw, Math.round(ly) + .5); c.stroke(); c.setLineDash([]);
      tag(c, pw, ly, fmtP(cur, lp), col, '#fff');
    }
    // crosshair
    if (hover && hover.x < pw && hover.y > padT && hover.y < padT + ph) {
      const i = Math.floor((hover.x - (pw - vis.length * cw)) / cw);
      const k = vis[i];
      c.strokeStyle = C.cross; c.setLineDash([4, 4]);
      const xx = k ? Math.round(x(i)) + .5 : hover.x;
      c.beginPath(); c.moveTo(xx, padT); c.lineTo(xx, padT + ph); c.moveTo(0, Math.round(hover.y) + .5); c.lineTo(pw, Math.round(hover.y) + .5); c.stroke(); c.setLineDash([]);
      if (hover.y <= padT + priceH) tag(c, pw, hover.y, fmtP(cur, hi - (hover.y - padT) / priceH * (hi - lo)), C.text, C.panel);
      if (k) {
        c.font = MONO; const lbl = hhmmss(k.t); const tw = c.measureText(lbl).width + 12;
        c.fillStyle = C.text; c.fillRect(Math.min(pw - tw, Math.max(0, xx - tw / 2)), h - BX + 1, tw, BX - 2);
        c.fillStyle = C.panel; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lbl, Math.min(pw - tw / 2, Math.max(tw / 2, xx)), h - BX / 2 + .5); c.textAlign = 'left';
        showOHLC(k, start + i);
        const chg = (k.c - k.o) / k.o;
        chartTip.hidden = false;
        chartTip.innerHTML = `<div class="d">${hhmmss(k.t)} · ${ivLabel()}</div>
          <div class="r"><span>O</span>${fmtP(cur, k.o)}</div><div class="r"><span>H</span>${fmtP(cur, k.h)}</div>
          <div class="r"><span>L</span>${fmtP(cur, k.l)}</div><div class="r"><span>C</span>${fmtP(cur, k.c)}</div>
          <div class="r"><span>Δ</span><b class="${chg >= 0 ? 'up-t' : 'down-t'}">${pct(chg, 3)}</b></div><div class="r"><span>Vol</span>${fmtBig(k.v)}</div>`;
        const tw2 = chartTip.offsetWidth, th = chartTip.offsetHeight;
        let tx = hover.x + 16; if (tx + tw2 > pw - 4) tx = hover.x - tw2 - 16;
        chartTip.style.transform = `translate(${Math.max(4, tx)}px, ${Math.max(4, Math.min(h - th - 4, hover.y - th / 2))}px)`;
      } else chartTip.hidden = true;
    } else { chartTip.hidden = true; showOHLC(lastK, all.length - 1); }
    $('#lg-fast').textContent = fastA[all.length - 1] ? fmtP(cur, fastA[all.length - 1]) : '—';
    $('#lg-slow').textContent = slowA[all.length - 1] ? fmtP(cur, slowA[all.length - 1]) : '—';
  }
  function tag(c, pw, yy, text, bg, fg) {
    c.font = '600 11px "IBM Plex Mono", monospace'; const th = 18;
    c.fillStyle = bg; c.beginPath(); c.roundRect ? c.roundRect(pw + 2, yy - th / 2, 64, th, 4) : c.rect(pw + 2, yy - th / 2, 64, th); c.fill();
    c.fillStyle = fg; c.textBaseline = 'middle'; c.fillText(text.length > 9 ? text.slice(0, 9) : text, pw + 7, yy + .5);
  }
  function ivLabel() { return { 5: '5s', 15: '15s', 60: '1m', 300: '5m' }[iv]; }
  function showOHLC(k) {
    const chg = (k.c - k.o) / k.o;
    $('#ohlc').innerHTML = `O <b>${fmtP(cur, k.o)}</b>H <b>${fmtP(cur, k.h)}</b>L <b>${fmtP(cur, k.l)}</b>C <b class="${chg >= 0 ? 'up-t' : 'down-t'}">${fmtP(cur, k.c)}</b>`;
  }

  // chart interaction
  let drag = null;
  chartCv.addEventListener('pointermove', e => {
    const r = chartCv.getBoundingClientRect(); hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (drag && chartGeom) { const dx = e.clientX - drag.x; view.offset = drag.off + dx / chartGeom.cw; }
    dirty.chart = true;
  });
  chartCv.addEventListener('pointerleave', () => { hover = null; dirty.chart = true; });
  chartCv.addEventListener('pointerdown', e => { drag = { x: e.clientX, off: view.offset }; chartCv.setPointerCapture(e.pointerId); chartCv.classList.add('is-drag'); });
  const endDrag = () => { drag = null; chartCv.classList.remove('is-drag'); };
  chartCv.addEventListener('pointerup', endDrag); chartCv.addEventListener('pointercancel', endDrag);
  chartCv.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  chartCv.addEventListener('dblclick', () => { view.count = 110; view.offset = 0; dirty.chart = true; });
  function zoom(f) { view.count = Math.max(20, Math.min(600, view.count * f)); dirty.chart = true; }

  /* ================= watchlist ================= */
  const wl = $('#wl');
  wl.innerHTML = SYMS.map((S, i) => `<li role="option" id="wl-${S.id}" data-i="${i}" tabindex="-1" aria-selected="${i === 0}"><span class="t">${S.id}<small>${S.name}</small></span><span class="p num">—</span><canvas aria-hidden="true"></canvas><span class="c num">—</span></li>`).join('');
  wl.addEventListener('click', e => { const li = e.target.closest('li'); if (li) select(+li.dataset.i); });
  function drawWatch() {
    SYMS.forEach(S => {
      const li = $('#wl-' + S.id), last = S.p[S.p.length - 1], ch = last / S.open - 1;
      const pEl = li.querySelector('.p'), prev = +pEl.dataset.v;
      pEl.textContent = fmtP(S, last); pEl.dataset.v = last;
      if (prev && prev !== last) { pEl.classList.remove('flash-up', 'flash-down'); void pEl.offsetWidth; pEl.classList.add(last > prev ? 'flash-up' : 'flash-down'); setTimeout(() => pEl.classList.remove('flash-up', 'flash-down'), 450); }
      const cEl = li.querySelector('.c'); cEl.textContent = pct(ch); cEl.className = 'c num ' + (ch >= 0 ? 'up-t' : 'down-t');
      const cv = li.querySelector('canvas'); const { c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
      const N = 90, stepN = 240, pts = []; for (let k = N - 1; k >= 0; k--) pts.push(S.p[Math.max(0, S.p.length - 1 - k * stepN)]);
      const mn = Math.min(...pts), mx = Math.max(...pts), col = ch >= 0 ? C.up : C.down;
      const X = i => i / (N - 1) * w, Y = v => 2 + (mx - v) / (mx - mn || 1) * (h - 4);
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, alpha(col, .22)); g.addColorStop(1, alpha(col, 0));
      c.beginPath(); pts.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fillStyle = g; c.fill();
      c.beginPath(); pts.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
    });
  }

  /* ================= KPIs + header ================= */
  function drawKPIs() {
    const S = cur, last = S.p[S.p.length - 1], ch = last / S.open - 1;
    let lo = Infinity, hi = -Infinity, vol = 0; for (let i = 0; i < S.p.length; i++) { const p = S.p[i]; if (p < lo) lo = p; if (p > hi) hi = p; vol += S.v[i]; }
    const m1 = candles(S, 60); let s = 0, s2 = 0, n = 0;
    for (let i = Math.max(1, m1.length - 240); i < m1.length; i++) { const r = Math.log(m1[i].c / m1[i - 1].c); s += r; s2 += r * r; n++; }
    const sd = Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)), rv = sd * Math.sqrt(525600);
    const spr = S.book.asks[0].p - S.book.bids[0].p;
    const px = $('#sym-px'), prev = +px.dataset.v; px.textContent = fmtP(S, last); px.dataset.v = last;
    if (prev && prev !== last) { px.classList.remove('flash-up', 'flash-down'); void px.offsetWidth; px.classList.add(last > prev ? 'flash-up' : 'flash-down'); setTimeout(() => px.classList.remove('flash-up', 'flash-down'), 450); }
    const chEl = $('#sym-chg'); chEl.textContent = pct(ch); chEl.className = 'chg ' + (ch >= 0 ? 'up' : 'down');
    $('#k-last').textContent = fmtP(S, last);
    const k = $('#k-chg'); k.textContent = pct(ch); k.className = ch >= 0 ? 'up' : 'down';
    $('#k-chg-sub').textContent = (ch >= 0 ? '+' : '') + fmtP(S, last - S.open) + ' since open';
    const rd = S.px > 1000 ? 0 : S.dec; $('#k-range').textContent = `${fmt(lo, rd)} – ${fmt(hi, rd)}`;
    $('#k-range-sub').textContent = `width ${((hi / lo - 1) * 100).toFixed(2)}%`;
    $('#k-vol').textContent = fmtBig(vol) + ' ' + S.id;
    $('#k-vol-sub').textContent = '≈ $' + fmtBig(vol * last) + ' notional';
    $('#k-rv').textContent = (rv * 100).toFixed(1) + '%';
    $('#k-spr').textContent = (spr / last * 1e4).toFixed(2) + ' bps';
    $('#k-spr-sub').textContent = fmtP(S, spr) + ' top of book';
    document.title = `${fmtP(S, last)} ${S.id} · Quant Terminal`;
  }

  /* ================= order book + tape ================= */
  const asksEl = $('#asks'), bidsEl = $('#bids');
  function drawBook() {
    const S = cur, b = S.book;
    const cumA = [], cumB = []; let a = 0, bb = 0;
    b.asks.forEach(l => cumA.push(a += l.q)); b.bids.forEach(l => cumB.push(bb += l.q));
    const max = Math.max(a, bb);
    const row = (l, cum, side, i) => `<div class="row${b.changed && b.changed.has(side + i) ? ' flash' : ''}"><i style="width:${(cum / max * 100).toFixed(1)}%"></i><span>${fmtP(S, l.p)}</span><span>${fmtBig(l.q)}</span><span>${fmtBig(cum)}</span></div>`;
    asksEl.innerHTML = b.asks.map((l, i) => row(l, cumA[i], 'a', i)).reverse().join('');
    bidsEl.innerHTML = b.bids.map((l, i) => row(l, cumB[i], 'b', i)).join('');
    const mid = (b.asks[0].p + b.bids[0].p) / 2, spr = b.asks[0].p - b.bids[0].p;
    const last = S.p[S.p.length - 1], prev = S.p[S.p.length - 2];
    $('#ob-mid').innerHTML = `<b class="${last >= prev ? 'up-t' : 'down-t'}">${fmtP(S, mid)} ${last >= prev ? '↑' : '↓'}</b><span>spread ${fmtP(S, spr)} · ${(spr / mid * 1e4).toFixed(2)} bps</span>`;
    $('#tape-rows').innerHTML = S.trades.slice(0, 30).map((tr, i) => `<div class="row${i < 2 ? ' tr-in' : ''}"><span class="${tr.s === 'b' ? 'up-t' : 'down-t'}">${fmtP(S, tr.p)}</span><span>${fmtBig(tr.q)}</span><span>${hhmmss(tr.t)}</span></div>`).join('');
  }

  /* ================= backtest ================= */
  function makeDaily(S) {
    const r = mulberry32(S.seed * 7 + 3), N = 1460 + 320, sd = S.annual / Math.sqrt(365);
    const c = [1]; let mu = .0008, left = 120;
    for (let i = 1; i < N; i++) {
      if (--left <= 0) { const u = r(); mu = u < .45 ? .0017 : u < .75 ? -.0019 : .0001; left = 60 + Math.floor(r() * 200); }
      const vol = sd * (.7 + .6 * r());
      c.push(c[i - 1] * Math.exp(mu - vol * vol / 2 + vol * gauss(r)));
    }
    const k = S.px / c[N - 1]; const today = new Date(); today.setHours(0, 0, 0, 0);
    return { c: c.map(x => x * k), d: c.map((_, i) => new Date(today.getTime() - (N - 1 - i) * 864e5)) };
  }
  function backtest(D, fast, slow, feeBps, allowShort, look) {
    const N = D.c.length, s0 = N - 1 - look, fee = feeBps / 1e4;
    const fA = sma(D.c, fast), sA = sma(D.c, slow);
    const eq = [1], bh = [1], ret = [], bret = []; let pos = 0, trades = 0, wins = 0, closed = 0, entry = null, exposure = 0;
    for (let i = s0; i < N - 1; i++) {
      const sig = fA[i] > sA[i] ? 1 : allowShort ? -1 : 0; // decided at close i → held over (i, i+1]
      let cost = 0;
      if (sig !== pos) {
        cost = fee * Math.abs(sig - pos);
        if (pos !== 0 && entry !== null) { closed++; if (eq[eq.length - 1] * (1 - cost) > entry) wins++; }
        if (sig !== 0) { trades++; entry = eq[eq.length - 1]; } else entry = null;
        pos = sig;
      }
      const mr = D.c[i + 1] / D.c[i] - 1, r = pos * mr - cost;
      if (pos) exposure++;
      ret.push(r); bret.push(mr);
      eq.push(eq[eq.length - 1] * (1 + r)); bh.push(bh[bh.length - 1] * (1 + mr));
    }
    if (pos !== 0 && entry !== null) { closed++; if (eq[eq.length - 1] > entry) wins++; }
    const stats = (R, E) => {
      const n = R.length, m = R.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(R.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1));
      let peak = -Infinity, mdd = 0; const dd = E.map(v => { peak = Math.max(peak, v); const d = v / peak - 1; mdd = Math.min(mdd, d); return d; });
      return { total: E[E.length - 1] - 1, cagr: Math.pow(E[E.length - 1], 365 / n) - 1, sharpe: sd > 0 ? m / sd * Math.sqrt(365) : 0, vol: sd * Math.sqrt(365), mdd, dd };
    };
    return { eq, bh, dates: D.d.slice(s0), s: stats(ret, eq), b: stats(bret, bh), trades, winRate: closed ? wins / closed : 0, exposure: exposure / ret.length };
  }
  let lastBT = null;
  const btForm = $('#bt-form'), btErr = $('#bt-err');
  function readParams() {
    const f = +$('#bt-fast').value, s = +$('#bt-slow').value, fee = +$('#bt-fee').value;
    [$('#bt-fast'), $('#bt-slow'), $('#bt-fee')].forEach(el => el.setAttribute('aria-invalid', 'false'));
    let err = '';
    if (!Number.isInteger(f) || f < 2 || f > 150) { err = 'Fast SMA must be a whole number 2–150.'; $('#bt-fast').setAttribute('aria-invalid', 'true'); }
    else if (!Number.isInteger(s) || s < 3 || s > 300) { err = 'Slow SMA must be a whole number 3–300.'; $('#bt-slow').setAttribute('aria-invalid', 'true'); }
    else if (f >= s) { err = 'Fast period must be shorter than slow.'; $('#bt-fast').setAttribute('aria-invalid', 'true'); $('#bt-slow').setAttribute('aria-invalid', 'true'); }
    else if (!(fee >= 0 && fee <= 100)) { err = 'Fee must be 0–100 bps.'; $('#bt-fee').setAttribute('aria-invalid', 'true'); }
    btErr.textContent = err;
    return err ? null : { f, s, fee, short: $('#bt-short').checked, look: +$('#bt-look').value };
  }
  function runBT() {
    const P = readParams(); if (!P) return;
    lastBT = backtest(cur.daily, P.f, P.s, P.fee, P.short, P.look); lastBT.P = P;
    SMA.fast = Math.min(P.f, 60); SMA.slow = Math.min(P.s, 120); // mirror on the live chart (capped for intraday)
    $('#lg-fast-n').textContent = SMA.fast; $('#lg-slow-n').textContent = SMA.slow;
    renderMetrics(); drawEquity(); renderHeat(); dirty.chart = true;
    store.set('qt-bt', P);
  }
  btForm.addEventListener('submit', e => { e.preventDefault(); runBT(); });
  function renderMetrics() {
    const R = lastBT, s = R.s, b = R.b, cls = v => v >= 0 ? 'up-t' : 'down-t';
    const cell = (k, v, sub, c = '') => `<div><dt>${k}</dt><dd class="${c}">${v}${sub ? `<small>${sub}</small>` : ''}</dd></div>`;
    $('#metrics').innerHTML =
      cell('Total return', pct(s.total, 1), 'B&H ' + pct(b.total, 1), cls(s.total)) +
      cell('CAGR', pct(s.cagr, 1), 'B&H ' + pct(b.cagr, 1), cls(s.cagr)) +
      cell('Sharpe', s.sharpe.toFixed(2), 'B&H ' + b.sharpe.toFixed(2)) +
      cell('Max drawdown', pct(s.mdd, 1), 'B&H ' + pct(b.mdd, 1), 'down-t') +
      cell('Volatility', (s.vol * 100).toFixed(1) + '%', 'annualized') +
      cell('Trades', R.trades, `${R.P.look} days`) +
      cell('Win rate', (R.winRate * 100).toFixed(0) + '%', 'closed trades') +
      cell('Exposure', (R.exposure * 100).toFixed(0) + '%', R.P.short ? 'long/short' : 'long only');
    $('#bt-sym').textContent = `${cur.id} daily · ${R.P.f}/${R.P.s}`;
  }
  const eqCv = $('#equity'), eqTip = $('#eq-tip'); let eqHover = null;
  function drawEquity() {
    if (!lastBT) return;
    const { c, w, h } = fit(eqCv); c.clearRect(0, 0, w, h); if (w < 40 || h < 40) return;
    const R = lastBT, n = R.eq.length, AX = 58, padT = 6, padB = 16, gap = 6;
    const pw = w - AX, LANE = 52, pl = pw - LANE, ph = h - padT - padB, eqH = Math.round(ph * .72), ddH = ph - eqH - gap;
    const lo = Math.min(...R.eq, ...R.bh) * 10000, hi = Math.max(...R.eq, ...R.bh) * 10000;
    const X = i => i / (n - 1) * pl, Y = v => padT + (hi - v) / (hi - lo || 1) * eqH;
    const ddMin = Math.min(R.s.mdd, -.01), YD = d => padT + eqH + gap + d / ddMin * ddH;
    c.font = MONO; c.textBaseline = 'middle'; c.lineWidth = 1;
    const st = niceStep(hi - lo, 4);
    for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) { const yy = Math.round(Y(v)) + .5; c.strokeStyle = C.grid; c.beginPath(); c.moveTo(0, yy); c.lineTo(pw, yy); c.stroke(); c.fillStyle = C.muted; c.fillText('$' + fmtBig(v), pw + 6, yy); }
    // base 10k line
    const by = Math.round(Y(10000)) + .5; if (by > padT && by < padT + eqH) { c.strokeStyle = C['line-2']; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(0, by); c.lineTo(pw, by); c.stroke(); c.setLineDash([]); }
    // month ticks, spaced by pixels so labels never collide
    c.textAlign = 'center'; c.textBaseline = 'top'; let lastX = -1e9;
    R.dates.forEach((d, i) => { if (d.getDate() !== 1) return; const xx = Math.round(X(i)) + .5; if (xx - lastX < 64 || xx < 18 || xx > pl - 18) return; lastX = xx;
      c.strokeStyle = C.grid; c.beginPath(); c.moveTo(xx, padT); c.lineTo(xx, padT + ph); c.stroke(); c.fillStyle = C.dim; c.fillText(d.toLocaleDateString('en-US', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2), xx, h - padB + 3); });
    c.textAlign = 'left';
    // lines
    const path = (arr, col, dash) => { c.strokeStyle = col; c.lineWidth = 2; c.setLineDash(dash || []); c.beginPath(); arr.forEach((v, i) => { const xx = X(i), yy = Y(v * 10000); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }); c.stroke(); c.setLineDash([]); c.lineWidth = 1; };
    path(R.bh, C['s-bh'], [5, 3]); path(R.eq, C['s-eq']);
    // direct labels at line ends
    c.font = '600 10.5px "IBM Plex Sans", sans-serif'; c.textBaseline = 'middle';
    const ye = Y(R.eq[n - 1] * 10000), yb = Y(R.bh[n - 1] * 10000);
    let [l1, l2] = [ye, yb]; if (Math.abs(l1 - l2) < 13) { const m = (l1 + l2) / 2, sgn = l1 <= l2 ? -1 : 1; l1 = m + sgn * 6.5; l2 = m - sgn * 6.5; }
    const clampY = v => Math.max(padT + 6, Math.min(padT + eqH - 6, v));
    c.textAlign = 'left'; c.fillStyle = C['s-eq']; c.fillRect(pl + 4, clampY(l1) - 1, 6, 2); c.fillStyle = C.text; c.fillText('Strategy', pl + 13, clampY(l1));
    c.fillStyle = C['s-bh']; c.fillRect(pl + 4, clampY(l2) - 1, 6, 2); c.fillStyle = C.muted; c.fillText('B&H', pl + 13, clampY(l2));
    // drawdown area
    c.fillStyle = alpha(C.down, .16); c.strokeStyle = C.down; c.beginPath(); c.moveTo(0, YD(0));
    R.s.dd.forEach((d, i) => c.lineTo(X(i), YD(d))); c.lineTo(pl, YD(0)); c.closePath(); c.fill();
    c.beginPath(); R.s.dd.forEach((d, i) => i ? c.lineTo(X(i), YD(d)) : c.moveTo(X(i), YD(d))); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1;
    c.font = MONO; c.fillStyle = C.muted; c.textBaseline = 'middle'; c.fillText(pct(ddMin, 0), pw + 6, YD(ddMin) - 4); c.fillText('0%', pw + 6, YD(0) + 4);
    // hover
    if (eqHover && eqHover.x >= 0 && eqHover.x <= pl) {
      const i = Math.max(0, Math.min(n - 1, Math.round(eqHover.x / pl * (n - 1)))), xx = Math.round(X(i)) + .5;
      c.strokeStyle = C.cross; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(xx, padT); c.lineTo(xx, padT + ph); c.stroke(); c.setLineDash([]);
      [[R.eq[i] * 1e4, C['s-eq']], [R.bh[i] * 1e4, C['s-bh']]].forEach(([v, col]) => { c.beginPath(); c.arc(xx, Y(v), 4, 0, 7); c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = C.panel; c.stroke(); c.lineWidth = 1; });
      eqTip.hidden = false;
      eqTip.innerHTML = `<div class="d">${R.dates[i].toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div><div class="r"><span>Strategy</span>$${fmt(R.eq[i] * 1e4, 0)}</div><div class="r"><span>Buy &amp; hold</span>$${fmt(R.bh[i] * 1e4, 0)}</div><div class="r"><span>Drawdown</span>${pct(R.s.dd[i], 1)}</div>`;
      const tw = eqTip.offsetWidth; let tx = eqHover.x + 14; if (tx + tw > pl) tx = eqHover.x - tw - 14;
      eqTip.style.transform = `translate(${Math.max(2, tx)}px, ${padT + 4}px)`;
    } else eqTip.hidden = true;
  }
  eqCv.addEventListener('pointermove', e => { const r = eqCv.getBoundingClientRect(); eqHover = { x: e.clientX - r.left }; drawEquity(); });
  eqCv.addEventListener('pointerleave', () => { eqHover = null; drawEquity(); });

  // heatmap sweep
  const HF = [5, 10, 15, 20, 30, 40, 50, 70], HS = [30, 50, 75, 100, 125, 150, 200, 250];
  function mix(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const ch = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; }
  function renderHeat() {
    if (!lastBT) return;
    const P = lastBT.P, el = $('#heat'); let html = '';
    HS.slice().reverse().forEach(s => {
      html += `<span class="ax">${s}</span>`;
      HF.forEach(f => {
        if (f >= s) { html += '<span></span>'; return; }
        const sh = backtest(cur.daily, f, s, P.fee, P.short, P.look).s.sharpe;
        const t = Math.max(-1, Math.min(1, sh / 1.2));
        const col = t < 0 ? mix(C['div-mid'], C['div-neg'], -t) : mix(C['div-mid'], C['div-pos'], t);
        const sel = f === P.f && s === P.s ? ' is-sel' : '';
        html += `<button type="button" class="${sel}" style="background:${col}" data-f="${f}" data-s="${s}" title="SMA ${f}/${s} · Sharpe ${sh.toFixed(2)}" aria-label="Fast ${f}, slow ${s}, Sharpe ${sh.toFixed(2)}"></button>`;
      });
    });
    html += '<span class="ax">s/f</span>' + HF.map(f => `<span class="ax">${f}</span>`).join('');
    el.innerHTML = html;
  }
  $('#heat').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('#bt-fast').value = b.dataset.f; $('#bt-slow').value = b.dataset.s; runBT(); });

  /* ================= selection / controls ================= */
  function select(i) {
    cur = SYMS[(i + SYMS.length) % SYMS.length];
    $$('#wl li').forEach(li => li.setAttribute('aria-selected', li.dataset.i == SYMS.indexOf(cur)));
    $('#sym-name').textContent = cur.id + '/USD';
    $('#sym-px').dataset.v = '';
    view.offset = 0; runBT(); drawKPIs(); drawBook(); dirty.chart = true;
  }
  $$('#intervals button').forEach(b => { b.classList.toggle('is-on', +b.dataset.iv === iv); b.setAttribute('aria-pressed', +b.dataset.iv === iv); b.addEventListener('click', () => setIv(+b.dataset.iv)); });
  function setIv(v) { iv = v; store.set('qt-iv', v); $$('#intervals button').forEach(b => { const on = +b.dataset.iv === iv; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }); view.offset = 0; dirty.chart = true; }
  $$('.lg').forEach(b => b.addEventListener('click', () => { const k = b.dataset.series; show[k] = !show[k]; b.classList.toggle('is-on', show[k]); b.setAttribute('aria-pressed', show[k]); dirty.chart = true; }));
  function setTheme(t) { document.documentElement.dataset.theme = t; store.set('qt-theme', t); try { localStorage.setItem('qt-theme', t); } catch { } readColors(); renderHeat(); drawEquity(); drawWatch(); dirty.chart = true; }
  $('#btn-theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  function togglePause() { paused = !paused; $('#btn-pause').setAttribute('aria-pressed', paused); $('#feed').classList.toggle('paused', paused); $('#feed-label').textContent = paused ? 'PAUSED' : 'SIM FEED · 1s'; }
  $('#btn-pause').addEventListener('click', togglePause);
  const help = $('#help');
  $('#btn-help').addEventListener('click', () => help.showModal());
  // collapse
  const grid = $('#grid');
  function collapse(which) {
    const el = $('#' + which), on = !el.classList.contains('is-collapsed');
    el.classList.toggle('is-collapsed', on);
    if (which !== 'bt') grid.classList.toggle(which + '-collapsed', on);
    el.querySelector('.collapse').setAttribute('aria-expanded', !on);
    const st = store.get('qt-collapsed', {}); st[which] = on; store.set('qt-collapsed', st);
    requestAnimationFrame(() => { dirty.chart = true; drawEquity(); drawWatch(); });
  }
  $$('[data-collapse]').forEach(b => b.addEventListener('click', () => collapse(b.dataset.collapse)));
  Object.entries(store.get('qt-collapsed', {})).forEach(([k, v]) => { if (v) collapse(k); });

  // resizable gutters
  const center = $('#center');
  const sizes = Object.assign({ lw: 236, rw: 300, bh: 350 }, store.get('qt-sizes', {}));
  function applySizes() { grid.style.setProperty('--lw', sizes.lw + 'px'); grid.style.setProperty('--rw', sizes.rw + 'px'); center.style.setProperty('--bh', sizes.bh + 'px'); }
  function clampSizes() {
    sizes.lw = Math.max(170, Math.min(420, sizes.lw)); sizes.rw = Math.max(220, Math.min(460, sizes.rw));
    sizes.bh = Math.max(150, Math.min(Math.max(150, center.clientHeight - 200), sizes.bh));
  }
  applySizes();
  $$('.gutter').forEach(g => {
    const kind = g.dataset.resize;
    const nudge = d => { if (kind === 'left') sizes.lw += d; else if (kind === 'right') sizes.rw -= d; else sizes.bh -= d; clampSizes(); applySizes(); store.set('qt-sizes', sizes); dirty.chart = true; drawEquity(); };
    g.addEventListener('pointerdown', e => {
      e.preventDefault(); g.setPointerCapture(e.pointerId); g.classList.add('is-drag');
      let last = kind === 'bottom' ? e.clientY : e.clientX;
      const move = ev => { const cur2 = kind === 'bottom' ? ev.clientY : ev.clientX; nudge(cur2 - last); last = cur2; };
      const up = () => { g.classList.remove('is-drag'); g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', move); g.addEventListener('pointerup', up);
    });
    g.addEventListener('keydown', e => {
      const k = e.key; const d = 16;
      if (kind === 'bottom' && (k === 'ArrowUp' || k === 'ArrowDown')) { e.preventDefault(); nudge(k === 'ArrowUp' ? -d : d); }
      if (kind !== 'bottom' && (k === 'ArrowLeft' || k === 'ArrowRight')) { e.preventDefault(); nudge(k === 'ArrowLeft' ? -d : d); }
    });
  });

  // keyboard shortcuts
  addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.classList && e.target.classList.contains('gutter') && e.key.startsWith('Arrow')) return;
    const k = e.key;
    if (k >= '1' && k <= '6') select(+k - 1);
    else if (k === 'ArrowDown') { e.preventDefault(); select(SYMS.indexOf(cur) + 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); select(SYMS.indexOf(cur) - 1); }
    else if (k === 'ArrowLeft') { view.offset += view.count * .1; dirty.chart = true; }
    else if (k === 'ArrowRight') { view.offset -= view.count * .1; dirty.chart = true; }
    else if (k === '+' || k === '=') zoom(1 / 1.2);
    else if (k === '-' || k === '_') zoom(1.2);
    else if (k === '0') { view.count = 110; view.offset = 0; dirty.chart = true; }
    else if (k === 'i' || k === 'I') { const L = [5, 15, 60, 300]; setIv(L[(L.indexOf(iv) + 1) % L.length]); }
    else if (k === 'b' || k === 'B') runBT();
    else if (k === 't' || k === 'T') setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    else if (k === '[') collapse('watch');
    else if (k === ']') collapse('book');
    else if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === '?') { help.open ? help.close() : help.showModal(); }
  });

  /* ================= loop ================= */
  const dirty = { chart: true };
  function frame() {
    if (dirty.chart) { dirty.chart = false; drawChart(); }
    requestAnimationFrame(frame);
  }
  function second() {
    $('#clock').textContent = new Date().toTimeString().slice(0, 8);
    if (paused) return;
    tickAll(); drawKPIs(); drawBook(); drawWatch(); dirty.chart = true;
  }
  if ('ResizeObserver' in window) {
    let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { clampSizes(); applySizes(); dirty.chart = true; drawEquity(); drawWatch(); }, 30); }).observe(document.body);
  }

  // restore backtest params
  const saved = store.get('qt-bt', null);
  if (saved) { $('#bt-fast').value = saved.f; $('#bt-slow').value = saved.s; $('#bt-fee').value = saved.fee; $('#bt-short').checked = !!saved.short; $('#bt-look').value = saved.look; }
  const go = () => { readColors(); select(0); drawWatch(); second(); setInterval(second, 1000); requestAnimationFrame(frame); };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
})();
