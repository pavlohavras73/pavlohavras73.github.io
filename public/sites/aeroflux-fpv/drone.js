// ==========================================================================
// AEROFLUX FPV — 3D WEBGPU/WEBGL REAL-TIME ENGINE
// Features: GLTFLoader, RoomEnvironment, dark carbon material, spinning props,
// scroll-driven camera choreography (GSAP ScrollTrigger), and Fleet Hangar viewer.
// ==========================================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = new GLTFLoader();

/* --------------------------------------------------------------------------
   Shared Materials: Procedural Carbon Twill & Polycarbonate Tinted Props
   -------------------------------------------------------------------------- */
function createCarbonTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#10141a';
  ctx.fillRect(0, 0, 128, 128);

  // 2x2 carbon twill weave simulation
  for (let y = 0; y < 128; y += 8) {
    for (let x = 0; x < 128; x += 8) {
      const isAlt = ((x / 8 + y / 8) % 2 === 0);
      ctx.fillStyle = isAlt ? '#1d232c' : '#141820';
      ctx.fillRect(x, y, 8, 8);
      ctx.fillStyle = isAlt ? '#2a3340' : '#101319';
      ctx.fillRect(x, y, 8, 2);
      ctx.fillStyle = '#0c0e13';
      ctx.fillRect(x, y + 6, 8, 2);
    }
  }

  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

const carbonTexture = createCarbonTexture();

function createDroneMaterials(accentHex = 0x00f0ff) {
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x12151b,
    roughness: 0.38,
    metalness: 0.42,
    roughnessMap: carbonTexture,
    bumpMap: carbonTexture,
    bumpScale: 0.002,
    emissive: 0x06080c,
    emissiveIntensity: 0.15
  });

  const propMat = new THREE.MeshPhysicalMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.22,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.72,
    transmission: 0.38,
    ior: 1.52,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12
  });

  const emissiveAccentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 1.2,
    roughness: 0.2,
    metalness: 0.8
  });

  return { carbonMat, propMat, emissiveAccentMat };
}

/* ==========================================================================
   SCENE 1: HERO & SCROLL-DRIVEN PRODUCT ANATOMY (#drone)
   ========================================================================== */
const heroCanvas = document.getElementById('drone');
const tagsEl = document.getElementById('tags');
const story = window.__story || { p: 0, step: 0 };

let heroRenderer, heroScene, heroCamera, heroPmrem;
let heroDroneGroup = new THREE.Group();
let heroDroneModel = null;
let heroProps = [];
let heroNoseNode = null;
let heroBodyMesh = null;
let heroMaterials = null;

