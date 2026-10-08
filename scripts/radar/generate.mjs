import { readFile, writeFile, mkdir, access, appendFile } from 'node:fs/promises';

const ROOT = new URL('../../', import.meta.url);
const SITE = new URL('site/', ROOT);
const RADAR = new URL('radar/', SITE);
const ISSUES = new URL('issues.json', RADAR);
const ORIGIN = 'https://maksym.site';

const args = new Set(process.argv.slice(2));
const DAYS = Number(process.env.DAYS || 7);
const LLM_URL = process.env.LLM_URL || 'https://openrouter.ai/api/v1/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

const SYSTEM = `You curate a weekly tech radar for the personal site of Maksym Herasymenko, a Senior Backend Engineer (Java, Spring Boot, distributed systems, event-driven architecture, observability, AWS and Google Cloud) working in banking and fintech in Madrid. Audience: backend engineers, engineering managers and tech recruiters.
From the candidate articles, pick the 5 to 8 most relevant and substantive for that audience. Prefer Java/Spring/JVM, distributed systems, architecture, cloud, observability, reliability, security, fintech/payments and AI-assisted engineering. Skip marketing, funding news, duplicates and listicles.
For each pick write "take": 2-3 sentences in first person as Maksym explaining why it matters in practice for backend teams. Do not summarise the article at length, do not quote it, and do not invent facts beyond the title and snippet; if unsure, keep it general. Plain text, no emojis, no hype.
Also write "title": a short, specific headline for this week's issue (max 70 characters, no date), and "intro": 1-2 sentences on the theme of the week, in first person.
Return only JSON: {"title": string, "intro": string, "items": [{"id": number, "take": string}]}`;

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const entity = (_, e) => {
  if (e[0] === '#') {
    const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return Number.isFinite(n) ? String.fromCodePoint(n) : '';
  }
  return ENT[e.toLowerCase()] ?? `&${e};`;
};
const decode = (s = '') => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, entity);
const plain = (s = '') => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (block, name) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))?.[1];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function linkOf(block) {
  const text = plain(tag(block, 'link') || '');
  if (/^https?:\/\//.test(text)) return text;
  for (const [, attrs] of block.matchAll(/<link\b([^>]*?)\/?>/gi)) {
    const href = attrs.match(/href="([^"]+)"/)?.[1];
    const rel = attrs.match(/rel="([^"]+)"/)?.[1];
    if (href && (!rel || rel === 'alternate')) return decode(href);
  }
  return null;
}

function parseFeed(xml, source) {
  const blocks = [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    const date = new Date(plain(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date') || ''));
    return {
      source,
      title: plain(tag(b, 'title') || ''),
      link: linkOf(b),
      date: Number.isNaN(date.getTime()) ? null : date,
      snippet: plain(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content') || '').slice(0, 300),
    };
  }).filter((i) => i.title && i.link && i.date);
}

async function fetchFeed({ name, url }) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'maksym.site radar (+https://maksym.site/radar/)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), name).slice(0, 15);
  } catch (e) {
    console.warn(`! ${name}: ${e.message}`);
    return [];
  }
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return { year, week, slug: `${year}-w${String(week).padStart(2, '0')}` };
}

async function curate(candidates) {
  if (!process.env.LLM_API_KEY) throw new Error('LLM_API_KEY is not set');
  const list = candidates.map((c, i) => `[${i}] ${c.source} | ${c.title}\n${c.snippet}`).join('\n\n');
  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': ORIGIN,
      'X-Title': 'maksym.site radar',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: `Candidate articles:\n\n${list}` }],
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const content = (await res.json()).choices?.[0]?.message?.content || '';
  const out = JSON.parse(content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1));
  const seen = new Set();
  const items = (out.items || [])
    .filter((i) => Number.isInteger(i.id) && candidates[i.id] && typeof i.take === 'string' && i.take.trim() && !seen.has(i.id) && seen.add(i.id))
    .slice(0, 8)
    .map((i) => ({ ...candidates[i.id], take: i.take.trim() }));
  if (items.length < 3 || !out.title || !out.intro) throw new Error('LLM returned too few valid items');
  return { title: String(out.title).trim().slice(0, 90), intro: String(out.intro).trim(), items };
}

