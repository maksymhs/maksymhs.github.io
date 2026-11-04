(async () => {
  const API = 'https://api.maksym.site';
  const sessionRead = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const sessionWrite = (key, value) => { try { sessionStorage.setItem(key, value); } catch { } };
  const SESSION = sessionRead('maksym-chat-session') || Math.random().toString(36).slice(2, 8).toUpperCase();
  sessionWrite('maksym-chat-session', SESSION);
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
    if (next === system() && !document.body.classList.contains('portfolio')) { delete root.dataset.theme; store(null); }
    else { root.dataset.theme = next; store(next); }
    label();
  });
  dark.addEventListener?.('change', label);
  label();

  // Shared progressive enhancement: normal profile/contact links remain the fallback.
  try {
    const response = await fetch('/assets/connect.html?v=message-only-v1');
    if (!response.ok) throw new Error('Panel unavailable');
    document.body.insertAdjacentHTML('beforeend', await response.text());
  } catch { /* Keep navigation and the LinkedIn contact alternative available. */ }

  const dialog = $('connectDialog');
  const launcher = $('connectLauncher');
  const inlineConversation = $('contactConversation');
  if (inlineConversation && dialog) {
    const draft = $('directMessage')?.value || '';
    inlineConversation.replaceChildren(dialog.querySelector('.connect-tabs'), dialog.querySelector('.connect-body'));
    $('contactMessage').value = draft;
  }

  const connectTabs = [...document.querySelectorAll('.connect-tabs [role="tab"]')];
  const selectConnect = (mode) => {
    const selected = mode === 'contact' ? $('connectMessageTab') : $('connectAskTab');
    connectTabs.forEach((tab) => {
      const on = tab === selected;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(tab.getAttribute('aria-controls')).hidden = !on;
    });
    $('connectTitle').textContent = mode === 'contact' ? 'Message Maksym' : 'Ask my AI CV';
  };
  if (inlineConversation) selectConnect(location.hash === '#ask' ? 'ask' : 'contact');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let panelMotion;
  let closing = false;
  const frames = () => matchMedia('(max-width: 599px)').matches
    ? [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }]
    : [{ opacity: 0, transform: 'translateY(12px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }];
  const closeConnect = () => {
    if (!dialog?.open || closing) return;
    closing = true;
    panelMotion?.cancel();
    if (reducedMotion.matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    panelMotion = dialog.animate([...frames()].reverse(), { duration: 140, easing: 'ease-in', fill: 'both' });
    panelMotion.finished.then(() => { dialog.close(); }).catch(() => {});
  };
  const openConnect = (mode = 'ask', focusInput = true) => {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    selectConnect(mode);
    if (inlineConversation) {
      if (focusInput) $(mode === 'contact' ? 'contactMessage' : 'chatInput').focus({ preventScroll: true });
      return;
    }
    if (closing) {
      closing = false;
      panelMotion?.cancel();
      dialog.classList.remove('is-closing');
    }
    if (!dialog.open) {
      dialog.showModal();
      if (!reducedMotion.matches) panelMotion = dialog.animate(frames(), { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    root.classList.add('connect-open');
    launcher.setAttribute('aria-expanded', 'true');
    if (focusInput) $(mode === 'contact' ? 'contactMessage' : 'chatInput').focus({ preventScroll: true });
    else $('connectClose').focus({ preventScroll: true });
  };
  const openMcp = () => {
    openConnect('ask', false);
    const own = document.querySelector('.connect-own');
    if (own) own.open = true;
    if ($('mcp')) {
      $('mcp').open = true;
      requestAnimationFrame(() => $('mcp').scrollIntoView({ block: 'nearest', behavior: 'instant' }));
    }
  };
  if (dialog && typeof dialog.showModal === 'function') {
    launcher.hidden = false;
    launcher.addEventListener('click', () => openConnect());
    $('connectClose').addEventListener('click', closeConnect);
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeConnect(); });
    dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('a[href], button, input, textarea, select, summary, [tabindex]')]
        .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    });
    dialog.addEventListener('close', () => {
      closing = false;
      panelMotion?.cancel();
      dialog.classList.remove('is-closing');
      root.classList.remove('connect-open');
      launcher.setAttribute('aria-expanded', 'false');
    });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeConnect();
    } });
    connectTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectConnect(index ? 'contact' : 'ask'));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
        selectConnect(next ? 'contact' : 'ask');
        connectTabs[next].focus();
      });
    });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const url = new URL(link.href);
      if (url.origin !== location.origin) return;
      if (['#ask', '#contact'].includes(url.hash) && (url.pathname === '/about/' || url.pathname === location.pathname)) {
        event.preventDefault();
        openConnect(url.hash === '#contact' ? 'contact' : 'ask');
      } else if (url.hash === '#mcp' && (url.pathname === '/about/' || url.pathname === location.pathname)) {
        event.preventDefault();
        openMcp();
      }
    });
    const fromHash = () => {
      if (['#ask', '#contact'].includes(location.hash)) openConnect(location.hash === '#contact' ? 'contact' : 'ask', false);
      if (location.hash === '#mcp') openMcp();
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

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

  // One source of truth for how an assistant should talk as Maksym: /persona.txt (also used by the MCP prompt).
  const copyProfile = document.getElementById('copyProfile');
  const openClaude = document.getElementById('openClaude');
  const openChatGPT = document.getElementById('openChatGPT');
  if (copyProfile || openClaude || openChatGPT) {
    const text = (path) => fetch(path).then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); }).then((s) => s.trim());
    const own = document.querySelector('.connect-own');
    const requested = new Promise((resolve) => {
      own?.addEventListener('toggle', () => { if (own.open) resolve(); });
      copyProfile?.addEventListener('click', resolve, { once: true });
    });
    const persona = requested.then(() => text('/persona.txt'));
    const profile = requested.then(() => text('/llms-full.txt'));
    const START = 'Now begin.';
    const withLink = persona.then((p) => `${p}\n\nHis profile is at https://maksym.site/llms-full.txt: read it first and use only that.`);
    const withProfile = Promise.all([persona, profile]).then(([p, prof]) => `${p}\n\n--- PROFILE ---\n${prof}\n--- END OF PROFILE ---\n\n${START}`);
    withLink.then((prompt) => {
      const q = encodeURIComponent(prompt);
      if (openClaude) openClaude.href = `https://claude.ai/new?q=${q}`;
      if (openChatGPT) openChatGPT.href = `https://chatgpt.com/?q=${q}`;
    }).catch(() => {});
    withProfile.catch(() => {});
    copyProfile?.addEventListener('click', async () => {
      const label = copyProfile.textContent;
      try {
        if (window.ClipboardItem && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ 'text/plain': withProfile.then((s) => new Blob([s], { type: 'text/plain' })) })]);
        } else {
          await navigator.clipboard.writeText(await withProfile);
        }
        copyProfile.textContent = 'Copied. Paste it in any AI';
      } catch {
        copyProfile.textContent = 'Could not copy';
      }
      setTimeout(() => { copyProfile.textContent = label; }, 2600);
    });
  }

  const tabs = [...document.querySelectorAll('.mcp-dev [role="tab"]')];
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
      status.innerHTML = `Could not send it. Please <a href="https://www.linkedin.com/in/herasymenko" target="_blank" rel="noopener">message on LinkedIn</a>.`;
    } finally {
      btn.disabled = false;
    }
  }

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email');
    sendLead(e.currentTarget, { source: 'contact', contact: email || '(not provided, direct message)' });
  };
  $('contactForm')?.addEventListener('submit', handleContactSubmit);
  $('directContactForm')?.addEventListener('submit', handleContactSubmit);

  const log = $('chatLog');
  const form = $('chatForm');
  const input = $('chatInput');
  const suggest = $('chatSuggest');
  if (!log || !form || !input) return;

  const send = form.querySelector('button[type="submit"]');
  const placeholder = input.placeholder;
  let restored = [];
  try {
    const saved = JSON.parse(sessionRead('maksym-chat-history') || '[]');
    if (Array.isArray(saved)) restored = saved.filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string').slice(-12).map((message) => ({ role: message.role, content: message.content.slice(0, 12000) }));
  } catch { }
  const history = restored;
  const saveHistory = () => sessionWrite('maksym-chat-history', JSON.stringify(history.slice(-12)));
  let busy = false;

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

  history.forEach((message) => add(message.role === 'user' ? 'me' : 'bot', message.role === 'user' ? esc(message.content) : md(message.content)));
  if (history.length && suggest) suggest.hidden = true;

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
      saveHistory();
    } catch {
      history.pop();
      out.classList.add('err');
      out.innerHTML = `<p>Sorry, the assistant is unavailable right now. You can use the <a href="#contact">contact form</a> instead.</p>`;
    } finally {
      busy = false;
      send.disabled = false;
    }
  }

  function submit() {
    const q = input.value.trim();
    if (busy || !q) return;
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
})();