if (heroCanvas) {
  try {
    heroRenderer = new THREE.WebGLRenderer({
      canvas: heroCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    heroRenderer.toneMappingExposure = 1.15;
    heroRenderer.outputColorSpace = THREE.SRGBColorSpace;

    heroScene = new THREE.Scene();
    heroPmrem = new THREE.PMREMGenerator(heroRenderer);
    heroScene.environment = heroPmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    heroCamera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    heroScene.add(heroDroneGroup);

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 7, 6);
    heroScene.add(keyLight);

    const rimLight1 = new THREE.DirectionalLight(0x00f0ff, 3.4);
    rimLight1.position.set(-6, 3, -6);
    heroScene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xff7a00, 1.8);
    rimLight2.position.set(6, -2, -5);
    heroScene.add(rimLight2);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.2);
    fillLight.position.set(0, -5, 4);
    heroScene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x1a2230, 0.85);
    heroScene.add(ambientLight);

    // Floor Projection Hologram Rings
    const ringGeo1 = new THREE.RingGeometry(1.8, 1.83, 128);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = -1.25;
    heroScene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(2.4, 2.42, 128);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff7a00, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1.25;
    heroScene.add(ring2);

    heroMaterials = createDroneMaterials(0x00f0ff);

    // Load Flagship 5" Racer Model
    loader.load('assets/models/racer5_6s.glb', (gltf) => {
      heroDroneModel = gltf.scene;

      // Center model
      const box = new THREE.Box3().setFromObject(heroDroneModel);
      const center = box.getCenter(new THREE.Vector3());
      heroDroneModel.position.sub(center);

      // Scale to world size (~2.4 units span)
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 2.4 / (maxDim || 1);
      heroDroneGroup.scale.setScalar(scaleFactor);

      heroProps = [];
      heroDroneModel.traverse((child) => {
        if (child.isMesh) {
          if (child.name.startsWith('Prop_') || (child.parent && child.parent.name.startsWith('Prop_'))) {
            child.material = heroMaterials.propMat.clone();
          } else {
            child.material = heroMaterials.carbonMat.clone();
            heroBodyMesh = child;
          }
        }
        if (child.name === 'Prop_FL') heroProps.push({ node: child, dir: 1, baseZ: child.position.z });
        if (child.name === 'Prop_FR') heroProps.push({ node: child, dir: -1, baseZ: child.position.z });
        if (child.name === 'Prop_RL') heroProps.push({ node: child, dir: -1, baseZ: child.position.z });
        if (child.name === 'Prop_RR') heroProps.push({ node: child, dir: 1, baseZ: child.position.z });
        if (child.name === 'Nose') heroNoseNode = child;
      });

      heroDroneGroup.add(heroDroneModel);
      setupHeroTags();
    }, undefined, (err) => {
      console.error('Error loading hero drone model:', err);
    });

  } catch (e) {
    console.error('WebGL failed on hero canvas:', e);
    if (heroCanvas) heroCanvas.style.display = 'none';
  }
}

/* --------------------------------------------------------------------------
   3D Projected HUD Tags for Hero/Anatomy
   -------------------------------------------------------------------------- */
let hudTags = [];
function setupHeroTags() {
  if (!tagsEl) return;
  tagsEl.innerHTML = '';

  const tagDefs = [
    { step: 1, label: '01 // UNIBODY T700 CARBON ARM', getPos: () => new THREE.Vector3(-0.8, -0.1, 0.4) },
    { step: 2, label: '02 // FLUX-V 2207 · 1950KV MOTOR', getPos: () => new THREE.Vector3(0.9, 0.15, 0.8) },
    { step: 3, label: '03 // H7 CORE & 60A DSHOT ESC', getPos: () => new THREE.Vector3(0, 0.25, 0) },
    { step: 4, label: '04 // 12MS GLASS-TO-GLASS SENSOR', getPos: () => (heroNoseNode ? heroNoseNode.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 0.2, -1.0)) },
    { step: 5, label: '05 // 6S 1300MAH GRAPHENE PACK', getPos: () => new THREE.Vector3(0, 0.5, 0.2) }
  ];

  hudTags = tagDefs.map((def) => {
    const el = document.createElement('div');
    el.className = 'tag';
    el.innerHTML = `<span class="tag__pip"></span><span class="tag__label">${def.label}</span>`;
    tagsEl.appendChild(el);
    return { ...def, el };
  });
}

/* --------------------------------------------------------------------------
   Camera Choreography: Interpolate Steps
   -------------------------------------------------------------------------- */
