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

})();
