// Hero: GPU particle terrain (three.js). Falls back to CSS gradient if WebGL is unavailable.
const canvas = document.getElementById('hero-gl');
const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

if (!hasGL()) {
  hero.classList.add('no-gl');
} else {
  import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').then(THREE => {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 2.1, 7.5);
    camera.lookAt(0, 0.2, -2);

    const isMobile = innerWidth < 700;
    const COLS = isMobile ? 120 : 220, ROWS = isMobile ? 90 : 140;
    const W = 22, D = 18;
    const pos = new Float32Array(COLS * ROWS * 3);
    const rnd = new Float32Array(COLS * ROWS);
    let i = 0;
    for (let z = 0; z < ROWS; z++) for (let x = 0; x < COLS; x++) {
      pos[i * 3] = (x / (COLS - 1) - .5) * W;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = (z / (ROWS - 1) - .5) * D - 3;
      rnd[i] = Math.random(); i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));

    const uniforms = {
      uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) },
      uPx: { value: renderer.getPixelRatio() }, uSize: { value: isMobile ? 2.4 : 2.1 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform float uTime; uniform vec2 uMouse; uniform float uPx; uniform float uSize;
        attribute float aRnd; varying float vH; varying float vFade; varying float vR;
        // cheap 2D noise
        vec2 h2(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
          return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)),dot(h2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y); }
        void main(){
          vec3 p = position; float t = uTime*0.18;
          float n = noise(p.xz*0.22 + vec2(t, t*0.6))*1.25 + noise(p.xz*0.55 - vec2(t*1.3, 0.0))*0.45;
          float ripple = sin(length(p.xz - vec2(uMouse.x*6.0, -2.0 + uMouse.y*2.0))*1.4 - uTime*1.6) * 0.12;
          p.y = n + ripple - 1.15;
          vH = n; vR = aRnd;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          gl_Position = projectionMatrix * mv;
          float depth = -mv.z;
          vFade = smoothstep(19.0, 6.0, depth) * smoothstep(1.2, 3.5, depth);
          gl_PointSize = uSize * uPx * (7.0/depth) * (0.75 + aRnd*0.6);
        }`,
      fragmentShader: /* glsl */`
        varying float vH; varying float vFade; varying float vR;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c);
          float a = smoothstep(0.5, 0.0, d);
          vec3 violet = vec3(0.60,0.42,1.0), cyan = vec3(0.13,0.83,0.93), white = vec3(0.95,0.95,1.0);
          vec3 col = mix(violet, cyan, smoothstep(-0.6, 0.9, vH));
          col = mix(col, white, smoothstep(0.85, 1.3, vH) * 0.6);
          float glow = 0.35 + smoothstep(-0.4, 1.1, vH) * 0.9;
          gl_FragColor = vec4(col * glow, a * vFade * (0.55 + vR*0.45));
        }`
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.fov = w < 700 ? 70 : 55; camera.updateProjectionMatrix();
    }
    resize(); addEventListener('resize', resize);

    const target = new THREE.Vector2();
    addEventListener('pointermove', e => { target.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); }, { passive: true });

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    const clock = new THREE.Clock();
    let t = 3;
    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      t += Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value = t;
      uniforms.uMouse.value.lerp(target, 0.04);
      camera.position.x = uniforms.uMouse.value.x * 0.6;
      camera.position.y = 2.1 + uniforms.uMouse.value.y * 0.25 - Math.min(scrollY / innerHeight, 1) * 0.8;
      camera.lookAt(0, 0.2, -2);
      renderer.render(scene, camera);
    }
    if (reduced) { uniforms.uTime.value = 6; renderer.render(scene, camera); }
    else frame();
  }).catch(() => hero.classList.add('no-gl'));
}
