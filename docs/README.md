# Documentation index

Start here when working on the Energetic Exotics dashboard. These docs describe **what to build**, **how it should look**, and **decisions already made** — the wireframes in `reference/` are for layout and flows only, not visual styling.

## Read order for agents

1. **[`../README.md`](../README.md)** — Project setup, folder structure, implemented routes, styling stack
2. **[`design-system.md`](./design-system.md)** — Brand tokens, typography, colors, buttons, inputs (source of truth for visuals)
3. **[`ui-decisions.md`](./ui-decisions.md)** — Resolved conflicts, exceptions, footer/auth notes, what’s done vs next
4. **[`component-inventory.md`](./component-inventory.md)** — Component map, wireframe → code mapping, implementation status

## Quick reference

| Need | Where |
|------|--------|
| CSS tokens | `src/styles/tokens.css` |
| User-facing copy | `src/content/portal.ts` |
| UI components | `src/components/ui/`, `src/components/layout/`, `src/components/auth/` |
| Page flows / layouts | `reference/wireframes/`, `reference/userflow.html` |
| Logo asset | `public/company-logo.svg` only |
| Figma file | [Internal UI Style Guide](https://www.figma.com/design/vjj9rDRMUTzSM9v3Twa49m/Energetic-Exotics--Internal-UI-?node-id=2368-52) |

## Rules of thumb

- **Visual styling:** website + Figma + `design-system.md` — not wireframe grayscale CSS
- **Layout & flows:** wireframes in `reference/` — not served by the app
- **Styling in code:** CSS modules + tokens — no Tailwind
- **Auth:** frontend scaffold only; login does not validate yet
- **Footer:** minimal `SiteFooter` on all `PageShell` pages (see D19 in `ui-decisions.md`)
