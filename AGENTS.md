# AGENTS.md

Personal site of Maksym (https://maksym.site), a Senior Backend Engineer. Static site on GitHub Pages plus a Cloudflare Worker. Read this before changing anything.

## Layout

- `site/`: the published site (HTML, CSS, JS, `llms.txt`, `llms-full.txt`, `persona.txt`, `radar/`). Pages: `index.html` (minimal hub), `about/` (profile, chat, contact), `citadel/` (landing of the Citadel project, with its screenshots) and `radar/`. Pushing to `main` deploys it (`.github/workflows/deploy.yml`).
- `worker/`: Cloudflare Worker `api` at `api.maksym.site`: `/chat` (Ask me), `/lead` (contact form to Telegram), `/mcp` (public MCP server) and, behind the `RADAR_TOKEN` bearer, `/draft` (the chat's LLM without streaming) and `/radar-notify` (Telegram report) for the radar. Deploy with `cd worker && npx wrangler deploy`.
- `scripts/radar/`: radar. `auto.mjs` is the autonomous daily publisher run by `radar-daily.yml`; `generate.mjs` validates and renders; `STYLE.md` is the writing guide the LLM follows.
- `cv/cv.tex`: LaTeX source for the CV. Compile locally with pdflatex or xelatex; do not publish the resulting PDF under `site/`. The site no longer hosts a CV PDF.
- `.github/workflows/`: `deploy.yml` (Pages, adds asset hashes), `radar-daily.yml` (publishes the daily post and starts the deploy), `radar-automerge.yml` (merges hand-made `radar/*` PRs that only touch radar files, then triggers the deploy).

## Sources of truth (edit once, everything follows)

- Facts about Maksym: `site/llms-full.txt`. The chat, the MCP server (`get_profile`, `get_section`), the "Copy as prompt" button and the radar all read it. The About page (`site/about/index.html`), the Citadel landing (`site/citadel/index.html`) and CV source are written by hand: keep them consistent with it.
- How an assistant talks as Maksym: `site/persona.txt`. Used by the "Open in Claude/ChatGPT" buttons, "Copy as prompt" and the MCP prompt `talk_to_maksym` (the worker keeps an identical fallback in `PERSONA`).
- Chat system prompt: `system()` in `worker/src/index.js`.

## Rules

- Never invent facts about Maksym (employers, dates, numbers, salary, notice period, availability). Salary and notice period are deliberately not published.
- The surname appears only in the CV source (`cv/cv.tex`) and inside the LinkedIn URL. The CV PDF is not published on the site. Use "Maksym" everywhere else, and keep the chat and MCP rule that never states or infers it.
- No phone or email on the site or in the CV source. Contact goes through the form, Calendly and LinkedIn.
- Assistants speaking as Maksym must say they are an AI version of his CV.
- No secrets in the repo. Worker secrets: `LLM_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RADAR_TOKEN` (also a GitHub Actions secret with the same value) (set with `pbpaste | npx wrangler secret put NAME`; typing into `!` prompts uploads an empty value). The chat uses Workers AI first (`CF_MODEL`) and OpenRouter (`LLM_MODEL`) as fallback.
- Radar posts: first person, honest, sources linked; never copy article text. Run `node scripts/radar/generate.mjs --render-only` after hand edits to regenerate index, RSS, sitemap, `llms.txt` and the radar block of the home page.
- The repos that are public besides this one are `maksymhs/maksymhs` (GitHub profile README) and `maksymhs/Citadel` (the project of the landing; keep its claims in line with its README). Do not link private repositories.

## Checks before pushing

- `node --check worker/src/index.js site/assets/site.js scripts/radar/generate.mjs`
- Look at the page in a browser for layout changes. `site/assets` is cached 4 hours by Cloudflare; the deploy versions the URLs.
- After a worker deploy, test `/chat` and `/mcp` for real (`tools/list`, `prompts/get`).
