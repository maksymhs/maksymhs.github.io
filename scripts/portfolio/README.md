# Portfolio components

This portfolio keeps the existing static GitHub Pages deployment. Node.js renders
reusable HTML components at authoring time; no React runtime, package installation
or client-side router is needed. Generated pages remain usable without JavaScript.

From the repository root:

```sh
node scripts/portfolio/generate.mjs
node scripts/radar/generate.mjs --render-only
python3 -m http.server 8000 --directory site
```

The first command renders home, the project index and the three case studies. It
also refreshes navigation on About/Experience and the marked skills region on
About, preserving the rest of those hand-authored pages. The second refreshes the
sitemap and Radar outputs without calling the LLM or publishing a new post.
Commit the generated HTML alongside the generator changes.

## Content and component boundaries

- `data.mjs`: profile, roles, skills and project/case-study data. Keep professional
  facts aligned with `site/llms-full.txt`; only add documented results and links.
- `components.mjs`: `Hero`, `ProjectGrid`, `ProjectCard`, `SkillsCloud`,
  `CaseStudy`, `ContactCTA`, and shared page, navigation and footer templates.
  `ProjectCard` is used on both home and Projects. Content is HTML-escaped.
- `site/experience/index.html`: the existing semantic experience timeline and
  quantified professional results, kept separate from personal project outcomes.
- `site/assets/portfolio.css`: shared visual components and responsive layouts;
  one column on mobile, three project columns above 730px. The intermediate
  731–1000px range reduces spacing. Existing Radar/Citadel styling is separate.
- `site/assets/portfolio.js`: progressive mobile navigation and decorative role
  typing. The menu supports Tab, ArrowDown and Escape. With JavaScript disabled,
  navigation stays visible. Reduced-motion preferences disable typing/cursor
  animation and hover movement. Screen readers get a stable role description.

## Routes and metadata

Case-study routes are `/projects/<slug>/index.html`, giving stable directory URLs
and working direct links without SPA fallback rules. Add projects to `data.mjs`,
then run both generators: the Radar sitemap builder imports the same project list
so its daily run retains case-study routes. Every generated page has a unique
title, description, canonical URL, social metadata and JSON-LD. SEO describes
Maksym's actual backend portfolio rather than unrelated framework keywords.

## Images

`site/assets/projects/` contains small, real interface captures, not fabricated
product mockups. The current 840px-wide previews and 448px assistant capture total
under 200 KB. Images declare their native dimensions, have descriptive alt text,
and cards reserve a fixed aspect ratio to avoid layout shift. Below-fold previews
are lazy-loaded; case-study images load immediately. When replacing a capture,
keep it compact, update dimensions/alt text in the data, and change the filename
to invalidate any cached copy. Do not expose private sessions or credentials.

## Deployment and validation

Pushing to `main` runs `.github/workflows/deploy.yml`. It publishes `site/`,
including nested case-study routes, and versions both shared scripts and styles.
The generator outputs are committed; production needs no extra build service.

Validate desktop, tablet and mobile layouts, dark/light themes, direct case-study
routes, keyboard menu navigation, reduced-motion behavior, and the existing
Ask/Contact dialog. Inspect JS syntax with `node --check`, and run
`git diff --check`. Do not send test contact messages or publish Radar posts as
part of a layout check. Production AI and contact behavior still depend on the
existing Cloudflare Worker configuration and allowed origins.

The portfolio links to the existing contact dialog and LinkedIn. It does not
publish a CV PDF, an email address, invented response times, GitHub star counts
or unverified contributions. Citadel's link is a product tour rather than a
claim that a public, writable installation is available.
