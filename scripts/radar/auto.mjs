// Autonomous daily radar: pick, read, write, validate and publish one post. Run by .github/workflows/radar-daily.yml.
// The LLM is the one behind the chat of the site, reached through the Worker route POST /draft (shared token).
// The model only writes the headline, the intro and the takes: links, titles, sources and dates always come from the
// feeds, and every number in a take must appear in the text of the article it comments on.
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url);
const API = process.env.RADAR_API || 'https://api.maksym.site';
const TOKEN = process.env.RADAR_TOKEN || '';
const DRY = process.argv.includes('--dry-run');
const UA = 'maksym.site radar (+https://maksym.site/radar/)';
const read = (p) => readFile(new URL(p, ROOT), 'utf8');

const today = process.env.RADAR_DATE || new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

const say = async (msg) => {
  console.log(msg);
  if (process.env.RADAR_SUMMARY) await writeFile(process.env.RADAR_SUMMARY, `${msg}\n`);
};

let mock = process.env.RADAR_MOCK ? JSON.parse(await readFile(process.env.RADAR_MOCK, 'utf8')) : null;
async function llm(messages, max_tokens = 1600) {
  if (mock) return mock.shift();
  if (!TOKEN) throw new Error('RADAR_TOKEN is not set');
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${API}/draft`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, max_tokens, temperature: 0.3 }),
        signal: AbortSignal.timeout(150000),
      });
      if (res.ok) return (await res.json()).text;
      last = `HTTP ${res.status}`;
      if (res.status === 401) throw new Error('The Worker rejected RADAR_TOKEN (401)');
    } catch (e) {
      if (/401/.test(e.message)) throw e;
      last = e.message;
    }
    await new Promise((r) => setTimeout(r, 4000 * (i + 1)));
  }
  throw new Error(`LLM unavailable: ${last}`);
}

function json(text) {
  const t = String(text).replace(/^```(?:json)?\s*|\s*```$/gim, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('the answer has no JSON object');
  const body = t.slice(start, end + 1);
  try {
    return JSON.parse(body);
  } catch {
    // Models sometimes add // comments or trailing commas.
    return JSON.parse(body.replace(/(^|[\s,\[{])\/\/[^\n]*/g, '$1').replace(/,(\s*[\]}])/g, '$1'));
  }
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const nums = (s) => [...s.matchAll(/\d+(?:[.,]\d+)*/g)].map((m) => m[0].replace(/[.,]+$/, '')).filter((n) => !/^\d$/.test(n) && n !== '10');

function htmlText(html) {
  let h = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, ' ');
  h = h.match(/<article\b[\s\S]*?<\/article>/i)?.[0] || h.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || h;
  return h.replace(/<[^>]+>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[e.toLowerCase()] ?? ' '))
    .replace(/\s+/g, ' ').trim();
}

async function article(c, limit) {
  try {
    const res = await fetch(c.link, { headers: { 'User-Agent': UA, 'Accept-Language': 'en,ru;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    if (res.ok) {
      const t = htmlText(await res.text());
      if (t.length > 1200) return t.slice(0, limit);
    }
  } catch { }
  return c.snippet && c.snippet.length > 400 ? c.snippet : null;
}

const SELECT = `You choose what Maksym, a Senior Backend Engineer (Java, Spring Boot, distributed systems, AWS, observability, banking and fintech), should comment on in his tech radar today.
From the numbered candidates return the ids ranked by substance and relevance for backend engineers and engineering managers: Java/Spring/JVM, distributed systems and architecture, resilience, observability, cloud, security, fintech and AI-assisted engineering. Skip marketing, funding news, listicles, job posts, release-note one-liners and anything without technical substance.
Habr candidates (Russian) are welcome when they are real engineering write-ups; list the best ones separately.
Return only JSON: {"ranked":[up to 8 ids, best first, any source],"habr":[up to 3 ids of Habr candidates, best first]}`;

function candidates() {
  const r = spawnSync('node', ['scripts/radar/generate.mjs', '--dry-run', '--json'], { cwd: new URL(ROOT).pathname, env: { ...process.env, DAYS: '3' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`feed collection failed: ${r.stderr.slice(0, 300)}`);
  return JSON.parse(r.stdout);
}

async function main() {
  const posted = await read(`site/radar/${today}/index.html`).then(() => true, () => false);
  if (posted && !DRY) return console.log(`Post ${today} already exists, nothing to do.`);

  const issues = JSON.parse(await read('site/radar/issues.json').catch(() => '[]'));
  const known = new Set(issues.flatMap((i) => i.links || []));
  const all = candidates().filter((c) => !known.has(c.link) && c.date <= today);
  const habr = all.filter((c) => c.source === 'Habr').slice(0, 14);
  const rest = all.filter((c) => c.source !== 'Habr').slice(0, 50);
  const list = [...rest, ...habr];
  if (list.length < 5) throw new Error(`only ${list.length} fresh candidates, not publishing`);
  const line = (c, i) => `${i}. [${c.source}] ${c.date} ${c.title}${c.snippet ? ` | ${c.snippet.slice(0, 170)}` : ''}`;

  let pick;
  for (let attempt = 0; attempt < 3 && !pick; attempt++) {
    try {
      pick = json(await llm([{ role: 'system', content: `${SELECT}\nValid JSON only: no comments, no text around it.` }, { role: 'user', content: list.map(line).join('\n') }], 400));
    } catch (e) {
      if (attempt === 2) throw new Error(`the selection answer was not usable: ${e.message}`);
    }
  }
  const ids = (a) => (Array.isArray(a) ? a.map(Number).filter((n) => Number.isInteger(n) && list[n]) : []);
  const ranked = [...new Set(ids(pick.ranked))].filter((n) => list[n].source !== 'Habr');
  const hids = [...new Set(ids(pick.habr))].filter((n) => list[n].source === 'Habr');
  if (!ranked.length) throw new Error('the model did not pick any article');

  const withText = async (idList, limit) => (await Promise.all(idList.map(async (n) => ({ ...list[n], text: await article(list[n], limit) })))).filter((c) => c.text);
  const main = (await withText(ranked.slice(0, 5), 9000))[0];
  if (!main) throw new Error('could not read any of the picked articles, not publishing');
  const others = (await withText(ranked.filter((n) => list[n].link !== main.link).slice(0, 4), 4000)).slice(0, 2);
  const ru = (await withText(hids, 4000)).slice(0, 1);
  const more = [...others, ...ru].slice(0, 3);

  const style = await read('scripts/radar/STYLE.md');
  const profile = await read('site/llms-full.txt');
  const system = `You write today's post for the tech radar of Maksym's personal site, in first person as Maksym. Follow this style guide for voice and honesty (ignore its publishing steps and file format):\n\n${style}\n\nPROFILE (the only source of facts about Maksym):\n${profile}\n\nRules for this job: use only facts that are in the ARTICLE text given for each item; if the article does not say something, do not say it. Do not copy sentences. Quote numbers exactly as the article states them and attribute them ("according to InfoQ"). Mention Maksym's experience only if it genuinely applies and only with facts from the PROFILE. The main_take is NOT a summary: use at most four sentences to say what happened (names and numbers from the article), then at least two sentences in first person ("I", "I would", "I would check") on why it matters in practice for backend teams and what you would verify before adopting it. For Russian articles write in English, mention naturally that the article is in Russian and what it contains. No emojis, no hype, no markdown, no bullet lists.\nReturn only JSON: {"title": "10-90 chars, specific headline, no date", "intro": "30-400 chars", "main_take": "100-170 words", "more_takes": [${more.map(() => '"1-3 sentences (60-500 characters)"').join(', ')}]}`;
  const block = (c, label) => `### ${label}\nSource: ${c.source}\nTitle: ${c.title}\nDate: ${c.date}\nARTICLE TEXT:\n${c.text}`;
  const user = [block(main, 'MAIN'), ...more.map((c, i) => block(c, `MORE ${i + 1}`))].join('\n\n');

  const sources = [main, ...more];
  const profileNums = new Set(nums(profile));
  const check = (d) => {
    const bad = [];
    if (typeof d.title !== 'string' || d.title.length < 10 || d.title.length > 90) bad.push('title must be 10-90 characters');
    if (typeof d.intro !== 'string' || d.intro.length < 30 || d.intro.length > 400) bad.push('intro must be 30-400 characters');
    const takes = [d.main_take, ...(Array.isArray(d.more_takes) ? d.more_takes : [])];
    if (typeof d.main_take !== 'string' || words(d.main_take) < 100 || words(d.main_take) > 170) bad.push(`main_take must be 100-170 words (got ${typeof d.main_take === 'string' ? words(d.main_take) : 0})`);
    if (typeof d.main_take === 'string' && !/\b(I|I'd|I'll|I've|my|me)\b/.test(d.main_take)) bad.push('main_take must be in first person: add what you would check and why it matters to you');
    more.forEach((_, i) => {
      const t = d.more_takes?.[i];
      if (typeof t !== 'string' || t.length < 60 || t.length > 500) bad.push(`more_takes[${i}] must be 60-500 characters`);
    });
    takes.forEach((t, i) => {
      if (typeof t !== 'string') return;
      const src = sources[i]?.text.replace(/(\d),(\d)/g, '$1.$2') || '';
      const missing = nums(t).filter((n) => !src.includes(n) && !profileNums.has(n));
      if (missing.length) bad.push(`${i ? `more_takes[${i - 1}]` : 'main_take'} has numbers that are not in its article: ${missing.join(', ')}. Remove them or state only what the article says`);
      if (/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(t)) bad.push('no emojis');
    });
    return bad;
  };

  let draft;
  let problems = [];
  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await llm(messages, 1800);
    try {
      draft = json(raw);
      problems = check(draft);
    } catch (e) {
      draft = null;
      problems = [e.message];
    }
    if (!problems.length) break;
    messages.push({ role: 'assistant', content: raw }, { role: 'user', content: `Fix these problems and return the full JSON again:\n- ${problems.join('\n- ')}` });
  }
  if (problems.length) throw new Error(`the draft did not pass validation: ${problems.join('; ')}`);

  const item = (c, take) => ({ title: c.title, source: c.source === 'Habr' ? 'Habr (in Russian)' : c.source, date: c.date, link: c.link, take: take.trim() });
  const post = {
    date: today,
    title: draft.title.trim(),
    intro: draft.intro.trim(),
    main: item(main, draft.main_take),
    more: more.map((c, i) => item(c, draft.more_takes[i])),
  };
  const dir = await mkdtemp(join(tmpdir(), 'radar-'));
  const file = join(dir, 'post.json');
  await writeFile(file, JSON.stringify(post, null, 2));
  if (DRY) {
    console.log(JSON.stringify(post, null, 2));
    return;
  }
  const r = spawnSync('node', ['scripts/radar/generate.mjs', '--publish', file], { cwd: new URL(ROOT).pathname, encoding: 'utf8' });
  process.stdout.write(r.stdout);
  if (r.status !== 0) throw new Error(`publish failed: ${r.stderr.trim()}`);
  await say(`Radar ${today}: "${post.title}" (${post.main.link})`);
}

main().catch(async (e) => {
  await say(`Radar ${today}: no post. ${e.message}`.slice(0, 900));
  process.exit(1);
});
