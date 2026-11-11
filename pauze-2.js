(() => {
  const menuButton = document.querySelector('.menu');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? 'CLOSE' : 'MENU';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = 'MENU';
    }));
  }
  const clock = document.querySelector('[data-ist]');
  const date = document.querySelector('[data-date]');
  const updateClock = () => {
    const now = new Date();
    if (clock) clock.textContent = new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true}).format(now);
    if (date) date.textContent = new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'short',day:'2-digit',month:'short',year:'numeric'}).format(now);
  };
  updateClock();
  window.setInterval(updateClock, 30000);
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold:.12});
    items.forEach(item => observer.observe(item));
  } else items.forEach(item => item.classList.add('visible'));
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();