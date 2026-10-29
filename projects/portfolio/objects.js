/* Small procedural demonstrators, rendered lazily with one shared secondary context. */
export function createObjectViewers(THREE, options) {
  const elements = [...document.querySelectorAll('[data-object-viewer]')];
  if (!elements.length) return { setObject() {}, getState: () => ({ count: 0 }) };
  const records = elements.map(element => ({
    element, kind: element.dataset.objectKind || 'screen', image: element.dataset.objectImage || '',
    visible: false, yaw: 0.32, pitch: element.dataset.objectKind === 'ar' ? 0.55 : -0.12, ready: false, failed: false,
    fallback: element.querySelector('.object-fallback'), canvas: element.querySelector('canvas')
  }));
  let renderer, scene, camera, model, active = null, frame = 0, previous = 0, elapsed = 0;
  let dragging = false, dragId = null, lastX = 0, lastY = 0, loadToken = 0;
  let needsSelection = false;
  let hidden = document.hidden;
  let contextLost = false;
  const textures = new Map();
  const canvas = records[0].canvas || document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.objectCanvas = '';
  records.forEach(record => {
    if (record.canvas && record.canvas !== canvas) record.canvas.hidden = true;
    record.element.style.touchAction = 'pan-y';
    record.element.dataset.objectState = 'waiting';
  });

  function showFallback(record, failed = false) {
    record.ready = false;
    record.failed = failed;
    record.element.dataset.objectState = failed ? 'unavailable' : 'waiting';
    record.element.dataset.ready = 'false';
    record.element.classList.remove('object-ready');
    if (record.fallback) record.fallback.hidden = false;
    if (failed) {
      record.element.closest('.object-lab')?.querySelectorAll('[data-object-reset], [data-object-choice]').forEach(button => { button.disabled = true; });
    }
  }

  function render() {
    if (!renderer || !active || active.failed || contextLost || !model) return;
    model.rotation.set(active.pitch, active.yaw, 0);
    active.element.dataset.objectYaw = active.yaw.toFixed(3);
    active.element.dataset.objectPitch = active.pitch.toFixed(3);
    if (!options.paused()) model.position.y = Math.sin(elapsed * 0.7) * 0.035;
    try { renderer.render(scene, camera); } catch (_) { showFallback(active, true); stop(); }
  }

  function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function schedule() {
    if (!active?.visible || !active.ready || active.failed || options.paused() || hidden || frame) return;
    frame = requestAnimationFrame(animate);
  }

  function animate(time) {
    frame = 0;
    if (!active?.visible || !active.ready || options.paused() || hidden) return;
    const delta = previous ? Math.min(0.05, (time - previous) / 1000) : 0;
    previous = time;
    elapsed += delta;
    if (needsSelection) { needsSelection = false; selectVisible(); }
    if (!dragging) active.yaw += delta * 0.12;
    render();
    schedule();
  }

  function disposeModel() {
    if (!model) return;
    const geometries = new Set();
    const materials = new Set();
    model.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => materials.add(material));
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    scene.remove(model);
    model = null;
  }

  function silver() { return new THREE.MeshStandardMaterial({ color: '#bec9d1', metalness: 0.83, roughness: 0.27 }); }
  function blue() { return new THREE.MeshStandardMaterial({ color: '#70a9f7', metalness: 0.5, roughness: 0.23, emissive: '#173b69', emissiveIntensity: 0.6 }); }
  function mesh(group, geometry, material, position = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    group.add(object);
    return object;
  }

  function placeholderTexture() {
    const drawing = document.createElement('canvas');
    drawing.width = 1024; drawing.height = 608;
    const context = drawing.getContext('2d');
    context.fillStyle = '#0c1420'; context.fillRect(0, 0, 1024, 608);
    context.strokeStyle = '#223c5b'; context.lineWidth = 1;
    for (let x = 0; x < 1024; x += 48) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 608); context.stroke(); }
    for (let y = 0; y < 608; y += 48) { context.beginPath(); context.moveTo(0, y); context.lineTo(1024, y); context.stroke(); }
    context.strokeStyle = '#86b5ef'; context.lineWidth = 3;
    context.strokeRect(170, 130, 684, 348);
    context.fillStyle = '#dce7f4'; context.font = '500 34px system-ui'; context.fillText('INTERACTIVE STUDY', 220, 280);
    context.fillStyle = '#91aac7'; context.font = '24px system-ui'; context.fillText('Drag to explore the object in space.', 220, 330);
    const texture = new THREE.CanvasTexture(drawing);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.set('__placeholder', texture);
    return texture;
  }

  function loadImage(path, material, token) {
    if (!path) return;
    const url = new URL(path, document.baseURI).href;
    if (textures.has(url)) { material.map = textures.get(url); material.needsUpdate = true; return; }
    new THREE.TextureLoader().load(url, loaded => {
      // Fit the supplied artwork into the display without distorting its aspect ratio.
      const drawing = document.createElement('canvas'); drawing.width = 1024; drawing.height = 608;
      const context = drawing.getContext('2d');
      context.fillStyle = '#080d14'; context.fillRect(0, 0, drawing.width, drawing.height);
      const image = loaded.image;
      const scale = Math.min(drawing.width / image.width, drawing.height / image.height);
      const w = image.width * scale, h = image.height * scale;
      context.drawImage(image, (drawing.width - w) / 2, (drawing.height - h) / 2, w, h);
      const texture = new THREE.CanvasTexture(drawing);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer?.capabilities.getMaxAnisotropy() || 1);
      loaded.dispose();
      textures.set(url, texture);
      if (token === loadToken && active?.ready) { material.map = texture; material.needsUpdate = true; render(); }
    }, undefined, () => { /* The procedural display remains useful if a supplied image is absent. */ });
  }

  function buildScreen(record, token) {
    const group = new THREE.Group();
    const aluminum = silver();
    const obsidian = new THREE.MeshStandardMaterial({ color: '#111820', metalness: 0.66, roughness: 0.3 });
    mesh(group, new THREE.BoxGeometry(4.03, 2.53, 0.16, 1, 1, 1), aluminum, [0, 0.24, 0]);
    mesh(group, new THREE.BoxGeometry(3.98, 2.48, 0.08), obsidian, [0, 0.24, 0.1]);
    const display = new THREE.MeshBasicMaterial({ map: textures.get('__placeholder') || placeholderTexture(), toneMapped: false });
    mesh(group, new THREE.PlaneGeometry(3.73, 2.215), display, [0, 0.24, 0.146]);
    mesh(group, new THREE.SphereGeometry(0.018, 10, 8), blue(), [0, 1.435, 0.15]);
    mesh(group, new THREE.CylinderGeometry(0.11, 0.17, 0.56, 16), aluminum, [0, -1.27, -0.1]);
    mesh(group, new THREE.BoxGeometry(1.82, 0.07, 0.85), aluminum, [0, -1.58, 0.05]);
    const backMark = mesh(group, new THREE.TorusGeometry(0.2, 0.035, 8, 40), aluminum, [0, 0.25, -0.1]);
    backMark.rotation.x = 0.1;
    loadImage(record.image, display, token);
    return group;
  }

  function buildSatellite() {
    const group = new THREE.Group();
    const aluminum = silver();
    const luminous = blue();
    mesh(group, new THREE.IcosahedronGeometry(0.86, 0), aluminum);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.4, 0)), new THREE.LineBasicMaterial({ color: '#8db5e7', transparent: true, opacity: 0.75 }));
    group.add(edges);
    for (let i = 0; i < 3; i++) {
      const ring = mesh(group, new THREE.TorusGeometry(1.85, 0.018, 6, 120), aluminum);
      ring.rotation.set(i * 0.96 + 0.2, i * 0.67, 0.4);
      const node = mesh(group, new THREE.SphereGeometry(0.12, 16, 12), luminous);
      node.position.set(Math.cos(i * 2.1) * 1.85, Math.sin(i * 2.1) * 1.4, Math.sin(i) * 0.7);
    }
    for (const x of [-1, 1]) {
      const panel = mesh(group, new THREE.BoxGeometry(0.82, 1.35, 0.045), new THREE.MeshStandardMaterial({ color: '#19365b', metalness: 0.7, roughness: 0.3 }), [x * 1.3, 0, 0]);
      panel.rotation.y = x * 0.2;
      const grid = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.PlaneGeometry(0.78, 1.3, 3, 5)), new THREE.LineBasicMaterial({ color: '#7a9dc8', transparent: true, opacity: 0.75 }));
      grid.position.set(x * 1.3, 0, 0.03); group.add(grid);
    }
    return group;
  }

  function buildAR() {
    const group = new THREE.Group();
    const floor = new THREE.MeshStandardMaterial({ color: '#17202b', metalness: 0.25, roughness: 0.75 });
    const wall = new THREE.MeshStandardMaterial({ color: '#a4b4c7', metalness: 0.25, roughness: 0.5 });
    mesh(group, new THREE.BoxGeometry(4.5, 0.14, 3.2), floor, [0, -0.42, 0]);
    const grid = new THREE.GridHelper(4.4, 16, '#4d729e', '#273c56');
    grid.position.y = -0.34; group.add(grid);
    [[0, -1.5, 4.4, 0.08], [0, 1.5, 4.4, 0.08], [-2.15, 0, 0.08, 3], [2.15, 0, 0.08, 3], [-0.7, -0.85, 0.07, 1.3], [0.8, 0.85, 0.07, 1.3], [-1.45, 0.1, 1.4, 0.07], [1.5, -0.2, 1.3, 0.07]].forEach(([x, z, w, d]) => {
      mesh(group, new THREE.BoxGeometry(w, 0.47, d), wall, [x, -0.12, z]);
    });
    const points = [[-1.6, -0.14, 1.05], [-0.35, -0.14, 1.05], [-0.35, -0.14, -0.65], [0.35, -0.14, -0.65], [0.35, -0.14, 0.7], [1.65, -0.14, 0.7]].map(p => new THREE.Vector3(...p));
    const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.05);
    mesh(group, new THREE.TubeGeometry(path, 64, 0.035, 6, false), blue());
    points.forEach(point => { const marker = mesh(group, new THREE.SphereGeometry(0.075, 12, 8), blue()); marker.position.copy(point); });
    mesh(group, new THREE.ConeGeometry(0.13, 0.36, 16), blue(), [-1.6, 0.16, 1.05]);
    mesh(group, new THREE.SphereGeometry(0.17, 16, 12), blue(), [1.65, 0.19, 0.7]);
    group.rotation.x = 0.35;
    return group;
  }

  function rebuild() {
    if (!active || !renderer) return;
    disposeModel();
    const token = ++loadToken;
    model = active.kind === 'ar' ? buildAR() : active.kind === 'satellite' ? buildSatellite() : buildScreen(active, token);
    scene.add(model);
    active.element.dataset.objectKind = active.kind;
    const scope = active.element.closest('.object-lab') || active.element;
    scope.querySelectorAll('[data-object-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.objectChoice === active.kind)));
    render();
  }

  function resize() {
    if (!active || !renderer || active.failed) return;
    const rect = active.element.getBoundingClientRect();
    const width = Math.max(1, rect.width), height = Math.max(1, rect.height);
    renderer.setPixelRatio(window.matchMedia('(max-width: 760px)').matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0.15, camera.aspect < 1.1 ? 9.0 : 7.8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    render();
  }

  function activate(record) {
    if (contextLost) { showFallback(record, true); return; }
    if (active === record || record.failed) { schedule(); return; }
    stop();
    if (active) showFallback(active);
    active = record;
    try {
      if (!renderer) {
        const attributes = { alpha: true, antialias: true, powerPreference: 'low-power' };
        const context = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
        if (!context) throw new Error('3D unavailable');
        renderer = new THREE.WebGLRenderer({ canvas, context, ...attributes });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(36, 1, 0.1, 70);
        const key = new THREE.DirectionalLight('#f6f8ff', 4.0); key.position.set(-3, 4, 5);
        const fill = new THREE.DirectionalLight('#75aaff', 2.0); fill.position.set(4, 1, -3);
        scene.add(key, fill, new THREE.AmbientLight('#a1b4cf', 1.1));
      }
      record.element.insertBefore(canvas, record.element.firstChild);
      canvas.hidden = false;
      record.ready = true;
      record.element.dataset.objectState = 'ready';
      record.element.dataset.ready = 'true';
      record.element.classList.add('object-ready');
      if (record.fallback) record.fallback.hidden = true;
      rebuild(); resize(); render(); schedule();
      if (!record.failed) record.element.closest('.object-lab')?.querySelectorAll('[data-object-reset], [data-object-choice]').forEach(button => { button.disabled = false; });
      window.dispatchEvent(new CustomEvent('object:ready', { detail: { kind: record.kind, image: Boolean(record.image) } }));
    } catch (_) { showFallback(record, true); }
  }

  function selectVisible() {
    const visible = records.filter(record => record.visible && !record.failed);
    if (!visible.length) { stop(); return; }
    visible.sort((a, b) => Math.abs(a.element.getBoundingClientRect().top + a.element.offsetHeight / 2 - innerHeight / 2) - Math.abs(b.element.getBoundingClientRect().top + b.element.offsetHeight / 2 - innerHeight / 2));
    activate(visible[0]);
  }

  function choose(record, value, image) {
    const kinds = ['screen', 'satellite', 'ar'];
    let kind = value;
    if (value === 'next' || value === 'previous') kind = kinds[(kinds.indexOf(record.kind) + (value === 'next' ? 1 : 2)) % kinds.length];
    else if (/^\d+$/.test(String(value))) kind = kinds[Number(value) % kinds.length];
    if (!kinds.includes(kind)) return;
    record.kind = kind;
    if (image) record.image = image;
    record.yaw = 0.32; record.pitch = kind === 'ar' ? 0.55 : -0.12;
    if (active === record) rebuild();
  }

  records.forEach(record => {
    const element = record.element;
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    element.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button, a, input')) return;
      activate(record);
      dragging = true; dragId = event.pointerId; lastX = event.clientX; lastY = event.clientY;
      element.setPointerCapture?.(event.pointerId);
      element.classList.add('is-dragging');
    });
    element.addEventListener('pointermove', event => {
      if (!dragging || dragId !== event.pointerId || active !== record) return;
      record.yaw += (event.clientX - lastX) * 0.009;
      record.pitch = Math.max(-1.0, Math.min(1.0, record.pitch + (event.clientY - lastY) * 0.006));
      lastX = event.clientX; lastY = event.clientY; render();
    });
    function release() { dragging = false; dragId = null; element.classList.remove('is-dragging'); }
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
    function reset() { record.yaw = 0.32; record.pitch = record.kind === 'ar' ? 0.55 : -0.12; if (record === active) render(); }
    element.addEventListener('keydown', event => {
      if (event.target !== element || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault(); activate(record);
      if (event.key === 'Home') reset();
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') record.yaw += event.key === 'ArrowLeft' ? -0.16 : 0.16;
      else record.pitch = Math.max(-1, Math.min(1, record.pitch + (event.key === 'ArrowUp' ? -0.12 : 0.12)));
      render();
    });
    const scope = element.closest('.object-lab') || element;
    scope.querySelectorAll('[data-object-reset]').forEach(button => button.addEventListener('click', reset));
    scope.querySelectorAll('[data-object-choice]').forEach(button => button.addEventListener('click', () => choose(record, button.dataset.objectChoice, button.dataset.objectImage)));
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (active === record) resize(); }).observe(element);
  });

  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; stop(); if (active) showFallback(active, true); });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    records.forEach(record => {
      record.failed = false;
      record.element.closest('.object-lab')?.querySelectorAll('[data-object-reset], [data-object-choice]').forEach(button => { button.disabled = false; });
    });
    if (!active) return;
    active.failed = false; active.ready = true;
    active.element.dataset.objectState = 'ready'; active.element.dataset.ready = 'true'; active.element.classList.add('object-ready');
    if (active.fallback) active.fallback.hidden = true;
    active.element.closest('.object-lab')?.querySelectorAll('[data-object-reset], [data-object-choice]').forEach(button => { button.disabled = false; });
    render(); schedule();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { records.find(record => record.element === entry.target).visible = entry.isIntersecting; });
      selectVisible();
    }, { rootMargin: '80px', threshold: [0, 0.25, 0.6] });
    records.forEach(record => observer.observe(record.element));
  }
  else { records.forEach(record => { record.visible = true; }); activate(records[0]); }
  window.addEventListener('portfolio:motion', () => { if (options.paused()) stop(); else schedule(); });
  window.addEventListener('scroll', () => { needsSelection = true; }, { passive: true });
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) stop(); else schedule(); });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pagehide', event => {
    stop();
    if (!event.persisted) { disposeModel(); textures.forEach(texture => texture.dispose()); renderer?.dispose(); }
  });
  window.addEventListener('pageshow', () => { hidden = document.hidden; schedule(); });

  const controller = { setObject: value => choose(active || records[0], value), getState: () => ({ count: records.length, active: active?.kind, ready: Boolean(active?.ready), contexts: renderer ? 1 : 0, paused: options.paused() }) };
  window.orbitalObjects = controller;
  return controller;
}
