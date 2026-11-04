// Shared, factual metadata for HTML readers and search engines. No ranking claims.
const ORIGIN = 'https://maksym.site';
const personId = `${ORIGIN}/#maksym`;
const websiteId = `${ORIGIN}/#website`;
const person = {
  '@type': 'Person', '@id': personId, name: 'Maksym', url: `${ORIGIN}/`,
  jobTitle: 'Senior Backend Engineer',
  description: 'Java and Spring Boot backend engineer with 10+ years in banking and telecommunications, based in Madrid, Spain.',
  address: { '@type': 'PostalAddress', addressLocality: 'Madrid', addressCountry: 'ES' },
  sameAs: ['https://github.com/maksymhs', 'https://www.linkedin.com/in/herasymenko'],
  knowsAbout: ['Java', 'Spring Boot', 'Distributed systems', 'Microservices', 'Event-driven architecture', 'PostgreSQL', 'AWS SQS', 'Observability', 'Developer tools'],
  knowsLanguage: ['Spanish', 'Russian', 'Ukrainian', 'English'],
  subjectOf: { '@type': 'CreativeWork', url: `${ORIGIN}/llms-full.txt`, encodingFormat: 'text/markdown' },
};
const website = { '@type': 'WebSite', '@id': websiteId, url: `${ORIGIN}/`, name: 'Maksym', inLanguage: 'en', publisher: { '@id': personId }, about: { '@id': personId } };
export function EnhanceSEO(html, path) {
  if (!html.includes('application/ld+json') || html.includes('content="noindex"')) return html;
  const url = ORIGIN + path;
  const script = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  const original = JSON.parse(html.match(script)[1]);
  const nodes = original['@graph'] || [original];
  const existing = nodes.find(n => n.url === url && n['@type'] !== 'Person' && (path === '/' || n['@type'] !== 'WebSite')) || nodes[0];
  const page = { ...existing };
  delete page['@context'];
  if (path !== '/') {
    page['@id'] ||= `${url}#page`;
    page.isPartOf = { '@id': websiteId };
    page.inLanguage = 'en';
    if (path === '/about/') { page['@type'] = 'ProfilePage'; page.mainEntity = { '@id': personId }; }
    if (path === '/contact/') page['@type'] = 'ContactPage';
    if (path === '/projects/') page['@type'] = 'CollectionPage';
    page.about ||= { '@id': personId };
    if (page.author?.name === 'Maksym') page.author = { '@id': personId };
  }
  const schema = { '@context': 'https://schema.org', '@graph': [person, { ...website, ...(path === '/' ? page : {}), ...website }, ...(path === '/' ? [] : [page])] };
  let result = html.replace(script, () => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`);
  const additions = [];
  if (!result.includes('name="robots"')) additions.push('<meta name="robots" content="index, follow, max-image-preview:large">');
  if (!result.includes('title="llms.txt"')) additions.push('<link rel="alternate" type="text/markdown" href="/llms.txt" title="llms.txt">');
  if (!result.includes('href="/llms-full.txt"')) additions.push('<link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Full professional profile">');
  if (!result.includes('property="og:image:width"')) additions.push('<meta property="og:image:width" content="1730">');
  if (!result.includes('property="og:image:height"')) additions.push('<meta property="og:image:height" content="909">');
  if (!result.includes('property="og:image:alt"')) additions.push('<meta property="og:image:alt" content="'+(path === '/citadel/' ? 'Citadel dashboard showing machine health and availability' : 'Maksym — Senior Backend Engineer, Java and Spring Boot, Madrid')+'">');
  if (!result.includes('name="twitter:title"')) {
    const title = result.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const description = result.match(/name="description" content="([^"]*)"/)?.[1];
    if (title) additions.push(`<meta name="twitter:title" content="${title.replace(/"/g,'&quot;')}">`);
    if (description) additions.push(`<meta name="twitter:description" content="${description}">`);
  }
  if (!result.includes('name="twitter:image"')) additions.push('<meta name="twitter:image" content="https://maksym.site/og.png">');
  return additions.length ? result.replace('</head>', () => additions.join('\n') + '\n</head>') : result;
}