const cameraStages = [
  // 0: Hero Intro — Drone in right half on desktop, headline on left half
  { camPos: [0.0, 1.25, 4.4], lookAt: [0.0, 0.0, 0], droneRot: [-0.15, -0.65, 0.08], dronePos: [1.32, 0.05, 0], propLift: 0 },
  // 1: Frame Macro
  { camPos: [0.9, 1.5, 2.5], lookAt: [-0.25, 0.1, 0], droneRot: [0.42, 0.35, -0.12], dronePos: [0.48, -0.05, 0], propLift: 0 },
  // 2: Propulsion & Motor Bell
  { camPos: [1.5, 1.2, 2.2], lookAt: [0.3, 0.2, 0], droneRot: [-0.28, -0.95, 0.22], dronePos: [0.45, 0, 0], propLift: 0.12 },
  // 3: Flight Stack Core
  { camPos: [0.3, 2.8, 1.8], lookAt: [0.1, 0, 0], droneRot: [0.85, -0.22, 0.05], dronePos: [0.45, -0.1, 0], propLift: 0.04 },
  // 4: Vision & Nose Sensor
  { camPos: [-0.3, 0.5, 2.4], lookAt: [0.1, 0.15, 0], droneRot: [-0.12, 0.22, -0.06], dronePos: [0.4, 0, 0], propLift: 0 },
  // 5: Power Architecture
  { camPos: [-1.2, 1.8, 2.6], lookAt: [0.1, 0.1, 0], droneRot: [0.5, 1.75, -0.14], dronePos: [0.45, -0.05, 0], propLift: 0 },
  // 6: Flight Launch Ready
  { camPos: [0.0, 1.3, 4.4], lookAt: [0, 0, 0], droneRot: [0.46, -0.1, 0], dronePos: [0, 0, 0], propLift: 0 }
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpArr(a, b, t) {
  return a.map((v, i) => lerp(v, b[i], t));
}

let isHeroMobile = false;
function resizeHero() {
  if (!heroRenderer || !heroCanvas) return;
  const w = heroCanvas.clientWidth;
  const h = heroCanvas.clientHeight;
  if (!w || !h) return;
  heroRenderer.setSize(w, h, false);
  heroCamera.aspect = w / h;
  isHeroMobile = w < 768;
  heroCamera.fov = isHeroMobile ? 48 : 36;
  heroCamera.updateProjectionMatrix();
}

if (heroCanvas) {
  resizeHero();
  window.addEventListener('resize', resizeHero);
}

// Hero Animation Loop
let heroVisible = true;
if (heroCanvas) {
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
  }).observe(heroCanvas);
}

let lastTime = performance.now();
let animTime = 0;
let smoothedProgress = 0;
const projVec = new THREE.Vector3();
const lookVec = new THREE.Vector3();

