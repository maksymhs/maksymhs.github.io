(() => {
  const API = 'https://api.maksym.site';
  const SESSION = Math.random().toString(36).slice(2, 8).toUpperCase();
  const CALENDLY = 'https://calendly.com/maksymhe';
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  const year = $('year');
  if (year) year.textContent = new Date().getFullYear();

  const dark = matchMedia('(prefers-color-scheme: dark)');
  const toggle = $('themeToggle');
  const system = () => (dark.matches ? 'dark' : 'light');
  const current = () => root.dataset.theme || system();
  const label = () => toggle?.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  const store = (v) => { try { v ? localStorage.setItem('theme', v) : localStorage.removeItem('theme'); } catch { } };
  toggle?.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    if (next === system()) { delete root.dataset.theme; store(null); }
    else { root.dataset.theme = next; store(next); }
    label();
  });
  dark.addEventListener?.('change', label);
  label();

  document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));
  document.querySelectorAll('a[data-focus]').forEach((a) => a.addEventListener('click', () => {
    setTimeout(() => document.querySelector(a.dataset.focus)?.focus({ preventScroll: true }), 400);
  }));

  document.querySelectorAll('.panel pre').forEach((pre) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'copy';
    b.textContent = 'Copy';
    b.dataset.copy = pre.textContent;
    pre.after(b);
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-copy]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = 'Copied';
    } catch {
      b.textContent = 'Press ⌘C';
    }
    setTimeout(() => { b.textContent = 'Copy'; }, 1600);
  });

  const copyProfile = document.getElementById('copyProfile');
  copyProfile?.addEventListener('click', async () => {
    const label = copyProfile.textContent;
    try {
      const res = await fetch('/llms-full.txt');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const profile = (await res.text()).trim();
      const prompt = `Act as Maksym, a Senior Backend Engineer, using ONLY the profile below. Answer my questions in the first person, as if you were him, concise and concrete, in my language. Start by saying in one sentence that you are an AI version of his CV, then invite me to ask anything or paste a job description. Never invent employers, dates, numbers, salary, notice period or availability; if something is not in the profile, say it is best discussed with him directly at https://maksym.site/#contact. Do not state a surname.\n\n--- PROFILE ---\n${profile}`;
      await navigator.clipboard.writeText(prompt);
      copyProfile.textContent = 'Copied: paste it in any AI';
    } catch {
      copyProfile.textContent = 'Could not copy';
    }
    setTimeout(() => { copyProfile.textContent = label; }, 2600);
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const items = document.querySelectorAll('main section:not(.hero), .job, .case, .mcp');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
    root.classList.add('motion');
  }

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]*[^\s<).,;:!?])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  function md(text) {
    const blocks = [];
    let list = null;
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)/);
      if (item) {
        if (!list) { list = []; blocks.push(list); }
        list.push(inline(item[1]));
        continue;
      }
      list = null;
      if (line) blocks.push(inline(line));
    }
    return blocks.map((b) => (Array.isArray(b) ? `<ul>${b.map((i) => `<li>${i}</li>`).join('')}</ul>` : `<p>${b}</p>`)).join('');
  }

  async function sendLead(form, extra) {
    const status = form.querySelector('.form-status');
    const btn = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true;
    status.textContent = 'Sending…';
    try {
      const res = await fetch(`${API}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...extra, session: SESSION }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      status.textContent = form.dataset.ok || 'Thanks, message sent.';
    } catch {
      status.innerHTML = `Could not send it. Please <a href="${CALENDLY}" target="_blank" rel="noopener">book a call</a> or message on LinkedIn.`;
    } finally {
      btn.disabled = false;
    }
  }

  $('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    sendLead(e.currentTarget, { source: 'contact' });
  });

  const log = $('chatLog');
  const form = $('chatForm');
  const input = $('chatInput');
  const suggest = $('chatSuggest');
  if (!log || !form || !input) return;

  const send = form.querySelector('button[type="submit"]');
  const placeholder = input.placeholder;
  const history = [];
  let busy = false;
  let answers = 0;
  let leadOffered = false;

  const grow = () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight + 2, 240)}px`; };
  const toBottom = () => { log.scrollTop = log.scrollHeight; };
  function add(cls, html) {
    const el = document.createElement('div');
    el.className = `msg ${cls}`;
    el.innerHTML = html;
    log.appendChild(el);
    toBottom();
    return el;
  }

  function offerLead() {
    const tpl = $('leadTpl');
    if (!tpl || leadOffered) return;
    leadOffered = true;
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.addEventListener('submit', (e) => {
      e.preventDefault();
      const context = history.filter((m) => m.role === 'user').slice(-3).map((m) => m.content.slice(0, 300)).join('\n---\n');
      sendLead(node, { source: 'chat', context });
    });
    log.appendChild(node);
    toBottom();
  }

  async function ask(question) {
    if (busy || !question) return;
    busy = true;
    send.disabled = true;
    if (suggest) suggest.hidden = true;
    input.placeholder = placeholder;
    add('me', esc(question.length > 600 ? `${question.slice(0, 600)}…` : question));
    history.push({ role: 'user', content: question });
    const out = add('bot', '<p class="typing">Thinking…</p>');
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12), lang: (navigator.language || 'en').slice(0, 5), session: SESSION }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data:') || line.includes('[DONE]')) continue;
          try {
            const tok = JSON.parse(line.slice(5)).choices?.[0]?.delta?.content || '';
            if (tok) { full += tok; out.innerHTML = md(full); toBottom(); }
          } catch { }
        }
      }
      const answer = full.trim();
      if (!answer) throw new Error('empty');
      history.push({ role: 'assistant', content: answer });
      answers++;
      if (question.length >= 400 || answers === 2) offerLead();
    } catch {
      history.pop();
      out.classList.add('err');
      out.innerHTML = `<p>Sorry, the assistant is unavailable right now. You can <a href="${CALENDLY}" target="_blank" rel="noopener">book a call</a> or use the <a href="#contact">contact form</a>.</p>`;
    } finally {
      busy = false;
      send.disabled = false;
    }
  }

  function submit() {
    const q = input.value.trim();
    input.value = '';
    grow();
    ask(q);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  input.addEventListener('input', grow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  suggest?.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-jd')) {
      input.placeholder = 'Paste the job description here…';
      input.focus();
      return;
    }
    ask(b.textContent.trim());
  });
  document.querySelectorAll('a[href="#ask"]').forEach((a) => a.addEventListener('click', () => setTimeout(() => input.focus({ preventScroll: true }), 300)));
})();
