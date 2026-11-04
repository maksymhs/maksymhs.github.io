# Minimal multipage portfolio

The homepage is a single introduction with a small backend SVG illustration.
It links to About, Experience, Projects and Contact. Radar/blog and the AI CV
assistant are secondary footer links. There are no project grids or news feeds
on the homepage. The dark neutral theme is the default; an explicit theme choice
is retained in local storage.

The static site needs no package installation or runtime framework:

```sh
node scripts/portfolio/generate.mjs
node scripts/radar/generate.mjs --render-only
python3 -m http.server 8000 --directory site
```

Commit generated HTML together with the source changes. A push to `main` runs the
existing GitHub Pages workflow, which versions shared JS/CSS assets.

## Sources and ownership

- `components.mjs`: page shell, navigation, hero, repository list and contact page.
- `data.mjs`: documented professional facts, skills and historical case studies.
  Keep facts aligned with `site/llms-full.txt`; do not invent metrics or projects.
- The Projects page is a short manually curated list of verified public GitHub
  repositories, without screenshots, star counts, API calls or case-study cards.
- About and Experience remain hand-authored. The generator refreshes their shared
  header/footer, theme initialization and the marked, collapsible skills region.
- `/contact/` has an inline form using the existing Worker lead endpoint. The
  existing dialog and `/about/#ask`, `#contact` and `#mcp` links remain supported.
- The shared shell refreshes Radar pages without changing their editorial content.
  Daily Radar generation keeps the contact page and historical case-study routes
  in the sitemap. Old case-study URLs are retained for existing inbound links;
  they are not listed as separate projects on the new Projects page.
- `site/assets/backend-stack.svg` is a small static vector diagram. It contains
  no photograph, animation or external dependencies.

`portfolio.js` progressively enhances the mobile menu (Tab, ArrowDown and Escape).
Without JavaScript the navigation stays visible. `site.js` handles theme choice,
AI conversation and contact forms. The contact page uses unique form IDs, so it
can coexist with the historical dialog. Owner email/phone and a CV PDF are not
published; contact goes through the form or LinkedIn.

## Validation

Check desktop, tablet and mobile routes, no horizontal overflow, active navigation,
light/dark themes and keyboard menu behavior. The homepage should fit a normal
900px-tall desktop viewport; mobile may scroll briefly to show the illustration.
Validate both contact forms with intercepted requests, including the reply email,
and preserve the AI identity disclosure. Do not send test messages externally.
Run JS syntax checks and `git diff --check`; rerunning both generators should be
idempotent. The original Citadel landing remains separate from portfolio styling.
