(() => {
  const menuButton = document.querySelector('.menu');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    const closeMenu = (restoreFocus = false) => {
      if (!nav.classList.contains('open')) return;
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation menu');
      menuButton.textContent = 'MENU';
      if (restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      menuButton.textContent = open ? 'CLOSE' : 'MENU';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('pointerdown', event => {
      if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 700) closeMenu();
    }, { passive: true });
  }

  const clock = document.querySelector('[data-ist]');
  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true
    }).format(new Date());
  };
  updateClock();
  window.setInterval(updateClock, 30000);

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.12 });
    revealItems.forEach(item => revealObserver.observe(item));
  } else revealItems.forEach(item => item.classList.add('visible'));

  // Real project filtering, with counts and accessible pressed states.
  const filters = document.querySelectorAll('[data-filter]');
  const projects = [...document.querySelectorAll('.project[data-category]')];
  const filterStatus = document.querySelector('.filter-status');
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    let visible = 0;
    filters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    projects.forEach(project => {
      const show = selected === 'all' || project.dataset.category === selected;
      project.hidden = !show;
      if (show) { project.classList.add('visible'); visible++; }
    });
    if (filterStatus) {
      const label = selected === 'all' ? 'all' : selected;
      filterStatus.textContent = `Showing ${label === 'all' ? 'all' : label} ${visible} project${visible === 1 ? '' : 's'}`;
    }
  }));

  // Subtle pointer illumination on project rows, disabled for touch/reduced motion.
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    projects.forEach(project => project.addEventListener('pointermove', event => {
      const rect = project.getBoundingClientRect();
      project.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      project.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    }));
    const mark = document.querySelector('.hero-mark');
    const frame = mark && mark.querySelector('.mark-frame');
    if (mark && frame) {
      mark.addEventListener('pointermove', event => {
        const rect = mark.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        frame.style.transform = `rotate(-7deg) translate(${x * 9}px, ${y * 9}px)`;
      });
      mark.addEventListener('pointerleave', () => { frame.style.transform = 'rotate(-7deg)'; });
    }
  }

  // Copy the public contact address with a clear success/failure state.
  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('.copy-status');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const address = copyButton.dataset.copyEmail;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(address);
        } else {
          const field = document.createElement('textarea');
          field.value = address;
          field.setAttribute('readonly', '');
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.appendChild(field);
          field.select();
          const copied = document.execCommand('copy');
          field.remove();
          if (!copied) throw new Error('Clipboard unavailable');
        }
        if (copyStatus) copyStatus.textContent = 'EMAIL COPIED';
        copyButton.textContent = 'COPIED ✓';
      } catch {
        if (copyStatus) copyStatus.textContent = 'Copy unavailable. Use the email button.';
      }
    });
  }

  // Active section marker and a slim page-progress indicator.
  const sectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = sectionLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        sectionLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }), { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }
  let ticking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? window.scrollY / max : 0;
    document.documentElement.style.setProperty('--scroll-progress', String(Math.min(1, Math.max(0, progress))));
    ticking = false;
  };
  const scheduleProgressUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  };
  window.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
  window.addEventListener('resize', scheduleProgressUpdate, { passive: true });
  updateProgress();
})();