// Native details handles keyboard and touch activation; close on dismissal.
document.querySelectorAll('.practice-menu').forEach(menu => {
  const trigger = menu.querySelector('summary');
  const sync = () => trigger.setAttribute('aria-expanded', String(menu.open));
  sync();
  menu.addEventListener('toggle', sync);
  menu.querySelectorAll('nav a').forEach(link => {
    if (new URL(link.href).pathname === window.location.pathname) link.setAttribute('aria-current', 'page');
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      trigger.focus();
    }
  });
});
