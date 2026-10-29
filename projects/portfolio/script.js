/* Shared portfolio interactions. The GPU scene is isolated in scene.js. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const menu = document.getElementById('mobileMenu');
  const toggle = document.getElementById('hamburger');
  let menuOpen = false, menuOverflow = '';
  function setMenu(open, focusBack = false) {
    if (!menu || !toggle) return;
    if (open && !menuOpen) { menuOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    else if (!open && menuOpen) document.body.style.overflow = menuOverflow;
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menu.hidden = !open; menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    document.querySelector('main')?.toggleAttribute('inert', open);
    document.querySelector('body > footer')?.toggleAttribute('inert', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) menu.querySelector('a')?.focus();
    else if (focusBack) toggle.focus();
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (toggle?.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const focusable = [toggle, ...menu.querySelectorAll('a[href]')];
      const index = focusable.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1).focus(); }
      else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); toggle.focus(); }
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  document.addEventListener('click', event => { if (toggle?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.nav, .mobile-menu')) setMenu(false); });
  let scrollPending = false;
  const updateScroll = () => {
    const extent = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--scroll', (extent > 0 ? scrollY / extent * 100 : 0) + '%');
    document.getElementById('navbar')?.classList.toggle('scrolled', scrollY > 30);
    scrollPending = false;
  };
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  const filterButtons = [...document.querySelectorAll('.filter-chip[data-filter]')];
  const projectCards = [...document.querySelectorAll('#project-grid > [data-project-tags]')];
  const filterStatus = document.getElementById('project-filter-status');
  function filterProjects(value, updateURL = true) {
    if (!filterButtons.some(button => button.dataset.filter === value)) value = 'all';
    let visible = 0;
    for (const card of projectCards) { card.hidden = value !== 'all' && !card.dataset.projectTags.split(/\s+/).includes(value); if (!card.hidden) visible++; }
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.filter === value));
    if (filterStatus) filterStatus.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'}${value === 'all' ? ' to explore' : ' in ' + (filterButtons.find(button => button.dataset.filter === value)?.textContent.trim() || value)}`;
    if (updateURL) history.replaceState(null, '', location.pathname + location.search + (value === 'all' ? '' : '#' + value));
  }
  filterButtons.forEach(button => button.addEventListener('click', () => filterProjects(button.dataset.filter)));
  if (filterButtons.length) { filterProjects(location.hash.slice(1).toLowerCase(), false); addEventListener('hashchange', () => filterProjects(location.hash.slice(1).toLowerCase(), false)); }
  document.querySelectorAll('[data-tilt], .project-card, .fancy-skill-card').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || document.body.classList.contains('motion-paused') || !matchMedia('(hover: hover)').matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5, y = (event.clientY - box.top) / box.height - .5;
        card.style.transform = `perspective(1100px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-4px)`; frame = 0;
      });
    });
    const clearTilt = () => { cancelAnimationFrame(frame); frame = 0; card.style.transform = ''; };
    card.addEventListener('pointerleave', clearTilt); card.addEventListener('blur', clearTilt); reduced.addEventListener('change', clearTilt);
  });
  const copyButton = document.getElementById('copy-email');
  copyButton?.addEventListener('click', async () => {
    const email = copyButton.dataset.email || 'ahmadsyahmi723@gmail.com', status = document.getElementById('copy-email-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email); if (status) status.textContent = 'Email copied.';
    } catch {
      let fallback = document.getElementById('email-copy-fallback');
      if (!fallback) {
        fallback = document.createElement('div'); fallback.id = 'email-copy-fallback'; fallback.className = 'email-copy-fallback';
        const label = document.createElement('label'); label.htmlFor = 'email-copy-value'; label.textContent = 'Select and copy this email address';
        const input = document.createElement('input'); input.id = 'email-copy-value'; input.type = 'text'; input.readOnly = true; input.value = email;
        fallback.append(label, input); copyButton.parentElement.append(fallback);
      }
      fallback.hidden = false; const input = fallback.querySelector('input'); input?.focus(); input?.select();
      if (status) status.textContent = 'Select the address below to copy it.';
    }
  });
  // Gallery buttons (including fetched project previews) are delegated by experience.js.
  setTimeout(() => {
    if (document.querySelector('#universe') && !document.body.classList.contains('scene-ready')) {
      const status = document.getElementById('scene-status'); if (status) status.textContent = 'Still universe';
      const help = document.getElementById('scene-help'); if (help) help.textContent = 'STILL ARTWORK · 3D UNAVAILABLE';
      document.querySelectorAll('[data-scene-mode], #reset-view, #motion-toggle').forEach(button => { button.disabled = true; });
    }
  }, 15000);
  addEventListener('scene:ready', () => document.querySelectorAll('[data-scene-mode], #reset-view, #motion-toggle').forEach(button => { button.disabled = false; }));
})();
