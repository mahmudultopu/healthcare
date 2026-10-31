/* ==========================================================================
   NEWME Health — patient web app
   Single-page dashboard with hash routing. All data lives in this browser
   (localStorage via NEWME.store) and is seeded with sample data on first run.
   ========================================================================== */

(() => {
  'use strict';

  const N = window.NEWME;
  const { store, escapeHtml: esc } = N;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Date helpers ---------- */
  const toISO = (d) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 10);
  };
  const addDays = (iso, n) => {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + n);
    return toISO(d);
  };
  const today = N.todayISO();
  const nowHHMM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const longDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  /* ---------- Static content ---------- */
  // Macro split (share of kcal) and fibre grams per serving for quick-add foods
  const FOODS = [
    { name: 'Avocado toast & egg', kcal: 250, img: 'assets/images/food-toast.jpg',   p: 0.2,  c: 0.4,  f: 0.4,  fiber: 5 },
    { name: 'Banana',              kcal: 90,  img: 'assets/images/food-banana.jpg',  p: 0.05, c: 0.9,  f: 0.05, fiber: 3 },
    { name: 'Fruit bowl',          kcal: 120, img: 'assets/images/food-fruit.jpg',   p: 0.05, c: 0.9,  f: 0.05, fiber: 4 },
    { name: 'Pancakes',            kcal: 350, img: 'assets/images/food-pancake.jpg', p: 0.1,  c: 0.65, f: 0.25, fiber: 1 },
    { name: 'Veggie salad',        kcal: 310, img: 'assets/images/food-salad.jpg',   p: 0.15, c: 0.45, f: 0.4,  fiber: 9 },
    { name: 'Salmon poke bowl',    kcal: 420, img: 'assets/images/food-bowl.jpg',    p: 0.3,  c: 0.45, f: 0.25, fiber: 4 },
    { name: 'Apple',               kcal: 70,  img: 'assets/images/food-apple.jpg',   p: 0.02, c: 0.95, f: 0.03, fiber: 4 },
    { name: 'Fish, rice & greens', kcal: 220, img: 'assets/images/food-dinner.jpg',  p: 0.35, c: 0.45, f: 0.2,  fiber: 3 },
  ];
  const DEFAULT_MACROS = { p: 0.2, c: 0.5, f: 0.3 };

  const MEAL_SLOTS = [
    { id: 'breakfast', name: 'Breakfast', time: '07:00 – 09:00 AM' },
    { id: 'lunch',     name: 'Lunch',     time: '12:30 – 01:30 PM' },
    { id: 'dinner',    name: 'Dinner',    time: '06:00 – 08:00 PM' },
  ];

  const LABS = [
    ['Hemoglobin',         '13.6', 'g/dL',     '12.0 – 15.5', 'normal'],
    ['White blood cells',  '6.4',  '×10³/µL',  '4.0 – 11.0',  'normal'],
    ['Platelets',          '250',  '×10³/µL',  '150 – 400',   'normal'],
    ['Fasting glucose',    '92',   'mg/dL',    '70 – 99',     'normal'],
    ['HbA1c',              '5.4',  '%',        '< 5.7',       'normal'],
    ['Total cholesterol',  '198',  'mg/dL',    '< 200',       'normal'],
    ['LDL cholesterol',    '132',  'mg/dL',    '< 100',       'high'],
    ['HDL cholesterol',    '58',   'mg/dL',    '> 50',        'normal'],
    ['Triglycerides',      '120',  'mg/dL',    '< 150',       'normal'],
    ['Vitamin D',          '24',   'ng/mL',    '30 – 100',    'low'],
    ['TSH',                '2.1',  'mIU/L',    '0.4 – 4.0',   'normal'],
  ];

  const PRESCRIPTIONS = [
    { name: 'Metformin 500 mg',   how: 'Twice daily after meals', by: 'Dr. Min-ji Lee',   refills: 2 },
    { name: 'Atorvastatin 10 mg', how: 'Once daily at bedtime',   by: 'Dr. Seo-yeon Kim', refills: 5 },
    { name: 'Vitamin D3 1000 IU', how: 'Once daily with food',    by: 'Dr. Min-ji Lee',   refills: 1 },
  ];

  const DOCUMENTS = [
    { title: 'Blood test report',         sub: 'Lab · PDF summary',   type: 'labs' },
    { title: 'Cardiology visit summary',  sub: 'Dr. Seo-yeon Kim',    type: 'visit' },
    { title: 'Vaccination record',        sub: 'Updated this year',   type: 'vaccines' },
  ];

  /* ---------- Sample data (first run or after reset) ---------- */
  const SEED_KEYS = ['profile', 'weights', 'sleep', 'water', 'meals', 'vitals', 'meds', 'medsTaken', 'seeded'];

  const seed = () => {
    if (store.get('seeded', false)) return;

    const existing = store.get('profile', {});
    store.set('profile', {
      name: 'Hana Choi', age: 29, sex: 'f', height: 165, blood: 'A+',
      waterGoal: 2300, calorieGoal: 1900, allergies: 'Penicillin', ...existing,
    });

    const weights = [];
    for (let i = 30; i >= 0; i -= 3) {
      weights.push({ date: addDays(today, -i), kg: +(58.2 + i * 0.072 + (i % 2 ? 0.15 : -0.1)).toFixed(1) });
    }
    store.set('weights', weights);

    store.set('sleep', [7.2, 6.4, 8.1, 7.5, 5.8, 7.0, 7.7].map((h, i) => ({ date: addDays(today, i - 7), hours: h })));
    store.set('water', { [today]: 1250, [addDays(today, -1)]: 2150 });

    const food = (name) => FOODS.find((f) => f.name === name);
    const entry = (date, slot, name) => ({ id: N.newId('M'), date, slot, ...food(name) });
    store.set('meals', [
      entry(today, 'breakfast', 'Avocado toast & egg'),
      entry(today, 'breakfast', 'Banana'),
      entry(today, 'breakfast', 'Fruit bowl'),
      entry(today, 'lunch', 'Veggie salad'),
      entry(today, 'lunch', 'Apple'),
      entry(today, 'dinner', 'Fish, rice & greens'),
      entry(addDays(today, -1), 'breakfast', 'Pancakes'),
      entry(addDays(today, -1), 'lunch', 'Salmon poke bowl'),
    ]);

    store.set('vitals', [
      { date: addDays(today, -6), time: '08:05', bpm: 75, sys: 121, dia: 79 },
      { date: addDays(today, -3), time: '08:20', bpm: 70, sys: 117, dia: 75 },
      { date: today, time: '08:10', bpm: 72, sys: 118, dia: 76 },
    ]);

    store.set('meds', [
      { id: 'm1', name: 'Vitamin D3',   dose: '1000 IU',   time: '08:00', note: 'With breakfast' },
      { id: 'm2', name: 'Metformin',    dose: '500 mg',    time: '08:30', note: 'After breakfast' },
      { id: 'm3', name: 'Omega-3',      dose: '1 capsule', time: '13:00', note: 'With lunch' },
      { id: 'm4', name: 'Metformin',    dose: '500 mg',    time: '20:00', note: 'After dinner' },
      { id: 'm5', name: 'Atorvastatin', dose: '10 mg',     time: '21:30', note: 'At bedtime' },
    ]);
    store.set('medsTaken', { [today]: { m1: true } });

    const appts = N.getAppointments();
    if (!appts.some((a) => a.status === 'upcoming')) {
      const p = store.get('profile', {});
      N.saveAppointments([
        ...appts,
        { id: N.newId('NM'), status: 'completed', createdAt: Date.now(), name: p.name, type: 'In clinic', dept: 'cardiology', doctorId: 'd1', doctorName: 'Dr. Seo-yeon Kim', date: addDays(today, -14), time: '10:00', notes: 'Annual heart check' },
        { id: N.newId('NM'), status: 'upcoming', createdAt: Date.now(), name: p.name, type: 'Video call', dept: 'general', doctorId: 'd6', doctorName: 'Dr. Min-ji Lee', date: addDays(today, 1), time: '14:30', notes: 'Follow-up on blood test' },
      ]);
    }

    store.set('seeded', true);
  };

  /* ---------- Data accessors ---------- */
  const profile = () => store.get('profile', {});
  const meals = () => store.get('meals', []);
  const mealsOn = (date) => meals().filter((m) => m.date === date);
  const meds = () => store.get('meds', []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const takenToday = () => store.get('medsTaken', {})[today] || {};
  const weights = () => store.get('weights', []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = () => { const w = weights(); return w.length ? w[w.length - 1].kg : null; };
  const vitals = () => store.get('vitals', []);
  const latestVitals = () => { const v = vitals(); return v.length ? v[v.length - 1] : null; };
  const waterOn = (date) => store.get('water', {})[date] || 0;

  const nutrition = (list) => list.reduce((acc, m) => {
    const p = m.p ?? DEFAULT_MACROS.p;
    const c = m.c ?? DEFAULT_MACROS.c;
    const f = m.f ?? DEFAULT_MACROS.f;
    acc.kcal += m.kcal;
    acc.protein += (m.kcal * p) / 4;
    acc.carbs += (m.kcal * c) / 4;
    acc.fat += (m.kcal * f) / 9;
    acc.fiber += m.fiber ?? (m.kcal / 100) * 1.2;
    return acc;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  const macroTargets = () => {
    const goal = profile().calorieGoal || 1900;
    return { protein: (goal * 0.2) / 4, carbs: (goal * 0.5) / 4, fat: (goal * 0.3) / 9, fiber: 25 };
  };

  const doctorImg = (appt) => (N.doctorById(appt.doctorId) || {}).img || 'assets/images/doctor-6.jpg';
  const apptKey = (a) => `${a.date} ${a.time}`;
  const isUpcoming = (a) => a.status === 'upcoming' && apptKey(a) >= `${today} ${nowHHMM()}`;

  const bpStatus = (sys, dia) => {
    if (sys >= 130 || dia >= 80) return ['High', '#B42318'];
    if (sys >= 120) return ['Elevated', '#B54708'];
    return ['Normal', '#3F6B00'];
  };

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  };

  /* ==========================================================================
     Header: user menu, notifications, search
     ========================================================================== */
  const popovers = [];
  const bindPopover = (btn, menu, onOpen) => {
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    const open = () => {
      popovers.forEach((p) => p.close());
      if (onOpen) onOpen();
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden ? open() : close(); });
    menu.addEventListener('click', (e) => { if (e.target.closest('a, [data-go]')) close(); });
    popovers.push({ close });
  };
  const closePopovers = () => popovers.forEach((p) => p.close());
  document.addEventListener('click', (e) => { if (!e.target.closest('.popover')) closePopovers(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopovers(); });

  const renderHeader = () => {
    $('#userName').textContent = profile().name || 'Patient';
    const notes = notifications();
    $('#notifDot').hidden = notes.length === 0;
  };

  const notifications = () => {
    const list = [];
    const soon = addDays(today, 2);
    N.getAppointments().filter(isUpcoming).filter((a) => a.date <= soon).forEach((a) => {
      list.push({ icon: 'i-calendar', text: `${a.type} with ${a.doctorName}`, sub: `${N.formatDate(a.date)} · ${N.formatTime(a.time)}`, go: 'appointments' });
    });
    const taken = takenToday();
    meds().filter((m) => m.time <= nowHHMM() && !taken[m.id]).forEach((m) => {
      list.push({ icon: 'i-pill', text: `Time for ${m.name} ${m.dose}`, sub: `Due ${N.formatTime(m.time)} · ${m.note || 'Take as directed'}`, go: 'medications' });
    });
    if (waterOn(today) < (profile().waterGoal || 2300) / 2 && new Date().getHours() >= 13) {
      list.push({ icon: 'i-drop', text: 'Drink some water', sub: 'You are under half of today\'s goal', go: 'trackers', scroll: 'water-tracker' });
    }
    return list;
  };

  bindPopover($('#userMenuBtn'), $('#userMenu'));
  bindPopover($('#notifBtn'), $('#notifMenu'), () => {
    const notes = notifications();
    $('#notifList').innerHTML = notes.length
      ? notes.map((n) => `<button type="button" class="popover__item" data-go="${n.go}" ${n.scroll ? `data-scroll="${n.scroll}"` : ''}><svg aria-hidden="true"><use href="#${n.icon}"/></svg><span>${esc(n.text)}<small>${esc(n.sub)}</small></span></button>`).join('')
      : '<p class="popover__empty">You\'re all caught up.</p>';
  });

  const SEARCH_INDEX = [
    { label: 'Dashboard', sub: 'Overview', go: 'dashboard', icon: 'i-home' },
    { label: 'Appointments', sub: 'Book or manage visits', go: 'appointments', icon: 'i-calendar' },
    { label: 'Medications', sub: 'Today\'s schedule', go: 'medications', icon: 'i-pill' },
    { label: 'Drinking tracker', sub: 'Water intake', go: 'trackers', scroll: 'water-tracker', icon: 'i-drop' },
    { label: 'Sleep tracker', sub: 'Last 7 nights', go: 'trackers', scroll: 'sleep-tracker', icon: 'i-moon' },
    { label: 'Weight', sub: '30-day trend', go: 'trackers', scroll: 'weight-tracker', icon: 'i-scale' },
    { label: 'Vitals', sub: 'Heart rate & blood pressure', go: 'trackers', scroll: 'vitals-tracker', icon: 'i-heart' },
    { label: 'Scan my food', sub: 'Log a meal photo', go: 'trackers', scroll: 'scan-food', icon: 'i-camera' },
    { label: 'Lab results', sub: 'Latest blood test', go: 'records', icon: 'i-file' },
    { label: 'Prescriptions', sub: 'Refills & instructions', go: 'records', icon: 'i-file' },
    { label: 'Profile & goals', sub: 'Personal details', go: 'profile', icon: 'i-user' },
    ...N.doctors.map((d) => ({ label: d.name, sub: `${d.title} · Book a visit`, go: 'appointments', doctor: d.id, icon: 'i-user' })),
  ];

  const renderSearch = () => {
    const q = $('#searchInput').value.trim().toLowerCase();
    const results = SEARCH_INDEX.filter((r) => !q || `${r.label} ${r.sub}`.toLowerCase().includes(q)).slice(0, 7);
    $('#searchResults').innerHTML = results.length
      ? results.map((r) => `<button type="button" class="popover__item" data-go="${r.go}" ${r.scroll ? `data-scroll="${r.scroll}"` : ''} ${r.doctor ? `data-doctor="${r.doctor}"` : ''}><svg aria-hidden="true"><use href="#${r.icon}"/></svg><span>${esc(r.label)}<small>${esc(r.sub)}</small></span></button>`).join('')
      : '<p class="popover__empty">No matches.</p>';
  };
  bindPopover($('#searchBtn'), $('#searchMenu'), () => {
    $('#searchInput').value = '';
    renderSearch();
    setTimeout(() => $('#searchInput').focus(), 30);
  });
  $('#searchInput').addEventListener('input', renderSearch);
  $('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const first = $('#searchResults [data-go]'); if (first) first.click(); }
  });

  /* ==========================================================================
     Routing
     ========================================================================== */
  const VIEWS = ['dashboard', 'appointments', 'medications', 'trackers', 'records', 'profile'];
  let pendingScroll = null;
  let pendingDoctor = null;

  const go = (view, { scroll, doctor } = {}) => {
    pendingScroll = scroll || null;
    pendingDoctor = doctor || null;
    if (location.hash === `#${view}`) route();
    else location.hash = view;
  };

  // Any element with data-go / data-scroll navigates inside the app
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go], a[data-scroll]');
    if (!el) return;
    e.preventDefault();
    const view = el.dataset.go || el.getAttribute('href').slice(1);
    go(view, { scroll: el.dataset.scroll, doctor: el.dataset.doctor });
  });

  const renderers = {};
  const route = () => {
    const hash = location.hash.slice(1);
    const view = VIEWS.includes(hash) ? hash : 'dashboard';
    closePopovers();
    VIEWS.forEach((v) => { $(`#view-${v}`).hidden = v !== view; });
    $$('.side-link').forEach((l) => {
      const on = l.dataset.view === view;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    document.title = `${$(`#view-${view}`).dataset.title} — NEWME Health`;
    renderers[view]();
    renderHeader();

    if (pendingScroll) {
      const target = document.getElementById(pendingScroll);
      pendingScroll = null;
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          target.classList.remove('is-flash');
          void target.offsetWidth;
          target.classList.add('is-flash');
        }, 60);
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  };
  window.addEventListener('hashchange', route);

  /* ==========================================================================
     Dashboard
     ========================================================================== */
  let mealDate = today;
  const expandedSlots = new Set();

  renderers.dashboard = () => {
    renderOverview();
    renderTargets();
    renderNextAppt();
    renderDashMeds();
    renderMeals();
  };

  const renderOverview = () => {
    const days = Number($('#overviewRange').value);
    const span = days === 7 ? 'week' : 'month';
    const recent = weights().filter((w) => w.date >= addDays(today, -days));
    const delta = recent.length > 1 ? recent[recent.length - 1].kg - recent[0].kg : 0;
    const msg = Math.abs(delta) < 0.1
      ? `Your weight is steady this ${span}`
      : `You've ${delta < 0 ? 'lost' : 'gained'} <b>${Math.abs(delta).toFixed(1)}kg</b> in a ${span}, keep it up!`;

    const goal = profile().calorieGoal || 1900;
    const n = nutrition(mealsOn(today));
    const left = goal - n.kcal;
    const t = macroTargets();
    const ring = (label, value, target, color) => {
      const pct = Math.round((value / target) * 100);
      return `<div class="big-ring"><div class="big-ring__dial" style="--p:${Math.min(pct, 100)}; --c:${color}"><span>${pct}%</span></div>${label}</div>`;
    };

    $('#overview').innerHTML = `
      <p class="overview__msg">${msg}</p>
      <p class="overview__sub">${left >= 0 ? 'Calories left to eat today' : 'Over today\'s calorie goal by'}</p>
      <p class="overview__kcal">${fmt(Math.abs(left))} kcal</p>
      <div class="overview__rings">
        ${ring('Protein', n.protein, t.protein, '#C7F33A')}
        ${ring('Carbo', n.carbs, t.carbs, '#F5C542')}
        ${ring('Fat', n.fat, t.fat, '#FF5A36')}
      </div>`;
  };
  $('#overviewRange').addEventListener('change', renderOverview);

  const renderTargets = () => {
    const v = latestVitals();
    const kg = latestWeight();
    const n = nutrition(mealsOn(today));
    $('#targets').innerHTML = `
      <div class="target">
        <p class="target__title">Water</p><svg class="target__icon target__icon--blue" aria-hidden="true"><use href="#i-drop"/></svg>
        <p class="target__label">Total Cons</p><p class="target__value">${fmt(waterOn(today))} ml</p>
        <button type="button" class="target__add" data-water="250" aria-label="Add 250 ml of water"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>
      </div>
      <a href="#trackers" data-scroll="scan-food" class="target">
        <p class="target__title">Calories</p><svg class="target__icon target__icon--flame" aria-hidden="true"><use href="#i-flame"/></svg>
        <p class="target__label">Total Cons</p><p class="target__value">${fmt(n.kcal)} kCal</p>
      </a>
      <a href="#trackers" data-scroll="weight-tracker" class="target">
        <p class="target__title">Weight</p><svg class="target__icon target__icon--orange" aria-hidden="true"><use href="#i-scale"/></svg>
        <p class="target__label">My Weight</p><p class="target__value">${kg ? `${kg} Kg` : '—'}</p>
      </a>
      <a href="#trackers" data-scroll="vitals-tracker" class="target">
        <p class="target__title">BPM</p><svg class="target__icon target__icon--red" aria-hidden="true"><use href="#i-heart"/></svg>
        <p class="target__label">Latest reading</p><p class="target__value">${v ? `${v.bpm} BPM` : '—'}</p>
      </a>`;
  };

  const renderNextAppt = () => {
    const next = N.getAppointments().filter(isUpcoming).sort((a, b) => apptKey(a).localeCompare(apptKey(b)))[0];
    if (!next) {
      $('#nextAppt').innerHTML = `<div class="empty"><p>No upcoming visits. Book a check-up or a video call with a doctor.</p><a href="#appointments" class="btn-dark btn-ripple btn-sm">Book a visit</a></div>`;
      return;
    }
    const dept = N.deptById(next.dept);
    $('#nextAppt').innerHTML = `
      <div class="appt-hero">
        <div class="appt-hero__top">
          <img src="${doctorImg(next)}" alt="" class="appt-hero__img" />
          <div class="min-w-0">
            <p class="font-semibold">${esc(next.doctorName)}</p>
            <p class="text-sm text-neutral-500">${dept ? dept.name : ''}</p>
          </div>
        </div>
        <div class="appt-hero__when">
          <span><svg aria-hidden="true"><use href="#i-calendar"/></svg>${N.formatDate(next.date)}</span>
          <span><svg aria-hidden="true"><use href="#i-clock"/></svg>${N.formatTime(next.time)}</span>
          <span><svg aria-hidden="true"><use href="#${next.type === 'Video call' ? 'i-video' : 'i-pin'}"/></svg>${next.type}</span>
        </div>
        <div class="mt-auto flex flex-wrap gap-2">
          ${next.type === 'Video call' ? `<button type="button" class="btn-lime btn-ripple btn-sm" data-join="${next.id}"><svg class="ico-sm"><use href="#i-video"/></svg>Join video visit</button>` : ''}
          <a href="#appointments" class="btn-outline btn-sm">Details</a>
        </div>
      </div>`;
  };

  const medRow = (m, taken, withDelete = false) => `
    <div class="med-row ${taken ? 'is-taken' : ''}">
      <span class="med-row__time">${N.formatTime(m.time)}</span>
      <div class="med-row__info">
        <p class="med-row__name">${esc(m.name)} <span class="font-normal text-neutral-500">${esc(m.dose)}</span></p>
        <p class="med-row__meta">${esc(m.note || 'Take as directed')}</p>
      </div>
      <button type="button" class="check-btn" data-med="${m.id}" aria-pressed="${!!taken}" aria-label="Mark ${esc(m.name)} at ${N.formatTime(m.time)} as taken"><svg aria-hidden="true"><use href="#i-check"/></svg></button>
      ${withDelete ? `<button type="button" class="del-btn" data-del-med="${m.id}" aria-label="Remove ${esc(m.name)}"><svg aria-hidden="true"><use href="#i-trash"/></svg></button>` : ''}
    </div>`;

  const renderDashMeds = () => {
    const list = meds();
    const taken = takenToday();
    const done = list.filter((m) => taken[m.id]).length;
    $('#dashMeds').innerHTML = list.length
      ? `<p class="mb-3 px-1 text-sm text-neutral-500">${done} of ${list.length} doses taken today</p><div class="grid gap-2">${list.slice(0, 4).map((m) => medRow(m, taken[m.id])).join('')}</div>`
      : '<p class="p-2 text-sm text-neutral-500">No medicines scheduled. <a href="#medications" class="underline">Add one</a>.</p>';
  };

  /* Meal plan panel */
  const renderMeals = () => {
    const rel = mealDate === today ? 'Today' : mealDate === addDays(today, -1) ? 'Yesterday' : mealDate === addDays(today, 1) ? 'Tomorrow' : '';
    $('#mealDate').textContent = rel ? `${rel}, ${longDate(mealDate).replace(/^\w+, /, '')}` : longDate(mealDate);
    const dayMeals = mealsOn(mealDate);

    $('#mealSlots').innerHTML = MEAL_SLOTS.map((slot) => {
      const items = dayMeals.filter((m) => m.slot === slot.id);
      const kcal = items.reduce((s, m) => s + m.kcal, 0);
      const thumbs = items.slice(0, 3).map((m) => m.img
        ? `<img src="${m.img}" alt="${esc(m.name)}" title="${esc(m.name)} · ${m.kcal} kcal" />`
        : `<span class="meal__ph" title="${esc(m.name)}">${esc(m.name.charAt(0).toUpperCase())}</span>`).join('');
      const open = expandedSlots.has(slot.id);
      return `
        <div class="meal">
          <div class="meal__head">
            <p class="meal__name">${slot.name}</p>
            <p class="meal__time"><svg aria-hidden="true"><use href="#i-clock"/></svg>${slot.time}</p>
          </div>
          <div class="meal__body">
            <div class="meal__thumbs">
              ${thumbs}
              <button type="button" class="plus-btn plus-btn--dark" data-add-meal="${slot.id}" aria-label="Add food to ${slot.name}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>
            </div>
            <p class="meal__kcal">${fmt(kcal)} kcal</p>
          </div>
          ${items.length ? `<button type="button" class="meal__toggle" data-toggle-slot="${slot.id}" aria-expanded="${open}">${open ? 'Hide' : 'Show'} ${items.length} item${items.length > 1 ? 's' : ''}</button>` : ''}
          ${open && items.length ? `<div class="meal__items">${items.map((m) => `<div class="meal__item"><span>${esc(m.name)} · ${m.kcal} kcal</span><button type="button" data-del-meal="${m.id}" aria-label="Remove ${esc(m.name)}"><svg aria-hidden="true"><use href="#i-x"/></svg></button></div>`).join('')}</div>` : ''}
        </div>`;
    }).join('');

    const n = nutrition(dayMeals);
    const t = macroTargets();
    $('#calTotal').textContent = `${fmt(n.kcal)} / ${fmt(profile().calorieGoal || 1900)} kcal`;
    const bar = (label, value, target, color) => {
      const pct = (value / target) * 100;
      return `<div class="cal-bar"><div class="cal-bar__top"><span>${label}</span><span>${pct.toFixed(1)}%</span></div><div class="cal-bar__track"><i style="--c:${color}" data-w="${Math.min(pct, 100)}"></i></div></div>`;
    };
    $('#calAnalysis').innerHTML =
      bar('Carbo', n.carbs, t.carbs, '#F5A35C') +
      bar('Fat', n.fat, t.fat, '#F06A6A') +
      bar('Protein', n.protein, t.protein, '#3D5AFE') +
      bar('Fiber', n.fiber, t.fiber, '#2FBF71');
    requestAnimationFrame(() => $$('#calAnalysis i').forEach((i) => { i.style.width = `${i.dataset.w}%`; }));
  };

  $('#mealPrev').addEventListener('click', () => { mealDate = addDays(mealDate, -1); renderMeals(); });
  $('#mealNext').addEventListener('click', () => { mealDate = addDays(mealDate, 1); renderMeals(); });
  $('#mealSlots').addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle-slot]');
    const del = e.target.closest('[data-del-meal]');
    if (toggle) {
      const id = toggle.dataset.toggleSlot;
      expandedSlots.has(id) ? expandedSlots.delete(id) : expandedSlots.add(id);
      renderMeals();
    } else if (del) {
      store.set('meals', meals().filter((m) => m.id !== del.dataset.delMeal));
      renderers.dashboard();
      toast('Food removed');
    }
  });

  /* Add-meal dialog */
  const mealDialog = $('#mealDialog');
  const mealForm = $('#mealForm');
  let pickedFood = null;

  $('#quickFoods').innerHTML = FOODS.map((f, i) =>
    `<button type="button" class="quick-food" data-food="${i}"><img src="${f.img}" alt="" /><span>${esc(f.name)}<small>${f.kcal} kcal</small></span></button>`).join('');

  $('#quickFoods').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-food]');
    if (!btn) return;
    pickedFood = FOODS[Number(btn.dataset.food)];
    $$('.quick-food').forEach((b) => b.classList.toggle('is-picked', b === btn));
    mealForm.elements.name.value = pickedFood.name;
    mealForm.elements.kcal.value = pickedFood.kcal;
  });
  mealForm.elements.name.addEventListener('input', () => {
    pickedFood = null;
    $$('.quick-food').forEach((b) => b.classList.remove('is-picked'));
  });

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add-meal]');
    if (!add) return;
    const slot = MEAL_SLOTS.find((s) => s.id === add.dataset.addMeal);
    mealForm.reset();
    pickedFood = null;
    $$('.quick-food').forEach((b) => b.classList.remove('is-picked'));
    mealForm.elements.slot.value = slot.id;
    $('#mealDialogTitle').textContent = `Add to ${slot.name.toLowerCase()}`;
    mealDialog.showModal();
  });

  mealForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!mealForm.reportValidity()) return;
    const f = mealForm.elements;
    const base = pickedFood && pickedFood.name === f.name.value.trim() ? pickedFood : { img: '', ...DEFAULT_MACROS };
    store.set('meals', [...meals(), {
      ...base, id: N.newId('M'), date: mealDate, slot: f.slot.value,
      name: f.name.value.trim(), kcal: Number(f.kcal.value),
    }]);
    expandedSlots.add(f.slot.value);
    mealDialog.close();
    renderers.dashboard();
    toast(`Added ${f.name.value.trim()}`);
  });

  $$('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  /* ==========================================================================
     Shared actions: water, medicine check-off, video visit
     ========================================================================== */
  const addWater = (ml) => {
    const water = store.get('water', {});
    water[today] = Math.max(0, (water[today] || 0) + ml);
    store.set('water', water);
    return water[today];
  };

  const toggleMed = (id) => {
    const all = store.get('medsTaken', {});
    const day = { ...(all[today] || {}) };
    day[id] = !day[id];
    all[today] = day;
    store.set('medsTaken', all);
    return day[id];
  };

  const currentView = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'dashboard');

  document.addEventListener('click', (e) => {
    const water = e.target.closest('[data-water]');
    const med = e.target.closest('[data-med]');
    const join = e.target.closest('[data-join]');

    if (water) {
      const ml = Number(water.dataset.water);
      const total = addWater(ml);
      renderers[currentView()]();
      renderHeader();
      toast(ml > 0 ? `+${ml} ml · ${fmt(total)} ml today` : `${fmt(total)} ml today`);
    } else if (med) {
      const taken = toggleMed(med.dataset.med);
      renderers[currentView()]();
      renderHeader();
      if (taken) toast('Dose marked as taken');
    } else if (join) {
      const appt = N.getAppointments().find((a) => a.id === join.dataset.join);
      if (!appt) return;
      $('#callImg').src = doctorImg(appt);
      $('#callTitle').textContent = `Video visit with ${appt.doctorName}`;
      $('#callText').textContent = appt.date === today
        ? `Your doctor will let you in at ${N.formatTime(appt.time)}. Keep this window open.`
        : `Scheduled for ${N.formatDate(appt.date)} at ${N.formatTime(appt.time)}. You can join 10 minutes before the start time.`;
      $('#callDialog').showModal();
    }
  });

  /* ==========================================================================
     Appointments
     ========================================================================== */
  let apptTab = 'upcoming';
  const apDept = $('#apDept');
  const apDoctor = $('#apDoctor');
  const apDate = $('#apDate');
  const apTime = $('#apTime');

  apDept.innerHTML = N.departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  apDate.min = today;
  apDate.value = today;

  const fillApDoctors = () => {
    const list = N.doctors.filter((d) => d.dept === apDept.value);
    apDoctor.innerHTML = '<option value="">First available specialist</option>' + list.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  };
  const fillApTimes = () => {
    const taken = N.getAppointments().filter((a) => a.status === 'upcoming' && a.date === apDate.value).map((a) => a.time);
    const slots = N.timeSlots.filter((t) => !(apDate.value === today && t <= nowHHMM()) && !taken.includes(t));
    apTime.innerHTML = slots.length
      ? slots.map((t) => `<option value="${t}">${N.formatTime(t)}</option>`).join('')
      : '<option value="">No times left</option>';
  };
  apDept.addEventListener('change', fillApDoctors);
  apDate.addEventListener('change', fillApTimes);

  renderers.appointments = () => {
    if (pendingDoctor) {
      const doc = N.doctorById(pendingDoctor);
      apDept.value = doc.dept;
      fillApDoctors();
      apDoctor.value = doc.id;
      pendingDoctor = null;
      setTimeout(() => apDate.focus(), 100);
    } else if (!apDoctor.options.length) {
      fillApDoctors();
    }
    fillApTimes();

    $$('[data-appt-tab]').forEach((t) => {
      const on = t.dataset.apptTab === apptTab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });

    const all = N.getAppointments();
    const list = apptTab === 'upcoming'
      ? all.filter(isUpcoming).sort((a, b) => apptKey(a).localeCompare(apptKey(b)))
      : all.filter((a) => !isUpcoming(a)).sort((a, b) => apptKey(b).localeCompare(apptKey(a)));

    $('#apptList').innerHTML = list.length ? list.map((a, i) => {
      const status = a.status === 'cancelled' ? 'cancelled' : isUpcoming(a) ? 'upcoming' : 'completed';
      const dept = N.deptById(a.dept);
      return `
        <article class="appt-card" style="animation-delay:${i * 50}ms">
          <img src="${doctorImg(a)}" alt="" class="appt-card__img" />
          <div class="appt-card__info">
            <p class="appt-card__name">${esc(a.doctorName)}</p>
            <p class="appt-card__meta">${dept ? dept.name : ''} · ${N.formatDate(a.date)} at ${N.formatTime(a.time)}</p>
            <div class="appt-card__chips">
              <span class="status status--${status}">${status[0].toUpperCase() + status.slice(1)}</span>
              <span class="chip">${a.type}</span>
              <span class="chip">${esc(a.id)}</span>
            </div>
            ${a.notes ? `<p class="mt-2 text-xs text-neutral-500">${esc(a.notes)}</p>` : ''}
          </div>
          ${status === 'upcoming' ? `<div class="appt-card__actions">
            ${a.type === 'Video call' ? `<button type="button" class="btn-lime btn-ripple btn-sm" data-join="${a.id}">Join</button>` : ''}
            <button type="button" class="btn-danger-ghost" data-cancel="${a.id}">Cancel</button>
          </div>` : ''}
        </article>`;
    }).join('') : `<div class="empty"><p>${apptTab === 'upcoming' ? 'No upcoming visits yet — book one with the form.' : 'No past visits yet.'}</p></div>`;
  };

  $$('[data-appt-tab]').forEach((t) => t.addEventListener('click', () => { apptTab = t.dataset.apptTab; renderers.appointments(); }));

  $('#apptList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    if (!window.confirm('Cancel this appointment?')) return;
    N.saveAppointments(N.getAppointments().map((a) => (a.id === btn.dataset.cancel ? { ...a, status: 'cancelled' } : a)));
    renderers.appointments();
    renderHeader();
    toast('Appointment cancelled');
  });

  $('#apptForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget.elements;
    const msg = $('#apptMsg');
    if (!f.time.value || !f.date.value) {
      msg.textContent = 'Please choose an available date and time.';
      msg.classList.add('is-error');
      return;
    }
    const doc = N.doctorById(f.doctor.value);
    const appt = N.addAppointment({
      name: profile().name, type: f.type.value, dept: f.dept.value,
      doctorId: doc ? doc.id : '', doctorName: doc ? doc.name : 'First available specialist',
      date: f.date.value, time: f.time.value, notes: f.notes.value.trim(),
    });
    msg.classList.remove('is-error');
    msg.textContent = `Booked for ${N.formatDate(appt.date)} at ${N.formatTime(appt.time)} · ${appt.id}`;
    f.notes.value = '';
    apptTab = 'upcoming';
    renderers.appointments();
    renderHeader();
    toast('Appointment booked');
  });

  /* ==========================================================================
     Medications
     ========================================================================== */
  renderers.medications = () => {
    const list = meds();
    const taken = takenToday();
    const done = list.filter((m) => taken[m.id]).length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;
    const next = list.find((m) => !taken[m.id] && m.time >= nowHHMM());

    $('#adherence').innerHTML = `
      <div class="big-ring__dial" style="--p:${pct}; --c:#C7F33A"><span>${pct}%</span></div>
      <div>
        <p class="adherence__title">${done} of ${list.length} doses taken</p>
        <p class="adherence__text">${next ? `Next: ${esc(next.name)} ${esc(next.dose)} at ${N.formatTime(next.time)}` : list.length && done === list.length ? 'All done for today — great job!' : 'Check off doses as you take them.'}</p>
      </div>`;
    $('#medSchedule').innerHTML = list.length
      ? list.map((m) => medRow(m, taken[m.id], true)).join('')
      : '<p class="text-sm text-neutral-500">No medicines yet. Add your first one with the form.</p>';
  };

  $('#medSchedule').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-med]');
    if (!del) return;
    store.set('meds', store.get('meds', []).filter((m) => m.id !== del.dataset.delMed));
    renderers.medications();
    renderHeader();
    toast('Medicine removed');
  });

  $('#medForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $('#medMsg');
    if (!form.checkValidity()) {
      msg.textContent = 'Please add a name, dose and time.';
      msg.classList.add('is-error');
      return;
    }
    const f = form.elements;
    store.set('meds', [...store.get('meds', []), { id: N.newId('MED'), name: f.name.value.trim(), dose: f.dose.value.trim(), time: f.time.value, note: f.note.value.trim() }]);
    msg.classList.remove('is-error');
    msg.textContent = `${f.name.value.trim()} added at ${N.formatTime(f.time.value)}.`;
    form.reset();
    f.time.value = '08:00';
    renderers.medications();
    renderHeader();
  });

  /* ==========================================================================
     Trackers
     ========================================================================== */
  renderers.trackers = () => {
    // Water
    const ml = waterOn(today);
    const goal = profile().waterGoal || 2300;
    $('#waterValue').textContent = fmt(ml);
    $('#waterGoalText').textContent = `${Math.round((ml / goal) * 100)}% of your ${fmt(goal)} ml goal`;
    requestAnimationFrame(() => { $('#waterFill').style.height = `${Math.min(ml / goal, 1) * 100}%`; });

    // Sleep (last 7 days, ending today)
    const sleep = store.get('sleep', []);
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const hours = days.map((d) => (sleep.find((s) => s.date === d) || {}).hours || 0);
    const logged = hours.filter((h) => h > 0);
    $('#sleepAvg').textContent = logged.length ? `${(logged.reduce((a, b) => a + b, 0) / logged.length).toFixed(1)} h` : '—';
    $('#sleepBars').innerHTML = days.map((d, i) => {
      const label = new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' });
      return `<div class="bars__col ${hours[i] >= 7 ? 'is-good' : ''}"><b>${hours[i] ? hours[i] : ''}</b><i style="height:${Math.max((hours[i] / 10) * 100, 4)}%"></i>${label}</div>`;
    }).join('');

    // Weight
    const w = weights().filter((x) => x.date >= addDays(today, -30));
    const svg = $('#weightChart');
    if (w.length) {
      const kgs = w.map((x) => x.kg);
      const min = Math.min(...kgs) - 0.5;
      const max = Math.max(...kgs) + 0.5;
      const pts = w.map((x, i) => [w.length === 1 ? 160 : (i / (w.length - 1)) * 320, 110 - ((x.kg - min) / (max - min)) * 100]);
      const line = pts.map((p) => p.join(',')).join(' ');
      svg.innerHTML = `
        <polygon class="area" points="0,120 ${line} 320,120" />
        <polyline class="line" points="${line}" />
        ${pts.map((p) => `<circle class="dot" cx="${p[0]}" cy="${p[1]}" r="3.5" />`).join('')}`;
      const delta = w[w.length - 1].kg - w[0].kg;
      $('#weightNow').textContent = `${w[w.length - 1].kg} kg`;
      $('#weightDelta').textContent = w.length > 1 ? `${delta <= 0 ? '' : '+'}${delta.toFixed(1)} kg in 30 days` : 'first entry';
    } else {
      svg.innerHTML = '';
      $('#weightNow').textContent = 'No entries yet';
      $('#weightDelta').textContent = 'log your weight below';
    }

    // Vitals
    const v = latestVitals();
    if (v) {
      const [label, color] = bpStatus(v.sys, v.dia);
      $('#vitalsNow').innerHTML = `
        <div class="vital"><small>Heart rate</small><p>${v.bpm}</p><em class="text-neutral-500">bpm</em></div>
        <div class="vital"><small>Blood pressure</small><p>${v.sys}/${v.dia}</p><em style="color:${color}">${label}</em></div>
        <div class="vital"><small>Measured</small><p class="!text-base">${v.date === today ? 'Today' : N.formatDate(v.date)}</p><em class="text-neutral-500">${N.formatTime(v.time)}</em></div>`;
    } else {
      $('#vitalsNow').innerHTML = '<p class="col-span-3 text-sm text-neutral-500">No readings yet.</p>';
    }
  };

  $('#sleepForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const h = Number($('#sleepHours').value);
    if (!e.currentTarget.checkValidity() || !h) return;
    store.set('sleep', [...store.get('sleep', []).filter((s) => s.date !== today), { date: today, hours: h }]);
    $('#sleepHours').value = '';
    renderers.trackers();
    toast(`Logged ${h} h of sleep`);
  });

  $('#weightForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) return;
    const kg = Number($('#weightInput').value);
    store.set('weights', [...store.get('weights', []).filter((x) => x.date !== today), { date: today, kg: +kg.toFixed(1) }]);
    $('#weightInput').value = '';
    renderers.trackers();
    toast(`Weight saved: ${kg.toFixed(1)} kg`);
  });

  $('#vitalsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $('#vitalsMsg');
    if (!form.checkValidity()) {
      msg.textContent = 'Please enter heart rate and both blood pressure numbers.';
      msg.classList.add('is-error');
      return;
    }
    const f = form.elements;
    const reading = { date: today, time: nowHHMM(), bpm: Number(f.bpm.value), sys: Number(f.sys.value), dia: Number(f.dia.value) };
    store.set('vitals', [...vitals(), reading]);
    const [label] = bpStatus(reading.sys, reading.dia);
    msg.classList.toggle('is-error', label === 'High');
    msg.textContent = label === 'High'
      ? 'This reading is high. Re-check after resting 5 minutes, and contact a doctor if it stays high.'
      : `Saved. Blood pressure looks ${label.toLowerCase()}.`;
    form.reset();
    renderers.trackers();
  });

  /* Scan my food: photo preview + manual calorie entry */
  let scanThumb = '';
  const downscale = (file, maxSize) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  $('#scanInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      $('#scanImg').src = await downscale(file, 1000);
      $('#scanImg').alt = 'Your meal photo';
      scanThumb = await downscale(file, 140);
      $('#scanForm').elements.name.focus();
      toast('Photo added — now name your meal');
    } catch (err) {
      toast('Could not read that image');
    }
  });

  $('#scanForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = $('#scanMsg');
    if (!form.checkValidity()) {
      msg.textContent = 'Please enter a meal name and calories.';
      msg.classList.add('is-error');
      return;
    }
    const f = form.elements;
    const slot = MEAL_SLOTS.find((s) => s.id === f.slot.value);
    store.set('meals', [...meals(), {
      id: N.newId('M'), date: today, slot: slot.id, name: f.name.value.trim(), kcal: Number(f.kcal.value),
      img: scanThumb || 'assets/images/food-salad.jpg', ...DEFAULT_MACROS,
    }]);
    msg.classList.remove('is-error');
    msg.textContent = `Added to today's ${slot.name.toLowerCase()}.`;
    form.reset();
    f.slot.value = slot.id;
    scanThumb = '';
    toast(`Logged ${f.name.value || 'meal'} to ${slot.name}`);
  });

  /* ==========================================================================
     Records
     ========================================================================== */
  const labDate = addDays(today, -5);

  renderers.records = () => {
    $('#labDate').textContent = N.formatDate(labDate);
    $('#labRows').innerHTML = LABS.map(([name, value, unit, ref, status]) =>
      `<tr><td>${name}</td><td><b>${value}</b> <span class="text-neutral-500">${unit}</span></td><td class="text-neutral-500">${ref}</td><td><span class="lab-status lab-status--${status}">${status[0].toUpperCase() + status.slice(1)}</span></td></tr>`).join('');
    $('#rxList').innerHTML = PRESCRIPTIONS.map((rx) =>
      `<div class="rx"><span class="rx__icon"><svg aria-hidden="true"><use href="#i-pill"/></svg></span><div class="min-w-0 flex-1"><p class="font-semibold text-sm">${rx.name}</p><p class="text-xs text-neutral-500">${rx.how} · ${rx.by}</p></div><span class="chip">${rx.refills} refills</span></div>`).join('');
    $('#docList').innerHTML = DOCUMENTS.map((d) =>
      `<button type="button" class="doc-row" data-doc="${d.type}"><span>${d.title}<small>${d.sub}</small></span><svg aria-hidden="true"><use href="#i-download"/></svg></button>`).join('');
  };

  const download = (filename, text) => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const labText = () => LABS.map(([n, v, u, r, s]) => `  ${n.padEnd(20)} ${`${v} ${u}`.padEnd(16)} ref ${r.padEnd(12)} ${s.toUpperCase()}`).join('\n');

  const summaryText = () => {
    const p = profile();
    const v = latestVitals();
    const upcoming = N.getAppointments().filter(isUpcoming);
    return [
      'NEWME HEALTH — PATIENT SUMMARY',
      `Generated: ${longDate(today)}`,
      '',
      `Name: ${p.name}   Age: ${p.age}   Sex: ${p.sex === 'm' ? 'Male' : 'Female'}   Blood type: ${p.blood}`,
      `Allergies: ${p.allergies || 'None recorded'}`,
      `Height: ${p.height} cm   Latest weight: ${latestWeight() ?? '—'} kg`,
      v ? `Latest vitals: ${v.bpm} bpm, BP ${v.sys}/${v.dia} (${N.formatDate(v.date)})` : 'Latest vitals: none',
      '',
      'CURRENT MEDICINES',
      ...meds().map((m) => `  ${N.formatTime(m.time).padEnd(9)} ${m.name} ${m.dose} — ${m.note || 'as directed'}`),
      '',
      'UPCOMING APPOINTMENTS',
      ...(upcoming.length ? upcoming.map((a) => `  ${N.formatDate(a.date)} ${N.formatTime(a.time)} — ${a.doctorName} (${a.type}) [${a.id}]`) : ['  None']),
      '',
      `LATEST BLOOD TEST (${N.formatDate(labDate)})`,
      labText(),
      '',
      'This summary is generated from data stored in your browser and is for personal reference.',
    ].join('\n');
  };

  $('#downloadReport').addEventListener('click', () => { download('newme-health-summary.txt', summaryText()); toast('Summary downloaded'); });
  $('#docList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-doc]');
    if (!btn) return;
    const p = profile();
    const docs = {
      labs: ['newme-blood-test.txt', `NEWME HEALTH — BLOOD TEST REPORT\nPatient: ${p.name}\nCollected: ${N.formatDate(labDate)}\n\n${labText()}\n\nReviewed by Dr. Min-ji Lee.`],
      visit: ['newme-cardiology-visit.txt', `NEWME HEALTH — VISIT SUMMARY\nPatient: ${p.name}\nDoctor: Dr. Seo-yeon Kim (Cardiology)\n\nECG normal sinus rhythm. Blood pressure well controlled.\nPlan: continue Atorvastatin 10 mg, recheck lipids in 3 months, 150 min/week of moderate exercise.`],
      vaccines: ['newme-vaccinations.txt', `NEWME HEALTH — VACCINATION RECORD\nPatient: ${p.name}\n\nInfluenza — annual\nTetanus/diphtheria booster — up to date\nHepatitis B — complete (3 doses)\nCOVID-19 — up to date`],
    };
    const [name, text] = docs[btn.dataset.doc];
    download(name, text);
    toast('Document downloaded');
  });

  /* ==========================================================================
     Profile
     ========================================================================== */
  const profileForm = $('#profileForm');
  renderers.profile = () => {
    const p = profile();
    ['name', 'age', 'sex', 'height', 'blood', 'waterGoal', 'calorieGoal', 'allergies'].forEach((k) => {
      if (p[k] !== undefined) profileForm.elements[k].value = p[k];
    });
    const kg = latestWeight();
    if (kg && p.height) {
      const bmi = kg / ((p.height / 100) ** 2);
      $('#profileBmi').textContent = bmi.toFixed(1);
      $('#profileBmiTag').textContent = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy weight' : bmi < 30 ? 'Overweight' : 'Obesity range';
    }
  };

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#profileMsg');
    if (!profileForm.checkValidity()) {
      msg.textContent = 'Please fill in all required fields.';
      msg.classList.add('is-error');
      return;
    }
    const f = profileForm.elements;
    store.set('profile', {
      ...profile(), name: f.name.value.trim(), age: Number(f.age.value), sex: f.sex.value, height: Number(f.height.value),
      blood: f.blood.value, waterGoal: Number(f.waterGoal.value), calorieGoal: Number(f.calorieGoal.value), allergies: f.allergies.value.trim(),
    });
    msg.classList.remove('is-error');
    msg.textContent = 'Saved.';
    renderers.profile();
    renderHeader();
  });

  $('#resetData').addEventListener('click', () => {
    if (!window.confirm('Reset all web app data to the sample data? Appointments booked on the website will be removed too.')) return;
    [...SEED_KEYS, 'appointments'].forEach((k) => store.remove(k));
    seed();
    mealDate = today;
    route();
    toast('Demo data reset');
  });

  /* ==========================================================================
     Boot: loading screen, then first render
     ========================================================================== */
  seed();

  const loader = $('#loader');
  const bar = $('.loader__bar i');
  const text = $('#loaderText');
  const steps = ['Loading your health dashboard…', 'Syncing appointments…', 'Preparing your trackers…'];
  const total = prefersReducedMotion ? 300 : 1300;

  route();
  steps.forEach((s, i) => setTimeout(() => {
    text.textContent = s;
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
  }, (total / steps.length) * i));

  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    $('#app').removeAttribute('aria-hidden');
    $('#views').focus({ preventScroll: true });
  }, total + 150);
})();
