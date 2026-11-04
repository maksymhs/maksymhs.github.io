// Dependency-free static components: generated pages work without JavaScript.
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { projects, skills } from './data.mjs';
import { Page, Hero, ProjectGrid, SkillsCloud, ContactCTA, CaseStudy, Header, RadarPreview, Footer, RefreshRadarShell } from './components.mjs';

const site = new URL('../../site/', import.meta.url);
const issues = JSON.parse(await readFile(new URL('radar/issues.json', site), 'utf8'));
const save = async (path, html) => {
  const file = new URL(path, site);
  await mkdir(new URL('./', file), { recursive: true });
  await writeFile(file, html);
};

await save('index.html', Page({
  title: 'Maksym — Senior Java Backend Engineer',
  description: 'Java backend engineer in Madrid. 10+ years in banking and telecom, open-source developer tools, AI interfaces and selected project case studies.',
  path: '/', home: true,
  body: `${Hero()}
  <section class="portfolio-section" id="selected-projects" aria-labelledby="projects-title"><div class="section-heading"><div><p class="p-kicker">SELECTED PROJECTS</p><h2 id="projects-title">Built beyond the day job.</h2></div><a class="home-secondary" href="/projects/">All projects →</a></div>${ProjectGrid(projects.filter((project) => project.slug !== 'radar'))}</section>
  ${RadarPreview(issues)}
  ${ContactCTA()}`,
}));

await save('projects/index.html', Page({
  title: 'Projects — Maksym | Developer Tools & Case Studies',
  description: 'Explore Citadel, Ask my CV and Engineering Radar: open-source code, product interfaces, architecture and project case studies by Maksym.',
  path: '/projects/', current: '/projects/',
  body: `<section class="p-intro"><p class="p-kicker">PROJECTS &amp; OPEN SOURCE</p><h1>Built to be used.</h1><p class="p-lead">Developer tools, AI interfaces and automation. Explore the product, read the code and see the decisions behind it.</p></section>
  <section class="portfolio-section project-list-section" aria-labelledby="project-list-title"><h2 class="sr-only" id="project-list-title">Featured projects</h2>${ProjectGrid(projects)}</section>
  <section class="portfolio-section open-source" aria-labelledby="open-source-title"><h2 id="open-source-title">Built in the open.</h2><p>Citadel and this site are open source. The repositories include the implementation, documentation and project history.</p><div class="p-inline"><a href="https://github.com/maksymhs/Citadel" target="_blank" rel="noopener">Citadel on GitHub ↗</a><a href="https://github.com/maksymhs/maksymhs.github.io" target="_blank" rel="noopener">This site's source ↗</a><a href="https://github.com/maksymhs" target="_blank" rel="noopener">GitHub profile ↗</a></div></section>${ContactCTA()}`,
}));

for (const [i, project] of projects.entries()) {
  await save(`projects/${project.slug}/index.html`, Page({
    title: `${project.title} — Case Study | Maksym`, description: project.summary,
    path: `/projects/${project.slug}/`, current: '/projects/',
    body: CaseStudy(project, projects[(i + 1) % projects.length]),
  }));
}

// These existing pages remain hand-authored. Only update the shared header and
// the explicitly owned skills region, without replacing their professional copy.
for (const path of ['about/index.html', 'experience/index.html']) {
  let html = await readFile(new URL(path, site), 'utf8');
  html = html.replace(/<header class="top p-top">[\s\S]*?<\/header>/, Header(`/${path.split('/')[0]}/`));
  html = html.replace(/<footer class="foot p-footer">[\s\S]*?<\/footer>/, Footer());
  html = html.replace("t==='light'?'light':'dark'", "t==='dark'?'dark':'light'").replace("dataset.theme='dark'", "dataset.theme='light'");
  if (!html.includes('src="/assets/portfolio.js"')) html = html.replace('</head>', '<script src="/assets/portfolio.js" defer></script>\n</head>');
  if (path.startsWith('about/')) {
    html = html.replace('<span id="skills" class="p-anchor"></span>', '');
    const section = `<!-- portfolio-skills:start -->\n<section class="p-block" id="skills" aria-labelledby="skills-title"><h2 id="skills-title">Technical toolkit</h2><p>Technologies from my professional experience and published profile.</p>${SkillsCloud(skills)}</section>\n<!-- portfolio-skills:end -->`;
    html = html.includes('<!-- portfolio-skills:start -->')
      ? html.replace(/<!-- portfolio-skills:start -->[\s\S]*?<!-- portfolio-skills:end -->/, section)
      : html.replace('<section class="p-block"><h2>Education', `${section}\n<section class="p-block"><h2>Education`);
  }
  await save(path, html);
}

for (const path of await readdir(new URL('radar/', site), { recursive: true })) {
  if (!path.endsWith('.html')) continue;
  const relative = `radar/${path}`;
  const html = await readFile(new URL(relative, site), 'utf8');
  const updated = RefreshRadarShell(html);
  if (updated !== html) await save(relative, updated);
}
console.log('Rendered portfolio and refreshed shared navigation, skills and Radar shell.');
