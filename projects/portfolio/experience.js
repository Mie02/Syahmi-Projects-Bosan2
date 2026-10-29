/* Progressive cinematic interactions shared by every portfolio page. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  try { const saved = sessionStorage.getItem('syz-motion-paused'); if (saved !== null) paused = saved === 'true'; } catch (_) {}
  const motionAllowed = () => !paused;
  let revealObserver;
  function syncMotion(value) {
    const wasPaused = paused;
    paused = Boolean(value);
    document.body.classList.toggle('motion-enabled', !paused);
    document.body.classList.toggle('motion-paused', paused);
    if (paused) document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
    else if (wasPaused && revealObserver) document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.remove('is-visible'); revealObserver.observe(el); }
    });
    const label = document.querySelector('#global-motion [data-motion-label]');
    if (label) label.textContent = paused ? 'Enable animations' : 'Pause animations';
    document.getElementById('global-motion')?.setAttribute('aria-pressed', String(paused));
  }
  syncMotion(paused);
  addEventListener('portfolio:motion', event => syncMotion(event.detail.paused));
  // Even if the graphics module fails, the reader can control page motion.
  document.getElementById('global-motion')?.addEventListener('click', () => {
    if (window.orbitalScene) return;
    syncMotion(!paused);
    try { sessionStorage.setItem('syz-motion-paused', String(paused)); } catch (_) {}
  });
  reduced.addEventListener('change', event => {
    if (!window.orbitalScene) syncMotion(event.matches);
  });
  function observeReveals(root = document) {
    const elements = root.querySelectorAll('[data-reveal]');
    elements.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', (index % 3) * 65 + 'ms');
      if (!motionAllowed() || !revealObserver) el.classList.add('is-visible');
      else revealObserver.observe(el);
    });
  }
  if ('IntersectionObserver' in window) revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: .08, rootMargin: '0px 0px -25px 0px' });
  observeReveals();
  document.body.classList.add('motion-ready');

  const chapters = [...document.querySelectorAll('[data-space-chapter]')];
  let scrollFrame = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  function updateChapters() {
    scrollFrame = 0;
    const vh = innerHeight;
    for (const chapter of chapters) {
      const rect = chapter.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) continue;
      const progress = clamp((vh * .75 - rect.top) / (rect.height + vh * .5));
      chapter.style.setProperty('--chapter-progress', progress.toFixed(4));
      if (chapter.dataset.spaceChapter === 'voyage') {
        const travel = clamp(-rect.top / Math.max(1, rect.height - vh));
        chapter.style.setProperty('--voyage-progress', travel.toFixed(4));
        const steps = [...chapter.querySelectorAll('[data-voyage-step]')];
        const active = Math.min(steps.length - 1, Math.floor(travel * steps.length));
        steps.forEach((step, index) => step.classList.toggle('is-active', index === active));
      }
    }
  }
  const requestChapterUpdate = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateChapters); };
  addEventListener('scroll', requestChapterUpdate, { passive: true });
  addEventListener('resize', requestChapterUpdate, { passive: true });
  updateChapters();

  // Native modal semantics retain focus, Escape handling and a non-JS link fallback.
  let projectDialog, dialogContent, activeCard, activeFetch, loadingToken = 0;
  let previousOverflow = '', previousScroll = 0, dialogHistory = false, closing = false, historyClosePending = false;
  const pageCache = new Map();
  function createProjectDialog() {
    projectDialog = document.createElement('dialog');
    projectDialog.className = 'project-dialog';
    projectDialog.setAttribute('aria-labelledby', 'project-preview-title');
    const shell = document.createElement('div'); shell.className = 'project-dialog-shell';
    const close = document.createElement('button'); close.className = 'project-dialog-close'; close.type = 'button'; close.setAttribute('aria-label', 'Close project preview'); close.textContent = '×';
    dialogContent = document.createElement('div'); dialogContent.className = 'project-dialog-body';
    shell.append(close, dialogContent); projectDialog.append(shell); document.body.append(projectDialog);
    close.addEventListener('click', () => closeProject());
    projectDialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
    projectDialog.addEventListener('click', event => { if (event.target === projectDialog) closeProject(); });
  }
  function rebaseContent(container, url) {
    container.querySelectorAll('script, style, link, iframe, canvas, [data-object-viewer]').forEach(el => el.remove());
    container.querySelectorAll('[src], [poster], [href], [data-image]').forEach(el => {
      ['src', 'poster', 'href', 'data-image'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value && !value.startsWith('#')) el.setAttribute(attr, new URL(value, url).href);
      });
    });
    container.querySelectorAll('[srcset]').forEach(el => {
      el.setAttribute('srcset', el.getAttribute('srcset').split(',').map(candidate => {
        const parts = candidate.trim().split(/\s+/); parts[0] = new URL(parts[0], url).href; return parts.join(' ');
      }).join(', '));
    });
    container.querySelectorAll('[id]').forEach(el => { el.id = 'preview-' + el.id; });
    container.querySelectorAll('[aria-labelledby], [aria-describedby], [for]').forEach(el => {
      ['aria-labelledby', 'aria-describedby', 'for'].forEach(attr => { const value = el.getAttribute(attr); if (value) el.setAttribute(attr, value.split(' ').map(id => 'preview-' + id).join(' ')); });
    });
    container.querySelectorAll('[data-reveal], .reveal-up').forEach(el => { el.classList.add('is-visible'); el.removeAttribute('data-reveal'); });
    container.querySelectorAll('video').forEach(video => { video.autoplay = false; video.controls = true; video.preload = 'none'; });
  }
  async function openProject(card, pushHistory = true) {
    if (!('HTMLDialogElement' in window)) { location.assign(card.href); return; }
    if (!projectDialog) createProjectDialog();
    if (projectDialog.open) return;
    activeCard = card; closing = false;
    const title = card.querySelector('h3')?.textContent.trim() || 'Explore the project';
    const image = card.querySelector('img');
    const header = document.createElement('header'); header.className = 'project-dialog-header';
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'A CLOSER LOOK';
    const heading = document.createElement('h2'); heading.id = 'project-preview-title'; heading.textContent = title;
    const fullLink = document.createElement('a'); fullLink.className = 'text-link'; fullLink.href = card.href; fullLink.textContent = 'Open full case study ↗'; fullLink.dataset.fullCase = '';
    header.append(eyebrow, heading, fullLink);
    const content = document.createElement('article'); content.className = 'project-dialog-content';
    const loadStatus = document.createElement('p'); loadStatus.className = 'project-loading'; loadStatus.setAttribute('role', 'status'); loadStatus.textContent = 'Opening the story…'; content.append(loadStatus);
    dialogContent.replaceChildren(header);
    if (image) { const cover = document.createElement('img'); cover.className = 'project-dialog-cover'; cover.src = image.currentSrc || image.src; cover.alt = image.alt; dialogContent.append(cover); }
    dialogContent.append(content);
    previousOverflow = document.body.style.overflow; previousScroll = scrollY;
    document.body.style.overflow = 'hidden';
    projectDialog.showModal(); projectDialog.dataset.state = 'opening';
    if (pushHistory) history.pushState({ ...history.state, portfolioProject: card.href }, '', location.href);
    dialogHistory = true;
    if (motionAllowed() && projectDialog.animate) {
      const from = card.getBoundingClientRect(), to = projectDialog.getBoundingClientRect();
      const animation = projectDialog.animate([
        { opacity: .2, transform: `translate(${from.left + from.width / 2 - to.left - to.width / 2}px,${from.top + from.height / 2 - to.top - to.height / 2}px) scale(${Math.min(.9, Math.max(.45, from.width / to.width))})` },
        { opacity: 1, transform: 'translate(0,0) scale(1)' }
      ], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
      animation.finished.then(() => { if (projectDialog.open) projectDialog.dataset.state = 'open'; }).catch(() => {});
    } else projectDialog.dataset.state = 'open';
    const token = ++loadingToken;
    activeFetch?.abort(); activeFetch = new AbortController();
    try {
      let html = pageCache.get(card.href);
      if (!html) {
        const response = await fetch(card.href, { signal: activeFetch.signal });
        if (!response.ok) throw new Error('Project unavailable');
        html = await response.text(); pageCache.set(card.href, html);
      }
      if (token !== loadingToken || !projectDialog.open) return;
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const source = parsed.querySelector('.container-style-62') || parsed.querySelector('main');
      if (!source) throw new Error('Project content unavailable');
      const imported = source.cloneNode(true); rebaseContent(imported, card.href);
      content.replaceChildren(...imported.childNodes);
    } catch (error) {
      if (error.name !== 'AbortError' && token === loadingToken) loadStatus.textContent = 'The preview could not load. Open the full case study using the link above.';
    }
  }
  async function closeProject(fromHistory = false, immediate = false) {
    if (!projectDialog?.open || closing) return;
    if (!fromHistory && dialogHistory && history.state?.portfolioProject) {
      if (historyClosePending) return;
      historyClosePending = true; history.back(); return;
    }
    closing = true; loadingToken++; activeFetch?.abort();
    if (lightbox?.open) lightbox.close();
    projectDialog.querySelectorAll('video').forEach(video => video.pause());
    projectDialog.dataset.state = 'closing';
    if (!immediate && motionAllowed() && projectDialog.animate) {
      try { await projectDialog.animate([{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(35px) scale(.96)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)' }).finished; } catch (_) {}
    }
    projectDialog.close(); document.body.style.overflow = previousOverflow;
    activeCard?.focus({ preventScroll: true });
    window.scrollTo({ top: previousScroll, behavior: 'instant' });
    closing = false; dialogHistory = false;
    const restoredURL = history.state?.portfolioProject;
    if (typeof restoredURL === 'string') {
      const restoredCard = [...document.querySelectorAll('.work-card, .project-card')].find(link => link.href === restoredURL);
      if (restoredCard) openProject(restoredCard, false);
    }
  }
  addEventListener('popstate', event => {
    historyClosePending = false;
    if (projectDialog?.open) closeProject(true);
    else if (typeof event.state?.portfolioProject === 'string') {
      const card = [...document.querySelectorAll('.work-card, .project-card')].find(link => link.href === event.state.portfolioProject);
      if (card) openProject(card, false);
    }
  });

  let lightbox;
  function showImage(button) {
    if (!('HTMLDialogElement' in window)) { location.assign(button.dataset.image); return; }
    if (!lightbox) {
      lightbox = document.createElement('dialog'); lightbox.className = 'lightbox'; lightbox.setAttribute('aria-label', 'Project image preview');
      const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close image preview');
      lightbox.append(close, document.createElement('img'), document.createElement('p')); document.body.append(lightbox);
      close.addEventListener('click', () => lightbox.close());
      lightbox.addEventListener('click', event => {
        const rect = lightbox.getBoundingClientRect();
        if (event.target === lightbox && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) lightbox.close();
      });
    }
    const image = lightbox.querySelector('img'); image.src = button.dataset.image;
    image.alt = button.dataset.caption || button.querySelector('img')?.alt || 'Project image';
    lightbox.querySelector('p').textContent = image.alt; lightbox.showModal();
  }
  let navigating = false;
  function clearDeparture() {
    navigating = false; document.body.classList.remove('page-leaving');
    window.dispatchEvent(new CustomEvent('portfolio:arrive'));
    document.getElementById('page-transition')?.classList.remove('is-active');
    document.querySelectorAll('.nav a').forEach(link => link.removeAttribute('aria-busy'));
  }
  addEventListener('pageshow', () => {
    clearDeparture(); historyClosePending = false;
    const projectURL = history.state?.portfolioProject;
    if (typeof projectURL === 'string') {
      const card = [...document.querySelectorAll('.work-card, .project-card')].find(link => link.href === projectURL);
      if (card && !projectDialog?.open) openProject(card, false);
    } else if (projectDialog?.open) closeProject(true, true);
    requestChapterUpdate();
  });
  document.addEventListener('click', async event => {
    const imageButton = event.target.closest('.gallery-open[data-image]');
    if (imageButton) { event.preventDefault(); showImage(imageButton); return; }
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return;
    if (anchor.matches('.work-card, .project-card') && /\/projects\/[^/]+\.html$/.test(url.pathname)) { event.preventDefault(); openProject(anchor); return; }
    if (url.pathname === location.pathname && url.search === location.search) return;
    const portfolioRoot = new URL('.', document.querySelector('script[src$="experience.js"]')?.src || location.href).pathname;
    if (!url.pathname.startsWith(portfolioRoot) || !motionAllowed()) return;
    event.preventDefault(); if (navigating) return; navigating = true;
    anchor.setAttribute('aria-busy', 'true');
    window.dispatchEvent(new CustomEvent('portfolio:navigate', { detail: { url: url.href } }));
    document.body.classList.add('page-leaving');
    document.getElementById('page-transition')?.classList.add('is-active');
    setTimeout(() => location.assign(url.href), 260);
    setTimeout(clearDeparture, 1600);
  });
  requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('portfolio:arrive')));
})();
