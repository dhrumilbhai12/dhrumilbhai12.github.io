# Tinkro — marketing site + free tools

Static site (plain HTML/CSS/vanilla JS). No build step required to deploy.

## Structure
- `index.html`, `features.html`, `pricing.html`, `templates.html`, `about.html`, `privacy.html`, `terms.html`, `404.html`
- `tools/screen-recorder.html` — working in-browser screen recorder (`assets/js/recorder.js`)
- `tools/form-builder.html` — working form builder with HTML export (`assets/js/form-builder.js`)
- `compare/*.html` — Loom / Typeform / Notion Forms comparison pages
- `blog/` — index + 2 articles
- `assets/css/style.css`, `assets/js/main.js` — shared styles and behaviour (nav, scroll reveal, waitlist)
- `sitemap.xml`, `robots.txt`, `favicon.svg`, `site.webmanifest`, `_headers` (Cloudflare Pages headers), `assets/img/og.png`

## Deploy to Cloudflare Pages
**Option A — dashboard (drag & drop):** Cloudflare dashboard → Workers & Pages → Create → Pages → *Upload assets* → name the project `tinkro` → upload this folder (or the zip contents) → Deploy. You get `https://tinkro.pages.dev`.

**Option B — Git:** push this folder to a GitHub repo → Pages → *Connect to Git* → Framework preset: **None**, Build command: *(empty)*, Build output directory: `/` (or the folder containing `index.html`).

**Option C — CLI:** `npx wrangler pages deploy . --project-name tinkro`

`_headers` and `404.html` are picked up automatically by Cloudflare Pages. Pages serves `/features.html` at `/features` (clean URLs); canonicals and the sitemap already use the clean form.

## Changing the domain (e.g. the planned .xyz)
The base URL `https://tinkro.pages.dev` is written into canonical tags, Open Graph/Twitter tags, JSON-LD, `sitemap.xml` and `robots.txt`.
1. Easiest: find-and-replace across the folder:
   `grep -rl "https://tinkro.pages.dev" . | xargs sed -i 's#https://tinkro.pages.dev#https://tinkro.xyz#g'`
2. Or edit `BASE` in the generator (`../build/common.py`) and re-run `python3 p_index.py p_tools.py p_pages.py p_blog.py p_infra.py` (run each script) — the generators are the source of truth for the HTML.
3. In Cloudflare Pages → Custom domains, add the domain, then (optional) add a redirect from `tinkro.pages.dev`.
Also update the "Made with Tinkro" URL baked into exported forms in `assets/js/form-builder.js`.

## TODOs
- **Waitlist backend:** `assets/js/main.js` stores emails in `localStorage` only (see the `TODO(backend)` comment). Connect a Pages Function + KV/D1, Formspree, Buttondown, etc. If you POST to another origin, add it to `connect-src`/`form-action` in `_headers` CSP.
- **Log in / Get Started** buttons point to `/#waitlist` until the app exists.
- Privacy page: add a real contact email before launch.
- Competitor facts on compare/blog pages reflect public pricing at time of writing (Loom free 25 videos / 5 min; Typeform free 10 responses/month; Notion form logic on paid plans). Re-check periodically.

## Notes on the tools
- Screen recorder: desktop Chrome/Edge/Firefox/Safari 16+. Mobile browsers can't capture the screen; the page explains this. MP4 appears in the format menu only where `MediaRecorder` supports it. Recordings never leave the device.
- `_headers` allows camera/mic/display-capture only on `/tools/screen-recorder*`.
