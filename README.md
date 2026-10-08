# maksym.site

Personal site of **Maksym Herasymenko**, Senior Backend Engineer (Java · Spring Boot · distributed systems).

**Live:** https://maksym.site

## Structure

```
site/
├── index.html          # All content (semantic HTML, SEO, ProfilePage JSON-LD)
├── llms.txt            # llmstxt.org index for AI crawlers (radar block auto-updated)
├── llms-full.txt       # Full profile in Markdown: source of truth for the chat and MCP
├── cv.pdf              # Generated from the print stylesheet (max 2 A4 pages)
├── radar/              # Weekly tech radar (generated, reviewed via PR)
├── 404.html
├── og.png              # Social preview (1200×630)
├── favicon.svg, apple-touch-icon.png, robots.txt, sitemap.xml
└── assets/
    ├── site.css        # Layout, light/dark theme (system default + toggle), print stylesheet (CV)
    └── site.js         # Theme toggle, "Ask my CV" chat, lead capture, contact form
worker/                 # Cloudflare Worker for api.maksym.site (/chat, /lead, /mcp)
scripts/radar/          # Radar generator (Node, no dependencies) + feeds.json
```

No framework and no build step: GitHub Actions publishes `site/` to GitHub Pages on every push to `main`.

When you change your experience, update `index.html` (content, JSON-LD and FAQ), `llms-full.txt` (the chat and MCP read it, cached 5 min) and, if needed, the summary in `llms.txt`; then regenerate the CV (print stylesheet of `index.html`, must stay within 2 A4 pages):

```bash
python3 -m http.server 8000 -d site &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --print-to-pdf=site/cv.pdf http://localhost:8000/
```

## Run locally

```bash
python3 -m http.server 8000 -d site
```

The chat and the forms call `https://api.maksym.site` (Cloudflare Worker), which only accepts requests from the origins in `ALLOWED_ORIGINS`.

## Radar

Every Monday `.github/workflows/radar.yml` reads the feeds in `scripts/radar/feeds.json`, asks an LLM to pick 5-8 relevant items and draft a short take for each, and opens a PR with `site/radar/<year>-w<week>/index.html`. Only titles, links and original commentary are published. Edit the takes so they sound like you, then merge to publish.

Setup: repo secret `LLM_API_KEY`, optional repo variable `LLM_MODEL`, and enable *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*.

```bash
node --use-system-ca scripts/radar/generate.mjs --dry-run      # list candidates, no LLM, no writes
LLM_API_KEY=... node --use-system-ca scripts/radar/generate.mjs # draft this week's issue locally
node scripts/radar/generate.mjs --render-only                  # rebuild radar index, RSS and sitemap
```

`--use-system-ca` is only needed behind a TLS-intercepting proxy. If you edit an issue's title or intro, update `site/radar/issues.json` too and run `--render-only`.

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

MIT © 2026 Maksym Herasymenko
