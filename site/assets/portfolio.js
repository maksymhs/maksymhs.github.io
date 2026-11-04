(() => {
  const menu = document.querySelector('.portfolio-menu');
  const nav = document.getElementById('portfolioNavigation');
  if (menu && nav) {
    const mobile = matchMedia('(max-width: 730px)');
    const close = (restoreFocus = false) => {
      menu.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menu.focus();
    };
    menu.hidden = false;
    document.documentElement.classList.add('portfolio-nav-ready');
    menu.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true'));
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && mobile.matches) {
        event.preventDefault();
        menu.setAttribute('aria-expanded', 'true');
        nav.querySelector('a')?.focus();
      }
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') close(true);
    });
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target) && !nav.contains(event.target)) close();
    });
    // Never hide a focused navigation link when the viewport changes to mobile.
    mobile.addEventListener('change', () => {
      close(mobile.matches && nav.contains(document.activeElement));
    });
  }

  const output = document.querySelector('[data-roles]');
  if (!output) return;
  const roles = JSON.parse(output.dataset.roles);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  let role = 0;
  let deleting = true;
  let length = roles[0].length;
  const tick = () => {
    length += deleting ? -1 : 1;
    output.textContent = roles[role].slice(0, length) || '\u00a0';
    let delay = deleting ? 35 : 65;
    if (length === 0) {
      role = (role + 1) % roles.length;
      deleting = false;
      delay = 220;
    } else if (length === roles[role].length && !deleting) {
      deleting = true;
      delay = 2400;
    }
    timer = setTimeout(tick, delay);
  };
  const reset = () => {
    clearTimeout(timer);
    role = 0;
    length = roles[0].length;
    deleting = true;
    output.textContent = roles[0];
    if (!motion.matches && !document.hidden) timer = setTimeout(tick, 2600);
  };
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);
  reset();
})();
