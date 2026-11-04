// Keep professional facts aligned with site/llms-full.txt. Do not invent metrics.
export const profile = {
  name: 'Maksym',
  role: 'Senior Java Backend Engineer',
  roles: ['Backend engineer', 'Open-source builder', 'Developer tools enthusiast'],
  intro: '10+ years building systems for banking and telecommunications. Currently at Openbank, working with Java, Spring Boot and distributed systems.',
  github: 'https://github.com/maksymhs',
  linkedin: 'https://www.linkedin.com/in/herasymenko',
};

export const skills = [
  { name: 'Backend', icon: '{ }', items: ['Java', 'Spring Boot', 'Microservices', 'REST APIs'] },
  { name: 'Data & messaging', icon: '⇄', items: ['PostgreSQL', 'Redis', 'Oracle', 'AWS SQS'] },
  { name: 'Cloud & delivery', icon: '>_', items: ['AWS', 'Google Cloud', 'Docker', 'Jenkins'] },
  { name: 'Quality & tooling', icon: '✓', items: ['JUnit', 'Grafana', 'Kibana', 'MCP'] },
];

export const projects = [
  {
    slug: 'citadel', title: 'Citadel', category: 'Developer tools',
    description: 'A self-hosted workspace for projects, persistent terminals and AI coding agents.',
    outcome: 'Keep development sessions running after the browser closes.',
    stack: ['Node.js', 'Fastify', 'SQLite', 'tmux'],
    image: '/assets/projects/citadel.png', width: 840, height: 560,
    alt: 'Citadel dashboard with machine health, availability and system metrics',
    repository: 'https://github.com/maksymhs/Citadel', demo: '/citadel/', demoLabel: 'Product tour',
    summary: 'A command center for the projects, terminals and agents that otherwise live across separate tools.',
    context: 'For developers running projects and AI coding agents on their own machines, a browser tab should be a window into the work, rather than the thing keeping it alive. Citadel brings those workspaces, terminals and machine health into one self-hosted interface.',
    decisions: [
      ['Persistence below the UI', 'tmux keeps sessions alive independently of the browser. Node.js and Fastify expose the workspace, while SQLite stores application state.'],
      ['A small deployment footprint', 'The documented minimum is 512 MB of RAM, with 1 GB recommended for AI agents. Optional services add capabilities without becoming baseline requirements.'],
      ['Explicit operational boundaries', 'A terminal runs with the service account’s rights; Citadel does not sandbox projects from each other. The product documentation makes that boundary explicit.'],
    ],
    flow: ['Browser workspace', 'Fastify / Node.js', 'SQLite + tmux', 'Projects & AI agents'],
    flowNote: 'Conceptual view: persistent terminal sessions live beneath the browser interface.',
    resultTitle: 'A workspace that survives the tab.',
    results: [
      'Persistent terminals, project workspaces, machine health and AI coding agents in one interface.',
      'Runs on Linux, macOS and Windows via WSL2; the documented baseline is 512 MB of RAM.',
      'MIT-licensed source, installation instructions and security limitations are public. No adoption or productivity metrics are claimed here.',
    ],
  },
  {
    slug: 'profile-assistant', title: 'Ask my CV', category: 'AI & interfaces',
    description: 'A profile-grounded AI assistant, with the same professional context available over MCP.',
    outcome: 'Let recruiters explore experience in their own words.',
    stack: ['Cloudflare Workers', 'LLMs', 'MCP'],
    image: '/assets/projects/profile-assistant.png', width: 448, height: 380,
    alt: 'Ask my CV interface with AI disclosure, suggested questions and a message input',
    repository: 'https://github.com/maksymhs/maksymhs.github.io/tree/main/worker', demo: '/about/#ask', demoLabel: 'Try the assistant',
    summary: 'Turn a static profile into a conversation, without inventing the person behind it.',
    context: 'Recruiters often need a specific answer: which technology appears in which role, whether the work model fits, or how experience maps to a job description. The assistant lets them ask directly, while the MCP endpoint makes that profile available to their own AI tools.',
    decisions: [
      ['One source of professional facts', 'The Worker reads llms-full.txt, the same profile used by the public MCP server. Instructions tell the assistant to ground claims in that profile and disclose its AI identity.'],
      ['Streamed answers with a fallback', 'Workers AI is tried first; OpenRouter is the configured fallback. Streaming gives the browser a response incrementally. Provider failures can still make the assistant unavailable.'],
      ['Server-side credentials and boundaries', 'Provider credentials remain in the Worker. Chat requests are origin-checked, rate-limited and bounded by message length and conversation history. These controls do not guarantee that a model will never make a mistake.'],
    ],
    flow: ['Visitor question', 'Cloudflare Worker', 'Profile + LLM', 'Streamed answer'],
    flowNote: 'MCP reads the same profile through a separate public endpoint; contact delivery is a separate action.',
    resultTitle: 'One profile, several ways to explore it.',
    results: [
      'Visitors can ask questions on the site; compatible assistants can read the professional profile through the public MCP endpoint.',
      'Chat, contact and MCP share one Worker implementation, with professional facts maintained in a dedicated profile file.',
      'The implementation is public. No conversion, model accuracy or recruiter engagement metrics have been measured here.',
    ],
  },
  {
    slug: 'radar', title: 'Engineering Radar', category: 'Automation & writing',
    description: 'A daily selection of AI and backend news, with original commentary and links to the sources.',
    outcome: 'Turn a feed-reading workflow into a published engineering digest.',
    stack: ['Node.js', 'RSS', 'GitHub Actions', 'LLMs'],
    image: '/assets/projects/radar.png', width: 840, height: 560,
    alt: 'Engineering Radar page with dated posts and links to original news sources',
    repository: 'https://github.com/maksymhs/maksymhs.github.io/tree/main/scripts/radar', demo: '/radar/', demoLabel: 'Read the radar',
    summary: 'A publishing pipeline that separates source facts from AI-assisted commentary.',
    context: 'Following AI and backend engineering creates a steady stream of articles. Radar collects feeds, selects candidates and produces a short daily digest with original takes. The public site discloses that the commentary is drafted with AI assistance.',
    decisions: [
      ['Keep source metadata out of generation', 'Links, titles, sources and dates come from feeds. The model writes the headline, introduction and commentary, rather than inventing source metadata.'],
      ['Validate before publishing', 'The pipeline reads the selected articles and validates the draft before passing it to the renderer. The numeric checks are useful guardrails, not a substitute for human fact-checking.'],
      ['Publish static artifacts', 'Node.js renders the post, archive, RSS and sitemap. GitHub Actions runs the daily pipeline and triggers the existing Pages deployment. The workflow can report its outcome through the Worker.'],
    ],
    flow: ['RSS candidates', 'Article text + draft', 'Validation', 'Static pages + RSS'],
    flowNote: 'The daily GitHub Actions workflow orchestrates this pipeline; the Worker provides the LLM endpoint.',
    resultTitle: 'A repeatable publishing workflow.',
    results: [
      'A public archive, individual post pages and an RSS feed generated from the same post data.',
      'Daily automation with validation and links back to original sources; AI assistance is disclosed to readers.',
      'No readership or time-saving metrics are claimed. Source quality and editorial accuracy remain ongoing concerns.',
    ],
  },
];
