/* ==========================================================================
   NEWME — interactions
   Vanilla JS, no dependencies.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky navbar shadow ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
  };

  menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth >= 768) setMenu(false); });

  /* ---------- Active nav link while scrolling ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  ['home', 'about', 'features', 'download', 'pricing'].forEach((id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });

  /* ---------- Fade-up on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty('--d', `${el.dataset.delay}ms`);
  });

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      obs.unobserve(el);
      // Drop the stagger delay once revealed so hover transitions respond instantly
      setTimeout(() => el.style.removeProperty('--d'), 1000 + Number(el.dataset.delay || 0));
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Counter animation ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (prefersReducedMotion) { el.textContent = target; return; }

    const duration = 1800;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * easeOut(progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- Button ripple ---------- */
  document.querySelectorAll('.btn-ripple').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* ---------- Features slider ---------- */
  const track = document.getElementById('featureTrack');
  const prevBtn = document.getElementById('featPrev');
  const nextBtn = document.getElementById('featNext');

  const stepSize = () => {
    const card = track.querySelector('.feature-card');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.offsetWidth + gap : track.clientWidth;
  };

  const updateSliderButtons = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= maxScroll;
  };

  prevBtn.addEventListener('click', () => track.scrollBy({ left: -stepSize() }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: stepSize() }));
  track.addEventListener('scroll', updateSliderButtons, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: stepSize() }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -stepSize() }); }
  });
  window.addEventListener('resize', updateSliderButtons);
  updateSliderButtons();

  /* ---------- QR code placeholder ----------
     Draws a decorative QR-style pattern (finder squares + seeded modules). */
  const drawQr = (canvas) => {
    const ctx = canvas.getContext('2d');
    const modules = 25;
    const cell = canvas.width / modules;
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    ctx.fillStyle = '#0B0D0C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';

    const inFinder = (x, y) =>
      (x < 8 && y < 8) || (x > modules - 9 && y < 8) || (x < 8 && y > modules - 9);

    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (!inFinder(x, y) && rand() > 0.52) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    const finder = (fx, fy) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(fx * cell, fy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = '#0B0D0C';
      ctx.fillRect((fx + 1) * cell, (fy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((fx + 2) * cell, (fy + 2) * cell, 3 * cell, 3 * cell);
    };
    finder(0, 0);
    finder(modules - 7, 0);
    finder(0, modules - 7);
  };

  const qrCanvas = document.getElementById('qrCanvas');
  if (qrCanvas) drawQr(qrCanvas);

  /* ---------- Video modal ---------- */
  const modal = document.getElementById('videoModal');
  const playBtn = document.getElementById('playBtn');
  let lastFocus = null;

  const openModal = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    modal.querySelector('.modal__close').focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  };

  playBtn.addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeModal();
    if (!mobileMenu.hidden) setMenu(false);
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
