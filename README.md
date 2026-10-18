# PAUZE® — Digital Studio Website

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=22&duration=2600&pause=700&color=4C8DFF&center=true&vCenter=true&width=680&lines=PAUZE%C2%AE+%E2%80%94+Digital+Studio+Website" alt="Animated header: PAUZE® — Digital Studio Website">
</p>

**Live website:** https://pauze.is-a.dev

A responsive, project-first portfolio for Pauze, showcasing software, developer tools, experiments, and creative work. Built with plain HTML, CSS, and JavaScript.

> **Proprietary project — All Rights Reserved.** This repository is public for viewing, but its source code and creative assets are not licensed for reuse. See [LICENSE](./LICENSE).

## Visit the website

Open **[pauze.is-a.dev](https://pauze.is-a.dev)** to explore the live portfolio.

## Features

- Responsive portfolio layout for desktop and mobile
- Animated PAUZE graffiti intro splash with a spray-painting character
- Project cards for PauzeWeather, PauzeControl, and other experiments
- About, skills, music, activity, build log, and contact sections
- CSS-generated interface visuals and decorative effects
- Mobile navigation and scroll-reveal effects
- Reduced-motion support for visitors who prefer less animation

## Tech stack

- HTML5
- CSS3 and CSS animations
- Vanilla JavaScript
- GitHub Pages for hosting
- Custom domain: `pauze.is-a.dev`

## Project structure

- `index.html` — page structure and content
- `styles.css` — styling, layout, and animations
- `script.js` — interactive behavior
- `LICENSE` — proprietary usage restrictions

## Usage and permissions

Viewing this public repository does **not** grant permission to copy, republish, modify, redistribute, sell, or create derivative works from its code or creative assets. Written permission from the copyright holder is required, except where applicable law provides otherwise.

GitHub does not offer a way to disable cloning or downloading for a public repository. The license states the reuse restrictions, but it cannot technically prevent someone from accessing public source code. Do not place API keys, passwords, tokens, or other secrets in this repository.

## Deployment

The website is hosted with GitHub Pages at **[pauze.is-a.dev](https://pauze.is-a.dev)**.

---

Made by **PAUZE®**. All rights reserved.

## Run locally

This is a static site with no package manager, build step, or test script. To preview it from the repository root, use Python 3:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`. The deployed site is published through GitHub Pages.


## Human verification gateway

Source for the optional Cloudflare Pages + Turnstile gateway is in [security-gateway/README.md](./security-gateway/README.md). It is designed to gate requests on **pauze.is-a.dev** and **pauze.devs.surf** before serving the site.

**This gateway is prepared but not live.** It still needs a Cloudflare Pages deployment, production Turnstile/session secrets, and custom-domain DNS changes. The existing GitHub Pages site has not been redirected, so there is no live verification gate yet. The public GitHub repository and raw source files remain accessible.
