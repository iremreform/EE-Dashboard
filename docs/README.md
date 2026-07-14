# Documentation index

Start here when working on the Energetic Exotics dashboard. These docs describe **what to build**, **how it should look**, and **decisions already made** — the wireframes in `reference/` are for layout and flows only, not visual styling.

## Read order for agents

1. **[`../README.md`](../README.md)** — Project setup, folder structure, implemented routes, styling stack
2. **[`design-system.md`](./design-system.md)** — Brand tokens, typography, colors, buttons, inputs (source of truth for visuals)
3. **[`ui-decisions.md`](./ui-decisions.md)** — Resolved conflicts, exceptions, footer/auth notes, what’s done vs next
4. **[`component-inventory.md`](./component-inventory.md)** — Component map, wireframe → code mapping, implementation status
5. **[`skills.md`](./skills.md)** — Agent operating guide and project-specific implementation rules
6. **[`tasks.md`](./tasks.md)** — Current backend plan, task breakdown, and client-answer follow-ups
7. **[`external-sources.md`](./external-sources.md)** — Google Sheets, R2, Resend, Supabase, Square, Vercel, notifications
8. **[`launch-checklist.md`](./launch-checklist.md)** — Client account ownership, domains, production configuration, QA, and handoff

## Quick reference

| Need | Where |
|------|--------|
| CSS tokens | `src/styles/tokens.css` |
| User-facing copy | `src/content/portal.ts` |
| UI components | `src/components/ui/`, `src/components/layout/`, `src/components/auth/` |
| Page flows / layouts | `reference/wireframes/`, `reference/userflow.html` |
| Logo assets | `public/company-logo.svg`, `public/ee logo small.png` |
| Backend plan | `docs/tasks.md` |
| External services | `docs/external-sources.md` |
| Production launch | `docs/launch-checklist.md` |
| Backend status | Supabase database/auth and current staging media are wired; Google Sheet sync and production R2 media are next |
| Figma file | [Internal UI Style Guide](https://www.figma.com/design/vjj9rDRMUTzSM9v3Twa49m/Energetic-Exotics--Internal-UI-?node-id=2368-52) |

## Rules of thumb

- **Visual styling:** website + Figma + `design-system.md` — not wireframe grayscale CSS
- **Layout & flows:** wireframes in `reference/` — not served by the app
- **Styling in code:** CSS modules + tokens — no Tailwind
- **Auth:** driver/admin login, protected routes, logout, required password changes, and admin self-service recovery use Supabase Auth
- **Footer:** minimal `SiteFooter` on all `PageShell` pages (see D19 in `ui-decisions.md`)
