import { profile } from './data.mjs';

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = (url) => url.startsWith('https:') ? ' target="_blank" rel="noopener"' : '';
const externalIcon = '<svg class="external-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>';
export const link = (url, label, cls = '') => `<a href="${esc(url)}"${cls ? ` class="${cls}"` : ''}${external(url)}>${esc(label)} ${externalIcon}</a>`;

export function Header(current = '') {
  const items = [['/about/', 'About'], ['/experience/', 'Experience'], ['/projects/', 'Projects'], ['/about/#skills', 'Skills'], ['/about/#contact', 'Contact']];
  return `<header class="top p-top">
  <a class="brand p-logo" href="/" aria-label="Maksym home">M<span>.</span></a>
  <button class="portfolio-menu" type="button" aria-expanded="false" aria-controls="portfolioNavigation" hidden><svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14"/></svg><span>Menu</span></button>
  <nav class="nav p-nav" id="portfolioNavigation" aria-label="Main navigation">${items.map(([url, text]) => `<a href="${url}"${url === current ? ' aria-current="page"' : ''}>${text}</a>`).join('')}</nav>
  <button class="theme" id="themeToggle" type="button" aria-label="Toggle theme"><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg><svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg></button>
</header>`;
}

export function Footer() {
  return `<footer class="foot p-footer"><span>© <span id="year">2026</span> Maksym</span><nav aria-label="Footer">${link(profile.linkedin, 'LinkedIn')}${link(profile.github, 'GitHub')}<a href="/radar/">Radar</a><a href="/about/#ask">Ask my CV</a><a href="/llms.txt">llms.txt</a></nav></footer>`;
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
<meta name="theme-color" content="#111318"><meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="https://maksym.site/og.png"><meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
<script>try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}</script>
<link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/portfolio.css"><script src="/assets/site.js" defer></script><script src="/assets/portfolio.js" defer></script>
</head>
<body class="portfolio ${home ? 'p-home code-home' : 'p-subpage'}"><a class="skip" href="#content">Skip to content</a>
<div class="wrap p-wrap">${Header(current)}<main id="content">${body}</main>${Footer()}</div>
</body></html>
`;
}

export function Hero() {
  return `<section class="code-hero" aria-labelledby="home-title">
  <div><p class="p-kicker">BACKEND ENGINEERING · MADRID</p>
  <h1 id="home-title">Hi, I'm Maksym<span>.</span></h1>
  <p class="code-role"><span class="sr-only">Senior Java Backend Engineer. Open-source builder.</span><span aria-hidden="true" data-roles="${esc(JSON.stringify(profile.roles))}">Backend engineer</span><span class="typing-cursor" aria-hidden="true">_</span></p>
  <p class="p-lead">${esc(profile.intro)}</p>
  <div class="p-actions"><a class="p-cta" href="#selected-projects">View projects <span aria-hidden="true">↓</span></a><a class="home-secondary" href="/experience/">View experience <span aria-hidden="true">→</span></a></div>
  <div class="p-social">${link(profile.github, 'GitHub')}${link(profile.linkedin, 'LinkedIn')}<a href="/about/#contact">Let's talk →</a></div></div>
  <aside class="profile-terminal" aria-label="Profile summary"><div class="terminal-bar"><span aria-hidden="true">● ● ●</span><span>profile.json</span></div><pre><code>{
  <span>"focus"</span>: "backend",
  <span>"stack"</span>: ["Java", "Spring Boot"],
  <span>"building"</span>: "developer tools",
  <span>"basedIn"</span>: "Madrid, Spain"
}</code></pre><p>10+ years of engineering experience</p></aside>
</section>`;
}

export function ProjectCard(project) {
  const route = `/projects/${project.slug}/`;
  return `<article class="project-card">
  <a class="project-media" href="${route}" aria-label="${esc(project.title)} case study"><img src="${project.image}" alt="${esc(project.alt)}" width="${project.width}" height="${project.height}" loading="lazy" decoding="async"></a>
  <div class="project-content"><p class="project-category">${esc(project.category)}</p><h3><a href="${route}">${esc(project.title)} <span aria-hidden="true">↗</span></a></h3><p>${esc(project.description)}</p><ul class="project-tags" aria-label="${esc(project.title)} technologies">${project.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul><p class="project-outcome">${esc(project.outcome)}</p><a class="project-case-link" href="${route}">Read case study <span aria-hidden="true">→</span></a><div class="project-links">${link(project.repository, 'GitHub')}${link(project.demo, project.demoLabel)}</div></div>
</article>`;
}

export function ProjectGrid(projects) {
  return `<div class="project-grid">${projects.map(ProjectCard).join('\n')}</div>`;
}

export function SkillsCloud(groups) {
  return `<div class="skills-grid">${groups.map((g) => `<article class="skill-group"><h3><span class="skill-icon" aria-hidden="true">${esc(g.icon)}</span>${esc(g.name)}</h3><ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></article>`).join('')}</div>`;
}

export function ContactCTA() {
  return `<section class="portfolio-contact" aria-labelledby="contact-title"><div><h2 id="contact-title">Interested in working together?</h2><p>Remote backend roles, developer tools or an engineering idea. Let's talk.</p></div><a class="p-cta" href="/about/#contact">Get in touch <span aria-hidden="true">→</span></a></section>`;
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
