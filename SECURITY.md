# Security Policy

## Reporting a vulnerability

Please report security issues privately to **security@newme.health**. Do not open a public issue.

Include a description, steps to reproduce and the potential impact. We aim to acknowledge reports within 3 business days.

## Security model

The site is fully static: there is no server-side code, database or login on this deployment, which removes the most common attack surfaces (injection, credential theft, server compromise).

Protections in place:

| Layer | Measure |
|-------|---------|
| Scripts | `Content-Security-Policy` allows scripts from this origin only. No inline scripts, `eval`, CDNs or third-party trackers. |
| Framing | `X-Frame-Options: DENY` and `frame-ancestors 'none'` prevent clickjacking. |
| Transport | HTTPS enforced with HSTS (2 years, includeSubDomains, preload). |
| Content sniffing | `X-Content-Type-Options: nosniff`. |
| Browser features | `Permissions-Policy` disables camera, microphone, geolocation, payment and USB APIs. |
| Isolation | `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` set to `same-origin`. |
| Output encoding | All user-supplied or stored text is HTML-escaped before rendering. |
| Input validation | Data read from `localStorage` is validated and normalised (types, lengths, date/time formats, image sources restricted to bundled assets or in-page photo data). |
| Form limits | Inputs have length limits and format checks. |
| Dependencies | No runtime dependencies. Tailwind is a build-time tool only. |

## Limits

- Portal data lives in the visitor's own browser. Anyone with access to that device and browser profile can read it.
- This deployment is a demonstration and must not be used to store real patient health information. A production system needs authenticated accounts, an encrypted backend, audit logging and compliance with local health-data law.

## Repository hygiene

Recommended settings for maintainers:

- Two-factor authentication on GitHub and Vercel accounts
- Branch protection on `main` (require pull requests and status checks)
- Dependabot alerts enabled
