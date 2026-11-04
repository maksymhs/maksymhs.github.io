// GitHub's public contribution calendar; no token or third-party chart service.
import { writeFile } from 'node:fs/promises';
const response = await fetch('https://github.com/users/maksymhs/contributions', {
  headers: { Accept: 'text/html', 'User-Agent': 'maksym-portfolio' },
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`GitHub calendar: HTTP ${response.status}`);
const html = await response.text();
const days = [...html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*>/g)]
  .map(([, date, level]) => ({ date, level: Number(level) })).sort((a,b) => a.date.localeCompare(b.date));
if (days.length < 350 || new Set(days.map(d=>d.date)).size !== days.length) throw new Error('Unrecognized or incomplete GitHub calendar; retaining the existing chart');
const total = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions/);
if (!total) throw new Error('GitHub contribution total missing');
const start = Date.parse(days[0].date+'T00:00:00Z');
const colors = ['#202c3d','#173d66','#245e9b','#3586ce','#8cc8ff'];
const esc = s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tooltips = new Map([...html.matchAll(/<tool-tip\b[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)].map(([,id,text])=>[id,text]));
const ids = new Map([...html.matchAll(/<td\b[^>]*data-date="([^"]+)"[^>]*id="([^"]+)"/g)].map(([,date,id])=>[date,id]));
const cells = days.map(d=>{
 const offset=Math.round((Date.parse(d.date+'T00:00:00Z')-start)/86400000);
 return `<rect x="${24+Math.floor(offset/7)*14}" y="${43+offset%7*14}" width="10" height="10" rx="2" fill="${colors[d.level]}"><title>${esc(tooltips.get(ids.get(d.date)) || d.date)}</title></rect>`;
}).join('');
const months=[];
for (const d of days) {
 const date=new Date(d.date+'T00:00:00Z');
 if (date.getUTCDate()===1) months.push(`<text x="${24+Math.floor((date-start)/86400000/7)*14}" y="29">${date.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})}</text>`);
}
const title=`${total[1]} contributions in the last year`;
const width=24+Math.ceil(days.length/7)*14+12;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="174" viewBox="0 0 ${width} 174" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">Public GitHub contribution calendar for maksymhs. ${days[0].date} to ${days.at(-1).date}. Updated ${new Date().toISOString().slice(0,10)}. Darker to brighter blue indicates less to more activity.</desc><style>text{font:10px system-ui,sans-serif;fill:#a7b6cc}</style>${months.join('')}${cells}<text x="24" y="163">${title}</text><text x="${width-146}" y="163">Less</text>${colors.map((c,i)=>`<rect x="${width-118+i*13}" y="154" width="10" height="10" rx="2" fill="${c}"/>`).join('')}<text x="${width-45}" y="163">More</text></svg>\n`;
await writeFile(new URL('../../site/assets/contributions.svg',import.meta.url),svg);
await writeFile(new URL('../../site/assets/contributions-light.svg',import.meta.url),svg.replaceAll('#a7b6cc','#536277').replaceAll('#202c3d','#e5ebf3').replaceAll('#173d66','#c6d9f5').replaceAll('#245e9b','#8db3e9').replaceAll('#3586ce','#4f88d1').replaceAll('#8cc8ff','#285fc1'));
console.log(`Updated GitHub calendar: ${days.length} days, ${title}`);
