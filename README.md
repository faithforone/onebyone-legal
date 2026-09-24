# OneByOne Legal Site

Static legal and support pages for OneByOne App Store submission.

Served at https://one-by.one/ (Cloudflare Pages project `onebyone-site`, auto-deploys from `main`).

- `/` — OneByOne product page (placeholder until the landing page)
- `/privacy/`, `/terms/`, `/support/` — English
- `/ko/privacy/`, `/ko/terms/`, `/ko/support/` — Korean (home `/ko/`)
- `/ja/privacy/`, `/ja/terms/`, `/ja/support/` — Japanese (home `/ja/`)
- `/en/*` redirects to the English root paths (`_redirects`, Cloudflare only)

GitHub Pages (https://faithforone.github.io/onebyone-legal/) serves the same files but ignores `_redirects`.
