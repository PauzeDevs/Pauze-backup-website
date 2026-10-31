# PAUZE | Independent Developer

**Live website:** https://pauze.is-a.dev  
**Repository:** https://github.com/PauzeDevs/Pauze-backup-website

A personal website for Pauze, built around existing PauzeDevs projects and a custom procedural 3D environment. The 3D scene is an overlay behind the real page content: it follows the site's sections and maps its project installations to the actual project cards.

## What's on the site

- Custom Three.js environment with a P/Z-inspired central sculpture, architectural forms, particles, and section gateways.
- Scroll-linked camera movement and a route navigator connected to the page's real sections.
- Four interactive 3D project installations mapped to Pauze Weather, Pauze Pulse, Pauze Control, and Other experiments.
- Existing project cards, About section, build notes, and contact links.
- Six playable browser games.
- GitHub public activity and contribution calendar.
- Discord presence, account details, and currently shared music activity when available.
- Website development services and an interactive INR estimate calculator.
- Responsive navigation, keyboard quick navigation, and reduced-motion support.

## Source files

| File | Purpose |
|---|---|
| `index.html` | Page structure, project content, navigation, and section anchors |
| `apple-style.css` | Active site styling, responsive layouts, and 3D overlay presentation |
| `world.js` | Three.js scene, camera movement, section gateways, project installations, and route HUD |
| `script.js` | Page interactions, arcade games, GitHub/Discord integrations, and website estimator |
| `CNAME` | Custom domain for GitHub Pages |
| `sitemap.xml`, `robots.txt` | Search engine discovery and crawling |

`styles.css` and `refresh.css` remain as legacy stylesheets; the current page loads `apple-style.css`.

## Technology

- HTML5, CSS3, and vanilla JavaScript
- Three.js 0.161.0, loaded as an ES module from jsDelivr
- GitHub Pages and the custom domain `pauze.is-a.dev`

The 3D layer requires WebGL and an internet connection for the Three.js module. If WebGL is unavailable, the page content remains usable with the CSS background fallback. Reduced-motion preferences disable continuous scene animation.

## Preview locally

No build step or package manager is required. From the repository root:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Deployment

This is a static GitHub Pages site with its custom domain configured through `CNAME`. Updates committed to the configured publishing branch are published by GitHub Pages.

## Usage

**Proprietary project. All rights reserved.** See [LICENSE](./LICENSE) for usage restrictions. Do not commit API keys, passwords, tokens, or other secrets.
