# OneByOne Legal Site

Static legal and support pages for OneByOne App Store submission.

Served at https://one-by.one/ (Cloudflare Pages project `onebyone-site`, auto-deploys from `main`).

- `/` — one-by.one product and launch page
- `/privacy/`, `/terms/`, `/support/` — English
- `/ko/privacy/`, `/ko/terms/`, `/ko/support/` — English fallback mirrors (home `/ko/`)
- `/ja/privacy/`, `/ja/terms/`, `/ja/support/` — English fallback mirrors (home `/ja/`)
- `/en/*` redirects to the English root paths (`_redirects`, Cloudflare only)

GitHub Pages (https://faithforone.github.io/onebyone-legal/) serves the same files but ignores `_redirects`.

## Editing styles

Cloudflare lets browsers cache `assets/styles.css` for 4 hours, so every page links it with a content hash (`styles.css?v=…`). After changing the stylesheet, refresh the hash in all pages:

```sh
python3 -c 'import hashlib,pathlib,re;v=hashlib.sha256(pathlib.Path("assets/styles.css").read_bytes()).hexdigest()[:10];[p.write_text(re.sub(r"(assets/styles\.css)(\?v=[0-9a-f]+)?\"",rf"\1?v={v}\"",p.read_text())) for p in pathlib.Path(".").rglob("*.html")]'
```

Legal content is currently English-only. Cloudflare redirects ko/ja legal URLs to the root English pages; matching English file mirrors also work on hosts that ignore `_redirects`. Keep these mirrors consistent when changing legal copy. International-transfer details and retention operations require owner/legal approval before publication.
