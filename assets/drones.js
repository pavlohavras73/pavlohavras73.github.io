import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('fpv-stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD = 5200;               // ms per drone
const CLASS_LABEL = { whoop: 'Tiny whoop', cinewhoop: 'Cinewhoop', toothpick: 'Toothpick', racer5: '5" Racer', freestyle5: '5" Freestyle', longrange7: '7" Long range' };

const specs = await fetch('assets/drones/specs.json').then(r => r.json());

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);

// lights: warm key, cool rim, accent under-glow
const key = new THREE.DirectionalLight(0xffe2cc, 3.4); key.position.set(3, 4, 2); scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb8ff, 3.2); rim.position.set(-4, 2, -3); scene.add(rim);
const under = new THREE.PointLight(0xff5a3d, 6, 4, 2); under.position.set(0, -0.6, 0); scene.add(under);
scene.add(new THREE.AmbientLight(0xffffff, 0.15));

// floor ring
const ringGeo = new THREE.RingGeometry(0.98, 1.0, 128);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: .55, side: THREE.DoubleSide });
const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.36; ring.scale.setScalar(.8); scene.add(ring);
const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: 0xff5a3d, transparent: true, opacity: .06 }));
disc.rotation.x = -Math.PI / 2; disc.position.y = -0.361; disc.scale.setScalar(.8); scene.add(disc);

// materials
const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a33, metalness: .5, roughness: .38, clearcoat: .8, clearcoatRoughness: .25 });
const accentMat = new THREE.MeshPhysicalMaterial({ color: 0xff6a2b, metalness: .2, roughness: .3, emissive: 0xff3d1a, emissiveIntensity: .35, clearcoat: 1 });
const propMat = new THREE.MeshPhysicalMaterial({ color: 0xff8a3d, metalness: 0, roughness: .2, transmission: .35, thickness: .02, transparent: true, opacity: .85, emissive: 0xff5a1a, emissiveIntensity: .25 });

const pivot = new THREE.Group(); scene.add(pivot);
const loader = new GLTFLoader();
const cache = new Map();

function prepare(gltf) {
  const root = gltf.scene;
  const props = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const n = (o.name + ' ' + (o.parent?.name || '')).toLowerCase();
    if (n.includes('prop')) { o.material = propMat; props.push(o); }
    else if (n.includes('nose')) o.material = accentMat;
    else o.material = bodyMat;
    o.geometry.computeVertexNormals();
  });
  // normalise size → fit in unit sphere, centred
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = 1.15 / Math.max(size.x, size.z, size.y);
  const g = new THREE.Group();
  root.position.sub(c);
  g.add(root); g.scale.setScalar(s);
  // Props spin about their own shaft, through the hub.
  // Hub = centroid of the prop's vertices: for a 3-blade prop the bounding-box centre sits ~13% of
  // the span off the hub, which made the prop wobble around the wrong point.
  // Shaft = the prop's thinnest geometry axis (Blender exports are Z-up inside a rotated parent,
  // so the parent's Y is not the shaft).
  const spinners = props.map(p => {
    const g = p.geometry;
    if (!g.userData.hubCentred) {            // geometry can be shared between props: centre it once
      const pos = g.attributes.position, hub = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) hub.add(new THREE.Vector3().fromBufferAttribute(pos, i));
      hub.divideScalar(pos.count);
      g.translate(-hub.x, -hub.y, -hub.z);
      g.userData.hubCentred = hub;
    }
    const hub = g.userData.hubCentred;      // keep the mesh where it was: move the node by the same offset
    p.position.add(hub.clone().multiply(p.scale).applyQuaternion(p.quaternion));
    g.computeBoundingBox();
    const ext = g.boundingBox.getSize(new THREE.Vector3()).toArray();
    p.userData.axis = new THREE.Vector3().setComponent(ext.indexOf(Math.min(...ext)), 1);  // local space
    return p;
  });
  return { g, spinners };
}

function load(id) {
  if (!cache.has(id)) cache.set(id, new Promise((res, rej) => loader.load(`assets/drones/${id}.glb`, gl => res(prepare(gl)), undefined, rej)));
  return cache.get(id);
}

