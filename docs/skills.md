# Agent Skills & Working Notes

This project is a branded Next.js portal for Energetic Exotics internal operations. Use this guide as a quick handoff before adding backend or new frontend behavior.

## Core skills needed

- **Next.js App Router:** pages live in `src/app`; prefer server-side data loading where practical once the backend exists.
- **React + TypeScript:** keep components typed, small, and aligned with existing patterns.
- **CSS modules + design tokens:** use `src/styles/tokens.css`; do not add Tailwind or one-off visual systems.
- **Supabase/Postgres modeling:** expected backend direction for drivers, submissions, reservations, media metadata, audit events, and admin users.
- **Auth and sessions:** username/password is the current client answer; Google OAuth was discussed but is not the current chosen login method.
- **File/media workflows:** delivery/pickup reports need live photo/video capture, gallery fallback, storage, metadata, and Google Drive copies.
- **External integrations:** Google Calendar reservations, Google Drive file copies, Square invoice/payment references, Vercel deployment.

## Project rules for agents

- Read `README.md`, this docs index, `design-system.md`, `ui-decisions.md`, `component-inventory.md`, `tasks.md`, and `external-sources.md` before implementing.
- Treat `reference/` as layout/user-flow reference only. Do not serve it from the app and do not copy its grayscale styling.
- Keep user-facing copy in `src/content/portal.ts`.
- Reuse components in `src/components/ui`, `src/components/layout`, `src/components/driver`, and `src/components/admin`.
- Use existing button, card, tag, checkbox, radio, and page intro styles before creating new UI primitives.
- Preserve the dark luxury brand: leather accents, dark surfaces, Editor's Note subheadings at light weight, and PP Monument-style uppercase headings.
- Do not implement real backend/auth without confirming environment credentials and final provider choices.

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

The UI is still using static/sample content. Form submission, auth, upload, notification, export, and admin edit actions are not wired to real services yet.

