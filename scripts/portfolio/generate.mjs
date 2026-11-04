// Dependency-free static components: generated pages work without JavaScript.
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { projects, skills } from './data.mjs';
import { Page, Hero, SkillsCloud, CaseStudy, Header, Footer, RefreshRadarShell, RepositoryList, ContactPage, Contributions } from './components.mjs';

const site = new URL('../../site/', import.meta.url);
const save = async (path, html) => {
  const file = new URL(path, site);
  await mkdir(new URL('./', file), { recursive: true });
  await writeFile(file, html);
};

await save('index.html', Page({
  title: 'Maksym — Senior Java Backend Engineer',
  description: 'Senior Java Backend Engineer in Madrid. 10+ years in banking and telecommunications. Experience, open-source projects and contact.',
  path: '/', home: true,
  body: Hero(),
}));

await save('projects/index.html', Page({
  title: 'Projects — Maksym | Open Source',
  description: 'Public GitHub repositories by Maksym: Citadel and this portfolio.',
  path: '/projects/', current: '/projects/',
  body: `<section class="p-intro"><h1>Things I build.</h1><p class="p-lead">Open-source tools and experiments around developer productivity and AI.</p></section>${RepositoryList()}${Contributions()}`,

}));

await save('contact/index.html', Page({ title: 'Contact — Maksym', description: 'Get in touch with Maksym about backend engineering roles, developer tools or collaboration.', path: '/contact/', current: '/contact/', body: ContactPage() }));

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
  html = html.replace("t==='dark'?'dark':'light'", "t==='light'?'light':'dark'").replace("dataset.theme='light'", "dataset.theme='dark'");
  if (!html.includes('src="/assets/portfolio.js"')) html = html.replace('</head>', '<script src="/assets/portfolio.js" defer></script>\n</head>');
  if (path.startsWith('about/')) {
    html = html.replace('<span id="skills" class="p-anchor"></span>', '');
    const section = `<!-- portfolio-skills:start -->\n<section class="p-block toolkit" id="skills" aria-labelledby="skills-title"><h2 id="skills-title">Technical toolkit</h2>${SkillsCloud(skills)}</section>\n<!-- portfolio-skills:end -->`;
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
