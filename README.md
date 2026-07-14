# Energetic Exotics Dashboard

Next.js portal for driver delivery/pickup workflows and internal admin review.

**Status (July 2026):** The planned v1 driver and admin workflows are built and backed by Supabase. Authentication, protected routes, driver management, delivery/pickup submissions, reservation lookup, signatures, media upload/preview, driver notes, admin editing, filters, alerts, audit history, and PDF export are active. Admin self-service password recovery works in staging through Resend SMTP. The main remaining production integrations are Google Sheet reservation synchronization and moving large photo/video uploads from the temporary Supabase Storage implementation to Cloudflare R2 after client approval.

## Project structure

```
├── docs/
│   ├── README.md             # Doc index — start here for agents
│   ├── design-system.md      # Brand tokens, components, Figma references
│   ├── component-inventory.md # Component map + implementation status
│   ├── ui-decisions.md       # Design/product decisions and client answers
│   ├── skills.md             # Agent operating guide for this project
│   ├── tasks.md              # Next implementation tasks and backend plan
│   ├── external-sources.md   # External systems/services to connect
│   └── launch-checklist.md   # Production account, domain, QA, and handoff checklist
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
- Private storage buckets exist for `submission-media` and `submission-pdfs`; `submission-media` is the current staging implementation while Cloudflare R2 is the recommended production media store.
- Admin dashboard recent submissions, admin submissions list/detail, alert summary, and drivers list read from Supabase.
- `/admin/drivers/new` inserts into `drivers`, creates a Supabase Auth user, and links `drivers.auth_user_id`.
- `/driver/login` signs in with Supabase Auth and verifies a matching active `drivers` row.
- Driver dashboard, delivery, pickup, and completion routes require an active driver session.
- Driver dashboard logout signs out through Supabase.
- `/admin/login` signs in with Supabase Auth and verifies a matching active `admin_users` row.
- `/admin/forgot-password` lets admins request a self-service Supabase password recovery email; `/admin/reset-password` safely verifies the one-time recovery token after user confirmation and sends active admins to the existing change-password screen.
- Driver create/reset/disable/re-enable actions, confirmation modals, search, and loading states are wired.
- Admin reservations list/detail, submission filters, in-app alerts, notification read/unread/delete actions, and audit-history views read from Supabase.
- Admin dashboard, drivers, create-driver, submissions, and submission detail routes require an active admin session.
- Admin sidebar logout signs out through Supabase.
- `/driver/delivery` persists the delivery report payload, payment verified status, new-submission alert, driver last-active timestamp, and audit event.
- `/driver/pickup` persists the pickup report payload, links to the same reservation, stores checklist state, compares mileage/fuel to the latest delivery report where present, creates an alert, updates driver last-active, and records an audit event.
- Delivery/pickup selected photos and videos upload directly from the browser to private Supabase Storage bucket `submission-media` via signed upload URLs; report submission finalizes `submission_media` metadata rows.
- `/admin/submissions/[id]` lets active admins edit lifecycle status, reservation/guest/vehicle details, mileage/fuel, payment verified status, and admin notes.
- `/admin/submissions/[id]/pdf` generates a branded PDF with report fields, uploaded photos, and the guest signature.
- `/driver/complete?report=...` lets the submitting active driver append notes immediately after submit; `/driver/reports` and `/driver/reports/[id]` let active drivers revisit their own locked reports and append follow-up notes.
- `/api/driver/reservations` lets active drivers look up Supabase reservations for delivery/pickup auto-fill.
- Broad client-side RLS policies are intentionally not used; application data access stays behind protected Next.js server routes/actions using `SUPABASE_SECRET_KEY`. Review RLS, service-key boundaries, and storage policies again before production launch.

## Routes (implemented)

| Route | Description |
|-------|-------------|
| `/` | Portal selector (Driver / Admin choice cards) |
| `/driver/login` | Driver sign-in |
| `/driver/forgot-password` | Password help (no email reset form) |
| `/driver/change-password` | Required/voluntary driver password change |
| `/driver/dashboard` | Driver workflow hub |
| `/driver/delivery` | Delivery check-in form |
| `/driver/pickup` | Pickup / return form |
| `/driver/complete` | Submission success screen |
| `/driver/reports` | Driver submitted reports list |
| `/driver/reports/[id]` | Locked driver report detail + notes |
| `/admin/login` | Admin sign-in |
| `/admin/forgot-password` | Admin self-service password recovery request |
| `/admin/reset-password` | Admin recovery-link verification |
| `/admin/change-password` | Required/voluntary/recovery admin password change |
| `/admin/dashboard` | Admin hub with alerts and recent submissions |
| `/admin/drivers` | Manage driver accounts |
| `/admin/drivers/new` | Create driver form |
| `/admin/reservations` | Searchable/filterable reservations list |
| `/admin/reservations/[id]` | Reservation detail and linked submissions |
| `/admin/submissions` | Filterable submissions list |
| `/admin/submissions/[id]` | Submission detail / review |
| `/admin/submissions/[id]/pdf` | Branded submission PDF export |

Planned frontend routes from `docs/ui-decisions.md` (D8) plus the later reports, reservations, password, and recovery routes are represented in the app. Dynamic list/detail/action workflows read from or write to Supabase; remaining static copy in `src/content/portal.ts` is component/page copy rather than operational data.

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

- Agree the Google Sheet columns/access model and synchronize it into the existing Supabase reservation lookup flow.
- After client approval, create a private Cloudflare R2 bucket and replace the current Supabase Storage upload/read layer with production-grade multipart uploads for 1–2 minute 4K videos.
- Complete the production Resend/domain handoff, Vercel account transfer, security review, device QA, and remaining items in `docs/launch-checklist.md`.
