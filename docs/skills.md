# Agent Skills & Working Notes

This project is a branded Next.js portal for Energetic Exotics internal operations. Use this guide as a quick handoff before adding backend or new frontend behavior.

## Core skills needed

- **Next.js App Router:** pages live in `src/app`; use server components/actions for Supabase-backed admin and auth workflows.
- **React + TypeScript:** keep components typed, small, and aligned with existing patterns.
- **CSS modules + design tokens:** use `src/styles/tokens.css`; do not add Tailwind or one-off visual systems.
- **Supabase/Postgres modeling:** active backend for drivers, submissions, reservations, media metadata, audit events, and admin users.
- **Auth and sessions:** username/password is the current client answer; driver login uses Supabase Auth, while admin login and route protection are still pending.
- **File/media workflows:** delivery/pickup reports need live photo/video capture, gallery fallback, storage, metadata, and Google Drive copies.
- **External integrations:** Google Calendar reservations, Google Drive file copies, Square payment verification context, Vercel deployment, Marker.io feedback.

## Project rules for agents

- Read `README.md`, this docs index, `design-system.md`, `ui-decisions.md`, `component-inventory.md`, `tasks.md`, and `external-sources.md` before implementing.
- Treat `reference/` as layout/user-flow reference only. Do not serve it from the app and do not copy its grayscale styling.
- Keep user-facing copy in `src/content/portal.ts`.
- Reuse components in `src/components/ui`, `src/components/layout`, `src/components/driver`, and `src/components/admin`.
- Use existing button, card, tag, checkbox, radio, and page intro styles before creating new UI primitives.
- Preserve the dark luxury brand: leather accents, dark surfaces, Editor's Note subheadings at light weight, and PP Monument-style uppercase headings.
- Keep server-only Supabase operations behind `SUPABASE_SECRET_KEY`; do not expose the secret key in client components.

## Current frontend state

All planned v1 routes are present:

- `/`
- `/driver/login`
- `/driver/forgot-password`
- `/driver/dashboard`
- `/driver/delivery`
- `/driver/pickup`
- `/driver/complete`
- `/admin/login`
- `/admin/dashboard`
- `/admin/drivers`
- `/admin/drivers/new`
- `/admin/submissions`
- `/admin/submissions/[id]`

Current backend wiring:

- `/admin/dashboard`, `/admin/submissions`, `/admin/submissions/[id]`, and `/admin/drivers` read from Supabase.
- `/admin/drivers/new` creates a driver row plus a Supabase Auth user.
- `/driver/login` signs in with Supabase Auth and checks for an active driver row.

Still pending: admin login, route protection, driver form submission, uploads, notifications, PDF export, admin edit actions, and reset/disable/re-enable actions.
