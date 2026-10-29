/* Ahmad Syahmi — a procedural orbital sculpture. Three.js r160.1 is vendored locally. */
(() => {
  'use strict';

  const canvas = document.getElementById('universe');
  const stage = canvas?.closest('.scene-stage');
  if (!canvas || !stage) return;
  const status = document.getElementById('scene-status');
  const motionButtons = [...document.querySelectorAll('#motion-toggle, #global-motion')];
  const motionButton = document.getElementById('motion-toggle');
  const modeButtons = [...document.querySelectorAll('[data-scene-mode]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPreference = null;
  try { motionPreference = sessionStorage.getItem('syz-motion-paused'); } catch (_) { /* Private storage may be disabled. */ }
  const state = { mode: 'orbit', paused: motionPreference === null ? reducedMotion.matches : motionPreference === 'true', ready: false, fallback: false, rotation: 0, chapter: 'orbit', progress: 0, objectsReady: false };
  let renderer, scene, camera, sculpture, ringSystem, stars, moon, atmosphere, planet, satellite, streaks, streakPositions, starSeeds;
  let objectController;
  let frame = 0;
  let inView = true;
  let lost = false;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastTime = 0;
  let elapsed = 0;
  let width = 1;
  let height = 1;
  let mobile = false;
  let targetRotation = 0;
  let scrollDirty = true;
  let chapters = [];
  let currentPose = null;
  let targetPose = null;
  let departure = 0;
  let departureTarget = 0;
  const pointer = { x: 0, y: 0 };
  const palettes = {
    orbit: { light: '#bca27d', dark: '#302b24', ring: '#a58b60', haze: '#719ece', exposure: 1.0 },
    nebula: { light: '#9dacaa', dark: '#222e34', ring: '#899d95', haze: '#668dd0', exposure: 1.0 },
    eclipse: { light: '#b58c60', dark: '#211d1a', ring: '#816245', haze: '#7399bb', exposure: 0.85 }
  };

  function syncControls() {
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(state.paused));
      const label = button.querySelector('[data-motion-label]');
      const name = button.id === 'global-motion' ? 'animations' : 'motion';
      if (label) label.textContent = `${state.paused ? 'Resume' : 'Pause'} ${name}`;
      else button.textContent = `${state.paused ? 'Resume' : 'Pause'} ${name}`;
    });
    document.body.classList.toggle('motion-paused', state.paused);
    document.body.classList.toggle('motion-enabled', !state.paused);
    stage.dataset.scenePaused = String(state.paused);
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sceneMode === state.mode)));
  }

  function fallback() {
    state.ready = false;
    state.fallback = true;
    document.body.classList.remove('scene-ready');
    document.body.classList.add('scene-unavailable');
    if (status) status.textContent = 'Still universe';
    modeButtons.forEach(button => { button.disabled = true; });
    if (motionButton) motionButton.disabled = true;
    const resetButton = document.getElementById('reset-view');
    if (resetButton) resetButton.disabled = true;
    const help = document.getElementById('scene-help');
    if (help) help.textContent = 'STILL ARTWORK · 3D UNAVAILABLE';
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function renderStill() {
    if (!renderer || lost || state.fallback) return;
    try { renderer.render(scene, camera); } catch (_) { fallback(); }
  }

  function schedule() {
    if (!renderer || !state.ready || state.fallback || lost || !inView || document.hidden || frame || state.paused) return;
    lastTime = 0;
    frame = requestAnimationFrame(animate);
  }

  function setPaused(value, explicit = true) {
    state.paused = Boolean(value);
    if (explicit) {
      motionPreference = String(state.paused);
      try { sessionStorage.setItem('syz-motion-paused', motionPreference); } catch (_) { /* Continue without persistence. */ }
    }
    syncControls();
    window.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { paused: state.paused, reduced: reducedMotion.matches } }));
    if (state.paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      renderStill();
    } else { scrollDirty = true; schedule(); }
  }

  function setMode(value) {
    if (!palettes[value]) return;
    state.mode = value;
    stage.dataset.mode = value;
    syncControls();
    if (!planet) return;
    const colors = palettes[value];
    planet.material.uniforms.uLight.value.set(colors.light);
    planet.material.uniforms.uDark.value.set(colors.dark);
    planet.material.uniforms.uEclipse.value = value === 'eclipse' ? 1 : 0;
    ringSystem.children[0].material.uniforms.uColor.value.set(colors.ring);
    atmosphere.material.uniforms.uColor.value.set(colors.haze);
    renderer.toneMappingExposure = colors.exposure;
    renderStill();
  }

  function reset() {
    targetRotation = 0;
    pointer.x = 0;
    pointer.y = 0;
    if (sculpture) {
      sculpture.rotation.y = currentPose?.ry || 0;
      sculpture.rotation.x = currentPose?.rx || 0;
      state.rotation = 0;
      renderStill();
    }
  }

  window.orbitalScene = { setMode, setPaused, reset, setObject: value => objectController?.setObject(value), getState: () => ({ ...state }) };
  syncControls();
  window.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { paused: state.paused, reduced: reducedMotion.matches } }));
  motionButtons.forEach(button => button.addEventListener('click', () => setPaused(!state.paused)));
  document.getElementById('reset-view')?.addEventListener('click', reset);
  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.sceneMode)));
  reducedMotion.addEventListener('change', event => { if (motionPreference === null) setPaused(event.matches, false); });

  // The scene does not capture wheel events or vertical touch gestures.
  const interactions = [...document.querySelectorAll('[data-space-interact]')];
  // Older pages can retain a directly focusable, non-global stage.
  if (!interactions.length && stage.tabIndex >= 0 && getComputedStyle(stage).position !== 'fixed') interactions.push(stage);
  interactions.forEach(interaction => {
  interaction.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button, a, input')) return;
    dragging = true;
    pointerId = event.pointerId;
    lastX = event.clientX;
    interaction.setPointerCapture?.(event.pointerId);
    interaction.classList.add('is-dragging');
  });
  interaction.addEventListener('pointermove', event => {
    if (dragging && event.pointerId === pointerId) {
      targetRotation += (event.clientX - lastX) * 0.006;
      lastX = event.clientX;
      if (state.paused && sculpture) {
        sculpture.rotation.y = (currentPose?.ry || 0) + targetRotation;
        state.rotation = targetRotation;
        renderStill();
      }
    } else if (!state.paused && event.pointerType !== 'touch') {
      const rect = stage.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }
  });
  function releasePointer() {
    dragging = false;
    pointerId = null;
    interaction.classList.remove('is-dragging');
  }
  interaction.addEventListener('pointerup', releasePointer);
  interaction.addEventListener('pointercancel', releasePointer);
  interaction.addEventListener('lostpointercapture', releasePointer);
  interaction.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });
  interaction.addEventListener('keydown', event => {
    if (event.target !== interaction || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') reset();
    else {
      targetRotation += event.key === 'ArrowLeft' ? -0.16 : 0.16;
      if (state.paused && sculpture) {
        sculpture.rotation.y = (currentPose?.ry || 0) + targetRotation;
        state.rotation = targetRotation;
        renderStill();
      }
    }
  });
  });
  window.addEventListener('scroll', () => {
    scrollDirty = true;
  }, { passive: true });
  window.addEventListener('portfolio:navigate', () => { if (!state.paused) departureTarget = 1; });
  window.addEventListener('portfolio:arrive', () => { departureTarget = 0; scrollDirty = true; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    }, { rootMargin: '80px' }).observe(stage);
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; fallback(); });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    state.ready = true;
    state.fallback = false;
    document.body.classList.add('scene-ready');
    document.body.classList.remove('scene-unavailable');
    if (status) status.textContent = 'Live 3D';
    modeButtons.forEach(button => { button.disabled = false; });
    if (motionButton) motionButton.disabled = false;
    const resetButton = document.getElementById('reset-view');
    if (resetButton) resetButton.disabled = false;
    const help = document.getElementById('scene-help');
    if (help) help.textContent = 'DRAG TO EXPLORE ↔';
    renderStill();
    schedule();
  });

  window.addEventListener('pagehide', event => {
    cancelAnimationFrame(frame); frame = 0;
    if (!event.persisted && renderer) {
      scene?.traverse(child => {
        child.geometry?.dispose();
        if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => material.dispose());
      });
      renderer.dispose();
    }
  });
  window.addEventListener('pageshow', () => { scrollDirty = true; schedule(); });

  const noiseGLSL = `
    float hash(vec3 p) { p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float noise(vec3 p) {
      vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    float fbm(vec3 p) { float n=0.0, a=0.5; for(int i=0;i<5;i++){n+=a*noise(p); p=p*2.03+vec3(7.1,2.3,4.7); a*=0.5;}return n; }
  `;

  import('./assets/vendor/three.module.min.js').then(THREE => {
    import('./objects.js').then(module => {
      objectController = module.createObjectViewers(THREE, { paused: () => state.paused });
      state.objectsReady = true;
    }).catch(() => {
      document.querySelectorAll('[data-object-viewer]').forEach(viewer => {
        viewer.dataset.objectState = 'unavailable';
        viewer.dataset.ready = 'false';
        (viewer.closest('.object-lab') || viewer).querySelectorAll('[data-object-reset], [data-object-choice]').forEach(button => { button.disabled = true; });
      });
    });
    try {
      const attributes = { alpha: true, antialias: true, powerPreference: 'high-performance', premultipliedAlpha: true };
      const context = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
      if (!context) { fallback(); return; }
      renderer = new THREE.WebGLRenderer({ canvas, context, ...attributes });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
      camera.position.set(0, 0, 10.6);
      sculpture = new THREE.Group();
      scene.add(sculpture);

      const planetMaterial = new THREE.ShaderMaterial({
        uniforms: { uLight: { value: new THREE.Color(palettes.orbit.light) }, uDark: { value: new THREE.Color(palettes.orbit.dark) }, uEclipse: { value: 0 } },
        vertexShader: `${noiseGLSL}
          varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNormal;
          void main(){
            vLocal=position; float elevation=fbm(position*3.4)*0.038;
            vec3 p=position+normal*elevation;
            vec4 world=modelMatrix*vec4(p,1.0);vWorld=world.xyz;
            vNormal=normalize(mat3(modelMatrix)*normal);
            gl_Position=projectionMatrix*viewMatrix*world;
          }`,
        fragmentShader: `${noiseGLSL}
          uniform vec3 uLight; uniform vec3 uDark; uniform float uEclipse;
          varying vec3 vLocal; varying vec3 vWorld; varying vec3 vNormal;
          void main(){
            vec3 N=normalize(vNormal); vec3 V=normalize(cameraPosition-vWorld);
            vec3 L=normalize(mix(vec3(-1.15,0.9,0.42),vec3(-0.7,0.65,-0.65),uEclipse));
            float geological=fbm(vLocal*5.4);
            float veins=fbm(vLocal*14.0+geological*2.8);
            float bands=sin(vLocal.y*15.0+geological*11.0+vLocal.x*2.0)*0.5+0.5;
            float dust=fbm(vLocal*62.0);
            vec3 stone=mix(uDark,uLight,smoothstep(0.18,0.82,geological*0.70+bands*0.15+veins*0.15));
            stone*=0.9+dust*0.2;
            stone=mix(stone,stone*0.65,smoothstep(0.71,0.77,veins)*0.35);
            float diffuse=max(0.0,dot(N,L));
            float litHemisphere=pow(diffuse,0.82);
            float spec=pow(max(0.0,dot(N,normalize(L+V))),42.0)*(0.04+veins*0.09);
            float rim=pow(1.0-max(0.0,dot(N,V)),4.2);
            vec3 color=stone*(0.025+litHemisphere*1.35)+uLight*spec;
            color+=uLight*rim*(0.025+diffuse*0.5);
            color+=vec3(0.08,0.10,0.11)*max(0.0,dot(N,normalize(vec3(1,-0.4,-0.3))))*0.05;
            gl_FragColor=vec4(color,1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      });
      planet = new THREE.Mesh(new THREE.SphereGeometry(1.72, 128, 96), planetMaterial);
      planet.rotation.z = 0.24;
      sculpture.add(planet);

      atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.8, 64, 48), new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(palettes.orbit.haze) } },
        vertexShader: 'varying vec3 vNormal; varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p;}',
        fragmentShader: 'uniform vec3 uColor;varying vec3 vNormal; varying vec3 vWorld;void main(){vec3 N=normalize(vNormal);vec3 V=normalize(cameraPosition-vWorld);float rim=pow(1.0-abs(dot(N,V)),3.0);float light=max(0.0,dot(N,normalize(vec3(-0.8,0.7,1.0))));gl_FragColor=vec4(uColor,rim*light*0.24);}',
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
      }));
      sculpture.add(atmosphere);

      ringSystem = new THREE.Group();
      ringSystem.rotation.set(1.16, -0.31, -0.40);
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(palettes.orbit.ring) } },
        vertexShader: 'varying vec3 vLocal;varying vec3 vWorld;void main(){vLocal=position;vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
        fragmentShader: `${noiseGLSL}
          uniform vec3 uColor;varying vec3 vLocal;varying vec3 vWorld;
          void main(){
            float radius=length(vLocal.xy);float angle=atan(vLocal.y,vLocal.x);
            float grain=noise(vec3(vLocal.xy*85.0,0.0));
            float bands=sin(radius*165.0)*0.5+0.5;
            float broad=sin(radius*32.0+sin(radius*13.0))*0.5+0.5;
            float gap=smoothstep(0.0,0.022,abs(radius-2.61));
            float edge=smoothstep(2.08,2.17,radius)*(1.0-smoothstep(3.19,3.31,radius));
            float pattern=(0.31+bands*0.25+broad*0.34+grain*0.21)*gap;
            float shade=0.58+0.32*sin(angle+0.9);
            vec3 color=uColor*pattern*shade;
            gl_FragColor=vec4(color,edge*0.86);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        side: THREE.DoubleSide, transparent: true, depthWrite: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.08, 3.31, 200, 24), ringMaterial);
      ringSystem.add(ring);
      sculpture.add(ringSystem);

      // A deterministic dust field produces a fine, broad ring without loading a model.
      let seed = 731;
      function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      const dustPositions = new Float32Array(1500 * 3);
      const dustColors = new Float32Array(1500 * 3);
      for (let i = 0; i < 1500; i++) {
        const a = random() * Math.PI * 2;
        const r = 2.15 + random() * 1.33;
        dustPositions[i * 3] = Math.cos(a) * r;
        dustPositions[i * 3 + 1] = Math.sin(a) * r;
        dustPositions[i * 3 + 2] = (random() - 0.5) * 0.09;
        const light = 0.36 + random() * 0.56;
        dustColors.set([light * 0.81, light * 0.9, light], i * 3);
      }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
      ringSystem.add(new THREE.Points(dustGeometry, new THREE.PointsMaterial({ size: 0.014, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false })));

      const rockMaterial = new THREE.MeshStandardMaterial({ color: '#7c7260', roughness: 0.92, metalness: 0.16 });
      const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMaterial, 85);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 85; i++) {
        const a = random() * Math.PI * 2;
        const r = 3.37 + random() * 0.42;
        dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, (random() - 0.5) * 0.13);
        const s = 0.008 + random() ** 3 * 0.044;
        dummy.scale.set(s * (0.8 + random()), s, s * 0.8);
        dummy.rotation.set(random() * 6, random() * 6, random() * 6);
        dummy.updateMatrix();
        rocks.setMatrixAt(i, dummy.matrix);
      }
      ringSystem.add(rocks);

      const moonGeometry = new THREE.IcosahedronGeometry(0.27, 4);
      const moonPositions = moonGeometry.attributes.position;
      for (let i = 0; i < moonPositions.count; i++) {
        const scale = 0.97 + random() * 0.06;
        moonPositions.setXYZ(i, moonPositions.getX(i) * scale, moonPositions.getY(i) * scale, moonPositions.getZ(i) * scale);
      }
      moonGeometry.computeVertexNormals();
      moon = new THREE.Mesh(moonGeometry, new THREE.MeshStandardMaterial({ color: '#9a9587', roughness: 0.98 }));
      moon.position.set(-2.8, 1.95, -0.8);
      sculpture.add(moon);
      const moonOrbit = new THREE.Mesh(new THREE.TorusGeometry(3.73, 0.002, 3, 160), new THREE.MeshBasicMaterial({ color: '#8b816b', transparent: true, opacity: 0.16, depthWrite: false }));
      moonOrbit.rotation.set(0.6, -0.5, -0.35);
      sculpture.add(moonOrbit);

      const starPositions = new Float32Array(650 * 3);
      const starColors = new Float32Array(650 * 3);
      starSeeds = new Float32Array(650 * 3);
      for (let i = 0; i < 650; i++) {
        starPositions.set([(random() - 0.5) * 42, (random() - 0.5) * 26, -6 - random() * 18], i * 3);
        starSeeds.set(starPositions.subarray(i * 3, i * 3 + 3), i * 3);
        const l = 0.16 + random() * 0.64;
        starColors.set([l * 0.79, l * 0.9, l], i * 3);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size: 0.027, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
      scene.add(stars);
      streakPositions = new Float32Array(650 * 6);
      const streakGeometry = new THREE.BufferGeometry();
      streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
      streaks = new THREE.LineSegments(streakGeometry, new THREE.LineBasicMaterial({ color: '#8caed9', transparent: true, opacity: 0, depthWrite: false }));
      streaks.frustumCulled = false;
      scene.add(streaks);

      // A second ambient subject gives the skills chapter its own visual identity.
      satellite = new THREE.Group();
      const silver = new THREE.MeshStandardMaterial({ color: '#bdceda', metalness: 0.78, roughness: 0.24 });
      const blue = new THREE.MeshBasicMaterial({ color: '#93c5ff', transparent: true, opacity: 0.5 });
      satellite.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 0), silver));
      const frameGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.2, 0));
      satellite.add(new THREE.LineSegments(frameGeometry, new THREE.LineBasicMaterial({ color: '#88add1', transparent: true, opacity: 0.35 })));
      for (let i = 0; i < 3; i++) {
        const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.008, 4, 96), blue);
        orbit.rotation.set(i * 0.95, i * 0.7, 0.3);
        satellite.add(orbit);
      }
      satellite.position.set(-2.2, 0.1, -1.5);
      satellite.scale.setScalar(0.001);
      scene.add(satellite);
      const key = new THREE.DirectionalLight('#fff0d4', 3.4);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const fill = new THREE.DirectionalLight('#8da9b4', 0.5);
      fill.position.set(5, -2, -4);
      scene.add(fill, new THREE.AmbientLight('#978b76', 0.38));

      function resize() {
        if (state.fallback) return;
        const rect = stage.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        mobile = window.matchMedia('(max-width: 760px)').matches;
        const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches;
        renderer.setPixelRatio(mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = mobile ? 43 : 37;
        camera.position.z = mobile ? 10.6 : tablet ? 12.2 : 10.6;
        camera.updateProjectionMatrix();
        chapters = [...document.querySelectorAll('[data-space-chapter]')];
        scrollDirty = true;
        updateChapter();
        currentPose = { ...targetPose };
        applyPose(true);
        renderStill();
      }
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
      else window.addEventListener('resize', resize, { passive: true });
      // A mode can be selected while the local module is still loading.
      setMode(state.mode);
      resize();
      renderer.render(scene, camera);
      state.ready = true;
      state.fallback = false;
      document.body.classList.add('scene-ready');
      if (status) status.textContent = 'Live 3D';
      window.dispatchEvent(new CustomEvent('scene:ready', { detail: { renderer: 'WebGL', version: THREE.REVISION } }));
      schedule();
    } catch (_) { renderer?.dispose(); fallback(); }
  }).catch(fallback);

  function chapterPose(name, progress = 0) {
    const inner = document.body.classList.contains('inner-page');
    const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches;
    const base = {
      x: mobile ? 0.25 : tablet ? 2.05 : Math.min(2.48, (width / height) * 1.28),
      y: mobile ? -2.9 : 0.14, z: 0, s: mobile ? 0.7 : tablet ? 0.65 : 1,
      rx: 0, ry: 0, cam: tablet ? 12.2 : 10.6, star: 0.75, warp: 0, sat: 0
    };
    if (inner) Object.assign(base, { x: mobile ? 1.48 : 3.6, y: mobile ? 1.4 : 0.55, s: mobile ? 0.4 : 0.58, cam: 11.8 });
    if (name === 'voyage') {
      // Scroll supplies a finite flight through the orbital plane; it never owns the wheel.
      const flight = Math.sin(progress * Math.PI);
      Object.assign(base, {
        x: (mobile ? 0.5 : 2.0) - progress * (mobile ? 5.5 : 8.5),
        y: 0.2 + progress * 0.9, z: flight * 3.2,
        s: (mobile ? 0.74 : 1.05) + flight * 0.38,
        rx: -0.08 + progress * 0.28, ry: progress * 0.9,
        cam: 10.4 - flight * 1.0, star: 0.9, warp: flight
      });
    } else if (name === 'work') {
      Object.assign(base, { x: mobile ? 3.5 : 5.5, y: 0.9, s: 0.55, cam: 12.3, ry: 0.9, star: 0.62 });
    } else if (name === 'about') {
      Object.assign(base, { x: mobile ? -2.3 : -3.4, y: mobile ? 1.0 : -0.2, s: mobile ? 0.4 : 0.66, cam: 12.7, ry: 1.0, star: 0.5 });
    } else if (name === 'toolkit') {
      Object.assign(base, { x: mobile ? 3.4 : 5.4, y: 1.8, s: 0.3, cam: 13.2, ry: 1.35, star: 0.62, sat: 1 });
    } else if (name === 'contact') {
      Object.assign(base, { x: mobile ? 0.2 : 1.1, y: mobile ? -4.8 : -4.6, s: mobile ? 2.0 : 2.3, cam: 12.0, rx: -0.2, ry: 1.4, star: 0.55 });
    } else if (name === 'gallery') {
      Object.assign(base, { x: mobile ? 3.0 : 4.8, y: 1.2, s: 0.48, cam: 13.6, ry: 0.7, star: 0.65 });
    }
    return base;
  }

  function updateChapter() {
    scrollDirty = false;
    let index = 0;
    const probe = height * 0.55;
    chapters.forEach((section, i) => { if (section.getBoundingClientRect().top <= probe) index = i; });
    const section = chapters[index];
    if (!section) { targetPose = chapterPose('orbit'); return; }
    const rect = section.getBoundingClientRect();
    const name = section.dataset.spaceChapter || 'orbit';
    const progress = Math.max(0, Math.min(1, name === 'voyage'
      ? (height * 0.2 - rect.top) / Math.max(height, rect.height - height * 0.6)
      : (probe - rect.top) / Math.max(height, rect.height)));
    targetPose = chapterPose(name, progress);
    if (index > 0) {
      let blend = Math.max(0, Math.min(1, (probe - rect.top) / (height * 0.62)));
      blend = blend * blend * (3 - 2 * blend);
      const previous = chapterPose(chapters[index - 1].dataset.spaceChapter, 1);
      Object.keys(targetPose).forEach(key => { targetPose[key] = previous[key] + (targetPose[key] - previous[key]) * blend; });
    }
    state.chapter = name;
    state.progress = progress;
    stage.dataset.chapter = name;
    stage.dataset.sceneProgress = progress.toFixed(3);
  }

  function applyPose(immediate = false) {
    if (!currentPose || !targetPose || !sculpture) return;
    if (immediate) currentPose = { ...targetPose };
    else Object.keys(targetPose).forEach(key => { currentPose[key] += (targetPose[key] - currentPose[key]) * 0.055; });
    const p = currentPose;
    sculpture.position.set(p.x, p.y + (state.paused ? 0 : Math.sin(elapsed * 0.28) * 0.04), p.z);
    sculpture.scale.setScalar(p.s);
    sculpture.rotation.y = p.ry + targetRotation + (state.paused ? 0 : pointer.x * 0.045);
    sculpture.rotation.x = p.rx + (state.paused ? 0 : pointer.y * 0.03);
    camera.position.z = p.cam - departure * 0.45;
    stars.material.opacity = p.star;
    streaks.material.opacity = p.warp * 0.36;
    satellite.scale.setScalar(Math.max(0.001, p.sat * (mobile ? 0.57 : 0.9)));
    satellite.position.x = mobile ? 0.3 : -2.2;
    satellite.position.y = mobile ? -0.1 : 0.1;
    state.rotation = targetRotation;
  }

  function animate(time) {
    frame = 0;
    if (state.paused || lost || !inView || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    elapsed += delta;
    if (scrollDirty) updateChapter();
    departure += (departureTarget - departure) * 0.06;
    planet.rotation.y += delta * 0.035;
    ringSystem.rotation.z = -0.40 + Math.sin(elapsed * 0.13) * 0.025;
    applyPose();
    stars.rotation.y = elapsed * 0.0008;
    satellite.rotation.y += delta * 0.13;
    satellite.rotation.z = Math.sin(elapsed * 0.18) * 0.12;
    if (currentPose.warp > 0.001) {
      for (let i = 0; i < 650; i++) {
        const k = i * 3;
        const output = i * 6;
        const z = -6 - ((-starSeeds[k + 2] - 6 + state.progress * 22 + elapsed * 0.12) % 18);
        streakPositions[output] = starSeeds[k];
        streakPositions[output + 1] = starSeeds[k + 1];
        streakPositions[output + 2] = z;
        streakPositions[output + 3] = starSeeds[k] * 1.015;
        streakPositions[output + 4] = starSeeds[k + 1] * 1.015;
        streakPositions[output + 5] = z + currentPose.warp * 2.5;
      }
      streaks.geometry.attributes.position.needsUpdate = true;
    }
    moon.rotation.y += delta * 0.045;
    renderStill();
    if (!state.fallback) frame = requestAnimationFrame(animate);
  }
})();
