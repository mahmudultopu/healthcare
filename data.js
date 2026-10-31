/* ==========================================================================
   NEWME — shared data + storage
   Loaded by both the website (index.html) and the web app (app.html),
   so appointments booked on the site show up in the patient portal.
   ========================================================================== */

window.NEWME = (() => {
  'use strict';

  const departments = [
    { id: 'general',       name: 'General Medicine', icon: 'i-stethoscope', desc: 'Check-ups, fevers, infections and everyday health concerns.' },
    { id: 'cardiology',    name: 'Cardiology',       icon: 'i-heart',       desc: 'Heart health, blood pressure, ECG and cholesterol care.' },
    { id: 'neurology',     name: 'Neurology',        icon: 'i-brain',       desc: 'Headaches, migraines, nerve and sleep disorders.' },
    { id: 'pediatrics',    name: 'Pediatrics',       icon: 'i-baby',        desc: 'Gentle care, vaccines and growth checks for children.' },
    { id: 'orthopedics',   name: 'Orthopedics',      icon: 'i-bone',        desc: 'Joint pain, sports injuries, fractures and posture.' },
    { id: 'dermatology',   name: 'Dermatology',      icon: 'i-drop',        desc: 'Skin, hair and nail conditions, acne and allergies.' },
    { id: 'dentistry',     name: 'Dentistry',        icon: 'i-tooth',       desc: 'Cleanings, fillings, braces and oral surgery.' },
    { id: 'ophthalmology', name: 'Eye Care',         icon: 'i-eye',         desc: 'Vision tests, glasses, cataract and retina care.' },
  ];

  const doctors = [
    { id: 'd6', name: 'Dr. Min-ji Lee',    dept: 'general',     title: 'General Physician',  exp: 9,  rating: 4.9, reviews: 1204, img: 'assets/images/doctor-6.jpg', langs: 'English, Korean',  next: 'Today, 2:30 PM' },
    { id: 'd1', name: 'Dr. Seo-yeon Kim',  dept: 'cardiology',  title: 'Cardiologist',       exp: 12, rating: 4.9, reviews: 842,  img: 'assets/images/doctor-1.jpg', langs: 'English, Korean',  next: 'Today, 4:00 PM' },
    { id: 'd2', name: 'Dr. Arif Rahman',   dept: 'neurology',   title: 'Neurologist',        exp: 15, rating: 4.8, reviews: 655,  img: 'assets/images/doctor-2.jpg', langs: 'English, Bangla',  next: 'Tomorrow, 10:00 AM' },
    { id: 'd3', name: 'Dr. Amara Okafor',  dept: 'pediatrics',  title: 'Pediatrician',       exp: 10, rating: 5.0, reviews: 978,  img: 'assets/images/doctor-3.jpg', langs: 'English, French',  next: 'Today, 5:30 PM' },
    { id: 'd4', name: 'Dr. Marcus Reed',   dept: 'orthopedics', title: 'Orthopedic Surgeon', exp: 14, rating: 4.8, reviews: 512,  img: 'assets/images/doctor-4.jpg', langs: 'English, Spanish', next: 'Tomorrow, 9:30 AM' },
    { id: 'd5', name: 'Dr. Daniel Novak',  dept: 'dermatology', title: 'Dermatologist',      exp: 8,  rating: 4.7, reviews: 431,  img: 'assets/images/doctor-5.jpg', langs: 'English, Czech',   next: 'Wed, 11:00 AM' },
  ];

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  /* ---------- localStorage wrapper (fails gracefully in private mode) ---------- */
  const PREFIX = 'newme:';
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* storage unavailable */ }
    },
  };

  /* ---------- Helpers ---------- */
  const deptById = (id) => departments.find((d) => d.id === id);
  const doctorById = (id) => doctors.find((d) => d.id === id);

  const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const newId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Appointments ---------- */
  const getAppointments = () => store.get('appointments', []);
  const saveAppointments = (list) => store.set('appointments', list);

  const addAppointment = (appt) => {
    const record = { id: newId('NM'), status: 'upcoming', createdAt: Date.now(), ...appt };
    saveAppointments([...getAppointments(), record]);
    return record;
  };

  return {
    departments, doctors, timeSlots, store,
    deptById, doctorById, todayISO, formatDate, formatTime, newId, escapeHtml,
    getAppointments, saveAppointments, addAppointment,
  };
})();
