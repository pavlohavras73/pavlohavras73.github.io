(() => {
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const rail = document.getElementById('rail');

  // ---------- rail ----------
  slides.forEach((sl, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span>${sl.dataset.label}</span><i></i>`;
    b.setAttribute('aria-label', `Slide ${i + 1}: ${sl.dataset.label}`);
    b.addEventListener('click', () => go(i));
    rail.appendChild(b);
  });
  document.getElementById('tot').textContent = String(slides.length).padStart(2, '0');

  let cur = 0;
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    slides[i].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function setCurrent(i) {
    cur = i;
    document.getElementById('cur').textContent = String(i + 1).padStart(2, '0');
    [...rail.children].forEach((b, k) => b.classList.toggle('on', k === i));
    document.getElementById('prog').style.width = ((i + 1) / slides.length * 100) + '%';
    window.dispatchEvent(new CustomEvent('deck:slide', { detail: slides[i] }));
  }

  // ---------- counters ----------
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const to = +el.dataset.count, t0 = performance.now(), dur = 1400;
    const fmt = n => n.toLocaleString('en-US');
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      // tall slides (stacked cards on phones) never reach 45% visibility, so also accept half a screen
      if (en.isIntersecting && (en.intersectionRatio > .45 || en.intersectionRect.height > innerHeight * .5)) {
        en.target.classList.add('in');
        setCurrent(slides.indexOf(en.target));
        en.target.querySelectorAll('[data-count]').forEach(countUp);
      }
    });
  }, { root: deck, threshold: [.1, .2, .3, .45, .6] });
  slides.forEach(s => io.observe(s));

  // ---------- keyboard ----------
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
  });

  if (matchMedia('print').matches || location.hash === '#print') slides.forEach(s => s.classList.add('in'));
})();
