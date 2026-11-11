# PAUZE

**Website:** https://pauze.is-a.dev  
**Repository:** https://github.com/PauzeDevs/Pauze-backup-website  
**Developer profile:** https://github.com/PauzeDevs

A deliberately lean, one-page home for PauzeDevs. The site presents selected software projects, a short introduction and direct contact links. Its visual identity is built from typography, CSS geometry and interaction rather than stock photography or generated filler.

## What is wired up

- Responsive navigation with mobile menu, Escape-to-close and active-section indication.
- Project filters for Web, Android, Tools and AI, with accessible pressed states and live result counts.
- Project links to public source repositories, release pages, build history and the PauzeControl project website.
- Honest private-repository labels where the source is not public.
- Pointer-aware project lighting and a restrained monogram movement on desktop.
- Scroll progress, reveal transitions and a live Lucknow/IST clock.
- Reduced-motion handling and keyboard-visible focus states.
- Email launch and copy-to-clipboard actions with success/failure feedback.
- Search metadata, Open Graph/Twitter metadata, a custom SVG favicon, `robots.txt`, `sitemap.xml` and a custom 404 page.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, metadata, project cards and navigation |
| `pauze-2.css` | Responsive visual system and interaction states |
| `pauze-2.js` | Navigation, filters, clock, motion and contact actions |
| `favicon.svg` | Original PZ browser mark |
| `404.html` | Branded not-found page |
| `CNAME` | Custom GitHub Pages domain |
| `robots.txt`, `sitemap.xml` | Search crawler guidance |

## Run locally

No build step or package manager is required:

```bash
python3 -m http.server 4173
```

Open http://localhost:4173.

## Deployment

This is a static GitHub Pages site. The custom domain is configured in `CNAME`. Changes on the configured publishing branch are deployed by GitHub Pages. The redesign work is being developed on `redesign/pauze-2.0`; it does not change `main` until merged.

## Notes

- Some projects are private and are labelled accordingly. Private source links are intentionally not presented as public downloads.
- Third-party font delivery requires an internet connection. System font fallbacks remain available.
- Browser and device testing should be completed before merging to the production branch.
