# Static site

The public pages are the homepage, Contact, and the paginated Radar archive and articles. The homepage and Contact are maintained directly under `site/`. Retired portfolio URLs redirect for compatibility.

Run `node scripts/radar/generate.mjs --render-only` to refresh the Radar archive, RSS, sitemap and homepage preview. Run `python3 -m http.server 8000 --directory site` to preview the site. A push to `main` deploys with GitHub Pages.
