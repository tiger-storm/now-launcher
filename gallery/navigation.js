document.getElementById('year').textContent = new Date().getFullYear();
        const toggle = document.querySelector('.nav-toggle');
        const links = document.getElementById('primary-links');
        const mobile = window.matchMedia('(max-width: 900px)');
        document.documentElement.classList.add('nav-ready');

        function setNavigation(open) {
            links.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
            toggle.querySelector('.nav-icon').textContent = open ? 'close' : 'menu';
        }

        toggle.addEventListener('click', () => setNavigation(toggle.getAttribute('aria-expanded') !== 'true'));
        links.addEventListener('click', event => {
            if (event.target.closest('a')) setNavigation(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
                setNavigation(false);
                toggle.focus();
            }
        });
        mobile.addEventListener('change', () => {
            if (mobile.matches && links.contains(document.activeElement)) toggle.focus();
            if (!mobile.matches && document.activeElement === toggle) links.querySelector('a').focus();
            setNavigation(false);
        });
