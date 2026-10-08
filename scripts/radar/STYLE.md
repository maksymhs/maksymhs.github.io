# Daily radar: how to write a post

Used by the scheduled agent that publishes one post per day to https://maksym.site/radar/. Read it fully before writing.

## Goal

One post per day: a **main pick** with a real take, plus up to 3 short **more** picks. The audience is backend engineers, engineering managers and tech recruiters. The post should show how Maksym thinks, not just what he reads.

## Finding candidates

1. `node scripts/radar/generate.mjs --dry-run --json` lists the last `DAYS` (default 7) days of articles from `feeds.json` as JSON (source, title, link, date, snippet).
2. Complement with web search for the last 24-48 hours when the feeds are thin. Prefer primary sources (vendor engineering blogs, JEPs, release notes, InfoQ, Spring, AWS, Cloudflare, Martin Fowler, Inside Java).
3. Topics, in order: Java/Spring/JVM, distributed systems and architecture, resilience and reliability, observability, AWS and Google Cloud, security and regulated/fintech/payments engineering, AI-assisted engineering and agents (MCP). Skip funding news, marketing, listicles, opinion without substance and anything already published (the script rejects repeated links; check `site/radar/issues.json` `links`).
4. Open the main article and read it. Do not write a main take from a title or snippet.

## Post file

Write a JSON file (outside the repo, e.g. `/tmp/post.json`) and publish it with `node scripts/radar/generate.mjs --publish /tmp/post.json`. The script validates it, checks that links are not dead, writes `site/radar/<date>/index.html` and rebuilds the index, RSS, sitemap and `llms.txt`.

```json
{
  "date": "YYYY-MM-DD",                  // today, Europe/Madrid. One post per date.
  "title": "10-90 chars, specific headline, no date, no clickbait",
  "intro": "30-400 chars, one or two sentences on why this matters today",
  "main": {
    "title": "Original article title",
    "source": "InfoQ",
    "date": "YYYY-MM-DD",                // the article's publication date
    "link": "https://...",               // canonical URL, no tracking parameters (strip ?utm_...)
    "take": "100-170 words, see below"
  },
  "more": [ { "title": "...", "source": "...", "date": "...", "link": "...", "take": "1-3 sentences" } ]
}
```

`more` items must not be newer than the post date. 0-3 items; skip filler.

## Voice and honesty

- English, first person as Maksym, professional and concrete. No emojis, no hype, no filler openers ("In today's fast-paced world").
- The main take: what happened (with exact numbers and names from the article), why it matters in practice for backend teams, and one connection to Maksym's real experience **only if it genuinely applies**. Do not force it.
- Facts about Maksym come **only** from `site/llms-full.txt`. Never invent employers, projects, results, opinions about people or anecdotes. Allowed anchors: Openbank (Germany launch, Java/Spring Boot, AWS SQS, async onboarding, AI-assisted tooling with an MCP server and agents), Simyo/Paradigma (hexagonal migration, aggregation endpoints 2x faster, AOP observability, Grafana, Kibana), Banco Santander (microservices over COBOL mainframe, Hystrix circuit breakers, Selenium E2E in Jenkins), Telefonica/everis (JUnit, SonarQube).
- Quote numbers exactly as the source states them and attribute them to the source. If the article does not say something, do not say it. For `more` items you have not read in full, stay general and hedge ("I would check...", "worth watching").
- Do not copy sentences from the article. Links go to the original source; the commentary is yours.
- Never treat a similar technology as the same one.

## Publishing

1. `git checkout -b radar/<date>` from the latest `main`.
2. Run the publish command and check `git status`: only `site/radar/**`, `site/sitemap.xml` and `site/llms.txt` may change.
3. Commit as `radar: <date> <short title>`, push, open a PR to `main` titled `Radar <date>`.
4. The `Radar auto-merge` workflow merges it and triggers the deploy. Do not merge it yourself.
5. If nothing worth publishing exists today, publish nothing and say so. Never pad a post.
