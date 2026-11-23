(() => {
    'use strict';

    const cards = [...document.querySelectorAll('.gallery-card')];
    const dialog = document.querySelector('.feature-dialog');
    const video = document.getElementById('dialog-video');
    const still = document.getElementById('dialog-image');
    const closeButton = dialog.querySelector('.dialog-close');
    const previous = document.getElementById('previous-feature');
    const next = document.getElementById('next-feature');
    const mediaError = dialog.querySelector('.media-error');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let activeIndex = -1;
    let returnFocus = null;
    let closing = false;

    function stopVideo() {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }

    function render(index, play = false) {
        const card = cards[index];
        const opening = !dialog.open;
        if (opening) {
            returnFocus = document.activeElement?.closest('a, button') || card.querySelector('a');
        }
        activeIndex = index;
        stopVideo();
        mediaError.hidden = true;
        const title = card.querySelector('h3').textContent;
        const tier = card.dataset.tier;
        const poster = card.querySelector('img');
        document.getElementById('dialog-title').textContent = title;
        document.getElementById('dialog-chapter').textContent = card.dataset.chapter;
        document.getElementById('dialog-label').textContent = card.dataset.label;
        document.getElementById('dialog-description').textContent = card.querySelector('.card-detail').textContent;
        const tierLabel = document.getElementById('dialog-tier');
        tierLabel.hidden = !tier;
        tierLabel.textContent = tier || '';
        tierLabel.classList.toggle('tier-pro', tier?.includes('Pro') || false);
        document.getElementById('tour-progress').textContent = `${index + 1} of ${cards.length}`;
        document.getElementById('feature-permalink').href = `#watch-${card.dataset.id}`;
        previous.disabled = index === 0;
        next.disabled = index === cards.length - 1;
        const hasVideo = Boolean(card.dataset.video);
        video.hidden = !hasVideo;
        still.hidden = hasVideo;
        document.getElementById('dialog-format').textContent = hasVideo
            ? 'Silent demonstration · Playback controls available'
            : 'Screenshot preview · Video walkthrough to follow';
        if (hasVideo) {
            video.poster = poster.src;
            video.setAttribute('aria-label', title);
            video.src = card.dataset.video;
            document.getElementById('video-download').href = card.dataset.video;
        } else {
            still.src = poster.src;
            still.alt = poster.alt;
        }
        if (opening) {
            document.documentElement.classList.add('gallery-dialog-open');
            dialog.showModal();
        }
        dialog.scrollTop = 0;
        // Focus the new title on every step; native dialog keeps focus inside.
        document.getElementById('dialog-title').focus({ preventScroll: true });
        if (hasVideo && play && !reducedMotion.matches) video.play().catch(() => {});
    }

    function hide() {
        stopVideo();
        dialog.close();
        document.documentElement.classList.remove('gallery-dialog-open');
        activeIndex = -1;
        closing = false;
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }

    function indexFromLocation() {
        return cards.findIndex(card => location.hash === `#watch-${card.dataset.id}`);
    }

    function syncLocation() {
        const index = indexFromLocation();
        if (index >= 0) {
            if (index !== activeIndex || !dialog.open) render(index);
        } else if (dialog.open) hide();
    }

    function open(index) {
        if (index < 0 || index >= cards.length) return;
        const hash = `#watch-${cards[index].dataset.id}`;
        if (dialog.open) {
            history.replaceState(history.state, '', hash);
        } else {
            history.pushState({ galleryDialog: true }, '', hash);
        }
        render(index, true);
    }

    function dismiss() {
        if (closing) return;
        closing = true;
        if (history.state?.galleryDialog) {
            // All Next/Previous steps replace this entry: Back closes the tour once.
            history.back();
        } else {
            // Direct feature links have no gallery entry to go back to.
            history.replaceState(history.state, '', location.pathname + location.search);
            hide();
        }
    }

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href^="#watch-"]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const index = cards.findIndex(card => link.hash === `#watch-${card.dataset.id}`);
        if (index < 0) return;
        event.preventDefault();
        open(index);
    });
    previous.addEventListener('click', () => open(activeIndex - 1));
    next.addEventListener('click', () => open(activeIndex + 1));
    closeButton.addEventListener('click', dismiss);
    dialog.addEventListener('cancel', event => {
        event.preventDefault();
        dismiss();
    });
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], video[controls]')]
            .filter(control => control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'dialog-title')) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    let pointerStartedOutside = false;
    function outside(event) {
        const bounds = dialog.getBoundingClientRect();
        return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    }
    dialog.addEventListener('pointerdown', event => { pointerStartedOutside = outside(event); });
    dialog.addEventListener('click', event => {
        if (event.target === dialog && pointerStartedOutside && outside(event)) dismiss();
    });
    video.addEventListener('error', () => {
        if (video.hasAttribute('src')) mediaError.hidden = false;
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) video.pause(); });
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    window.addEventListener('pagehide', () => video.pause());
    syncLocation();
})();
