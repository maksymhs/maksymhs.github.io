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
works as a standalone fallback before the conversation panels load. Owner email/phone and a CV PDF are not
published; contact goes through the form or LinkedIn.

## Validation

Check desktop, tablet and mobile routes, no horizontal overflow, active navigation,
light/dark themes and keyboard menu behavior. The homepage should fit a normal
900px-tall desktop viewport; mobile may scroll briefly to show the illustration.
Validate both contact forms with intercepted requests, including the reply email,
and preserve the AI identity disclosure. Do not send test messages externally.
Run JS syntax checks and `git diff --check`; rerunning both generators should be
idempotent. The original Citadel landing remains separate from portfolio styling.

## Contact, contributions and presentation

On `/contact/`, the shared conversation panels render inline, with tabs for a
message to Maksym or questions to his AI CV. The direct form asks only for a
message. Visitors can include a reply address in that message if they wish; the
existing Worker accepts the established anonymous-contact marker. Historical
About fragment links redirect to the corresponding view on Contact. No popup or
floating launcher is created; the shared fragment loads only on Contact.

The Technical toolkit is an always-visible section. Experience uses one timeline
card per role, with dates, role description and technology badges.

`node scripts/portfolio/contributions.mjs` fetches the official public GitHub
calendar without credentials and renders dark/light SVG snapshots. Use Node 24;
when the runtime requires the inherited HTTP proxy, run it with
`NODE_USE_ENV_PROXY=1`. The script checks that a full calendar and contribution
total were returned before writing files. The Pages workflow refreshes the chart
on deploy and on a daily schedule; a failed fetch retains the checked-in snapshot.
Both variants get content-versioned asset URLs during publication. The chart links
to GitHub for current details. The backend illustration also has explicit light
and dark variants, selected by the site's theme rather than the OS preference.
