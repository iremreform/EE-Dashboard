# External Sources & Services

This document captures external systems needed for the production backend.

## Google Calendar

**Purpose:** Reservation source of truth.

**Client answer:** Reservations are kept on Google Calendar, and forms should auto-fill reservation details.

**Data needed by portal:**

- reservation number
- date(s)
- guest name
- guest phone number
- drop-off location
- pickup location
- vehicle details if available

**Implementation notes:**

- Confirm calendar account/owner, calendar IDs, permissions, event format, and whether service account access is acceptable.
- Decide whether to sync reservations into Postgres on a schedule or fetch on demand.
- Store normalized reservation records locally so delivery/pickup reports remain stable even if calendar events change later.

## Google Drive

**Purpose:** Secondary copy/export location for reports, photos, videos, and signatures.

**Client answer:** Files should also be saved to Google Drive.

**Implementation notes:**

- Confirm Drive folder structure and naming convention.
- Confirm whether PDFs, raw media, or both should be copied.
- Confirm whether copy happens immediately on submission, after admin review, or on archive.
- Use least-privilege OAuth/service account access and avoid public links unless explicitly requested.

## Supabase

**Purpose:** Active app backend for Postgres database, storage, and auth.

**Recommended use:**

- Postgres for drivers, admins, reservations, submissions, media metadata, alerts, audit events, and payment verification.
- Supabase Storage for original photos, walkaround videos, signatures, and generated PDFs.
- Initial schema and seed data were applied in the Supabase dashboard on June 27, 2026. The one-time SQL files were removed from the repo after successful execution.
- Admin dashboard/submissions/drivers reads are wired through server-side Supabase helpers.
- Driver creation creates both a `drivers` row and a Supabase Auth user.
- Driver login uses Supabase Auth and checks the linked active `drivers` row.
- Driver dashboard, delivery, pickup, and completion routes require an active driver session.
- Driver logout signs out through Supabase.
- Delivery report creation persists text/checklist/payment fields, creates a new-submission alert, updates driver last-active, and records an audit event. Media upload is still pending.
- Pickup report creation persists text/checklist fields, links to the same reservation, compares mileage/fuel against the latest delivery report where present, creates a new-submission alert, updates driver last-active, and records an audit event. Media upload is still pending.
- Driver reservation lookup/autofill reads from the Supabase `reservations` table. Google Calendar should sync or import into that table later.
- Admin login uses Supabase Auth and checks the linked active `admin_users` row.
- Admin dashboard, drivers, create-driver, submissions, and submission detail routes require an active admin session.
- Admin logout signs out through Supabase.
- Keep report and media files indefinitely; do not automatically delete them.
- Add storage usage monitoring and alert admins before storage is close to full.
- Row-level security and service-role access where appropriate.

**Auth status:** Supabase Auth is the active username/password direction. Driver/admin login, route protection, and logout are implemented.

## Square

**Purpose:** Payment verification context.

**Client answer:** Payments are handled through Square invoice links sent to customers by email/text.

**Portal behavior for now:**

- Show only `Payment verified: Yes / No`.
- Do not store card data or PCI-sensitive payment details.
- Do not integrate with the Square API in the first backend pass unless the client later asks for live invoice status.

## Vercel

**Purpose:** Expected hosting for the Next.js app unless the deployment target changes.

**Implementation notes:**

- Store production environment variables in Vercel project settings.
- Use Vercel preview deployments for client review.
- Confirm file upload limits and serverless runtime constraints before large video handling.

## Marker.io

**Purpose:** Client QA feedback/reporting on preview deployments.

**Implementation:**

- Loaded globally from `src/app/layout.tsx` using Next.js `<Script>`.
- Project ID: `6a20413903d28bc4520d2e1d`.
- Source: `snippet`.

**Notes:**

- Keep enabled for staging/client preview while frontend polish is active.
- Revisit before production launch if the portal contains real customer/reservation data.

## Notifications

**Purpose:** Admin notifications for every submission.

**Client answer:** Admins should receive notifications for all submissions.

**Provider options:**

- Email via Resend, SendGrid, or Supabase email integrations.
- Slack later if the client wants operational alerts in a channel.

**Implementation notes:**

- Notification settings card was removed from the UI; do not add configurable notification channels in v1 unless requested.
- Keep alert records in the database even if email/Slack delivery fails.
