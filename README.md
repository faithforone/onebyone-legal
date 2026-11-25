# OneByOne Legal Site

Static legal and support pages for OneByOne App Store submission.

Served at https://one-by.one/ (Cloudflare Pages project `onebyone-site`, auto-deploys from `main`).

- `/` — one-by.one product and launch page
- `/privacy/`, `/terms/`, `/support/` — English
- `/connect/` — remote HTTP + OAuth connection guide for MCP agents
- `/blog/` — English blog (index plus one folder per post, `/blog/<slug>/index.html`); uses `assets/site.css` + `assets/doc.css` and `doc.js` (copy buttons), no other script
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

`home.css`, `home.js`, `site.css`, `doc.css`, `doc.js`, `v3.css`, `v3.js`, `analytics.js` and `language.js` use SHA-256 prefixes (10 hex characters) in every HTML reference.

The home (`/` and `/ko/`, since 2026-11-26), the blog and the Connect guide share one look. `site.css` holds what they all use (colour and size tokens, top bar, buttons, footer). `doc.css` + `doc.js` are for reading pages (blog and Connect): the text column, copy blocks, the app tabs and the "on this page" list on Connect, post cards. `v3.css` + `v3.js` are for the home only. These pages are light only. Without JavaScript every app's steps show and the text can still be selected. After changing any of these files, refresh the hashes in all pages:

```sh
python3 -c 'import hashlib,pathlib,re
for n in ["site.css","doc.css","doc.js","v3.css","v3.js","analytics.js","home.js","language.js"]:
    v=hashlib.sha256(pathlib.Path("assets/"+n).read_bytes()).hexdigest()[:10]
    [p.write_text(re.sub(r"(/assets/"+re.escape(n)+r"\?v=)[0-9a-f]+",r"\g<1>"+v,p.read_text())) for p in pathlib.Path(".").rglob("*.html")]'
```

`styles.css`, `connect.css`, `home.css` and `home.js` are the older look, still used by the legal, support, manifesto, welcome, 404 and ja pages. `blog.css` and `connect.js` are no longer used by any page; they stay only so an old-look post copied from an older checkout still renders. Copy new posts from a current new-look post.

App Store links carry `pt=128870540&ct=<campaign>` written straight into the HTML, so App Store Connect > Analytics > Acquisition > Campaigns shows page views and downloads per place: `home-en-v3` and `home-ko-v3` on the homes (since 2026-11-26; the earlier A/B test used `home-{en|ko}-{a|b}` and ended then), `blog-en` / `blog-ko` on the blog, `connect-*` on Connect. `analytics.js` sends `app_store_click` with `place` (`nav`, the section id or class such as `hero`, `notify` for the price card, or `footer`) and `campaign`. The home keeps the ids older links use: `#try` (the phone), `#faq` and `#notify` (the price card). Its JSON-LD FAQPage is built from the visible questions; change both together. The hero phone and the tiles take every word from the HTML (`v3.js` reads `data-*`), so the English and Korean homes are the same markup in two languages.

Blog pages are exempt from this: `ko/blog/**` counts as real Korean pages in the shared checker. For the new Korean indexing policy, run `python3 work-sc/check_site.py --site-root .` and `node work-sc/check_behavior.mjs`. The original external checker still assumes all Korean pages are English noindex mirrors; see `work-sc/REPORT.md` for its unchanged result.

Legal content is currently English-only. Cloudflare redirects ko/ja legal URLs to the root English pages; matching English file mirrors also work on hosts that ignore `_redirects`. Keep these mirrors consistent when changing legal copy. International-transfer details and retention operations require owner/legal approval before publication.

Share images: `assets/og.png` (English pages) and `assets/og-ko.png` (Korean home and Connect) are 1200×630 PNGs under 300 KB, rendered from `assets/og-src/template.html`. Regenerate with `node assets/og-src/render.mjs` (needs Google Chrome; Pretendard loads from jsDelivr). Keep key content inside the centre square: chat apps crop to about 2:1 or a square.

Blog: a new post is a folder `blog/<slug>/index.html` copied from an existing post (head tags, Article + BreadcrumbList JSON-LD, the `crumbs` line with its group, visible "Updated" date followed by the reading time, end block, and the "Keep reading" block with three related posts). On the index the newest post is the big one at the top and the rest sit under their group heading (English: Plan with your AI, Find the right app, Reviews); move the old newest post into its group when a new one takes its place. Add it to `blog/index.html`, `sitemap.xml` and the Blog list in `llms.txt`, and keep `dateModified`, the visible Updated date and the `article:modified_time` tag in step when a post changes. Blog pages omit `language.js` and the language links so browsers are never redirected away from a post. English posts live under `/blog/`, Korean ones under `/ko/blog/` (real, indexable Korean pages with their own index; add Korean posts to `ko/blog/index.html` too). Only a post that exists in both languages gets hreflang (currently `add-custom-connector-in-claude` and `claude-custom-connector`); the sitemap does not use hreflang. Table styles for the comparison post live in `doc.css`, not inline. At launch, search the blog posts for "coming soon" and for `/#notify` (the launch-updates links) and switch them to the App Store link next to the `LAUNCH` switch in `home.js`; the blog does not load `home.js`.

Check the blog with `python3 ../fixes/site/check_site.py --site-root .` (without `--site-root` the checker looks at the sibling `legal-site` checkout, not this one).

## IndexNow (Bing, Yandex, Naver, Seznam)

The key file `/4e0c5576b4a10582ac41971ea88d81b1.txt` proves we own the host. After publishing or changing pages, tell the engines with the sitemap's URLs:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.indexnow.org/indexnow -H "content-type: application/json; charset=utf-8" -d "$(python3 -c 'import json,re;u=re.findall(r"<loc>([^<]+)</loc>",open("sitemap.xml").read());print(json.dumps({"host":"one-by.one","key":"4e0c5576b4a10582ac41971ea88d81b1","keyLocation":"https://one-by.one/4e0c5576b4a10582ac41971ea88d81b1.txt","urlList":u}))')"
```

200 or 202 means accepted. Add new pages to `sitemap.xml` first.
