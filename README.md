# OneByOne Legal Site

Static legal and support pages for OneByOne App Store submission.

Served at https://one-by.one/ (Cloudflare Pages project `onebyone-site`, auto-deploys from `main`).

- `/` — one-by.one product and launch page
- `/privacy/`, `/terms/`, `/support/` — English
- `/connect/` — remote HTTP + OAuth connection guide for MCP agents
- `/ko/`, `/ko/connect/` — Korean translations, indexable with reciprocal EN/KO/x-default hreflang
- `/ko/privacy/`, `/ko/terms/`, `/ko/support/` — English fallback mirrors (canonical legal copy)
- `/ja/privacy/`, `/ja/terms/`, `/ja/support/` — English fallback mirrors (home `/ja/`)
- `/en/*` redirects to the English root paths (`_redirects`, Cloudflare only)

GitHub Pages (https://faithforone.github.io/onebyone-legal/) serves the same files but ignores `_redirects`.

## Styles, scripts and content hashes

Cloudflare lets browsers cache `assets/` for 4 hours, so every stylesheet and script reference in every page carries a content hash: `?v=` plus the first 10 hex characters of the file's SHA-256. After changing any of them, refresh all the hashes (run from the repository root; `check_site.py` fails on a stale one):

```sh
python3 - <<'PY'
import hashlib, pathlib, re
for page in pathlib.Path(".").rglob("*.html"):
    if "og-src" in page.parts:
        continue
    def stamp(m):
        asset = pathlib.Path(m[2].lstrip("/")) if m[2].startswith("/") else page.parent / m[2]
        return f'{m[1]}{m[2]}?v={hashlib.sha256(asset.read_bytes()).hexdigest()[:10]}"'
    text = page.read_text()
    new = re.sub(r'((?:href|src)=")([^"?]*assets/[\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"', stamp, text)
    if new != text:
        page.write_text(new)
PY
```

Which page links what (a stylesheet in the head holds back the first paint until it has arrived, so a page links only what it uses):

- `styles.css`: every page. Palette, type, wordmark, footer, the header navigation and EN / 한국어 links, Korean typography.
- `home.css`: the pages with `<body class="home">` (`/`, `/ko/`, `/manifesto/`, `/welcome/`, `/connect/`, `/ko/connect/`).
- `connect.css`: the two Connect guides only. It holds nothing another page needs.
- `home.js` (`defer`): `/`, `/ko/`, `/manifesto/`, `/welcome/`. `connect.js` (`defer`): the two Connect guides.
- `language.js`: every page. On `/` and `/connect/`, the only pages it can redirect away from, it is a plain blocking `<script>` in the head, so a first-time Korean visitor never sees the English page first. Everywhere else it has `defer`. A new page that can redirect must load it without `defer`.

There are no inline scripts (the Content-Security-Policy in `_headers` allows `script-src 'self'` only). At start-up `home.js` does not read layout (`scrollY`, `scrollHeight`, `getBoundingClientRect` and the like): a read there forces the first layout of the whole page inside the script. It uses an IntersectionObserver for the header hairline and a ResizeObserver for the first fit of the text box; keep new start-up code to the same rule.

`--hush` in `home.css` is the quietest text grey and is set to keep at least 4.5:1 on every surface it sits on, in light and dark (the ratios are in the comment beside it). Check the ratio before changing it or putting it on a new background.

Language detection runs on the first external visit only, using the first preferred browser language. EN/한국어 links remember an explicit choice with localStorage (try/catch); their query marker also works with storage blocked. Automatic navigation uses location.replace; no-JS and identified crawlers stay on the requested URL.

Launch switch: `LAUNCH` and `APP_STORE_URL` near the top of the "Launch switch" block in `home.js` turn every launch-updates button into an App Store link.

For the new Korean indexing policy, run `python3 work-sc/check_site.py --site-root .` and `node work-sc/check_behavior.mjs`. The original external checker still assumes all Korean pages are English noindex mirrors; see `work-sc/REPORT.md` for its unchanged result.

Legal content is currently English-only. Cloudflare redirects ko/ja legal URLs to the root English pages; matching English file mirrors also work on hosts that ignore `_redirects`. Keep these mirrors consistent when changing legal copy. International-transfer details and retention operations require owner/legal approval before publication.

Share images: `assets/og.png` (English pages) and `assets/og-ko.png` (Korean home and Connect) are 1200×630 PNGs under 300 KB, rendered from `assets/og-src/template.html`. Regenerate with `node assets/og-src/render.mjs` (needs Google Chrome; Pretendard loads from jsDelivr). Keep key content inside the centre square: chat apps crop to about 2:1 or a square.

## Response headers

`_headers` sets the security headers for every response. HSTS is `max-age=31536000` without `includeSubDomains` or `preload`, on purpose: both apply to every present and future subdomain of one-by.one (`mcp.`, `connect.`, mail and verification hosts, anything a vendor asks for by CNAME), and removal from the browsers' preload list takes months. Add them only after confirming that every subdomain serves valid HTTPS and always will, then submit the domain at hstspreload.org.
