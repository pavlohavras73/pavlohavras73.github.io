(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), menu = $('#mobile-menu');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); menu.hidden = !open;
    nav.classList.add('is-scrolled');
  });
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; }));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = (reduced ? 0 : Math.min(sibs.indexOf(el), 5) * 70) + 'ms';
      el.classList.add('is-in'); io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    if (reduced) { el.textContent = to.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = t => { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 4));
      el.textContent = v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- workflow diagram ---------- */
  const flow = $('#flow'), svg = $('#flow-wires'), nodes = $$('.node', flow), logEl = $('#flow-log');
  const NS = 'http://www.w3.org/2000/svg';
  let paths = [];
  function layoutWires() {
    const fr = flow.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${fr.width} ${fr.height}`);
    svg.innerHTML = `<defs><linearGradient id="wiregrad" x1="0" x2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>`;
    paths = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i].getBoundingClientRect(), b = nodes[i + 1].getBoundingClientRect();
      let d;
      const ax = a.left - fr.left, ay = a.top - fr.top, bx = b.left - fr.left, by = b.top - fr.top;
      if (Math.abs(a.top - b.top) < 8) { // same row → horizontal
        const x1 = ax + a.width, y1 = ay + a.height / 2, x2 = bx, y2 = by + b.height / 2, m = (x2 - x1) / 2;
        d = `M${x1},${y1} C${x1 + m},${y1} ${x2 - m},${y2} ${x2},${y2}`;
      } else { // wrap → vertical s-curve
        const x1 = ax + a.width / 2, y1 = ay + a.height, x2 = bx + b.width / 2, y2 = by, m = (y2 - y1) / 2;
        d = `M${x1},${y1} C${x1},${y1 + m} ${x2},${y2 - m} ${x2},${y2}`;
      }
      const base = document.createElementNS(NS, 'path'); base.setAttribute('d', d); base.setAttribute('class', 'wire');
      const hot = document.createElementNS(NS, 'path'); hot.setAttribute('d', d); hot.setAttribute('class', 'wire-hot');
      svg.append(base, hot); paths.push(hot);
    }
    const pulse = document.createElementNS(NS, 'circle'); pulse.setAttribute('r', 4); pulse.setAttribute('class', 'pulse'); pulse.style.opacity = 0;
    svg.append(pulse); paths.pulse = pulse;
  }
  layoutWires();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layoutWires, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(layoutWires, 80); }).observe(flow);

  const leads = [
    { from: '@m.ortega', msg: '“Need a quote for 40 seats, starting next month”', seats: 40, budget: '$18k', score: 86, owner: 'Dana K.' },
    { from: '@lin_ops', msg: '“Can you integrate with our billing? ~120 users”', seats: 120, budget: '$52k', score: 91, owner: 'Ravi P.' },
    { from: '@hugo.b', msg: '“Pricing for a 12-person agency?”', seats: 12, budget: '$4.8k', score: 64, owner: 'Ana S.' }
  ];
  const now = () => new Date().toTimeString().slice(0, 8);
  function log(cls, tag, text) {
    const li = document.createElement('li');
    li.innerHTML = `<time>${now()}</time><b class="${cls}">${tag}</b><span>${text}</span>`;
    logEl.append(li); while (logEl.children.length > 7) logEl.firstChild.remove();
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function travel(path, dur) {
    return new Promise(res => {
      const p = paths.pulse; if (!p || reduced) return res();
      const len = path.getTotalLength(); const t0 = performance.now(); p.style.opacity = 1;
      const f = t => { const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const pt = path.getPointAtLength(len * e); p.setAttribute('cx', pt.x); p.setAttribute('cy', pt.y);
        if (k < 1) requestAnimationFrame(f); else { p.style.opacity = 0; res(); } };
      requestAnimationFrame(f);
    });
  }
  let flowVisible = false, flowRunning = false;
  new IntersectionObserver(([e]) => { flowVisible = e.isIntersecting; if (flowVisible && !flowRunning) runFlow(); }, { threshold: .25 }).observe(flow);
  async function runFlow() {
    flowRunning = true; let i = 0;
    while (flowVisible) {
      const L = leads[i++ % leads.length];
      nodes.forEach(n => n.classList.remove('is-active', 'is-done')); paths.forEach(p => p.classList.remove('on'));
      const steps = [
        () => log('t-tg', 'telegram', `message from ${L.from}: ${L.msg}`),
        () => log('t-ai', 'agent', `intent=<span style="color:#fff">quote_request</span> seats=${L.seats} est_budget=${L.budget} (0.41s)`),
        () => log('t-wf', 'workflow', `enriched company · lead_score=<span style="color:#fff">${L.score}</span> · 4/4 steps ok`),
        () => log('t-crm', 'crm', `deal created → owner <span style="color:#fff">${L.owner}</span> · reply sent ✓`)
      ];
      for (let s = 0; s < nodes.length; s++) {
        if (!flowVisible) break;
        nodes[s].classList.add('is-active'); steps[s]();
        await sleep(reduced ? 1400 : 900);
        nodes[s].classList.remove('is-active'); nodes[s].classList.add('is-done');
        if (s < paths.length) { paths[s].classList.add('on'); await travel(paths[s], 700); }
      }
      await sleep(1800);
    }
    flowRunning = false;
  }

  /* ---------- bento spotlight + integration grid ---------- */
  $$('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
  const cells = $$('.viz-grid span');
  if (!reduced && cells.length) setInterval(() => {
    cells.forEach(c => c.classList.remove('lit'));
    for (let k = 0; k < 3; k++) cells[Math.floor(Math.random() * cells.length)].classList.add('lit');
  }, 1100);
  else cells.slice(0, 3).forEach(c => c.classList.add('lit'));

  /* ---------- terminal ---------- */
  const term = $('#term');
  const script = [
    ['<span class="p">❯</span> <span class="w">nexa run sales-intake --watch</span>', 'type'],
    ['<span class="c">  ↳ loaded agent</span> <span class="v">sales-intake@v14</span> <span class="c">· model routing: auto · budget $0.05/run</span>'],
    ['<span class="c">  ↳ listening on</span> telegram:@acme_sales<span class="c">, email:sales@acme.test</span>'],
    [''],
    ['<span class="y">●</span> <span class="w">trigger</span>   telegram  <span class="c">“Hi! We’re 40 people, need SSO, quote?”</span>'],
    ['<span class="v">◆</span> <span class="w">think</span>     extract → {seats: 40, needs: ["sso"], urgency: "high"}'],
    ['<span class="v">◆</span> <span class="w">tool</span>      crm.search(domain="orbitalis.test")  <span class="c">→ 0 matches</span>'],
    ['<span class="v">◆</span> <span class="w">tool</span>      enrich.company("orbitalis.test")   <span class="c">→ 52 employees, SaaS</span>'],
    ['<span class="v">◆</span> <span class="w">tool</span>      pricing.quote(plan="scale", seats=40) <span class="c">→ $7,640/yr</span>'],
    ['<span class="y">!</span> <span class="w">guard</span>     discount 15% > policy 10% <span class="c">→ approval requested in #deals</span>'],
    ['<span class="g">✓</span> <span class="w">approved</span>  by dana@acme.test <span class="c">(38s)</span>'],
    ['<span class="g">✓</span> <span class="w">action</span>    crm.deal.create(id=D-2291, owner="Dana K.")'],
    ['<span class="g">✓</span> <span class="w">reply</span>     sent quote PDF + calendar link via telegram'],
    [''],
    ['<span class="g">done</span> <span class="c">in 41.2s · 7 steps · 3 tools · $0.012 · trace: nexa.run/t/8f2c</span>']
  ];
  let termStarted = false;
  function plain(html) { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  async function runTerm() {
    while (true) {
      term.innerHTML = '';
      for (const [line, mode] of script) {
        const row = document.createElement('div'); term.append(row);
        if (mode === 'type' && !reduced) {
          const prefix = '<span class="p">❯</span> ', txt = plain(line).replace(/^❯ /, '');
          for (let i = 0; i <= txt.length; i++) { row.innerHTML = prefix + '<span class="w">' + txt.slice(0, i) + '</span><span class="caret"></span>'; await sleep(38 + Math.random() * 40); }
          row.innerHTML = line; await sleep(400);
        } else { row.innerHTML = line || '&nbsp;'; await sleep(reduced ? 0 : 260 + Math.random() * 380); }
      }
      const c = document.createElement('div'); c.innerHTML = '<span class="p">❯</span> <span class="caret"></span>'; term.append(c);
      if (reduced) return;
      await sleep(5200);
    }
  }
  new IntersectionObserver(([e], o) => { if (e.isIntersecting && !termStarted) { termStarted = true; o.disconnect(); runTerm(); } }, { threshold: .3 }).observe(term);

  /* ---------- pricing toggle ---------- */
  const tBtns = $$('.toggle__btn'), thumb = $('.toggle__thumb'), note = $('#price-note');
  function placeThumb() { const a = $('.toggle__btn.is-active'); thumb.style.width = a.offsetWidth + 'px'; thumb.style.transform = `translateX(${a.offsetLeft - 4}px)`; }
  function setPeriod(per) {
    tBtns.forEach(b => { const on = b.dataset.period === per; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
    placeThumb();
    note.textContent = per === 'yearly' ? 'Billed yearly — two months free. Cancel anytime.' : 'Billed monthly. Cancel anytime.';
    $$('.price .num').forEach(n => {
      const from = +n.textContent, to = +(per === 'yearly' ? n.dataset.y : n.dataset.m);
      if (reduced || from === to) { n.textContent = to; return; }
      const t0 = performance.now();
      const f = t => { const k = Math.min(1, (t - t0) / 500); n.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }
  tBtns.forEach(b => b.addEventListener('click', () => setPeriod(b.dataset.period)));
  addEventListener('resize', placeThumb); document.fonts && document.fonts.ready.then(placeThumb); placeThumb();

  /* ---------- testimonials ---------- */
  const quotes = [
    ['Our support backlog went from 3 days to 40 minutes. The approval cards are the reason legal signed off.', 'Maya Lindqvist', 'Head of Ops, Orbitalis', '#a78bfa'],
    ['We replaced 23 brittle zaps with four Nexa agents. The traces alone are worth the price.', 'Daniel Okafor', 'Automation Lead, Kestrel', '#22d3ee'],
    ['It feels less like a tool and more like hiring a very calm operations engineer.', 'Sofia Brandt', 'COO, Monograph', '#34d399'],
    ['Routing simple steps to a small model cut our LLM bill by 71% with zero quality loss.', 'Kenji Watanabe', 'Platform Eng, Fieldnote', '#fcd34d'],
    ['Inbound leads get a quote in under a minute, at 3am, in their language.', 'Leila Haddad', 'VP Sales, Parallax', '#f0abfc'],
    ['Evals on every deploy means we finally trust prompt changes in production.', 'Tomás Rivera', 'Staff Engineer, Arcwell', '#93c5fd'],
    ['Setup took one afternoon. The Telegram trigger was literally two clicks.', 'Anya Petrenko', 'Founder, Lumen Studio', '#fda4af'],
    ['Finance reconciliations used to eat a week every month. Now it’s a Slack message.', 'Oliver Grant', 'Controller, Northbay', '#c4b5fd']
  ];
  const card = ([q, n, r, c]) => `<figure class="quote"><blockquote>${q}</blockquote><figcaption><span class="avatar" style="background:${c}">${n.split(' ').map(w => w[0]).join('')}</span><span><b>${n}</b><span>${r}</span></span></figcaption></figure>`;
  $$('.marquee__row').forEach((row, i) => {
    const set = (i ? quotes.slice(4).concat(quotes.slice(0, 4)) : quotes).map(card).join('');
    row.innerHTML = set + `<div class="dup" style="display:contents" aria-hidden="true">${set}</div>`;
  });
  if (reduced) $$('.marquee__row .dup').forEach(d => d.remove());

  /* ---------- CTA form ---------- */
  const form = $('#cta-form'), email = $('#cta-email'), msg = $('#cta-msg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.className = 'cta__msg err'; msg.textContent = 'Please enter a valid work email.'; email.focus(); return; }
    msg.className = 'cta__msg ok'; msg.textContent = `You're on the list — we'll reach out to ${v} shortly.`; form.reset();
  });
})();
