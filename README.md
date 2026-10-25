# OneByOne Legal Site

Static legal and support pages for OneByOne App Store submission.

Served at https://one-by.one/ (Cloudflare Pages project `onebyone-site`, auto-deploys from `main`).

- `/` — one-by.one product and launch page
- `/privacy/`, `/terms/`, `/support/` — English
- `/connect/` — remote HTTP + OAuth connection guide for MCP agents
- `/blog/` — English blog (index plus one folder per post, `/blog/<slug>/index.html`); uses `assets/blog.css` and `connect.js` for the copy buttons, no other script
- `/ko/`, `/ko/connect/` — Korean translations, indexable with reciprocal EN/KO/x-default hreflang
- `/ko/privacy/`, `/ko/terms/`, `/ko/support/` — English fallback mirrors (canonical legal copy)
- `/ja/privacy/`, `/ja/terms/`, `/ja/support/` — English fallback mirrors (home `/ja/`)
- `/en/*` redirects to the English root paths (`_redirects`, Cloudflare only)

GitHub Pages (https://faithforone.github.io/onebyone-legal/) serves the same files but ignores `_redirects`.

## Editing styles

Cloudflare lets browsers cache `assets/styles.css` for 4 hours, so every page links it with a content hash (`styles.css?v=…`). After changing the stylesheet, refresh the hash in all pages:

```sh
python3 -c 'import hashlib,pathlib,re;v=hashlib.sha256(pathlib.Path("assets/styles.css").read_bytes()).hexdigest()[:10];[p.write_text(re.sub(r"(assets/styles\.css)(\?v=[0-9a-f]+)?\"",rf"\1?v={v}\"",p.read_text())) for p in pathlib.Path(".").rglob("*.html")]'
```

Language detection runs on the first external visit only, using the first preferred browser language. EN/한국어 links remember an explicit choice with localStorage (try/catch); their query marker also works with storage blocked. Automatic navigation uses location.replace; no-JS and identified crawlers stay on the requested URL.

`home.css`, `home.js`, `connect.css`, `connect.js`, `blog.css` and `language.js` use SHA-256 prefixes (10 hex characters) in every HTML reference. Launch switch: `LAUNCH` and `APP_STORE_URL` near the top of the "Launch switch" block in `home.js` turn every launch-updates button into an App Store link.

For the new Korean indexing policy, run `python3 work-sc/check_site.py --site-root .` and `node work-sc/check_behavior.mjs`. The original external checker still assumes all Korean pages are English noindex mirrors; see `work-sc/REPORT.md` for its unchanged result.

Legal content is currently English-only. Cloudflare redirects ko/ja legal URLs to the root English pages; matching English file mirrors also work on hosts that ignore `_redirects`. Keep these mirrors consistent when changing legal copy. International-transfer details and retention operations require owner/legal approval before publication.

Share images: `assets/og.png` (English pages) and `assets/og-ko.png` (Korean home and Connect) are 1200×630 PNGs under 300 KB, rendered from `assets/og-src/template.html`. Regenerate with `node assets/og-src/render.mjs` (needs Google Chrome; Pretendard loads from jsDelivr). Keep key content inside the centre square: chat apps crop to about 2:1 or a square.

Blog: a new post is a folder `blog/<slug>/index.html` copied from an existing post (head tags, Article + BreadcrumbList JSON-LD, visible "Updated" date, end block). Add it to `blog/index.html` (newest first), `sitemap.xml` and the Blog list in `llms.txt`, and keep `dateModified`, the visible Updated date and the `article:modified_time` tag in step when a post changes. Blog pages are English only: they omit `language.js` and the language links so Korean browsers are never redirected away from a post. At launch, search the blog posts for "coming soon" and for `/#notify` (the launch-updates links) and switch them to the App Store link next to the `LAUNCH` switch in `home.js`; the blog does not load `home.js`.

Check the blog with `python3 ../fixes/site/check_site.py --site-root .` (without `--site-root` the checker looks at the sibling `legal-site` checkout, not this one).
