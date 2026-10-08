# AGENTS.md

Personal site of Maksym (https://maksym.site), a Senior Backend Engineer. Static site on GitHub Pages plus a Cloudflare Worker. Read this before changing anything.

## Layout

- `site/`: the published site (HTML, CSS, JS, `llms.txt`, `llms-full.txt`, `persona.txt`, `cv.pdf`, `radar/`). Pushing to `main` deploys it (`.github/workflows/deploy.yml`).
- `worker/`: Cloudflare Worker `api` at `api.maksym.site`: `/chat` (Ask my CV), `/lead` (contact form to Telegram) and `/mcp` (public MCP server). Deploy with `cd worker && npx wrangler deploy`.
- `scripts/radar/`: daily radar generator. `STYLE.md` is the writing guide used by the scheduled routine.
- `cv/cv.tex`: LaTeX source of the public CV. Compile with pdflatex or xelatex, then replace `site/cv.pdf`.
- `.github/workflows/`: `deploy.yml` (Pages, adds asset hashes), `radar-automerge.yml` (merges `radar/*` PRs that only touch radar files, then triggers the deploy).

## Sources of truth (edit once, everything follows)

- Facts about Maksym: `site/llms-full.txt`. The chat, the MCP server (`get_profile`, `get_section`), the "Copy as prompt" button and the radar all read it. The homepage (`site/index.html`) and the CV are written by hand: keep them consistent with it.
- How an assistant talks as Maksym: `site/persona.txt`. Used by the "Open in Claude/ChatGPT" buttons, "Copy as prompt" and the MCP prompt `talk_to_maksym` (the worker keeps an identical fallback in `PERSONA`).
- Chat system prompt: `system()` in `worker/src/index.js`.

## Rules

- Never invent facts about Maksym (employers, dates, numbers, salary, notice period, availability). Salary and notice period are deliberately not published.
- The surname appears only in the CV (`cv/cv.tex`, `site/cv.pdf`) and inside the LinkedIn URL. Use "Maksym" everywhere else, and keep the chat and MCP rule that never states or infers it.
- No phone or email on the site or in the public CV. Contact goes through the form, Calendly and LinkedIn.
- Assistants speaking as Maksym must say they are an AI version of his CV.
- No secrets in the repo. Worker secrets: `LLM_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (set with `pbpaste | npx wrangler secret put NAME`; typing into `!` prompts uploads an empty value). The chat uses Workers AI first (`CF_MODEL`) and OpenRouter (`LLM_MODEL`) as fallback.
- Radar posts: first person, honest, sources linked; never copy article text. Run `node scripts/radar/generate.mjs --render-only` after hand edits to regenerate index, RSS, sitemap, `llms.txt` and the homepage block.
- The only repo that is public besides this one is `maksymhs/maksymhs` (GitHub profile README). Do not link private repositories.

## Checks before pushing

- `node --check worker/src/index.js site/assets/site.js scripts/radar/generate.mjs`
- Look at the page in a browser for layout changes. `site/assets` is cached 4 hours by Cloudflare; the deploy versions the URLs.
- After a worker deploy, test `/chat` and `/mcp` for real (`tools/list`, `prompts/get`).
