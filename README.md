# maksym.site

Personal site of **Maksym**, Senior Backend Engineer (Java · Spring Boot · distributed systems).

**Live:** https://maksym.site

## Structure

```
site/
├── index.html          # All content (semantic HTML, SEO, ProfilePage JSON-LD)
├── llms.txt            # llmstxt.org index for AI crawlers (radar block auto-updated)
├── llms-full.txt       # Full profile in Markdown: source of truth for the chat and MCP
├── radar/              # Weekly tech radar (generated, reviewed via PR)
├── 404.html
├── og.png              # Social preview (1200×630)
├── favicon.svg, apple-touch-icon.png, robots.txt, sitemap.xml
└── assets/
    ├── site.css        # Layout, light/dark theme (system default + toggle), print stylesheet (CV)
    └── site.js         # Theme toggle, "Ask me" chat, lead capture, contact form
worker/                 # Cloudflare Worker for api.maksym.site (/chat, /lead, /mcp)
scripts/radar/          # Radar generator (Node, no dependencies) + feeds.json
```

No framework and no build step: GitHub Actions publishes `site/` to GitHub Pages on every push to `main`.

When you change your experience, update `index.html` (content, JSON-LD and FAQ), `llms-full.txt` (the chat and MCP read it, cached 5 min) and, if needed, the summary in `llms.txt`. The site does not publish a CV PDF.

```bash
python3 -m http.server 8000 -d site &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --print-to-pdf=/tmp/maksym-cv.pdf http://localhost:8000/
```

## Run locally

```bash
python3 -m http.server 8000 -d site
```

The chat and the forms call `https://api.maksym.site` (Cloudflare Worker), which only accepts requests from the origins in `ALLOWED_ORIGINS`.

## CV

`cv/cv.tex` is the LaTeX source for a local CV PDF (no phone or email; contact goes through LinkedIn and the site). The PDF is not published on the site. Compile it locally with pdflatex or xelatex (Overleaf: upload `cv.tex` and `perfil.jpg`). Facts must match `site/llms-full.txt`. Set `\photofalse` in `cv.tex` for ATS-only submissions.

## Radar

A daily post at `/radar/<YYYY-MM-DD>-<headline-keywords>/` (older date-only URLs redirect): one main pick with a take plus up to three short ones, in Maksym's voice, drafted with AI assistance. Only titles, links and original commentary are published.

The post is written by `.github/workflows/radar-daily.yml` (every day, 05:17 UTC): `scripts/radar/auto.mjs` collects the feeds, asks the Worker's LLM (the one behind "Ask me", route `POST /draft`) to rank the candidates, reads the chosen articles, asks it for the headline and the takes following `scripts/radar/STYLE.md`, validates them and publishes through `generate.mjs --publish`. Links, titles, sources and dates always come from the feeds; every number in a take must appear in the article it comments on; sources are English-language only, led by LLM and AI news from Anthropic, OpenAI, Google, Microsoft and Meta (feeds in `scripts/radar/feeds.json`). If nothing passes validation it publishes nothing and reports to Telegram through the Worker (`POST /radar-notify`). The workflow commits straight to `main` and starts the deploy.

Secret: `RADAR_TOKEN`, the same random value as a Worker secret and a GitHub Actions secret:

```bash
T=$(openssl rand -hex 32); echo "$T" | (cd worker && npx wrangler secret put RADAR_TOKEN); echo "$T" | gh secret set RADAR_TOKEN -R maksymhs/maksymhs.github.io
```

Run it by hand: Actions → "Radar daily" → Run workflow, or `RADAR_TOKEN=... node scripts/radar/auto.mjs --dry-run` to print the post without publishing. Humans and agents can still publish a post written by hand with `--publish`; `radar-automerge.yml` merges `radar/*` PRs that only touch radar files.

```bash
node scripts/radar/generate.mjs --dry-run --json            # candidate articles from feeds.json (last DAYS days)
node scripts/radar/generate.mjs --publish post.json         # validate, check links, write the post, rebuild index/RSS/sitemap/llms.txt/home page radar block
node scripts/radar/generate.mjs --render-only               # rebuild radar index, RSS and sitemap
```

Setup: Actions must be allowed to push to `main` (no required reviews or status checks on it). The old weekly generator (run without `--publish`) still works with `LLM_API_KEY` but no longer runs on a schedule.

## Worker

The system prompt lives server-side; the browser only sends the user/assistant history. Leads (contact form and the chat follow-up) are sent to Telegram.

```bash
cd worker
npx wrangler secret put LLM_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```

### Public MCP server

`POST https://api.maksym.site/mcp` implements MCP over Streamable HTTP (stateless, JSON responses, no auth, open CORS). Tools: `get_profile`, `get_section`, `list_radar_issues`, `get_radar_issue` (parsed from the published radar pages, so reviewed edits are reflected), `contact_maksym` (sends a lead to Telegram). Prompts: `ask_my_cv`, `evaluate_fit`, `interview_plan`. Resource: `https://maksym.site/llms.txt`.

```bash
npx @modelcontextprotocol/inspector   # connect to https://api.maksym.site/mcp
```

Vars in `wrangler.toml`: `LLM_URL` / `LLM_MODEL` (any OpenAI-compatible endpoint), `PROFILE_URL`, `ALLOWED_ORIGINS`, `NOTIFY_CHAT` (`true` to get every Q&A on Telegram). Logs: `npx wrangler tail`.

## License

MIT © 2026 Maksym
