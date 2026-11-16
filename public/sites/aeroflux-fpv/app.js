// ==========================================================================
// AEROFLUX FPV — APPLICATION LOGIC
// Features: Smooth scroll (Lenis), GSAP ScrollTrigger, Fleet Lineup switcher,
// Build Configurator with real-time physics, procedural track art, and form validation.
// ==========================================================================

(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const story = window.__story = { p: 0, step: 0 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* --------------------------------------------------------------------------
     Smooth Scrolling (Lenis + GSAP ScrollTrigger)
     -------------------------------------------------------------------------- */
  let lenis = null;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // Smooth Anchor Navigation
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();

      // Close mobile nav if open
      const navLinks = $('#nav-links');
      const navToggle = $('#nav-toggle');
      if (navLinks && navLinks.classList.contains('is-open')) {
        navLinks.classList.remove('is-open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      }

      if (lenis) {
        lenis.scrollTo(target, { duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  });

  /* --------------------------------------------------------------------------
     Navigation Bar State & Mobile Drawer
     -------------------------------------------------------------------------- */
  const nav = $('#nav');
  const navCheck = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', navCheck, { passive: true });
  navCheck();

  const navToggle = $('#nav-toggle');
  const navLinks = $('#nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* --------------------------------------------------------------------------
     Story Section: Hero + Anatomy Scroll Progress
     -------------------------------------------------------------------------- */
  const heroCopy = $('#hero-copy');
  const steps = $$('.step');
  const railFill = $('#rail-fill');
  const railLabel = $('#rail-label');
  const stepLabels = [
    '00 // INTRO',
    '01 // CHASSIS',
    '02 // PROPULSION',
    '03 // AVIONICS',
    '04 // OPTICS',
    '05 // POWER',
    '06 // STAGING'
  ];

  const S0 = 0.12;
  const S1 = 0.88;

  function applyStory(p) {
    story.p = p;

    // Crossfade hero copy during initial scroll
    if (heroCopy) {
      const h = clamp(p / 0.1, 0, 1);
      heroCopy.style.opacity = 1 - h;
      heroCopy.style.transform = `translateY(${-h * 50}px)`;
      heroCopy.style.visibility = h >= 1 ? 'hidden' : 'visible';
    }

    // Determine active anatomical step (1 to 6)
    let idx = 0;
    if (p >= S0 && p < S1) {
      idx = 1 + Math.min(4, Math.floor((p - S0) / ((S1 - S0) / 5)));
    } else if (p >= S1) {
      idx = 6;
    }
    story.step = idx;

    steps.forEach((s, i) => {
      const n = i + 1;
      s.classList.toggle('is-on', n === idx);
      s.classList.toggle('is-before', n > idx);
      s.classList.toggle('is-after', n < idx);
    });

    if (railFill) railFill.style.transform = `scaleY(${p})`;
    if (railLabel) railLabel.textContent = stepLabels[idx] || '00 // INTRO';
  }

  if (hasGsap) {
    ScrollTrigger.create({
      trigger: '.story',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (s) => applyStory(s.progress)
    });

    if (!reduced) {
      gsap.from('.hero__line > span', {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.1,
        delay: 0.15
      });
      gsap.from('.hero__badge, .hero__row, .hero__metrics', {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.4
      });
    }
  } else {
    const storyEl = $('.story');
    if (storyEl) {
      const scrollHandler = () => {
        const r = storyEl.getBoundingClientRect();
        applyStory(clamp(-r.top / (r.height - window.innerHeight), 0, 1));
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
      scrollHandler();
    }
  }
  applyStory(0);

  /* --------------------------------------------------------------------------
     Ticker Strip Motion
     -------------------------------------------------------------------------- */
  const ticker = $('#ticker');
  if (hasGsap && !reduced && ticker) {
    gsap.fromTo(
      ticker,
      { xPercent: 0 },
      {
        xPercent: -35,
        ease: 'none',
        scrollTrigger: {
          trigger: '.ticker',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      }
    );
  }

  /* --------------------------------------------------------------------------
     Specs Counters & Reveal Animations
     -------------------------------------------------------------------------- */
  const countUp = (el) => {
    if (el.dataset.counted) return;
    el.dataset.counted = 'true';
    const to = parseFloat(el.dataset.to);
    const dec = +(el.dataset.dec || 0);
    if (reduced || !hasGsap) {
      el.textContent = to.toFixed(dec);
      return;
    }
    const o = { v: 0 };
    gsap.to(o, {
      v: to,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = o.v.toFixed(dec); }
    });
  };

  const specCards = $$('.spec');
  if ('IntersectionObserver' in window) {
    const specObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const s = entry.target;
          s.classList.add('is-in');
          const targetEl = $('[data-to]', s);
          if (targetEl) countUp(targetEl);
          specObs.unobserve(s);
        }
      });
    }, { threshold: 0.1 });
    specCards.forEach((s) => specObs.observe(s));
  } else {
    specCards.forEach((s) => {
      s.classList.add('is-in');
      const targetEl = $('[data-to]', s);
      if (targetEl) countUp(targetEl);
    });
  }

  /* --------------------------------------------------------------------------
     FLEET LINEUP SECTION (8 REAL DRONE PLATFORMS)
     -------------------------------------------------------------------------- */
  let fleetData = [];
  const classNames = {
    whoop: 'MICRO WHOOP · 1S',
    cinewhoop: 'CINEWHOOP · 2S HD',
    toothpick: 'TOOTHPICK · 4S ULTRA',
    racer5: 'PRO RACER · 5″ 6S',
    freestyle5: 'FREESTYLE · 5″ 6S',
    longrange7: 'LONG RANGE · 7″ 6S'
  };

  const droneDescriptions = {
    air65: '22g featherweight indoor drone with 27,000KV brushless motors. Built for microscopic bedroom gaps and subterranean racing.',
    meteor75_pro: 'High-efficiency 75mm platform with 45mm props. Unmatched battery duration and micro-gate momentum.',
    mobula7_1s: 'The benchmark 75mm brushless whoop. Ultra-light, forgiving inverted yaw spins, and indestructible duct geometry.',
    pavo_pico_2s: 'Ultracompact 2S cinewhoop engineered for naked DJI O3 transmission. Smooth cinematic captures with ducted prop protection.',
    crux35_4s: 'Sub-100g 3.5-inch carbon toothpick with 7.5:1 thrust-to-weight ratio. Extreme power-to-weight with nearly silent acoustic profile.',
    racer5_6s: 'Championship flagship. 13.0:1 TWR, 0–100 km/h in 1.1s, 1950KV on 6S power. Designed exclusively for top-step podium racing.',
    freestyle5_6s: 'Reinforced 6mm Toray carbon arms with 1800KV linear throttle curve. Optimized for high-inertia freestyle flow and bando diving.',
    longrange7_6s: 'Expedition-grade 7-inch long range cruiser with 2807 motors and 3000mAh 6S pack. Mountain-surfing range with 25+ min endurance.'
  };

  const fleetGrid = $('#fleet-grid');
  let activeDroneId = 'racer5_6s';

  async function loadFleetSpecs() {
    try {
      const res = await fetch('assets/models/specs.json');
      fleetData = await res.json();
      renderFleetCards();
      selectDrone('racer5_6s');
    } catch (e) {
      console.error('Failed to load drone specs:', e);
    }
  }

  function renderFleetCards(filter = 'all') {
    if (!fleetGrid) return;
    fleetGrid.innerHTML = '';

    const allowedClasses = filter === 'all' ? null : filter.split(',');

    fleetData.forEach((drone) => {
      if (allowedClasses && !allowedClasses.includes(drone.cls)) return;

      const card = document.createElement('div');
      card.className = `fleet-card ${drone.id === activeDroneId ? 'is-active' : ''}`;
      card.dataset.id = drone.id;
      card.innerHTML = `
        <div class="fleet-card__top">
          <span class="chip-badge">${classNames[drone.cls] || drone.cls.toUpperCase()}</span>
          <span class="fleet-card__twr">${drone.twr}:1 TWR</span>
        </div>
        <div class="fleet-card__name">${drone.name}</div>
        <div class="fleet-card__meta">
          <span>${drone.mass_g}g AUW</span>
          <span>${drone.cells}S · ${drone.kv.toLocaleString()}KV</span>
        </div>
      `;

      card.addEventListener('click', () => {
        selectDrone(drone.id);
      });

      fleetGrid.appendChild(card);
    });
  }

  function selectDrone(droneId) {
    activeDroneId = droneId;
    const drone = fleetData.find((d) => d.id === droneId);
    if (!drone) return;

    // Highlight card in fleet grid
    $$('.fleet-card', fleetGrid).forEach((c) => {
      c.classList.toggle('is-active', c.dataset.id === droneId);
    });

    // Update Telemetry Spec Sheet
    const sheetClass = $('#sheet-class');
    const sheetId = $('#sheet-id');
    const sheetName = $('#sheet-name');
    const sheetDesc = $('#sheet-desc');
    const sheetMass = $('#sheet-mass');
    const sheetTwr = $('#sheet-twr');
    const sheetKv = $('#sheet-kv');
    const sheetProp = $('#sheet-prop');
    const sheetBattery = $('#sheet-battery');
    const sheetSpinup = $('#sheet-spinup');

    if (sheetClass) sheetClass.textContent = classNames[drone.cls] || drone.cls.toUpperCase();
    if (sheetId) sheetId.textContent = `ID // ${drone.id.toUpperCase()}`;
    if (sheetName) sheetName.textContent = drone.name;
    if (sheetDesc) sheetDesc.textContent = droneDescriptions[drone.id] || 'High-performance FPV racing craft with precision-tuned Betaflight PID dynamics.';

    if (sheetMass) sheetMass.textContent = `${drone.mass_g.toFixed(1)} g`;
    if (sheetTwr) sheetTwr.textContent = `${drone.twr.toFixed(1)} : 1`;
    if (sheetKv) sheetKv.textContent = `${drone.kv.toLocaleString()} KV`;
    if (sheetProp) sheetProp.textContent = `${drone.prop_mm} mm (${(drone.prop_mm / 25.4).toFixed(1)}″)`;
    if (sheetBattery) sheetBattery.textContent = `${drone.cells}S · ${drone.mah} mAh`;
    if (sheetSpinup) sheetSpinup.textContent = `${drone.spinup_ms.toFixed(1)} ms`;

    // Comparison Progress Bars (Normalized against fleet extremes)
    const barMass = $('#bar-mass');
    const barTwr = $('#bar-twr');
    const barKv = $('#bar-kv');
    const barProp = $('#bar-prop');
    const barBattery = $('#bar-battery');
    const barSpinup = $('#bar-spinup');

    if (barMass) barMass.style.width = `${clamp(drone.mass_g / 1100 * 100, 6, 100)}%`;
    if (barTwr) barTwr.style.width = `${clamp(drone.twr / 13.5 * 100, 8, 100)}%`;
    if (barKv) barKv.style.width = `${clamp(drone.kv / 27000 * 100, 8, 100)}%`;
    if (barProp) barProp.style.width = `${clamp(drone.prop_mm / 180 * 100, 8, 100)}%`;
    if (barBattery) barBattery.style.width = `${clamp((drone.cells * drone.mah) / 18000 * 100, 8, 100)}%`;
    if (barSpinup) barSpinup.style.width = `${clamp(drone.spinup_ms / 60 * 100, 8, 100)}%`;

    // Notify Three.js viewer in drone.js
    window.dispatchEvent(new CustomEvent('aeroflux:select-drone', {
      detail: { id: drone.id, specs: drone }
    }));
  }

  // Filter Pills Handler
  const filterPills = $$('.filter-pill');
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      renderFleetCards(pill.dataset.filter);
    });
  });

  // Link from Lineup to Build Lab
  const btnLoadConfig = $('#btn-load-config');
  if (btnLoadConfig) {
    btnLoadConfig.addEventListener('click', () => {
      // Pre-select matching frame if applicable
      if (activeDroneId.includes('whoop') || activeDroneId.includes('pico')) {
        selectConfigPreset('cine');
      } else if (activeDroneId.includes('freestyle')) {
        selectConfigPreset('freestyle');
      } else {
        selectConfigPreset('pro');
      }
    });
  }

  loadFleetSpecs();

  /* --------------------------------------------------------------------------
     BUILD CONFIGURATOR (FRAME / MOTOR / BATTERY PHYSICS)
     -------------------------------------------------------------------------- */
  const CONFIG_DATA = {
    frame: [
      { id: 'razor', name: 'Razor 5″ Ultra', sub: 'Competition Carbon · 5 mm · Low Drag', w: 108, price: 95, aero: 1.05, arm: 118, color: '#00f0ff' },
      { id: 'apex', name: 'Apex 5″ Unibody', sub: 'Freestyle T700 · 6 mm · HD Armor', w: 136, price: 125, aero: 0.94, arm: 124, color: '#ff7a00' },
      { id: 'ghost', name: 'Ghost 3.5″ Ducted', sub: 'Cinewhoop Carbon · Full Duct Guard', w: 94, price: 105, aero: 0.65, arm: 88, color: '#38bdf8', duct: true }
    ],
    motor: [
      { id: 'v2207', name: 'Flux-V 2207', sub: '1950 KV · 33 g · 1.55 kg Peak Thrust', w: 33, thrust: 1550, price: 98, r: 17 },
      { id: 'r2306', name: 'Flux-R 2306', sub: '2450 KV · 31 g · 1.42 kg High RPM', w: 31, thrust: 1420, price: 88, r: 16 },
      { id: 'm1804', name: 'Flux-M 1804', sub: '3500 KV · 18 g · 0.85 kg Light Whoop', w: 18, thrust: 850, price: 74, r: 13 }
    ],
    battery: [
      { id: '6s1300', name: '6S 1300 Graphene', sub: '22.2 V · 185 g · 150 C High Burst', w: 185, mah: 1300, volt: 1.0, price: 42, len: 76 },
      { id: '6s1550', name: '6S 1550 Endurance', sub: '22.2 V · 245 g · 120 C Extended', w: 245, mah: 1550, volt: 1.0, price: 52, len: 88 },
      { id: '4s1400', name: '4S 1400 Freestyle', sub: '14.8 V · 150 g · 100 C Light Pack', w: 150, mah: 1400, volt: 0.74, price: 32, len: 70 }
    ]
  };

  const BASE_AVIONICS = { w: 72, price: 280 }; // Core F7 FC, 60A ESC, O3 HD VTX, RX
  const configSel = { frame: 0, motor: 0, battery: 0 };

  // Render Config Radio Options
  $$('.opts').forEach((box) => {
    const group = box.dataset.group;
    box.innerHTML = CONFIG_DATA[group].map((opt, i) => `
      <label class="opt">
        <input type="radio" name="${group}" value="${i}" ${i === 0 ? 'checked' : ''}>
        <span class="opt__card">
          <b>${opt.name}</b>
          <small>${opt.sub}</small>
          <em>+$${opt.price}</em>
        </span>
      </label>
    `).join('');
  });

  const cfgForm = $('#cfg');
  if (cfgForm) {
    cfgForm.addEventListener('change', (e) => {
      configSel[e.target.name] = +e.target.value;
      recomputeConfig();
    });
  }

  // Presets Bar
  $$('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.preset-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectConfigPreset(btn.dataset.preset);
    });
  });

  function selectConfigPreset(preset) {
    if (preset === 'pro') {
      configSel.frame = 0; configSel.motor = 0; configSel.battery = 0;
    } else if (preset === 'freestyle') {
      configSel.frame = 1; configSel.motor = 1; configSel.battery = 1;
    } else if (preset === 'cine') {
      configSel.frame = 2; configSel.motor = 2; configSel.battery = 2;
    }

    Object.keys(configSel).forEach((group) => {
      const idx = configSel[group];
      const radio = $(`input[name="${group}"][value="${idx}"]`);
      if (radio) radio.checked = true;
    });

    recomputeConfig();
  }

  const outEls = {
    auw: $('#o-auw'),
    twr: $('#o-twr'),
    time: $('#o-time'),
    speed: $('#o-speed'),
    price: $('#o-price')
  };
  const curVals = { auw: 0, twr: 0, time: 0, speed: 0, price: 0 };

  function tweenStat(key, to, dec) {
    if (!outEls[key]) return;
    if (reduced || !hasGsap) {
      curVals[key] = to;
      outEls[key].textContent = to.toFixed(dec);
      return;
    }
    gsap.to(curVals, {
      [key]: to,
      duration: 0.75,
      ease: 'power3.out',
      onUpdate: () => { outEls[key].textContent = curVals[key].toFixed(dec); }
    });
  }

  function recomputeConfig() {
    const f = CONFIG_DATA.frame[configSel.frame];
    const m = CONFIG_DATA.motor[configSel.motor];
    const b = CONFIG_DATA.battery[configSel.battery];

    const auw = f.w + m.w * 4 + b.w + BASE_AVIONICS.w;
    const thrust = m.thrust * 4 * b.volt;
    const twr = thrust / auw;
    const avgCurrentA = (auw / 1000) * 16.5 * (b.volt < 1 ? 1.2 : 1);
    const flightTime = ((b.mah / 1000) * 0.8 / avgCurrentA) * 60;
    const speed = Math.min(215, (82 + twr * 8.4) * f.aero * (b.volt < 1 ? 0.9 : 1));
    const price = f.price + m.price + b.price + BASE_AVIONICS.price;

    tweenStat('auw', auw, 0);
    tweenStat('twr', twr, 1);
    tweenStat('time', flightTime, 1);
    tweenStat('speed', speed, 0);
    tweenStat('price', price, 0);

    const mAuw = $('#m-auw');
    const mTwr = $('#m-twr');
    const mTime = $('#m-time');
    const mSpeed = $('#m-speed');

    if (mAuw) mAuw.style.width = `${clamp(auw / 750 * 100, 5, 100)}%`;
    if (mTwr) mTwr.style.width = `${clamp(twr / 16 * 100, 5, 100)}%`;
    if (mTime) mTime.style.width = `${clamp(flightTime / 10 * 100, 5, 100)}%`;
    if (mSpeed) mSpeed.style.width = `${clamp(speed / 220 * 100, 5, 100)}%`;

    const nameEl = $('#cfg-name');
    if (nameEl) nameEl.textContent = `AeroFlux · ${f.name} · ${m.name.split(' ')[1]} · ${b.name}`;

    const quickStats = $('#cfg-quick-stats');
    if (quickStats) quickStats.textContent = `${twr.toFixed(1)}:1 TWR · ${Math.round(auw)}g · ${Math.round(speed)} km/h`;

    drawSchematicTop(f, m, b);
  }

  function drawSchematicTop(f, m, b) {
    const svg = $('#topview');
    if (!svg) return;
    const L = f.arm;
    const r = m.r;
    const propR = f.duct ? 52 : 64 + (m.r - 12) * 1.2;
    const arms = [45, 135, 225, 315].map((a) => {
      const rad = (a * Math.PI) / 180;
      return [Math.cos(rad) * L, Math.sin(rad) * L];
    });

    svg.innerHTML = `
      <defs>
        <radialGradient id="propG">
          <stop offset="0" stop-color="${f.color}" stop-opacity="0"/>
          <stop offset="0.82" stop-color="${f.color}" stop-opacity="0.16"/>
          <stop offset="1" stop-color="${f.color}" stop-opacity="0.5"/>
        </radialGradient>
      </defs>
      ${arms.map(([x, y]) => `
        <line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#18202d" stroke-width="20" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="${x}" y2="${y}" stroke="#263347" stroke-width="2"/>
      `).join('')}
      ${arms.map(([x, y], i) => `
        <g transform="translate(${x} ${y})">
          <circle r="${propR}" fill="url(#propG)"/>
          ${f.duct ? `<circle r="${propR + 6}" fill="none" stroke="${f.color}" stroke-width="4" opacity="0.8"/>` : ''}
          <circle r="${propR}" fill="none" stroke="${f.color}" stroke-opacity="0.3" stroke-dasharray="3 6"/>
          <circle r="${r}" fill="#0d1117" stroke="#00f0ff" stroke-width="2.5"/>
          <circle r="${r * 0.35}" fill="#ff7a00"/>
        </g>
      `).join('')}
      <rect x="-32" y="-46" width="64" height="92" rx="8" fill="#111622" stroke="#263347"/>
      <rect x="${-b.len / 2}" y="-20" width="${b.len}" height="40" rx="4" fill="${b.volt < 1 ? '#38bdf8' : '#00f0ff'}" opacity="0.9"/>
      <text x="0" y="5" text-anchor="middle" font-family="JetBrains Mono" font-size="10" font-weight="700" fill="#07090e">${b.name.split(' ')[0]}</text>
      <rect x="-6" y="-${b.len / 2 + 10 > 58 ? 58 : 56}" width="12" height="8" rx="2" fill="#ff7a00"/>
      <path d="M-8 -64 L0 -76 L8 -64" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round"/>
    `;
  }

  recomputeConfig();

  /* --------------------------------------------------------------------------
     SIMULATOR TRACK ARTWORK (HIGH-DPI PROCEDURAL CANVASES)
     -------------------------------------------------------------------------- */
  const TRACK_PALETTES = [
    { sky: ['#090514', '#2a0e38'], sun: '#00f0ff', grid: '#ff2bd6', gate: '#00f0ff', mount: ['#120924', '#1f0d36'], hud: '#00f0ff' },
    { sky: ['#140a02', '#6b2807'], sun: '#ffb347', grid: '#ff7a00', gate: '#ffb347', mount: ['#2e1104', '#471b06'], hud: '#ffb347' },
    { sky: ['#020b17', '#08334a'], sun: '#e0f7ff', grid: '#38bdf8', gate: '#00f0ff', mount: ['#061a29', '#0d283d'], hud: '#e0f7ff' },
    { sky: ['#050212', '#180a30'], sun: '#ff3d71', grid: '#00f0ff', gate: '#ff3d71', mount: ['#0b061c', '#150a2e'], hud: '#00f0ff', city: true },
    { sky: ['#02040a', '#0a1020'], sun: '#00f0ff', grid: '#4f7cff', gate: '#00f0ff', mount: ['#040712', '#090e1f'], hud: '#00f0ff', stars: true }
  ];

  function seedRng(seed) {
    let s = seed * 9301 + 49297;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  }

  function drawTrackArt(cv) {
    const i = +cv.dataset.art;
    const P = TRACK_PALETTES[i] || TRACK_PALETTES[0];
    const R = seedRng(i + 5);
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = cv.clientWidth || cv.parentElement?.clientWidth || 440;
    const h = cv.clientHeight || cv.parentElement?.clientHeight || 550;
    if (!w || !h) return;

    cv.width = w * dpr;
    cv.height = h * dpr;
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);

    const horizon = h * 0.52;

    // Sky gradient
    let grad = c.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, P.sky[0]);
    grad.addColorStop(1, P.sky[1]);
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);

    // Stars / celestial particles
    if (P.stars) {
      for (let k = 0; k < 150; k++) {
        c.fillStyle = `rgba(255,255,255,${R() * 0.85})`;
        c.fillRect(R() * w, R() * horizon, 1.3, 1.3);
      }
    }

    // Sun with synthwave horizontal scanlines
    const sunR = w * 0.22;
    const sunX = w * (0.35 + R() * 0.3);
    const sunY = horizon - sunR * 0.35;

    c.save();
    c.beginPath();
    c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    c.clip();

    grad = c.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    grad.addColorStop(0, P.sun);
    grad.addColorStop(1, P.grid);
    c.fillStyle = grad;
    c.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);

    c.fillStyle = P.sky[1];
    for (let k = 0; k < 7; k++) {
      const yy = sunY + k * sunR * 0.14;
      c.fillRect(sunX - sunR, yy, sunR * 2, 2.5 + k * 1.5);
    }
    c.restore();

    // Mountain or City Skyline Silhouettes
    P.mount.forEach((col, layer) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, horizon);

      if (P.city && layer === 1) {
        let cx = 0;
        while (cx < w) {
          const bw = 16 + R() * 28;
          const bh = 25 + R() * h * 0.22;
          c.lineTo(cx, horizon - bh);
          c.lineTo(cx + bw, horizon - bh);
          cx += bw;
          c.lineTo(cx, horizon);
        }
      } else {
        for (let x = 0; x <= w; x += w / 12) {
          c.lineTo(x, horizon - (layer ? 20 : 42) - R() * h * (layer ? 0.08 : 0.15));
        }
      }

      c.lineTo(w, horizon);
      c.closePath();
      c.fill();
    });

    // Floor Grid Perspective
    grad = c.createLinearGradient(0, horizon, 0, h);
    grad.addColorStop(0, '#040609');
    grad.addColorStop(1, P.sky[0]);
    c.fillStyle = grad;
    c.fillRect(0, horizon, w, h - horizon);

    c.strokeStyle = P.grid;
    c.lineWidth = 1.2;
    const vx = w / 2;
    for (let k = -12; k <= 12; k++) {
      c.globalAlpha = 0.45;
      c.beginPath();
      c.moveTo(vx + k * 6, horizon);
      c.lineTo(vx + k * w * 0.16, h);
      c.stroke();
    }

    for (let k = 1; k < 16; k++) {
      const t = Math.pow(k / 16, 2.2);
      const y = horizon + (h - horizon) * t;
      c.globalAlpha = 0.18 + t * 0.45;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }
    c.globalAlpha = 1;

    // Receding FPV Race Gates
    c.strokeStyle = P.gate;
    c.shadowColor = P.gate;
    c.shadowBlur = 18;
    for (let k = 4; k >= 0; k--) {
      const t = 1 - k / 5;
      const gw = w * (0.12 + t * 0.52);
      const gh = gw * 0.64;
      const gx = vx + Math.sin(k * 1.4 + i) * w * 0.12 * (1 - t) - gw / 2;
      const gy = horizon + (h - horizon) * Math.pow(t, 2.2) * 0.86 - gh;
      c.lineWidth = 2 + t * 6;
      c.globalAlpha = 0.35 + t * 0.65;
      c.strokeRect(gx, gy, gw, gh);
    }
    c.globalAlpha = 1;
    c.shadowBlur = 0;

    // Flight OSD Overlay
    c.strokeStyle = P.hud;
    c.fillStyle = P.hud;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(w / 2 - 16, h * 0.42); c.lineTo(w / 2 - 5, h * 0.42);
    c.moveTo(w / 2 + 5, h * 0.42); c.lineTo(w / 2 + 16, h * 0.42);
    c.moveTo(w / 2, h * 0.42 - 10); c.lineTo(w / 2, h * 0.42 - 3);
    c.stroke();

    c.font = '600 11px "JetBrains Mono", monospace';
    c.fillText(`LQ ${94 + i}`, 16, 26);
    c.fillText(`${(22.1 + i * 0.15).toFixed(1)}V`, 16, 42);

    c.textAlign = 'right';
    c.fillText(`00:${(31 + i * 7)}.${(17 + i * 13) % 100}`, w - 16, 26);
    c.fillText(`${142 + i * 9} KM/H`, w - 16, 42);
    c.textAlign = 'left';
  }

  const trackCanvases = $$('.track canvas');
  const drawAllTracks = () => trackCanvases.forEach(drawTrackArt);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(drawAllTracks);
  requestAnimationFrame(drawAllTracks);
  setTimeout(drawAllTracks, 400);

  if ('IntersectionObserver' in window) {
    const trackObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          drawTrackArt(e.target);
        }
      });
    }, { rootMargin: '250px' });
    trackCanvases.forEach((cv) => trackObs.observe(cv));
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAllTracks, 160);
  });

  // Desktop Horizontal Pin Gallery
  if (hasGsap) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 721px)', () => {
      const trackStrip = $('#sim-track');
      const pinEl = $('.sim__pin');
      if (!trackStrip || !pinEl) return;
      const dist = () => Math.max(0, trackStrip.scrollWidth - window.innerWidth + 64);
      const tw = gsap.to(trackStrip, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinEl,
          start: 'top 72px',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: reduced ? true : 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });
      return () => tw.kill();
    });
  }

  /* --------------------------------------------------------------------------
     PRE-ORDER & RESERVATION MODAL
     -------------------------------------------------------------------------- */
  const modal = $('#reserve-modal');
  const modalBackdrop = $('#modal-backdrop');
  const modalClose = $('#modal-close');
  const modalSummary = $('#modal-summary');
  const modalForm = $('#modal-form');

  function openReservation(title, price, details) {
    if (!modal) return;
    if (modalSummary) {
      modalSummary.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <strong style="color:var(--text-pure); font-size:14px;">${title}</strong>
          <span style="color:var(--cyan); font-weight:700; font-size:16px;">$${price} USD</span>
        </div>
        <p style="color:var(--text-muted); margin-top:4px;">${details}</p>
        <p style="color:var(--amber); font-size:11px; margin-top:6px;">BATCH 01 ALLOCATION · ESTIMATED DISPATCH Q1 2027</p>
      `;
    }
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeReservation() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  if (modalBackdrop) modalBackdrop.addEventListener('click', closeReservation);
  if (modalClose) modalClose.addEventListener('click', closeReservation);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) {
      closeReservation();
    }
  });

  // Pre-order tier triggers
  $$('.btn-preorder-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tier = btn.dataset.tier;
      const price = btn.dataset.price;
      openReservation(`AeroFlux ${tier}`, price, 'Includes factory flight-test report and immediate lifetime Sim Ultra beta access.');
    });
  });

  // Configurator Reserve Trigger
  const btnReserveBuild = $('#btn-reserve-build');
  if (btnReserveBuild) {
    btnReserveBuild.addEventListener('click', () => {
      const f = CONFIG_DATA.frame[configSel.frame];
      const m = CONFIG_DATA.motor[configSel.motor];
      const b = CONFIG_DATA.battery[configSel.battery];
      const total = f.price + m.price + b.price + BASE_AVIONICS.price;
      openReservation(
        `Custom AeroFlux Build (${f.name})`,
        total,
        `${f.name} + 4x ${m.name} + ${b.name} + H7 Flight Stack`
      );
    });
  }

  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const mail = $('#m-email').value;
      if (modalSummary) {
        modalSummary.innerHTML = `
          <p style="color:var(--cyan); font-weight:700;">PRIORITY RESERVATION CONFIRMED</p>
          <p style="color:var(--text-pure); margin-top:4px;">We've locked your Batch 01 dispatch slot for <strong>${mail}</strong>.</p>
          <p style="color:var(--text-muted); font-size:11px; margin-top:4px;">Your AeroFlux Sim Ultra activation token will arrive shortly.</p>
        `;
      }
      modalForm.style.display = 'none';
      setTimeout(() => {
        closeReservation();
        modalForm.style.display = '';
        modalForm.reset();
      }, 3500);
    });
  }

  /* --------------------------------------------------------------------------
     PILOT LIST NEWSLETTER FORM VALIDATION
     -------------------------------------------------------------------------- */
  const joinForm = $('#join-form');
  const fields = {
    call: {
      el: $('#f-call'),
      err: $('#e-call'),
      test: (v) => (v.trim().length >= 3 && /^[\w .-]+$/.test(v.trim()) ? '' : 'Callsign must be at least 3 alphanumeric characters.')
    },
    mail: {
      el: $('#f-mail'),
      err: $('#e-mail'),
      test: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter a valid pilot dispatch email.')
    },
    level: {
      el: $('#f-level'),
      err: $('#e-level'),
      test: (v) => (v ? '' : 'Select your flight background.')
    },
    ok: {
      el: $('#f-ok'),
      err: $('#e-ok'),
      test: (_, el) => (el.checked ? '' : 'Please accept the dispatch policy.')
    }
  };

  function checkField(f) {
    if (!f.el || !f.err) return true;
    const msg = f.test(f.el.value, f.el);
    f.err.textContent = msg;
    f.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  Object.values(fields).forEach((f) => {
    if (!f.el) return;
    f.el.addEventListener('blur', () => { if (f.touched) checkField(f); });
    f.el.addEventListener('input', () => { f.touched = true; if (f.el.getAttribute('aria-invalid') === 'true') checkField(f); });
    f.el.addEventListener('change', () => { f.touched = true; checkField(f); });
  });

  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.values(fields).map(checkField);
      const firstBad = Object.values(fields).find((f, i) => !results[i]);

      const joinOk = $('#join-ok');
      if (firstBad) {
        firstBad.el.focus();
        if (joinOk) joinOk.textContent = '';
        return;
      }

      const callsign = fields.call.el.value.trim().toUpperCase();
      const token = `AERO-${Math.floor(1000 + Math.random() * 9000)}-${callsign.slice(0, 4)}`;

      if (joinOk) {
        joinOk.innerHTML = `
          <strong>CLEARANCE GRANTED // CALLSIGN: ${callsign}</strong><br>
          Your Batch 01 pilot credentials are registered. Beta Access Key: <code style="color:#fff; background:#18202d; padding:2px 6px; border-radius:3px;">${token}</code> has been dispatched to your inbox.
        `;
      }

      joinForm.reset();
      Object.values(fields).forEach((f) => {
        if (f.el) {
          f.el.removeAttribute('aria-invalid');
          f.touched = false;
        }
      });
    });
  }

})();