function heroLoop(now) {
  requestAnimationFrame(heroLoop);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (!heroVisible || !heroRenderer || !heroScene || !heroCamera) return;
  animTime += dt;

  // Smooth story scroll progress
  smoothedProgress += (story.p - smoothedProgress) * (reduced ? 1 : Math.min(1, dt * 6));
  const p = Math.max(0, Math.min(1, smoothedProgress));

  // Determine stage interpolation: 6 segments between 7 keyframe stages
  const totalStages = cameraStages.length - 1;
  const rawIdx = p * totalStages;
  const idx0 = Math.min(totalStages - 1, Math.floor(rawIdx));
  const idx1 = Math.min(totalStages, idx0 + 1);
  const stageT = rawIdx - idx0;
  // Smoothstep ease within segment
  const easeT = stageT * stageT * (3 - 2 * stageT);

  const stageA = cameraStages[idx0];
  const stageB = cameraStages[idx1];

  const currentCamPos = lerpArr(stageA.camPos, stageB.camPos, easeT);
  const currentLookAt = lerpArr(stageA.lookAt, stageB.lookAt, easeT);
  const currentDroneRot = lerpArr(stageA.droneRot, stageB.droneRot, easeT);
  const currentDronePos = lerpArr(stageA.dronePos, stageB.dronePos, easeT);
  const currentPropLift = lerp(stageA.propLift, stageB.propLift, easeT);

  // Apply camera position
  if (isHeroMobile) {
    if (p <= 0.08) {
      heroCamera.position.set(0, 0.95, 4.6);
      lookVec.set(0, -0.08, 0);
    } else {
      heroCamera.position.set(0, currentCamPos[1] * 0.9, currentCamPos[2] * 1.25);
      lookVec.set(0, currentLookAt[1] - 0.2, 0);
    }
  } else {
    heroCamera.position.set(currentCamPos[0], currentCamPos[1], currentCamPos[2]);
    lookVec.set(currentLookAt[0], currentLookAt[1], currentLookAt[2]);
  }
  heroCamera.lookAt(lookVec);

  // Apply drone position & rotation with organic breathing hover
  if (heroDroneGroup) {
    const hoverY = reduced ? 0 : Math.sin(animTime * 1.5) * 0.04;
    const hoverRoll = reduced ? 0 : Math.sin(animTime * 1.1) * 0.02;
    const hoverPitch = reduced ? 0 : Math.cos(animTime * 0.9) * 0.015;

    if (isHeroMobile) {
      if (p <= 0.08) {
        heroDroneGroup.position.x = 0;
        heroDroneGroup.position.y = -0.22 + hoverY;
        heroDroneGroup.position.z = 0;
      } else {
        heroDroneGroup.position.x = 0;
        heroDroneGroup.position.y = currentDronePos[1] + hoverY;
        heroDroneGroup.position.z = currentDronePos[2];
      }
    } else {
      heroDroneGroup.position.x = currentDronePos[0];
      heroDroneGroup.position.y = currentDronePos[1] + hoverY;
      heroDroneGroup.position.z = currentDronePos[2];
    }

    heroDroneGroup.rotation.x = currentDroneRot[0] + hoverPitch;
    heroDroneGroup.rotation.y = currentDroneRot[1] + (reduced ? 0 : Math.sin(animTime * 0.4) * 0.02);
    heroDroneGroup.rotation.z = currentDroneRot[2] + hoverRoll;
  }

  // Spin propellers with quadcopter directions
  const propSpeed = 24.0;
  heroProps.forEach((pObj) => {
    if (!reduced) {
      pObj.node.rotation.z += pObj.dir * propSpeed * dt;
    }
    // Prop lift in exploded propulsion step
    if (pObj.node) {
      pObj.node.position.z = pObj.baseZ - currentPropLift * 2.8;
    }
  });

  // Highlight pulse on active anatomy step
  const activeStep = story.step;
  if (heroMaterials && heroMaterials.carbonMat) {
    const pulse = Math.sin(animTime * 4.5) * 0.5 + 0.5;
    if (activeStep >= 1 && activeStep <= 5) {
      heroMaterials.carbonMat.emissiveIntensity = 0.2 + pulse * 0.15;
    } else {
      heroMaterials.carbonMat.emissiveIntensity = 0.15;
    }
  }

  heroRenderer.render(heroScene, heroCamera);

  // Project HUD Tags to 2D Screen
  const w = heroCanvas.clientWidth;
  const h = heroCanvas.clientHeight;
  hudTags.forEach((tag) => {
    const pos = tag.getPos();
    pos.applyMatrix4(heroDroneGroup.matrixWorld);
    projVec.copy(pos).project(heroCamera);

    const screenX = (projVec.x * 0.5 + 0.5) * w;
    const screenY = (-projVec.y * 0.5 + 0.5) * h;
    const isTagStep = (tag.step === activeStep);
    const visibleInStep = (p > 0.12 && p < 0.88 && !isHeroMobile);

    tag.el.style.transform = `translate(${screenX}px, ${screenY}px)`;
    tag.el.style.opacity = visibleInStep ? (isTagStep ? '1' : '0.35') : '0';
    tag.el.classList.toggle('is-active', isTagStep);
  });
}

if (heroCanvas) {
  requestAnimationFrame(heroLoop);
}

/* ==========================================================================
   SCENE 2: INTERACTIVE FLEET HANGAR 3D VIEWER (#lineup-canvas)
   ========================================================================== */
const hangarCanvas = document.getElementById('lineup-canvas');
const hangarLoading = document.getElementById('lineup-loading');

let hangarRenderer, hangarScene, hangarCamera, hangarControls, hangarPmrem;
let hangarModelGroup = new THREE.Group();
let hangarCurrentDrone = null;
let hangarProps = [];
let hangarAutoOrbit = true;
let hangarPropsActive = true;
const modelCache = {};