// ---------- spec panel ----------
const $ = id => document.getElementById(id);
const dots = $('sp-dots');
specs.forEach((s, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', s.name);
  b.addEventListener('click', () => { show(i); restartTimer(); });
  dots.appendChild(b);
});
function tween(el, to, dec = 0) {
  const from = parseFloat(el.dataset.v || 0), t0 = performance.now(), dur = 900;
  el.dataset.v = to;
  const f = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = (from + (to - from) * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (p < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}
function fillSpec(i) {
  const s = specs[i];
  $('sp-name').textContent = s.name;
  $('sp-cls').textContent = CLASS_LABEL[s.cls] || s.cls;
  $('sp-idx').textContent = `${i + 1} / ${specs.length}`;
  tween($('sp-mass'), s.mass_g, s.mass_g < 100 ? 1 : 0);
  tween($('sp-twr'), s.twr, 1);
  tween($('sp-kv'), s.kv);
  tween($('sp-cells'), s.cells);
  tween($('sp-prop'), s.prop_mm);
  tween($('sp-spin'), s.spinup_ms, 0);
  [...dots.children].forEach((b, k) => b.classList.toggle('on', k === i));
}

// ---------- carousel ----------
let idx = 0, current = null, incoming = null, swapT = 1, timer, barStart = performance.now();
async function show(i) {
  idx = (i + specs.length) % specs.length;
  fillSpec(idx);
  const d = await load(idx === i ? specs[idx].id : specs[idx].id);
  if (incoming) pivot.remove(incoming.g);
  incoming = d;
  d.g.scale.multiplyScalar(1);            // keep
  d.g.userData.base = d.g.userData.base || d.g.scale.x;
  d.g.scale.setScalar(0.0001);
  d.g.rotation.set(0, -1.2, 0);
  pivot.add(d.g);
  swapT = 0;
  barStart = performance.now();
  load(specs[(idx + 1) % specs.length].id); // prefetch next
}
function restartTimer() { clearInterval(timer); if (!reduce) timer = setInterval(() => show(idx + 1), HOLD); }

// ---------- sizing / visibility ----------
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const narrow = w < 900;
  camera.position.set(0, 0.85, 4.4);
  camera.lookAt(0, 0, 0);
  // desktop: drone sits in the gap between copy (left) and spec card (right)
  camera.setViewOffset(w, h, narrow ? 0 : -w * 0.05, narrow ? 0 : -h * 0.02, w, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();

let visible = false;
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible) { if (!current && !incoming) show(0); restartTimer(); } else clearInterval(timer);
}, { threshold: 0.15 }).observe(stage);

// subtle pointer parallax
let mx = 0, my = 0;
stage.parentElement.addEventListener('pointermove', e => {
  const r = stage.getBoundingClientRect();
  mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5;
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  // transition: old shrinks & lifts, new grows with a spin
  if (swapT < 1) {
    swapT = Math.min(1, swapT + dt / 0.9);
    const e = 1 - Math.pow(1 - swapT, 3);
    if (incoming) { incoming.g.scale.setScalar(incoming.g.userData.base * e); incoming.g.rotation.y = -1.2 * (1 - e); }
    if (current && current !== incoming) {
      current.g.scale.setScalar(current.g.userData.base * (1 - e));
      current.g.position.y = e * 0.6;
      if (swapT === 1) { pivot.remove(current.g); current.g.position.y = 0; }
    }
    if (swapT === 1) { current = incoming; incoming = null; }
  }
  pivot.rotation.y += dt * (reduce ? 0 : 0.45);
  pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, 0.18 + my * 0.25, .05);
  pivot.rotation.z = THREE.MathUtils.lerp(pivot.rotation.z, -mx * 0.2, .05);
  pivot.position.y = Math.sin(t * 1.6) * 0.04;             // hover bob
  const spin = reduce ? 0 : 38;
  for (const d of [current, incoming]) d?.spinners.forEach((p, k) => p.rotateOnAxis(p.userData.axis, dt * spin * (k % 2 ? 1 : -1)));
  ring.scale.setScalar(.8 + Math.sin(t * 2) * 0.016);
  ringMat.opacity = .4 + Math.sin(t * 2) * .15;
  const p = Math.min(1, (performance.now() - barStart) / HOLD);
  $('sp-bar').style.width = (p * 100) + '%';
  renderer.render(scene, camera);
});
