# Delevo platform — project map (read this, don't explore)

Meal-subscription demo. Visible brand name = **Delevo**; technical ids stay `delyvo`.
Frontend only, vanilla JS, no build step. 4 apps share one localStorage state (`shared/store.js` = `window.DV`), synced across tabs.

## Layout (lines)
- `shared/` store.js (500, state + API), data.js (199, seed data), lang.js, ui.js, base.css, phone.css
- `customer/` app.js (897), i18n.js (AR/NL/EN), index.html — iPhone-framed app. OTP 1234, demo user Sara (c1)
- `driver/` app.js (843) — PIN 1111/2222/3333
- `restaurant/` app.js (1028) — PIN 1234, kanban + sticker printing (QR)
- `admin/` app.js, core.js, sec-overview.js, sec-people.js, sec-catalog.js, i18n.js — no login
- `server/server.js` (zero-dep Node sync server, port 3500): GET/PUT /api/state (optimistic rev, 409 on conflict), SSE /api/events. Data in server/data/state.json
- `index.html` landing linking the 4 apps; `assets/img/` dish photos
- `native/` Capacitor iOS shell (bundles customer+shared+assets). `npm run sync` in native/. Builds ONLY via GitHub Actions `.github/workflows/ios-testflight.yml` (local Xcode too old). Never submit for Apple review.

## Sync (done in session 1)
`shared/store.js` has local mode (no API) and server mode. API url = `?api=` → localStorage `delyvo.api` → `DEFAULT_API` const at top of the persistence section (= https://delevo-sync.34-7-31-149.sslip.io, set locally, NOT yet pushed to GitHub Pages). commit() applies locally, pushes with baseRev; on 409 adopts server state and re-applies unacked commits. Tested with 2 jsdom clients. Status: `DV.syncStatus()`, event `dv-sync`.
**Deployed** on the Google VM (ssh -i ~/.ssh/kayan_content_vps kayan@34.7.31.149): systemd `delevo-sync` (/opt/delevo-sync, port 3500, data /var/lib/delevo-sync/state.json), Caddy site `delevo-sync.34-7-31-149.sslip.io` (Caddyfile backup: Caddyfile.bak-delevo). Hostinger is no longer used. Update server: rsync server/server.js → /opt/delevo-sync then `sudo systemctl restart delevo-sync`.

## Business rules
- Restaurants are hidden from customers; never accept/reject (orders auto-confirmed)
- Customer sees subscription price only, never per-meal price; change cutoff = midnight
- Brand green #1FA06B; light theme only

## Deploy
GitHub Pages: push to main → https://alaroomiyunuss-pixel.github.io/delyvo-platform/ (push only when user asks)

## Working rules (token saving — strict)
- NEVER use simulator, browser, or screenshots. User tests at session end and sends issues as text.
- Don't explore: use this map, then `grep -n` and read only the needed line ranges (`sed -n 'a,bp'`), never whole big files.
- Never read: native/node_modules, native/ios, native/build, native/www, .git, assets/img.
- Pipe long command output through `tail -30` / `grep -i error`.
- No subagents/workflows. Short replies, in Arabic.
- One task per session; tell the user when to start a new numbered session. Update this file when structure changes.
