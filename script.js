(function () {
    // set a CSS variable --header-height so the .letter can size itself correctly
    function updateHeaderHeight() {
        const header = document.querySelector('header');
        if (!header) return;
        const h = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-height', `${Math.ceil(h)}px`);
    }

    // hamburger menu toggle
    function initHamburgerMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // close menu when clicking on a link
        navMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });

        // close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // run on load and on resize so the layout remains correct
    window.addEventListener('load', updateHeaderHeight);
    window.addEventListener('resize', updateHeaderHeight);
    // also call it now in case script runs after DOM ready (defer is used)
    updateHeaderHeight();
    
    // initialize hamburger menu
    initHamburgerMenu();

    const projects = document.querySelectorAll('.project');
    if (!('IntersectionObserver' in window) || projects.length === 0) {
        // fallback: reveal with a small stagger
        Array.from(projects).forEach((p, i) => {
            p.classList.add('hidden');
            p.style.setProperty('--delay', `${i * 80}ms`);
            setTimeout(() => p.classList.add('visible'), i * 80);
        });
        return;
    }

    const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // compute index for a nice stagger
                const index = Array.from(projects).indexOf(entry.target);
                entry.target.style.setProperty('--delay', `${index * 80}ms`);
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // reveal once
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    projects.forEach(p => {
        // start hidden
        p.classList.add('hidden');
        obs.observe(p);
    });
})();

/* color-shift: whole-text color interpolates from white → --color when pointer is within threshold */
(function initColorShift() {
  const els = Array.from(document.querySelectorAll('.color-shift'));
  if (!els.length) return;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function hexToRgb(hex) {
    hex = hex.trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToCss(c) { return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`; }
  function lerpColor(a, b, t) {
    return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
  }

  const state = els.map(() => ({ t: 0 }));

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

  const targets = els.map(el => {
    const s = getComputedStyle(el).getPropertyValue('--color').trim() || '#ff5a5a';
    const rgb = hexToRgb(s);
    const threshold = parseInt(el.getAttribute('data-color-threshold')) || 220;
    return { rgb, threshold };
  });

  let rafId;
  function frame() {
    els.forEach((el, i) => {
      const rect = el.getBoundingClientRect();

      // nearest point on the element's rect to the pointer (0 distance if pointer is over any part)
      const nearestX = clamp(pointer.x, rect.left, rect.right);
      const nearestY = clamp(pointer.y, rect.top, rect.bottom);
      const dx = pointer.x - nearestX;
      const dy = pointer.y - nearestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // amount: 1 when pointer is on/inside the element, falls to 0 at threshold distance
      const targetT = clamp(1 - dist / targets[i].threshold, 0, 1);

      // smooth the t value
      state[i].t = lerp(state[i].t, targetT, 0.14);

      const white = { r: 255, g: 255, b: 255 };
      const col = lerpColor(white, targets[i].rgb, state[i].t);
      el.style.color = rgbToCss(col);
    });

    rafId = requestAnimationFrame(frame);
  }

  frame();
  window.addEventListener('unload', () => cancelAnimationFrame(rafId));
})();