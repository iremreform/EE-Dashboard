# Energetic Exotics Dashboard

Next.js portal for driver delivery/pickup workflows and internal admin review.

**Status:** Frontend routes are built for the planned v1 driver/admin flows, and the first Supabase backend wiring is active. Admin dashboard/submissions/drivers read from Supabase, `/admin/drivers/new` creates driver records plus Supabase Auth users, and `/driver/login` uses real Supabase Auth. Admin login, route protection, driver form persistence, media uploads, PDF export, notifications, and external integrations are still pending.

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

## Environment

Copy `.env.example` to `.env.local` and fill in the Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is server-only. Do not expose it in client components or commit it.

## Backend setup

Supabase is configured for the current staging project. The initial schema and seed data were applied in the Supabase dashboard on June 27, 2026, then the one-time SQL files were removed from the repo.

Current backend state:

- App tables exist for drivers, admin users, reservations, submissions, media, notes, alerts, audit events, and payment verification.
- Private storage buckets exist for `submission-media` and `submission-pdfs`.
- Admin dashboard recent submissions, admin submissions list/detail, alert summary, and drivers list read from Supabase.
- `/admin/drivers/new` inserts into `drivers`, creates a Supabase Auth user, and links `drivers.auth_user_id`.
- `/driver/login` signs in with Supabase Auth and verifies a matching active `drivers` row.
- Broad client-side RLS policies are intentionally not added yet; server-side code should use `SUPABASE_SECRET_KEY` until route protection and driver/admin auth policies are implemented.

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

Planned frontend routes from `docs/ui-decisions.md` (D8) are now represented in the app. Some admin routes are backed by Supabase; driver forms and many action buttons are still static until the next backend phases are implemented.

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

- Continue backend stack: Next.js server routes/actions, Supabase Postgres + Storage, username/password auth, Google Calendar/Drive integrations.
- Wire admin login and route protection for driver/admin areas.
- Replace remaining static sample data with reservation auto-fill from Google Calendar and persisted delivery/pickup submissions.
- Implement real media capture/upload, Google Drive copy/export, notifications for every submission, and PDF export.
