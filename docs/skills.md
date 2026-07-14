# Agent Skills & Working Notes

Current as of July 2026. This is a branded Next.js operations portal with an active Supabase backend, not a frontend prototype.

## Core implementation knowledge

- **Next.js App Router:** server components/actions and route handlers live under `src/app`.
- **React + TypeScript:** keep components typed and follow existing client/server boundaries.
- **CSS modules + tokens:** use `src/styles/tokens.css`; do not introduce Tailwind or a second design system.
- **Supabase/Postgres:** active database/auth backend for admins, drivers, reservations, submissions, media metadata, notes, alerts, audit events, and payment verification.
- **Authentication:** separate driver/admin authorization over Supabase Auth; drivers use admin-managed recovery, while admins have self-service Resend-backed recovery.
- **Media:** current staging uploads go directly to private Supabase Storage. Planned production media is private Cloudflare R2 with multipart/resumable upload and signed reads.
- **Reservations:** current lookup reads Supabase `reservations`; planned source is a client-maintained Google Sheet synchronized into Supabase.
- **Documents:** branded server-generated PDF includes report data, photos, and guest signature.

## Project rules

- Read `README.md`, `docs/README.md`, `design-system.md`, `ui-decisions.md`, `component-inventory.md`, `tasks.md`, `external-sources.md`, and `launch-checklist.md` before substantial work.
- Treat `reference/` as layout/user-flow reference only. Never serve it or copy its grayscale styles.
- Keep user-facing copy in `src/content/portal.ts` where practical.
- Reuse components from `src/components/ui`, `src/components/layout`, `src/components/auth`, `src/components/driver`, and `src/components/admin`.
- Preserve the dark luxury brand: leather accents, dark surfaces, Editor's Note subheadings at light weight, and PP Monument-style uppercase headings.
- Use existing button, tag, checkbox, radio, modal, list-row, and page-intro patterns before adding new primitives.
- Keep `SUPABASE_SECRET_KEY` and all provider secrets server-only. Never commit, display, or place them in client components.
- Do not assume a service integration is approved merely because an adapter is planned; check `tasks.md` and `launch-checklist.md`.
- Do not automatically delete reports, media, or signatures.

## Implemented routes

### Public/auth

- `/`
- `/driver/login`
- `/driver/forgot-password`
- `/driver/change-password`
- `/admin/login`
- `/admin/forgot-password`
- `/admin/reset-password`
- `/admin/change-password`

### Driver

- `/driver/dashboard`
- `/driver/delivery`
- `/driver/pickup`
- `/driver/complete`
- `/driver/reports`
- `/driver/reports/[id]`

### Admin

- `/admin/dashboard`
- `/admin/drivers`
- `/admin/drivers/new`
- `/admin/reservations`
- `/admin/reservations/[id]`
- `/admin/submissions`
- `/admin/submissions/[id]`
- `/admin/submissions/[id]/pdf`

## Current behavior

- Driver/admin login, logout, protected routes, required password change, and account-status checks are real.
- Admin password recovery sends through temporary Resend SMTP in staging and uses a token-hash confirmation screen before password update.
- Driver creation links an application driver row to a Supabase Auth user; search, reset, disable, re-enable, confirmations, and loading states are wired.
- Delivery/pickup forms validate required fields, preserve form state, look up reservations, capture signatures, upload selected media, and persist reports.
- Pickup reports link to matching delivery/reservation records where available and create review alerts for condition differences.
- Drivers can view only their own reports; submitted fields are locked and only follow-up notes can be appended.
- Admins can search/filter reservations and submissions, view media/signatures, edit report data/status, add notes, inspect audit history, and export PDFs.
- The alert menu supports unread counts, opening a submission, mark-unread, delete, and optimistic interaction states.

## Remaining integration boundaries

- **Google Sheet:** synchronize client reservation rows into Supabase; do not make live reports depend directly on mutable Sheet rows.
- **Cloudflare R2:** replace the media storage adapter without changing `submission_media` ownership/metadata semantics.
- **Resend production handoff:** replace the shared test sender with a client-owned verified domain and rotate credentials.
- **Google Drive:** optional archive only; awaiting client confirmation.
- **Square:** no API integration in v1; payment verified remains a boolean.

See `tasks.md` for active engineering work and `launch-checklist.md` for account/domain/QA handoff work.
