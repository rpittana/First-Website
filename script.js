(function () {
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