if (hangarCanvas) {
  try {
    hangarRenderer = new THREE.WebGLRenderer({
      canvas: hangarCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    hangarRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    hangarRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    hangarRenderer.toneMappingExposure = 1.2;
    hangarRenderer.outputColorSpace = THREE.SRGBColorSpace;

    hangarScene = new THREE.Scene();
    hangarPmrem = new THREE.PMREMGenerator(hangarRenderer);
    hangarScene.environment = hangarPmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    hangarCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    hangarCamera.position.set(2.4, 1.8, 3.2);

    hangarControls = new OrbitControls(hangarCamera, hangarCanvas);
    hangarControls.enableDamping = true;
    hangarControls.dampingFactor = 0.06;
    hangarControls.minDistance = 1.2;
    hangarControls.maxDistance = 6.0;
    hangarControls.maxPolarAngle = Math.PI / 2 + 0.15; // Limit below ground

    hangarScene.add(hangarModelGroup);

    // Studio Lighting
    const hKeyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    hKeyLight.position.set(5, 7, 5);
    hangarScene.add(hKeyLight);

    const hRimCyan = new THREE.DirectionalLight(0x00f0ff, 3.2);
    hRimCyan.position.set(-5, 3, -5);
    hangarScene.add(hRimCyan);

    const hRimAmber = new THREE.DirectionalLight(0xff7a00, 1.8);
    hRimAmber.position.set(5, -2, -4);
    hangarScene.add(hRimAmber);

    const hAmbient = new THREE.AmbientLight(0x161e2b, 0.9);
    hangarScene.add(hAmbient);

    // Floor Holographic Reticle Grid
    const floorGeo = new THREE.RingGeometry(0.1, 1.8, 64);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const floorRing = new THREE.Mesh(floorGeo, floorMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -0.55;
    hangarScene.add(floorRing);

    // Load initial default model
    loadHangarModel('racer5_6s');

  } catch (e) {
    console.error('WebGL failed on hangar canvas:', e);
    if (hangarCanvas) hangarCanvas.style.display = 'none';
  }
}

function loadHangarModel(droneId) {
  if (!hangarScene || !hangarCanvas) return;
  if (hangarLoading) hangarLoading.classList.remove('is-hidden');

  // Check cache
  if (modelCache[droneId]) {
    displayHangarDrone(modelCache[droneId]);
    if (hangarLoading) hangarLoading.classList.add('is-hidden');
    return;
  }

  const modelPath = `assets/models/${droneId}.glb`;
  loader.load(modelPath, (gltf) => {
    modelCache[droneId] = gltf;
    displayHangarDrone(gltf);
    if (hangarLoading) hangarLoading.classList.add('is-hidden');
  }, undefined, (err) => {
    console.error(`Failed to load ${modelPath}:`, err);
    if (hangarLoading) hangarLoading.classList.add('is-hidden');
  });
}

function displayHangarDrone(gltf) {
  // Clear previous model
  while (hangarModelGroup.children.length > 0) {
    hangarModelGroup.remove(hangarModelGroup.children[0]);
  }
  hangarProps = [];

  const clone = gltf.scene.clone(true);
  const materials = createDroneMaterials(0x00f0ff);

  // Center & calculate size
  const box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  clone.position.sub(center);

  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  // Scale so all drones fit harmoniously (~1.9 unit span)
  const scale = 1.9 / (maxDim || 1);
  hangarModelGroup.scale.setScalar(scale);

  // Material application and prop binding
  clone.traverse((child) => {
    if (child.isMesh) {
      if (child.name.startsWith('Prop_') || (child.parent && child.parent.name.startsWith('Prop_'))) {
        child.material = materials.propMat.clone();
      } else {
        child.material = materials.carbonMat.clone();
      }
    }
    if (child.name === 'Prop_FL') hangarProps.push({ node: child, dir: 1 });
    if (child.name === 'Prop_FR') hangarProps.push({ node: child, dir: -1 });
    if (child.name === 'Prop_RL') hangarProps.push({ node: child, dir: -1 });
    if (child.name === 'Prop_RR') hangarProps.push({ node: child, dir: 1 });
  });

  hangarCurrentDrone = clone;
  hangarModelGroup.add(clone);

  // Soft camera reset to default 3/4 beauty view
  if (!reduced) {
    gsap.to(hangarCamera.position, {
      x: 2.2,
      y: 1.6,
      z: 2.8,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => hangarControls.update()
    });
  }
}

function resizeHangar() {
  if (!hangarRenderer || !hangarCanvas) return;
  const w = hangarCanvas.clientWidth;
  const h = hangarCanvas.clientHeight;
  if (!w || !h) return;
  hangarRenderer.setSize(w, h, false);
  hangarCamera.aspect = w / h;
  hangarCamera.updateProjectionMatrix();
}

if (hangarCanvas) {
  resizeHangar();
  window.addEventListener('resize', resizeHangar);
}

// Hangar Animation Loop with IntersectionObserver
let hangarVisible = true;
if (hangarCanvas) {
  new IntersectionObserver(([e]) => {
    hangarVisible = e.isIntersecting;
  }).observe(hangarCanvas);
}

let hangarTime = 0;
let lastHangarTime = performance.now();

function hangarLoop(now) {
  requestAnimationFrame(hangarLoop);
  const dt = Math.min(0.05, (now - lastHangarTime) / 1000);
  lastHangarTime = now;

  if (!hangarVisible || !hangarRenderer || !hangarScene || !hangarCamera) return;
  hangarTime += dt;

  hangarControls.update();

  // Auto-Orbit rotation
  if (hangarAutoOrbit && !reduced && hangarModelGroup) {
    hangarModelGroup.rotation.y += 0.28 * dt;
  }

  // Spinning Props
  if (hangarPropsActive && !reduced) {
    hangarProps.forEach((p) => {
      p.node.rotation.z += p.dir * 28.0 * dt;
    });
  }

  hangarRenderer.render(hangarScene, hangarCamera);
}

if (hangarCanvas) {
  requestAnimationFrame(hangarLoop);
}

/* --------------------------------------------------------------------------
   Interactive HUD Controls in Hangar
   -------------------------------------------------------------------------- */
const btnSpinToggle = document.getElementById('btn-spin-toggle');
const btnPropsToggle = document.getElementById('btn-props-toggle');
const btnCamReset = document.getElementById('btn-cam-reset');

if (btnSpinToggle) {
  btnSpinToggle.classList.toggle('is-active', hangarAutoOrbit);
  btnSpinToggle.addEventListener('click', () => {
    hangarAutoOrbit = !hangarAutoOrbit;
    btnSpinToggle.classList.toggle('is-active', hangarAutoOrbit);
  });
}

if (btnPropsToggle) {
  btnPropsToggle.classList.toggle('is-active', hangarPropsActive);
  btnPropsToggle.addEventListener('click', () => {
    hangarPropsActive = !hangarPropsActive;
    btnPropsToggle.classList.toggle('is-active', hangarPropsActive);
  });
}

if (btnCamReset) {
  btnCamReset.addEventListener('click', () => {
    if (reduced) {
      hangarCamera.position.set(2.2, 1.6, 2.8);
      hangarControls.target.set(0, 0, 0);
      hangarControls.update();
      if (hangarModelGroup) hangarModelGroup.rotation.y = 0;
    } else {
      gsap.to(hangarCamera.position, {
        x: 2.2,
        y: 1.6,
        z: 2.8,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => hangarControls.update()
      });
      if (hangarModelGroup) {
        gsap.to(hangarModelGroup.rotation, { y: 0, duration: 0.8, ease: 'power2.out' });
      }
    }
  });
}

/* --------------------------------------------------------------------------
   Global Public Event Hook for UI Interactivity
   -------------------------------------------------------------------------- */
window.addEventListener('aeroflux:select-drone', (e) => {
  if (e.detail && e.detail.id) {
    loadHangarModel(e.detail.id);
  }
});
