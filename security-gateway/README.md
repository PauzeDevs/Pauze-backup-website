# PAUZE Human Verification Gateway

This folder contains a Cloudflare Worker intended to gate requests for:

- **pauze.is-a.dev**
- **pauze.devs.surf**

The Worker renders a Pauze-branded Turnstile challenge, validates the token server-side with Cloudflare Siteverify, issues a signed, host-bound, HttpOnly session cookie, and only then serves files from the configured public GitHub repository.

## Current status

**Prepared in source control; not deployed or active yet.** This repository is still hosted on GitHub Pages. Merely committing Worker code does not route the custom domains through it. Do not attach domains to this Worker until the Turnstile keys have been configured and the upstream content has been tested.

GitHub Pages files and the repository are public. This gateway adds enforcement when the custom hostnames are routed through it, but it does not make public GitHub source files private; someone could still fetch public source files from GitHub directly. The intent is whole-site bot friction on the named website domains, not confidential-content hosting.

## Free-tier setup

1. Create a Cloudflare account and a Turnstile widget for both hostnames:
   - pauze.is-a.dev
   - pauze.devs.surf
   The site key is public; the secret key must never be committed to Git.
2. Install Node.js and Wrangler, then from this directory run:
   ~~~sh
   npm install --global wrangler
   wrangler login
   ~~~
3. Replace TURNSTILE_SITE_KEY in wrangler.toml with the public Turnstile site key.
4. Set the secrets interactively; use different, randomly generated values:
   ~~~sh
   wrangler secret put TURNSTILE_SECRET_KEY
   wrangler secret put SESSION_SECRET
   ~~~
   SESSION_SECRET should be at least 32 random bytes. Do not put either secret in the repository.
5. Deploy to a temporary workers.dev URL first:
   ~~~sh
   wrangler deploy
   ~~~
   At this point it is only a test endpoint. Requests using a hostname not mapped in Cloudflare to the Worker will not be protected.
6. Test the Worker on a separate test domain, including successful verification, failed verification, expired tokens, mobile layout, CSS/JS/assets, refreshes, and direct requests to nested asset paths.
7. Only after successful tests, route each custom domain to the Worker. Both domains must actually send all paths (HTML and assets) through this gateway.

## Domain-routing caveat

Cloudflare account and DNS access are required to route requests. pauze.is-a.dev is managed under the is-a.dev domain, which may require updating its registration/DNS configuration; a Worker deployed to workers.dev does not automatically protect that hostname. If Cloudflare cannot attach the hostname directly, the domain administrator must configure a supported CNAME/custom-hostname setup. Do not delete the existing GitHub Pages CNAME until a working replacement route and rollback plan are ready.

## Site mapping

SITE_REPOS_JSON currently maps both hostnames to PauzeDevs/Pauze-backup-website on the main branch, based on the CNAME and repository available at setup time. If pauze.devs.surf is meant to show another repository, change its mapping before deploying. The Worker fetches public files from raw.githubusercontent.com, so it does not fetch through the custom domain or create a proxy loop.

## Behavior and security

- Every request path is checked for a valid signed session before static content is served.
- Turnstile tokens are verified with Siteverify; client-side success alone is not accepted.
- Tokens must be for the exact requested hostname and the site_access action.
- Sessions are signed with HMAC-SHA-256, bound to the hostname, valid for eight hours, and stored in a Secure, HttpOnly, SameSite=Lax cookie.
- Invalid tokens, missing secrets, and unavailable verification services fail closed.
- The verification screen itself is noindex and no-store.
- This is anti-bot friction, not identity verification. It does not make the GitHub repository private, and it cannot prevent direct access to public source files or a separately accessible GitHub Pages origin.
