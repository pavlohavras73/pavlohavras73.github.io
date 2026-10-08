import { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY, forceCollide } from 'https://cdn.jsdelivr.net/npm/d3-force@3/+esm';

const box = document.getElementById('brain');
if (box) {
  const COLORS = ['#ff3b5c', '#ff8a3d', '#a78bfa', '#4da3ff', '#34d399', '#facc15', '#f472b6', '#22d3ee', '#6b6b78'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas');
  box.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(devicePixelRatio, 2);
  const resize = () => {
    W = box.clientWidth; H = box.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  new ResizeObserver(resize).observe(box); resize();

  const data = await fetch('assets/brain.json').then(r => r.json());
  const deg = new Array(data.g.length).fill(0);
  data.e.forEach(([a, b]) => { deg[a]++; deg[b]++; });
  const nodes = data.g.map((g, i) => ({ g, d: deg[i], r: 1.6 + Math.sqrt(deg[i]) * 1.4 }));
  const links = data.e.map(([s, t]) => ({ source: s, target: t }));

  const sim = forceSimulation(nodes)
    .force('link', forceLink(links).distance(18).strength(0.6))
    .force('charge', forceManyBody().strength(-9).distanceMax(160))
    .force('center', forceCenter(0, 0))
    .force('x', forceX(0).strength(0.045))
    .force('y', forceY(0).strength(0.06))
    .force('collide', forceCollide(d => d.r + 0.6))
    .alphaDecay(0.012);

  let mx = -1e9, my = -1e9, scale = 1;
  box.addEventListener('pointermove', e => { const r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  box.addEventListener('pointerleave', () => { mx = my = -1e9; });

  let t = 0, visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) sim.alpha(Math.max(sim.alpha(), 0.3)).restart(); }, { threshold: 0.1 }).observe(box);

  const draw = () => {
    requestAnimationFrame(draw);
    if (!visible) return;
    t += 0.004;
    // fit graph into box
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const n of nodes) { if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x; if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y; }
    const target = Math.min(W / (maxX - minX + 40), H / (maxY - minY + 40));
    scale += (target - scale) * 0.05;
    const rot = reduce ? 0 : t * 0.25;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const P = n => [W / 2 + (n.x * cs - n.y * sn) * scale, H / 2 + (n.x * sn + n.y * cs) * scale];
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.beginPath();
    for (const l of links) { const [x1, y1] = P(l.source), [x2, y2] = P(l.target); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
    for (const n of nodes) {
      const [x, y] = P(n);
      const near = Math.hypot(x - mx, y - my) < 60;
      const r = n.r * Math.max(0.7, scale) * (near ? 1.8 : 1);
      ctx.globalAlpha = n.d ? 0.95 : 0.35;
      ctx.fillStyle = COLORS[n.g];
      if (n.d > 6) { ctx.shadowColor = COLORS[n.g]; ctx.shadowBlur = 10; } else ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  };
  draw();
}
