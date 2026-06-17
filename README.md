# Energetic Exotics Dashboard

Next.js portal for driver delivery/pickup workflows and internal admin review.

**Status:** Frontend scaffold — branded UI, no backend or real auth yet. Login forms navigate to placeholder dashboards without validating credentials.

## Project structure

```
├── docs/
│   ├── README.md             # Doc index — start here for agents
│   ├── design-system.md      # Brand tokens, components, Figma references
│   ├── component-inventory.md # Component map + implementation status
│   └── ui-decisions.md       # Design conflicts, decisions, agent guidance
├── public/
│   └── company-logo.svg      # Single logo asset (app + reference wireframes)
├── reference/                # Static HTML wireframes — not served by the app
├── src/
│   ├── app/                  # App Router pages
│   ├── components/
│   │   ├── auth/             # Shared LoginForm
│   │   ├── layout/           # PageShell, PageIntro, SiteFooter, etc.
│   │   └── ui/               # Button, Input, Card, ChoiceCard, …
│   ├── content/
│   │   └── portal.ts         # User-facing copy (areas, pages, footer, nav)
│   ├── lib/                  # cn(), typography helpers
│   └── styles/
│       └── tokens.css        # Design tokens (source of truth for styling)
```

## Styling

- **CSS custom properties** in `src/styles/tokens.css` — see `docs/design-system.md`
- **CSS modules** per component — no Tailwind
- **Minimal reset** in `src/app/globals.css` (`box-sizing`, form inheritance)
- **Wireframes** in `reference/` are for layout/flow only — not visual styling

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes (implemented)

| Route | Description |
|-------|-------------|
| `/` | Portal selector (Driver / Admin choice cards) |
| `/driver/login` | Driver sign-in |
| `/driver/forgot-password` | Password help (no email reset form) |
| `/driver/dashboard` | Driver hub placeholder |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Admin hub placeholder |

Planned routes are listed in `docs/ui-decisions.md` (D8).

## Wireframe reference

Static prototypes live in `reference/` for flow and layout context (agents, developers). They are **not** served by the app — open files in the editor or browser via `reference/index.html`. Logo path: `public/company-logo.svg`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Next steps

- Backend + real auth (driver + admin)
- Database schema (drivers, submissions, media)
- Driver dashboard choice cards → delivery/pickup forms
- Admin sidebar shell, drivers, submissions, PDF export
- File uploads + notifications
