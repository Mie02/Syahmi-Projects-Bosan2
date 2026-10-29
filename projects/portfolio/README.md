# Ahmad Syahmi Zufayri — an interactive space portfolio

The deployment path is [mie02.github.io/Syahmi-Projects-Bosan2/projects/portfolio](https://mie02.github.io/Syahmi-Projects-Bosan2/projects/portfolio/). The site uses static HTML, CSS and JavaScript with no build step.

A shared, locally vendored Three.js 0.160.1 scene accompanies all twelve pages. Native scrolling changes the camera and lighting between chapters. The home page includes a pinned three-part journey, a manual orbital interaction zone, and Orbit, Nebula and Eclipse lighting options. Every page also includes its own interactive procedural object study: a display, satellite, or floor plan. Display textures use supplied project screenshots; these studies are clearly distinguished from the original project assets and demos.

Drag a viewer or use its arrow keys to rotate it; Home and Reset restore the view. The Skills viewer also offers three object choices. The persistent animation control pauses the shared scene and object studies, and respects the operating system's reduced-motion preference until explicitly enabled. Static CSS illustrations and readable content remain available if JavaScript or WebGL is unavailable. Rendering resolution and geometry adapt for smaller devices; offscreen viewers and hidden tabs stop their rendering work. GSAP and Lenis are not required. Google Fonts is optional, with system font fallbacks.

To preview from the repository root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/projects/portfolio/` in a browser. The site uses relative links so it also works within the GitHub Pages repository path.

The project collection contains seven projects with Unity, OpenGL, Blender, Motion and AR filters. Project links progressively enhance into expanding case-study dialogs, with ordinary full-page navigation as a fallback. Project pages preserve the supplied descriptions, captioned screenshots and two videos. Videos load only when requested. The shared interactions provide mobile navigation, filters, gallery previews, contact actions, section reveals, the scroll story and page transitions. Wheel and touch scrolling remain native.

`legacy.css` retains the original inner-page layout rules, `style.css` provides the base components, and `journey.css` supplies the current obsidian, silver and blue design. `script.js` handles common interactions; `experience.js` adds the journey, transitions and expanding project previews; `scene.js` and its object helper own the 3D rendering. Each page loads the same shared files using relative paths.

The AR Indoor Navigation project remains in progress. Its tools, implemented features and outcomes have not been supplied. Bujang Lapok media is awaiting a preview; no replacement imagery or project results have been invented. Unknown CV and LinkedIn links are omitted. The About page uses a monogram because a personal portrait was not supplied, and omits the source education logos where their branding could not be confirmed.

Canonical and sharing URLs are set for the published GitHub Pages path. The local `404.html` provides recovery links when opened directly; GitHub Pages only uses a custom error document placed at the repository publishing root.
