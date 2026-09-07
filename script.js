/* ============================================================
   MIE'S PROJECT HUB — script.js
   Loads projects.json → renders cards → handles search/filter
   To add a project: edit projects.json only. No JS edits needed.
   ============================================================ */

(function () {
  'use strict';

  /* ─── State ─────────────────────────────────────────────── */
  let allProjects = [];
  let activeCategory = 'All';
  let searchQuery = '';

  /* ─── DOM refs ──────────────────────────────────────────── */
  const grid       = document.getElementById('projects-grid');
  const searchEl   = document.getElementById('search');
  const filterBar  = document.getElementById('filter-chips');
  const statTotal  = document.getElementById('stat-total');
  const statCats   = document.getElementById('stat-cats');
  const statLast   = document.getElementById('stat-last');

  /* ─── Starfield ─────────────────────────────────────────── */
  function initStars() {
    const canvas = document.getElementById('stars-canvas');
    const ctx    = canvas.getContext('2d');
    let stars    = [];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawn() {
      stars = [];
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x:   Math.random() * canvas.width,
          y:   Math.random() * canvas.height,
          r:   Math.random() * 1.2 + 0.2,
          a:   Math.random(),
          da:  (Math.random() - 0.5) * 0.003,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.a += s.da;
        if (s.a <= 0 || s.a >= 1) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204, 214, 246, ${s.a})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    spawn();
    draw();
    window.addEventListener('resize', () => { resize(); spawn(); });
  }

  /* ─── Load data ─────────────────────────────────────────── */
  async function load() {
    showSkeletons(8);
    try {
      const res  = await fetch('projects.json');
      if (!res.ok) throw new Error('Failed to fetch projects.json');
      const data = await res.json();

      // sort newest first
      allProjects = data.sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated));

      updateStats();
      buildFilterChips();
      render();
    } catch (err) {
      console.warn('Network fetch for projects.json failed (likely local file:// protocol). Activating embedded fallback catalog.', err);
      try {
        const fallback = [
          {
            "id": "turboboost",
            "title": "TurboBoost Pro — AI & Shizuku Performance Engine",
            "description": "Ultra-compact (382 KB) native Android performance suite with Shizuku-automated debloater, System App Protector Guardrails, and real-time hardware telemetry.",
            "path": "projects/turboboost/index.html",
            "thumbnail": "assets/thumbnails/turboboost.png",
            "category": "Mobile",
            "tags": ["Android", "APK", "Shizuku", "Performance", "Safety Shield"],
            "status": "Complete",
            "dateUpdated": "2026-09-07"
          },
          {
            "id": "paperforge",
            "title": "PaperForge — FYP Defense & Survey Analysis Studio",
            "description": "Empirical psychometrics suite for FTMK FYP: automated Cronbach's alpha, straight-liner detection, APA 7.0 table exporter, and AI viva defense simulator.",
            "path": "projects/paperforge/index.html",
            "thumbnail": "assets/thumbnails/paperforge.svg",
            "category": "Academic",
            "tags": ["Psychometrics", "Cronbach's Alpha", "APA 7.0", "FYP Defense", "AI Examiner"],
            "status": "Complete",
            "dateUpdated": "2026-09-07"
          },
          {
            "id": "manifold",
            "title": "Manifold AI — Multi-Model Reasoning Dashboard",
            "description": "Prompt orchestration suite broadcasting inputs across multiple frontier LLMs simultaneously with differential output comparison.",
            "path": "projects/manifold/index.html",
            "thumbnail": "assets/thumbnails/manifold.svg",
            "category": "AI/ML",
            "tags": ["LLM", "Multi-Model", "Prompting", "Dashboard"],
            "status": "Complete",
            "dateUpdated": "2026-08-15"
          },
          {
            "id": "arnav",
            "title": "ARNav — Indoor AR Navigation",
            "description": "Unity 6 + AR Foundation indoor nav for FTMK building using QR anchors. Real-time pathfinding overlaid on the physical world.",
            "path": "projects/arnav/index.html",
            "thumbnail": "assets/thumbnails/arnav.svg",
            "category": "AR/VR",
            "tags": ["Unity", "AR Foundation", "QR", "NavMesh"],
            "status": "Complete",
            "dateUpdated": "2026-07-28"
          },
          {
            "id": "scholarhub",
            "title": "ScholarHub — Academic Resource Portal",
            "description": "Centralised dashboard for students to discover, bookmark, and track academic papers, lecture notes, and group study sessions.",
            "path": "projects/scholarhub/index.html",
            "thumbnail": "assets/thumbnails/scholarhub.svg",
            "category": "Academic",
            "tags": ["Web App", "Firebase", "Search", "Dashboard"],
            "status": "Complete",
            "dateUpdated": "2026-06-14"
          },
          {
            "id": "agentos",
            "title": "AgentOS — AI Agent Orchestration UI",
            "description": "Visual interface for spawning, monitoring, and chaining autonomous AI agents. Directed acyclic graph builder with live log streams.",
            "path": "projects/agentos/index.html",
            "thumbnail": "assets/thumbnails/agentos.svg",
            "category": "AI/ML",
            "tags": ["LLM", "Agents", "Canvas UI", "WebSockets"],
            "status": "Complete",
            "dateUpdated": "2026-06-20"
          },
          {
            "id": "psm-endless-runner",
            "title": "PSM Endless Runner",
            "description": "Infinite side-scroller built for a Programming & Software Methods assignment. Procedural level generation, velocity jump physics, high-score persistence.",
            "path": "projects/psm-endless-runner/index.html",
            "thumbnail": "assets/thumbnails/psm-runner.svg",
            "category": "Game",
            "tags": ["Canvas 2D", "JavaScript", "Procedural Gen"],
            "status": "Complete",
            "dateUpdated": "2026-05-30"
          },
          {
            "id": "portfolio",
            "title": "Deep Space Observatory — Portfolio",
            "description": "Personal portfolio with a sci-fi HUD aesthetic. Starfield constellation canvas, animated skill nodes, and a mission-log timeline.",
            "path": "projects/portfolio/index.html",
            "thumbnail": "assets/thumbnails/portfolio.svg",
            "category": "Web",
            "tags": ["Three.js", "GSAP", "Portfolio", "CSS Art"],
            "status": "Complete",
            "dateUpdated": "2026-06-10"
          },
          {
            "id": "ftmk-timetable",
            "title": "FTMK Campus Companion & Smart Timetable",
            "description": "AI-powered timetable parser, weekly cyber schedule grid, clash detection engine, .ICS calendar export, and direct ARNav QR spatial anchor navigation.",
            "path": "projects/ftmk-timetable/index.html",
            "thumbnail": "assets/thumbnails/timetable.svg",
            "category": "Tools",
            "tags": ["Timetable OCR", "Clash Detector", "ARNav Bridge", "iCal", "Telegram Bot"],
            "status": "Complete",
            "dateUpdated": "2026-09-07"
          }
        ];
        allProjects = fallback.sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated));
        updateStats();
        buildFilterChips();
        render();
      } catch (innerErr) {
        grid.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">⚠</div>
          <div class="empty-state-title">Could not load projects.json</div>
          <div class="empty-state-hint">${err.message}</div>
        </div>`;
      }
    }
  }

  /* ─── Stats ─────────────────────────────────────────────── */
  function updateStats() {
    statTotal.textContent = allProjects.length;

    const cats = new Set(allProjects.map(p => p.category));
    statCats.textContent = cats.size;

    const latest = allProjects[0]?.dateUpdated;
    if (latest) {
      statLast.textContent = new Date(latest).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }
  }

  /* ─── Filter chips ──────────────────────────────────────── */
  function buildFilterChips() {
    const cats = ['All', ...new Set(allProjects.map(p => p.category))];
    filterBar.innerHTML = cats.map(cat =>
      `<button class="chip${cat === 'All' ? ' active' : ''}" data-cat="${cat}" aria-pressed="${cat === 'All'}">${cat}</button>`
    ).join('');

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      activeCategory = btn.dataset.cat;
      filterBar.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c === btn);
        c.setAttribute('aria-pressed', c === btn ? 'true' : 'false');
      });
      render();
    });
  }

  /* ─── Filter & render ───────────────────────────────────── */
  function render() {
    const q = searchQuery.toLowerCase();

    const filtered = allProjects.filter(p => {
      const inCat = activeCategory === 'All' || p.category === activeCategory;
      const inSearch = !q || [p.title, p.description, ...(p.tags || [])].some(s =>
        s.toLowerCase().includes(q)
      );
      return inCat && inSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">◎</div>
        <div class="empty-state-title">No projects found</div>
        <div class="empty-state-hint">Try a different search term or category</div>
      </div>`;
      return;
    }

    grid.innerHTML = filtered.map((p, i) => cardHTML(p, i)).join('');

    // Keyboard nav — Enter opens card
    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter') window.location.href = card.href;
      });
    });
  }

  /* ─── Card HTML ─────────────────────────────────────────── */
  const CATEGORY_ICONS = {
    'AR/VR': '◈', 'AI/ML': '◆', 'Web': '⬡', 'Academic': '◉',
    'Game': '▶', 'Tools': '⚙', 'Mobile': '⚡',
  };

  function statusClass(s) {
    return s === 'Complete' ? 'complete' : s === 'In Progress' ? 'in-progress' : 'archived';
  }

  function cardHTML(p, i) {
    const delay  = Math.min(i * 50, 400);
    const icon   = CATEGORY_ICONS[p.category] || '◎';
    const tags   = (p.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');
    const date   = new Date(p.dateUpdated).toLocaleDateString('en-GB', {
      month: 'short', year: 'numeric'
    });

    const thumb = p.thumbnail
      ? `<img class="card-thumb" src="${p.thumbnail}" alt="${p.title}" loading="lazy" onerror="this.replaceWith(placeholder('${icon}'))">`
      : `<div class="card-thumb-placeholder" aria-hidden="true">${icon}</div>`;

    return `
      <a class="card" href="${p.path}" tabindex="0" aria-label="${p.title}"
         style="animation-delay:${delay}ms">
        ${thumb}
        <div class="card-body">
          <div class="card-top">
            <div class="card-title">${p.title}</div>
            <span class="status-badge ${statusClass(p.status)}">${p.status}</span>
          </div>
          <p class="card-desc">${p.description}</p>
          <div class="card-footer">
            <span class="card-category">${p.category}</span>
            <div class="card-tags">${tags}</div>
          </div>
          <div class="card-date">Updated ${date}</div>
        </div>
      </a>`;
  }

  /* helper for broken thumbnails */
  window.placeholder = function (icon) {
    const d = document.createElement('div');
    d.className = 'card-thumb-placeholder';
    d.setAttribute('aria-hidden', 'true');
    d.textContent = icon;
    return d;
  };

  /* ─── Skeletons ─────────────────────────────────────────── */
  function showSkeletons(n) {
    grid.innerHTML = Array.from({ length: n }, () => `
      <div class="skeleton-card">
        <div class="sk-thumb"></div>
        <div class="sk-body">
          <div class="sk-line short"></div>
          <div class="sk-line full"></div>
          <div class="sk-line medium"></div>
          <div class="sk-line short"></div>
        </div>
      </div>`).join('');
  }

  /* ─── Search ────────────────────────────────────────────── */
  searchEl.addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    render();
  });

  /* ─── Boot ──────────────────────────────────────────────── */
  initStars();
  load();

})();
