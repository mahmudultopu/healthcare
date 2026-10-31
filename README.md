# NEWME Health

Marketing website and patient portal for **NEWME Health**, a multi-specialty clinic network offering in-person visits, telemedicine, home lab tests and preventive check-ups.

**Live site:** [healthcare-theta-puce.vercel.app](https://healthcare-theta-puce.vercel.app)  
**Patient portal:** [healthcare-theta-puce.vercel.app/app](https://healthcare-theta-puce.vercel.app/app)

---

## Features

### Website (`index.html`)

- Doctor finder by department and date, with prefilled booking
- Eight specialist departments and a searchable, filterable doctor directory
- Appointment booking with live time-slot availability and inline validation
- Health calculators: BMI, daily water intake, calorie needs (Mifflin-St Jeor) and heart-rate zones (Karvonen)
- Services, preventive check-up packages, patient stories, health articles and FAQ
- 24/7 emergency bar and a quick-action bar on mobile

### Patient portal (`app.html`)

- Glass-style dashboard: body overview, daily targets, activity cards and meal plan
- Appointments: book, join video visits and cancel
- Medications: daily schedule with dose check-off and adherence tracking
- Trackers: water, sleep, weight trend, heart rate and blood pressure, meal photo logging
- Records: lab results, prescriptions and downloadable summaries
- Profile and personal goals

Bookings made on the website appear in the portal automatically.

---

## Tech stack

| Area    | Choice                                                         |
| ------- | -------------------------------------------------------------- |
| Markup  | Semantic HTML5                                                 |
| Styling | Tailwind CSS 3 (compiled at build time) + component CSS        |
| Scripts | Vanilla JavaScript, no runtime dependencies                    |
| Fonts   | Inter and Playfair Display, self-hosted (WOFF2)                |
| Hosting | Vercel (static)                                                |

No third-party scripts, trackers or CDNs are loaded in the browser.

---

## Project structure

```text
.
├── index.html            # Website
├── app.html              # Patient portal
├── 404.html              # Not-found page
├── style.css             # Design tokens and website components
├── app.css               # Portal layout and glass theme
├── data.js               # Shared data (departments, doctors) and storage helpers
├── script.js             # Website interactions
├── app.js                # Portal logic and views
├── assets/
│   ├── css/              # Compiled Tailwind output (base.css, tailwind.css)
│   ├── fonts/            # Self-hosted WOFF2 fonts
│   └── images/           # Photography, icons and social preview image
├── src/                  # Tailwind entry files
├── vercel.json           # Security headers, caching and clean URLs
├── tailwind.config.js
└── package.json
```

---

## Local development

Requirements: Node.js 18 or newer.

```bash
npm install
npm run build:css     # compile Tailwind into assets/css/
npx serve .           # or any static file server
```

Use `npm run watch:css` while editing markup. The compiled CSS is committed, so the site deploys without a build step.

**Stylesheet order matters:** `base.css` (reset) → `style.css` / `app.css` (components) → `tailwind.css` (utilities).

---

## Deployment

Every push to `main` deploys to production on Vercel. `vercel.json` sets:

- Strict Content-Security-Policy (`script-src 'self'`, no inline or third-party scripts)
- HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy
- Long-lived caching for fonts and images
- Clean URLs (`/app` instead of `/app.html`)

---

## Security

See [SECURITY.md](SECURITY.md) for the security model and how to report a vulnerability.

---

## Data and privacy

The portal is a front-end demonstration. Information entered in it is stored only in the visitor's own browser (`localStorage`) and is never sent to a server. A production deployment would connect it to an authenticated, encrypted backend that meets local health-data regulations.

Doctor names, phone numbers and addresses are placeholders.

---

## Credits

Photography is used under the [Unsplash License](https://unsplash.com/license) and the [Pexels License](https://www.pexels.com/license/). Photographers include Bruce Mars, Cathy Pham, Vitaly Gariev and the RDNE Stock project.

---

&copy; NEWME Health. All rights reserved.
