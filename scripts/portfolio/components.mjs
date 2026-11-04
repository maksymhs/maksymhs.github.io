import { profile } from './data.mjs';

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = (url) => url.startsWith('https:') ? ' target="_blank" rel="noopener"' : '';
const externalIcon = '<svg class="external-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>';
export const link = (url, label, cls = '') => `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ''}${external(url)}>${esc(label)} ${externalIcon}</a>`;
export const ThemeInit = "<script>try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}</script>";

export function RadarFooter() {
  return Footer();
}

// Apply the shared shell to archived posts without regenerating editorial text.
export function RefreshRadarShell(html) {
  if (!html.includes('<article class="post">')) return html;
  let result = html.replace(/<body(?: class="[^"]*")?>/, '<body class="portfolio p-radar">')
    .replace('<div class="wrap">', '<div class="wrap p-wrap">')
    .replace(/<header class="top(?: p-top)?">[\s\S]*?<\/header>/, Header('/radar/'))
    .replace(/<script>try\{var t=localStorage\.getItem\('theme'\);[\s\S]*?<\/script>/, ThemeInit)
    .replace('content="#f4f1ea"', 'content="#0d1219"').replace('content="#1d201d"', 'content="#111722"');
  if (!result.includes('href="/assets/portfolio.css"')) result = result.replace('</head>', '<link rel="stylesheet" href="/assets/portfolio.css"><script src="/assets/portfolio.js" defer></script>\n</head>');
  // Both old and current Radar shells place the footer after the article.
  result = result.replace(/\s*<footer class="foot(?: p-footer)?">[\s\S]*?<\/footer>/, '')
    .replace(/\s*<p class="radar-disclosure">[\s\S]*?<\/p>/, '')
    .replace('</main>', `</main>\n${RadarFooter()}`);
  return result;
}

export function Header(current = '') {
  const items = [['/about/', 'About'], ['/experience/', 'Experience'], ['/projects/', 'Projects'], ['/contact/', 'Contact']];
  return `<header class="top p-top">
  <a class="brand p-logo" href="/" aria-label="Maksym home">Maksym<span>.</span></a>
  <button class="portfolio-menu" type="button" aria-expanded="false" aria-controls="portfolioNavigation" hidden><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14"/></svg><span>Menu</span></button>
  <nav class="nav p-nav" id="portfolioNavigation" aria-label="Main navigation">${items.map(([url, text]) => `<a href="${url}"${url === current ? ' aria-current="page"' : ''}>${text}</a>`).join('')}</nav>
  <button class="theme" id="themeToggle" type="button" aria-label="Toggle theme"><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg></button>
</header>`;
}

export function Footer() {
  return `<footer class="foot p-footer"><nav aria-label="Footer"><a href="/radar/">Radar</a></nav></footer>`;
}

export function Page({ title, description, path, body, current = '', home = false }) {
  const url = `https://maksym.site${path}`;
  const schema = { '@context': 'https://schema.org', '@type': home ? 'WebSite' : 'WebPage', '@id': `${url}${home ? '#website' : '#page'}`, url, name: title, description, dateModified: '2026-11-04', ...(home ? {} : { isPartOf: { '@id': 'https://maksym.site/#website' } }) };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="author" content="Maksym">
<link rel="canonical" href="${url}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="text/markdown" href="/llms.txt" title="llms.txt"><link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Full profile"><link rel="alternate" type="application/rss+xml" href="/radar/feed.xml" title="Radar">
<meta name="theme-color" content="#0d1219"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="https://maksym.site/og.png"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
${ThemeInit}
<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/portfolio.css"><script src="/assets/site.js" defer></script><script src="/assets/portfolio.js" defer></script>
</head>
<body class="portfolio ${home ? 'p-home' : 'p-subpage'}"><a class="skip" href="#content">Skip to content</a>
<div class="wrap p-wrap">${Header(current)}<main id="content">${body}</main>${Footer()}</div>
</body></html>
`;
}

export function Hero() {
  return `<section class="entry-hero" aria-labelledby="home-title"><div class="entry-copy">
  <p class="p-kicker">SOFTWARE ENGINEER · MADRID, SPAIN</p>
  <h1 id="home-title">Senior Java<br>Backend Engineer<span>.</span></h1>
  <p class="p-lead">I'm Maksym. 10+ years building reliable backend systems for banking and telecommunications.</p>
  <div class="p-actions"><a class="p-cta" href="/experience/">View experience <span aria-hidden="true">→</span></a><a class="p-cta outline" href="/contact/">Let's talk</a></div>
  <div class="p-social">${link(profile.linkedin, 'LinkedIn')}${link(profile.github, 'GitHub')}<a href="/contact/#ask">Ask my AI CV →</a></div>
  </div><div class="entry-art"><img class="entry-illustration theme-dark-art" src="/assets/backend-layers.svg" alt="Layered backend architecture illustration" width="540" height="400"><img class="entry-illustration theme-light-art" src="/assets/backend-layers-light.svg" alt="Layered backend architecture illustration" width="540" height="400"></div></section>`;
}

export function ProjectCard(project) {
  const route = `/projects/${project.slug}/`;
  return `<article class="project-card">
  <a class="project-media" href="${route}" aria-label="${esc(project.title)} case study"><img src="${project.image}" alt="${esc(project.alt)}" width="${project.width}" height="${project.height}" loading="lazy" decoding="async"></a>
  <div class="project-content"><p class="project-category">${esc(project.category)}</p><h3><a href="${route}">${esc(project.title)} ${externalIcon}</a></h3><p>${esc(project.description)}</p><ul class="project-tags" aria-label="${esc(project.title)} technologies">${project.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><p class="project-outcome">${esc(project.outcome)}</p><a class="project-case-link" href="${route}">Read case study <span aria-hidden="true">→</span></a><div class="project-links">${link(project.repository, 'GitHub')}${link(project.demo, project.demoLabel)}</div></div>
</article>`;
}

export function ProjectGrid(projects) {
  return `<div class="project-grid">${projects.map(ProjectCard).join('\n')}</div>`;
}

export function SkillsCloud(groups) {
  return `<div class="skills-grid">${groups.map((g) => `<article class="skill-group"><h3><span class="skill-icon" aria-hidden="true">${esc(g.icon)}</span>${esc(g.name)}</h3><ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></article>`).join('')}</div>`;
}

export function ContactCTA() {
  return `<section class="portfolio-contact" id="connect" aria-labelledby="contact-title"><div class="contact-heading"><p class="p-kicker">LET'S CONNECT</p><h2 id="contact-title">Start a conversation.</h2><p>Get to know my work, or tell me what you have in mind.</p></div><div class="contact-options">
  <a class="contact-option" href="/contact/#ask"><span class="contact-mode">AI ASSISTANT</span><strong>Ask my CV <span aria-hidden="true">→</span></strong><span>Explore my experience or the fit for a role. An AI assistant based on my profile.</span></a>
  <a class="contact-option contact-direct" href="/contact/#contact"><span class="contact-mode">DIRECT MESSAGE</span><strong>Talk to Maksym <span aria-hidden="true">→</span></strong><span>A role, a project or a collaboration. Send me a message directly.</span></a>
  </div></section>`;
}

// Shared with the daily Radar renderer so new posts refresh home automatically.
export function RadarHomeBlock(issues) {
  const date = (issue) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(issue.date));
  return `<!-- radar-home:start -->
<ol class="home-radar-list">${issues.slice(0, 3).map((issue) => `<li><a href="/radar/${esc(issue.slug)}/"><time datetime="${esc(issue.date.slice(0, 10))}">${esc(date(issue))}</time><h3>${esc(issue.title)}</h3><span aria-hidden="true">→</span></a></li>`).join('\n')}</ol>
<!-- radar-home:end -->`;
}

export function RadarPreview(issues) {
  return `<section class="portfolio-section home-writing" aria-labelledby="writing-title"><div class="section-heading"><div><p class="p-kicker">RADAR / WRITING</p><h2 id="writing-title">What I'm following.</h2></div><a class="home-secondary" href="/radar/">All posts →</a></div><p class="section-description">AI, developer tools and backend engineering. A daily radar with AI-assisted commentary and links to the original sources.</p>${RadarHomeBlock(issues)}<a class="radar-subscribe" href="/radar/feed.xml">Follow via RSS →</a></section>`;
}

export function CaseStudy(project, next) {
  return `<article class="case-study">
  <header class="case-intro"><a class="case-back" href="/projects/">← All projects</a><p class="p-kicker">CASE STUDY / ${esc(project.category.toUpperCase())}</p><h1>${esc(project.title)}</h1><p class="p-lead">${esc(project.summary)}</p><div class="project-links">${link(project.repository, 'View source')}${link(project.demo, project.demoLabel)}</div><ul class="project-tags" aria-label="Technologies">${project.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></header>
  <figure class="case-screenshot"><img src="${project.image}" alt="${esc(project.alt)}" width="${project.width}" height="${project.height}" decoding="async"><figcaption>Product interface · ${esc(project.title)}</figcaption></figure>
  <section class="case-section" aria-labelledby="context-title"><h2 id="context-title">The context</h2><p>${esc(project.context)}</p></section>
  <section class="case-section" aria-labelledby="decisions-title"><h2 id="decisions-title">Decisions &amp; tradeoffs</h2>${project.decisions.map(([title, text]) => `<div class="case-decision"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}</section>
  <section class="case-section" aria-labelledby="flow-title"><h2 id="flow-title">How it fits together</h2><ol class="case-flow" aria-label="Conceptual architecture">${project.flow.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p class="case-caption">${esc(project.flowNote)}</p></section>
  <section class="case-section" aria-labelledby="results-title"><h2 id="results-title">${esc(project.resultTitle)}</h2><ul class="case-results">${project.results.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>
  <nav class="case-next" aria-label="Next project"><span>KEEP EXPLORING</span><a href="/projects/${next.slug}/">${esc(next.title)} →</a></nav>
</article>${ContactCTA()}`;
}

export function RepositoryList() {
  const repos = [
    { name: 'Citadel', icon: '>_', description: 'A lightweight, self-hosted workspace for projects, persistent terminals and AI coding agents.', stack: 'Node.js · Fastify · SQLite · tmux', url: 'https://github.com/maksymhs/Citadel' },
    { name: 'maksymhs.github.io', icon: '{ }', description: 'This portfolio, its AI profile assistant, public MCP endpoint and daily engineering Radar.', stack: 'HTML · CSS · JavaScript · Cloudflare Workers', url: 'https://github.com/maksymhs/maksymhs.github.io' },
  ];
  return `<ul class="repository-list">${repos.map(r => `<li><article><span class="repository-icon" aria-hidden="true">${esc(r.icon)}</span><div><h2>${link(r.url,r.name)}</h2><p>${esc(r.description)}</p><p class="p-stack">${esc(r.stack)}</p></div></article></li>`).join('')}</ul>`;
}

export function ContactPage() {
  return `<section class="p-intro contact-intro"><h1>Let's talk.</h1></section>
  <div class="direct-contact-layout"><div id="contactConversation"><nav class="contact-fallback-modes" aria-label="Conversation options"><span>Message Maksym</span><a href="/contact/#ask">Ask about me · AI →</a></nav><form class="form direct-contact-form" id="directContactForm" data-ok="Message sent. Thanks for getting in touch.">
  <textarea id="directMessage" aria-label="Your message" name="message" rows="4" required maxlength="2000" placeholder="Your message… Include a way to reply if you’d like."></textarea>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="p-cta" type="submit">Send message →</button><p class="form-status" role="status" aria-live="polite"></p></form></div>
  <nav class="contact-links" aria-label="Other ways to connect"><span>Or connect on</span> ${link(profile.linkedin,'LinkedIn')}</nav></div>`;
}

export function Contributions() {
  return `<section class="contribution-section" aria-label="GitHub contribution calendar"><div class="contribution-scroll" tabindex="0" role="region" aria-label="GitHub contribution calendar, scroll horizontally on smaller screens"><img class="theme-dark-art" src="/assets/contributions.svg" alt="Maksym's public GitHub contribution activity over the last year; open GitHub for the latest activity" width="778" height="174" loading="lazy"><img class="theme-light-art" src="/assets/contributions-light.svg" alt="Maksym’s public GitHub contribution activity over the last year" width="778" height="174" loading="lazy"></div><p>Public GitHub activity · Refreshed daily when GitHub is available · ${link(profile.github+'?tab=overview','Explore contributions')}</p></section>`;
}