const THEME = `<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>`;
const TOGGLE = `<button class="theme" id="themeToggle" type="button" aria-label="Toggle theme">
        <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>
        <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>
      </button>`;

function page({ title, description, path, body, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${ORIGIN}${path}">
  <meta name="theme-color" content="#fbfaf8" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#131312" media="(prefers-color-scheme: dark)">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate" type="application/rss+xml" title="Maksym Herasymenko · Radar" href="/radar/feed.xml">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${ORIGIN}${path}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ORIGIN}/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  ${THEME}
  <link rel="stylesheet" href="/assets/site.css">
  <script src="/assets/site.js" defer></script>
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <div class="wrap">
    <header class="top">
      <a class="brand" href="/">Maksym Herasymenko</a>
      <nav class="nav" aria-label="Site">
        <a href="/radar/">Radar</a>
        <a href="/#ask">Ask my CV</a>
        <a href="/#contact">Contact</a>
      </nav>
      ${TOGGLE}
    </header>
    <main id="content">
${body}
      <footer class="foot">
        <p>© ${new Date().getUTCFullYear()} Maksym Herasymenko · <a href="/radar/feed.xml">RSS</a> · Links point to the original sources; commentary is my own.</p>
      </footer>
    </main>
  </div>
</body>
</html>
`;
}

function issuePage(issue, items) {
  const path = `/radar/${issue.slug}/`;
  const list = items.map((i) => `          <li>
            <h2><a href="${esc(i.link)}" target="_blank" rel="noopener">${esc(i.title)}</a></h2>
            <p class="radar-src">${esc(i.source)} · ${fmtDate(i.date)}</p>
            <p>${esc(i.take)}</p>
          </li>`).join('\n');
  return page({
    title: `${issue.title} · Radar ${issue.slug} · Maksym Herasymenko`,
    description: issue.intro,
    path,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: issue.title,
      description: issue.intro,
      datePublished: issue.date,
      url: `${ORIGIN}${path}`,
      author: { '@type': 'Person', name: 'Maksym Herasymenko', url: ORIGIN },
    },
    body: `      <article class="post">
        <p class="kicker"><a href="/radar/">Radar</a> · Week ${issue.week}, ${issue.year}</p>
        <h1>${esc(issue.title)}</h1>
        <p class="post-meta">${fmtDate(issue.date)} · ${items.length} picks</p>
        <p class="post-intro">${esc(issue.intro)}</p>
        <ol class="radar-items">
${list}
        </ol>
        <p class="post-end"><a href="/radar/">← All issues</a> · <a href="/#ask">Ask my CV</a></p>
      </article>`,
  });
}

function indexPage(issues) {
  const list = issues.length
    ? issues.map((i) => `          <li>
            <p class="radar-src">Week ${i.week}, ${i.year} · ${fmtDate(i.date)}</p>
            <h2><a href="/radar/${i.slug}/">${esc(i.title)}</a></h2>
            <p>${esc(i.intro)}</p>
          </li>`).join('\n')
    : '          <li><p class="muted">The first issue is on its way.</p></li>';
  return page({
    title: 'Radar · Backend, cloud and fintech picks · Maksym Herasymenko',
    description: 'A weekly, hand-reviewed selection of backend, cloud and fintech engineering news, with my take on why it matters.',
    path: '/radar/',
    jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Radar', url: `${ORIGIN}/radar/`, author: { '@type': 'Person', name: 'Maksym Herasymenko', url: ORIGIN } },
    body: `      <article class="post">
        <p class="kicker">Radar</p>
        <h1>What I'm reading this week<span class="dot-accent" aria-hidden="true">.</span></h1>
        <p class="post-intro">A weekly, hand-reviewed selection of backend, cloud and fintech engineering news, with my take on why it matters. <a href="/radar/feed.xml">Subscribe via RSS</a>.</p>
        <ol class="radar-items issues">
${list}
        </ol>
      </article>`,
  });
}

function feedXml(issues) {
  const items = issues.slice(0, 20).map((i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${ORIGIN}/radar/${i.slug}/</link>
      <guid>${ORIGIN}/radar/${i.slug}/</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      <description>${esc(i.intro)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Maksym Herasymenko · Radar</title>
    <link>${ORIGIN}/radar/</link>
    <description>Weekly backend, cloud and fintech engineering picks with commentary.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}

async function sitemapXml(issues) {
  const current = await readFile(new URL('sitemap.xml', SITE), 'utf8').catch(() => '');
  const home = current.match(/<loc>https:\/\/maksym\.site\/<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/)?.[1] || new Date().toISOString().slice(0, 10);
  const url = (loc, lastmod, freq, prio) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
  const latest = issues[0]?.date.slice(0, 10) || home;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[url(`${ORIGIN}/`, home, 'monthly', '1.0'), url(`${ORIGIN}/radar/`, latest, 'weekly', '0.7'), ...issues.map((i) => url(`${ORIGIN}/radar/${i.slug}/`, i.date.slice(0, 10), 'yearly', '0.5'))].join('\n')}
</urlset>
`;
}

async function updateLlms(issues) {
  const file = new URL('llms.txt', SITE);
  const current = await readFile(file, 'utf8').catch(() => null);
  if (!current || !current.includes('<!-- radar:start -->')) return;
  const lines = issues.slice(0, 5).map((i) => `- [${i.title}](${ORIGIN}/radar/${i.slug}/): ${i.intro}`).join('\n');
  const block = `<!-- radar:start -->\n${lines ? `${lines}\n` : ''}<!-- radar:end -->`;
  await writeFile(file, current.replace(/<!-- radar:start -->[\s\S]*?<!-- radar:end -->/, block));
}

async function renderShared(issues) {
  await mkdir(RADAR, { recursive: true });
  await writeFile(ISSUES, `${JSON.stringify(issues, null, 2)}\n`);
  await writeFile(new URL('index.html', RADAR), indexPage(issues));
  await writeFile(new URL('feed.xml', RADAR), feedXml(issues));
  await writeFile(new URL('sitemap.xml', SITE), await sitemapXml(issues));
  await updateLlms(issues);
}

async function main() {
  const issues = JSON.parse(await readFile(ISSUES, 'utf8').catch(() => '[]'));
  if (args.has('--render-only')) {
    await renderShared(issues);
    console.log(`Rendered radar index, feed and sitemap (${issues.length} issues).`);
    return;
  }

  const now = new Date();
  const { year, week, slug } = isoWeek(now);
  const dir = new URL(`${slug}/`, RADAR);
  if (!process.env.FORCE && !args.has('--dry-run') && await access(dir).then(() => true, () => false)) {
    console.log(`Issue ${slug} already exists; set FORCE=1 to regenerate.`);
    return;
  }

  const feeds = JSON.parse(await readFile(new URL('feeds.json', import.meta.url), 'utf8'));
  const since = now.getTime() - DAYS * 86400000;
  const seen = new Set();
  const candidates = (await Promise.all(feeds.map(fetchFeed))).flat()
    .filter((i) => i.date.getTime() >= since && !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => b.date - a.date)
    .slice(0, 120);
  console.log(`${candidates.length} candidates from the last ${DAYS} days.`);

  if (args.has('--dry-run')) {
    candidates.forEach((c, i) => console.log(`[${i}] ${c.source} · ${fmtDate(c.date)} · ${c.title}`));
    return;
  }
  if (candidates.length < 5) throw new Error('Not enough candidates this week');

  const { title, intro, items } = await curate(candidates);
  const issue = { slug, year, week, title, intro, date: now.toISOString(), count: items.length };
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('index.html', dir), issuePage(issue, items));
  await renderShared([issue, ...issues.filter((i) => i.slug !== slug)]);
  console.log(`Drafted ${slug}: "${title}" with ${items.length} picks.`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `slug=${slug}\n`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
