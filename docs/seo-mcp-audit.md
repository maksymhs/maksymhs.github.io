# Search, LLM and MCP audit — 2026-11-04

## Implemented

- Shared JSON-LD graph: the same public Person identity, WebSite and current page.
  About uses ProfilePage; Contact uses ContactPage; Projects uses CollectionPage.
  Existing Radar Blog/BlogPosting and Citadel SoftwareApplication metadata remain.
- Only documented facts: first name, Java/Spring Boot backend role, Madrid, public
  GitHub/LinkedIn links and technologies present in llms-full.txt. No personal
  email, phone, inferred experience, salary, ratings or unverified metrics added.
- Shared generator retains canonical URLs, static HTML, unique page descriptions,
  social metadata and discoverable Markdown profile links. Image dimensions are
  checked against the actual image, including Citadel's separate screenshot.
- llms.txt, llms-full.txt and persona.txt link directly to Contact. The public
  profile remains the canonical source; daily Radar output keeps its own marked
  region rather than replacing profile content.
- Robots already permits public search/AI crawlers and declares the sitemap.
  The sitemap contains 39 existing canonical pages. The 404 stays noindex.
- New favicon: white M and blue point on the neutral dark brand background, with
  SVG, 16/32px PNG and 180px Apple icon versions and new cache-versioned URLs.
- Visible assistant labels are now “Ask about me”; stable MCP method names and
  URLs remain compatible. The historical case-study capture has been refreshed.

## Verified

- All 39 sitemap paths resolve to existing local pages with one H1, the correct
  canonical, valid JSON-LD, metadata and profile discovery links.
- The full rendered site contains 39 valid JSON-LD documents; both generators
  produce repeatable output and retain those enhancements on subsequent runs.
- Browser checks cover desktop, tablet and mobile wordmarks and renamed links.
- Public MCP, from a normal Chromium browser: initialize, tools/list,
  resources/list and prompts/get (ask_my_cv) return HTTP 200 and JSON-RPC results.
  The prompt response includes the actual profile. No contact tool was invoked
  and no messages were sent. robots.txt and both Markdown profiles return 200
  from the same browser.

## External access limitation

Plain Python HTTP requests from this cloud environment receive HTTP 403 for
api.maksym.site/mcp, while browser requests succeed. Earlier simple requests to
the site also returned an edge response with error code 1010. This is evidence of
client-dependent access filtering, not proof that Google or any particular LLM
crawler is blocked. Review Cloudflare security/bot rules and events for the
read-only public profile paths (/llms.txt, /llms-full.txt, /robots.txt,
/sitemap.xml) and the public /mcp endpoint. Avoid browser-only challenges for
legitimate automated clients. Preserve existing rate limits and contact controls.
No Cloudflare credential binding is available in this environment, so edge policy
was not changed. The Worker's existing documentation URL still uses a historical
About fragment which now redirects to Contact; no Worker deployment is needed
for the profile and site improvements.

The audit does not establish search indexing or rankings. llms.txt is a useful
convention, not a guarantee of LLM ingestion or recommendations. No Search Console
account was available, and no indexing submission, traffic claim or hidden
keyword text was added.
