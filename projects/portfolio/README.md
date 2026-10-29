# Ahmad Syahmi Zufayri — cinematic portfolio

Personal portfolio published at [mie02.github.io/Syahmi-Projects-Bosan2/projects/portfolio](https://mie02.github.io/Syahmi-Projects-Bosan2/projects/portfolio/).

The site is static HTML, CSS and JavaScript with no build step. The home page uses locally vendored Three.js 0.160.1 (MIT) for its procedural orbital scene. Drag or use arrow keys to rotate it, press Home to reset, and switch between Orbit, Nebula and Eclipse lighting. The scene respects reduced motion, supports pause and reset, caps mobile resolution, and stops rendering outside the viewport. A CSS illustration remains available when WebGL cannot load. GSAP and Lenis are not required. Google Fonts is optional; system font fallbacks keep the content readable if it cannot load.

To preview from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/projects/portfolio/` in a browser. The site uses relative links so it also works within the GitHub Pages repository path.

The project collection contains seven projects and supports Unity, OpenGL, Blender, Motion and AR filters. Project pages preserve the supplied descriptions, screenshots and two videos. Videos load only when requested. The shared script handles mobile navigation, filtering, gallery previews and contact interactions. `legacy.css` retains the original inner-page layouts; `style.css` supplies the current visual design.

The AR Indoor Navigation project remains in progress. Its tools, implemented features and outcomes have not been supplied. Bujang Lapok media is awaiting a preview; no replacement imagery or project results have been invented. Unknown CV and LinkedIn links are omitted. The About page uses a monogram because a personal portrait was not supplied, and omits the source education logos where their branding could not be confirmed.

Canonical and sharing URLs are set for the published GitHub Pages path. The local `404.html` provides recovery links when opened directly; GitHub Pages only uses a custom error document placed at the repository publishing root.
