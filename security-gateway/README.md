# PAUZE Human Verification Gateway

This is a Cloudflare Pages Advanced Mode gateway for the following hostnames:

- **pauze.is-a.dev**
- **pauze.devs.surf**
- The project's **pages.dev** hostname for testing

The gateway serves a Pauze-branded Cloudflare Turnstile challenge, validates the token server-side with Cloudflare Siteverify, issues a signed host-bound HttpOnly session cookie, and only then proxies static files from the configured public GitHub repository.

## Current status

**Source prepared in GitHub; not deployed or active yet.** The current site must not be switched over until the Pages project is deployed, its production variables/secrets are configured, verification is tested, and the custom-domain records are updated. This change has not modified the live domain routing.

GitHub Pages files and repository source are public. This gateway can enforce the challenge on hostname requests that reach the Pages project, but it does not make GitHub source private. If a GitHub Pages origin still serves the site directly after cutover, that origin must also be disabled or redirected; otherwise it is an alternate route around the gate.

## Deploy using the free Cloudflare Pages tier

1. Create a Cloudflare account and a Turnstile widget. Allow these hostnames in the widget:
   - pauze-human-verification.pages.dev
   - pauze.is-a.dev
   - pauze.devs.surf

   The site key is public. Never commit the secret key.

2. From a checkout of this repository, open the gateway folder and create the Pages project:
   ~~~sh
   cd security-gateway
   npm install --global wrangler
   wrangler login
   wrangler pages project create pauze-human-verification --production-branch main
   wrangler pages deploy ./pages --project-name pauze-human-verification
   ~~~

3. In Cloudflare Dashboard, open **Workers & Pages → pauze-human-verification → Settings → Variables and Secrets**. Configure production bindings:
   - TURNSTILE_SITE_KEY — the public site key from the Turnstile widget.
   - SITE_REPOS_JSON — keep the JSON mapping shown in wrangler.toml, unless the backup domain serves a different repository.
   - TURNSTILE_SECRET_KEY — set as a **secret**, not a plain variable.
   - SESSION_SECRET — set as a **secret** with at least 32 cryptographically random bytes.

   Make sure the Pages production environment has all four bindings. The gateway fails closed if any required key is missing.

4. Visit the project's pages.dev hostname and test successful verification, failed verification, expired tokens, mobile layout, CSS/JS assets, refreshes, and direct nested asset requests. Fix all failures before changing production DNS.

5. In **Workers & Pages → pauze-human-verification → Custom domains**, add pauze.is-a.dev and pauze.devs.surf. Complete the custom-domain setup there first. For externally managed subdomains, Cloudflare Pages supports a CNAME pointing to the project's pages.dev hostname; the domain owner must update the relevant DNS/registration records. Do not change or remove the existing records until the Pages project passes testing and Cloudflare shows both domains active.

6. After cutover, check the old GitHub Pages hostname as well. If it still renders an unverified copy, disable GitHub Pages for the old publishing repository after confirming the new Pages gateway is live.

## Domain and source mapping

SITE_REPOS_JSON currently maps both production domains to PauzeDevs/Pauze-backup-website on the main branch, matching the repository's current CNAME metadata. If pauze.devs.surf is intended to display a different repository, change its mapping before deployment. The gateway fetches public files from raw.githubusercontent.com; it does not fetch through the custom domains or create a proxy loop.

The pauze.is-a.dev subdomain is registered under the is-a.dev domain. Updating that CNAME may require a change through the is-a.dev registration repository or its domain administrator. This assistant has not changed DNS, cannot access your Cloudflare dashboard from this GitHub connection, and has not deployed the Pages project.

## How the gate works

- Every request path is checked before content is served.
- Tokens are validated server-side with Siteverify; a client-side success callback alone never grants access.
- Tokens must match the exact request hostname and the site_access action.
- Sessions are signed with HMAC-SHA-256, bound to one hostname, and valid for eight hours in a Secure, HttpOnly, SameSite=Lax cookie.
- Invalid tokens, missing secrets, and verification outages fail closed.
- The challenge page is noindex and no-store.

This is an anti-bot measure, not identity verification. It creates friction for automated visitors, but does not make public GitHub files private or guarantee that every successful visitor is human.
