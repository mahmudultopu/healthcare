/* ==========================================================================
   NEWME Health — website interactions
   Vanilla JS, no dependencies. Shared data comes from data.js (window.NEWME).
   ========================================================================== */

(() => {
  'use strict';

  const N = window.NEWME;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky navbar + back-to-top ---------- */
  const navbar = $('#navbar');
  const toTop = $('#toTop');
  const onScroll = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    toTop.hidden = window.scrollY < 900;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
  };
  menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
  $$('a', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileMenu.hidden) setMenu(false); });

  /* ---------- Active nav link while scrolling ---------- */
  const navLinks = $$('.nav-link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'departments', 'doctors', 'tools', 'plans', 'contact'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  /* ---------- Fade-up on scroll ---------- */
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

  const observeReveal = (root = document) => {
    $$('.reveal:not(.is-visible)', root).forEach((el) => {
      if (el.dataset.delay) el.style.setProperty('--d', `${el.dataset.delay}ms`);
      revealObserver.observe(el);
    });
  };

  /* ---------- Counter animation ---------- */
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (prefersReducedMotion) { el.textContent = target; return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1800, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
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
  $$('[data-count]').forEach((el) => countObserver.observe(el));

  /* ---------- Button ripple (delegated, so rendered buttons get it too) ---------- */
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn-ripple');
    if (!btn) return;
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

  /* ---------- Services slider ---------- */
  const track = $('#featureTrack');
  const prevBtn = $('#featPrev');
  const nextBtn = $('#featNext');
  const stepSize = () => {
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.offsetWidth + gap : track.clientWidth;
  };
  const updateSliderButtons = () => {
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
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

  /* ---------- Shared select options ---------- */
  const deptOptions = N.departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  $('#qfDept').insertAdjacentHTML('beforeend', deptOptions);
  $('#bkDept').insertAdjacentHTML('beforeend', deptOptions);

  /* ---------- Departments ---------- */
  $('#deptGrid').innerHTML = N.departments.map((d, i) => `
    <button type="button" class="dept-card reveal" data-delay="${(i % 4) * 80}" data-book-dept="${d.id}" aria-label="Book ${d.name}">
      <span class="dept-card__icon"><svg aria-hidden="true"><use href="#${d.icon}"/></svg></span>
      <span class="dept-card__go arrow-circle" aria-hidden="true"><svg><use href="#i-arrow"/></svg></span>
      <span class="dept-card__name">${d.name}</span>
      <span class="dept-card__desc">${d.desc}</span>
    </button>`).join('');

  /* ---------- Doctors: filters + search ---------- */
  const doctorGrid = $('#doctorGrid');
  const doctorEmpty = $('#doctorEmpty');
  const doctorSearch = $('#doctorSearch');
  const filters = $('#doctorFilters');
  let activeDept = 'all';

  const deptsWithDoctors = N.departments.filter((d) => N.doctors.some((doc) => doc.dept === d.id));
  filters.innerHTML = [{ id: 'all', name: 'All doctors' }, ...deptsWithDoctors]
    .map((d) => `<button type="button" class="filter-chip" role="tab" data-dept="${d.id}" aria-selected="${d.id === 'all'}">${d.name}</button>`)
    .join('');

  const renderDoctors = () => {
    const q = doctorSearch.value.trim().toLowerCase();
    const list = N.doctors.filter((doc) => {
      const dept = N.deptById(doc.dept);
      const matchesDept = activeDept === 'all' || doc.dept === activeDept;
      const matchesText = !q || `${doc.name} ${doc.title} ${dept.name}`.toLowerCase().includes(q);
      return matchesDept && matchesText;
    });

    doctorEmpty.classList.toggle('hidden', list.length > 0);
    doctorGrid.innerHTML = list.map((doc, i) => `
      <article class="doc-card" style="animation-delay:${i * 70}ms">
        <div class="doc-card__media">
          <img src="${doc.img}" alt="Portrait of ${doc.name}, ${doc.title}" loading="lazy" />
          <span class="doc-card__avail">Available</span>
          <span class="doc-card__rating"><svg aria-hidden="true"><use href="#i-star"/></svg>${doc.rating.toFixed(1)}</span>
        </div>
        <div class="doc-card__body">
          <h3 class="doc-card__name">${doc.name}</h3>
          <p class="doc-card__role">${doc.title} · ${N.deptById(doc.dept).name}</p>
          <div class="doc-card__meta">
            <span class="chip">${doc.exp} yrs experience</span>
            <span class="chip">${doc.reviews} reviews</span>
            <span class="chip">${doc.langs}</span>
          </div>
          <div class="doc-card__foot">
            <p class="doc-card__next">Next available<b>${doc.next}</b></p>
            <button type="button" class="btn-dark btn-ripple" data-book-doctor="${doc.id}">Book</button>
          </div>
        </div>
      </article>`).join('');
  };

  filters.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeDept = chip.dataset.dept;
    $$('.filter-chip', filters).forEach((c) => c.setAttribute('aria-selected', String(c === chip)));
    renderDoctors();
  });
  doctorSearch.addEventListener('input', renderDoctors);
  renderDoctors();

  /* ---------- Health tools ---------- */
  const tabs = $$('.tool-tab');
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  const calculators = {
    bmi(f, out) {
      const h = Number(f.height.value) / 100;
      const bmi = Number(f.weight.value) / (h * h);
      const bands = [
        [18.5, 'Underweight', 'Below the healthy range. A doctor or dietitian can help you gain weight safely.'],
        [25, 'Healthy weight', 'You are in the healthy range for most adults. Keep up balanced meals and activity.'],
        [30, 'Overweight', 'Slightly above the healthy range. Small, steady changes in diet and activity help.'],
        [Infinity, 'Obesity', 'Above the healthy range. Consider talking to a doctor about a personal plan.'],
      ];
      const [, tag, note] = bands.find(([max]) => bmi < max);
      out.value.textContent = bmi.toFixed(1);
      out.tag.textContent = tag;
      out.note.textContent = note;
      // Scale spans BMI 0–40
      out.marker.style.left = `${Math.min(Math.max(bmi / 40, 0.02), 0.98) * 100}%`;
    },
    water(f, out) {
      const litres = Number(f.weight.value) * 0.033 + (Number(f.exercise.value) / 30) * 0.35;
      const glasses = Math.round((litres * 1000) / 250);
      out.value.textContent = `${litres.toFixed(1)} L`;
      out.tag.textContent = `About ${glasses} glasses (250 ml)`;
      out.glasses.innerHTML = Array.from({ length: Math.min(glasses, 24) }, (_, i) => `<i style="animation-delay:${i * 40}ms"></i>`).join('');
    },
    cal(f, out) {
      const w = Number(f.weight.value);
      const h = Number(f.height.value);
      const a = Number(f.age.value);
      const bmr = 10 * w + 6.25 * h - 5 * a + (f.sex.value === 'm' ? 5 : -161);
      const tdee = bmr * Number(f.activity.value);
      out.value.textContent = `${fmt(tdee)} kcal`;
      out.rows.innerHTML = [
        ['Mild weight loss (−0.25 kg/wk)', tdee - 250],
        ['Weight loss (−0.5 kg/wk)', tdee - 500],
        ['Weight gain (+0.25 kg/wk)', tdee + 250],
        ['Resting metabolism (BMR)', bmr],
      ].map(([label, v]) => `<div class="cal-row"><span>${label}</span><b>${fmt(v)} kcal</b></div>`).join('');
    },
    hr(f, out) {
      const max = 220 - Number(f.age.value);
      const rest = Number(f.rest.value);
      const reserve = max - rest;
      out.value.textContent = `${max} bpm`;
      out.zones.innerHTML = [
        ['Zone 1 · Warm-up', 0.5, 0.6],
        ['Zone 2 · Fat burn', 0.6, 0.7],
        ['Zone 3 · Aerobic', 0.7, 0.8],
        ['Zone 4 · Threshold', 0.8, 0.9],
        ['Zone 5 · Maximum', 0.9, 1],
      ].map(([label, lo, hi]) =>
        `<div class="hr-zone" style="--w:${hi * 100}%"><span>${label}</span><b>${Math.round(rest + reserve * lo)}–${Math.round(rest + reserve * hi)} bpm</b></div>`
      ).join('');
    },
  };

  $$('.tool-form').forEach((form) => {
    const panel = form.closest('.tool-panel');
    const out = Object.fromEntries($$('[data-out]', panel).map((el) => [el.dataset.out, el]));
    const run = () => calculators[form.dataset.tool](form.elements, out);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      run();
    });
    run();
  });

  /* ---------- Appointment booking ---------- */
  const form = $('#bookingForm');
  const bkDept = $('#bkDept');
  const bkDoctor = $('#bkDoctor');
  const bkDate = $('#bkDate');
  const slotsEl = $('#bkSlots');
  const slotError = $('#slotError');
  const success = $('#bookingSuccess');
  let selectedTime = '';

  const today = N.todayISO();
  bkDate.min = today;
  bkDate.value = today;
  $('#qfDate').min = today;
  $('#qfDate').value = today;

  const fillDoctors = () => {
    const list = N.doctors.filter((d) => d.dept === bkDept.value);
    bkDoctor.innerHTML = '<option value="">First available specialist</option>' +
      list.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  };

  // Deterministic "already taken" slots so the schedule looks realistic per doctor/date
  const isTaken = (date, doctor, time) => {
    const key = `${date}|${doctor}|${time}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    const booked = N.getAppointments().some((a) => a.date === date && a.time === time && a.doctorId === doctor && a.status === 'upcoming');
    return booked || hash % 5 === 0;
  };

  const renderSlots = () => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    slotsEl.innerHTML = N.timeSlots.map((t) => {
      const [h, m] = t.split(':').map(Number);
      const past = bkDate.value === today && h * 60 + m <= nowMinutes;
      const disabled = past || isTaken(bkDate.value, bkDoctor.value || 'any', t);
      if (disabled && selectedTime === t) selectedTime = '';
      return `<button type="button" class="slot" data-time="${t}" aria-pressed="${selectedTime === t}" ${disabled ? 'disabled' : ''}>${N.formatTime(t)}</button>`;
    }).join('');
    if (!$('.slot:not(:disabled)', slotsEl)) {
      slotsEl.insertAdjacentHTML('beforeend', '<p class="col-span-full text-sm text-neutral-500">No slots left on this day — please pick another date.</p>');
    }
  };

  slotsEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot || slot.disabled) return;
    selectedTime = slot.dataset.time;
    $$('.slot', slotsEl).forEach((s) => s.setAttribute('aria-pressed', String(s === slot)));
    slotError.classList.remove('is-shown');
  });

  bkDept.addEventListener('change', () => { fillDoctors(); renderSlots(); });
  bkDoctor.addEventListener('change', renderSlots);
  bkDate.addEventListener('change', renderSlots);

  const goToBooking = ({ dept, doctor, date } = {}) => {
    success.hidden = true;
    form.hidden = false;
    if (dept) { bkDept.value = dept; fillDoctors(); }
    if (doctor) bkDoctor.value = doctor;
    if (date) bkDate.value = date;
    renderSlots();
    document.getElementById('appointment').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => form.elements.name.focus({ preventScroll: true }), 600);
  };

  // Department cards, check-up packages and doctor "Book" buttons
  document.addEventListener('click', (e) => {
    const deptTrigger = e.target.closest('[data-book-dept]');
    const docTrigger = e.target.closest('[data-book-doctor]');
    if (docTrigger) {
      const doc = N.doctorById(docTrigger.dataset.bookDoctor);
      goToBooking({ dept: doc.dept, doctor: doc.id });
    } else if (deptTrigger) {
      e.preventDefault();
      goToBooking({ dept: deptTrigger.dataset.bookDept });
    }
  });

  $('#quickFind').addEventListener('submit', (e) => {
    e.preventDefault();
    const qf = e.currentTarget;
    if (!qf.reportValidity()) return;
    goToBooking({ dept: $('#qfDept').value, date: $('#qfDate').value });
  });

  const validate = () => {
    let ok = true;
    ['name', 'phone', 'dept', 'date'].forEach((name) => {
      const input = form.elements[name];
      const valid = input.value.trim() !== '' && input.checkValidity();
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    slotError.classList.toggle('is-shown', !selectedTime);
    if (!selectedTime) ok = false;
    return ok;
  };

  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field && field.classList.contains('is-invalid') && e.target.checkValidity() && e.target.value.trim()) {
      field.classList.remove('is-invalid');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      const firstBad = $('.is-invalid input, .is-invalid select', form);
      if (firstBad) firstBad.focus();
      return;
    }
    const f = form.elements;
    const doctor = N.doctorById(f.doctor.value);
    const appt = N.addAppointment({
      name: f.name.value.trim(),
      phone: f.phone.value.trim(),
      type: f.type.value,
      dept: f.dept.value,
      doctorId: doctor ? doctor.id : '',
      doctorName: doctor ? doctor.name : 'First available specialist',
      date: f.date.value,
      time: selectedTime,
      notes: f.notes.value.trim(),
    });

    // Remember the patient's name for the web app greeting
    const profile = N.store.get('profile', {});
    if (!profile.name) N.store.set('profile', { ...profile, name: appt.name });

    $('#bookingSummary').textContent =
      `${appt.type} with ${appt.doctorName} (${N.deptById(appt.dept).name}) on ${N.formatDate(appt.date)} at ${N.formatTime(appt.time)}.`;
    $('#bookingId').textContent = appt.id;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  $('#bookAnother').addEventListener('click', () => {
    form.reset();
    selectedTime = '';
    bkDate.value = today;
    fillDoctors();
    goToBooking();
  });

  fillDoctors();
  renderSlots();

  /* ---------- Newsletter ---------- */
  $('#newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#nlEmail');
    const msg = $('#nlMsg');
    if (!input.checkValidity()) {
      msg.textContent = 'Please enter a valid email address.';
      return;
    }
    msg.textContent = 'Thanks! Your first health tip is on its way.';
    input.value = '';
  });

  /* ---------- Start reveals last, after dynamic content exists ---------- */
  observeReveal();

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
