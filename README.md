# maksym.site

Personal site of **Maksym**, Senior Backend Engineer (Java · Spring Boot · distributed systems).

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

## CV

`cv/cv.tex` is the LaTeX source of the public CV (no phone or email; contact goes through LinkedIn and the site). Compile it with pdflatex or xelatex (Overleaf: upload `cv.tex` and `perfil.jpg`), then replace `site/cv.pdf`. Facts must match `site/llms-full.txt`. Set `\photofalse` in `cv.tex` for ATS-only submissions.

## Radar

A daily post at `/radar/<YYYY-MM-DD>/`: one main pick with a take plus up to three short ones, in Maksym's voice, drafted with AI assistance. Only titles, links and original commentary are published.

A scheduled Claude routine writes `/tmp/post.json` following `scripts/radar/STYLE.md`, runs the publisher and opens a PR from `radar/<date>`. `.github/workflows/radar-automerge.yml` merges it if it only touches radar files and then starts the deploy.

```bash
node scripts/radar/generate.mjs --dry-run --json            # candidate articles from feeds.json (last DAYS days)
node scripts/radar/generate.mjs --publish post.json         # validate, check links, write the post, rebuild index/RSS/sitemap/llms.txt/homepage block
node scripts/radar/generate.mjs --render-only               # rebuild radar index, RSS and sitemap
```

Setup: the repo must allow Actions to merge PRs into `main` (no required reviews or status checks on it). The old weekly generator (run without `--publish`) still works with `LLM_API_KEY` but no longer runs on a schedule.

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
