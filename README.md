# Energetic Exotics Dashboard

Next.js portal for driver delivery/pickup workflows and internal admin review.

**Status:** Frontend routes are built for the planned v1 driver/admin flows, with branded styling and static sample data. There is still **no backend, database, file upload pipeline, or real auth**; login forms navigate through for preview/testing only.

## Project structure

```
├── docs/
│   ├── README.md             # Doc index — start here for agents
│   ├── design-system.md      # Brand tokens, components, Figma references
│   ├── component-inventory.md # Component map + implementation status
│   ├── ui-decisions.md       # Design/product decisions and client answers
│   ├── skills.md             # Agent operating guide for this project
│   ├── tasks.md              # Next implementation tasks and backend plan
│   └── external-sources.md   # External systems/services to connect
├── public/
│   ├── company-logo.svg      # Full logo asset
│   └── ee logo small.png     # Mobile compact logo mark
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
| `/driver/dashboard` | Driver workflow hub |
| `/driver/delivery` | Delivery check-in form |
| `/driver/pickup` | Pickup / return form |
| `/driver/complete` | Submission success screen |
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Admin hub with alerts and recent submissions |
| `/admin/drivers` | Manage driver accounts |
| `/admin/drivers/new` | Create driver form |
| `/admin/submissions` | Filterable submissions list |
| `/admin/submissions/[id]` | Submission detail / review |

Planned frontend routes from `docs/ui-decisions.md` (D8) are now represented in the app. Most actions are static until the backend is implemented.

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

- Confirm and implement backend stack: Next.js server routes/actions, Supabase Postgres + Storage, username/password auth, Google Calendar/Drive integrations.
- Build database schema for drivers, admin users, reservations, submissions, media, audit events, alerts, and payment references.
- Replace static sample data with reservation auto-fill from Google Calendar and persisted delivery/pickup submissions.
- Implement real media capture/upload, Google Drive copy/export, notifications for every submission, and PDF export.
- Add auth/session enforcement for driver vs admin routes.
