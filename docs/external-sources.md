# External Sources & Services

This document captures external systems needed for the production backend.

## Google Calendar

**Purpose:** Reservation source of truth.

**Client answer:** Reservations are kept on Google Calendar, and forms should auto-fill reservation details.

**Data needed by portal:**

- reservation number
- date(s)
- guest name
- guest/contact number, pending clarification
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

**Purpose:** Recommended app backend for Postgres database, storage, and possibly auth.

**Recommended use:**

- Postgres for drivers, admins, reservations, submissions, media metadata, alerts, audit events, and payment references.
- Supabase Storage for original photos, walkaround videos, signatures, and generated PDFs.
- Row-level security and service-role access where appropriate.

**Open choice:** Supabase Auth can support username/password style login, but the final auth approach should be confirmed before implementation.

## Square

**Purpose:** Payment/invoice reference.

**Client answer:** Payments are handled through Square invoice links sent to customers by email/text.

**Open questions:**

- Should the portal display manual `Payment verified: Yes / No`, Square invoice status, invoice URL/reference, or all of these?
- Should the portal integrate with Square API or only store a manually entered Square invoice reference?
- Should unpaid/overdue payment trigger an alert?

## Vercel

**Purpose:** Expected hosting for the Next.js app unless the deployment target changes.

**Implementation notes:**

- Store production environment variables in Vercel project settings.
- Use Vercel preview deployments for client review.
- Confirm file upload limits and serverless runtime constraints before large video handling.

## Notifications

**Purpose:** Admin notifications for every submission.

**Client answer:** Admins should receive notifications for all submissions.

**Provider options:**

- Email via Resend, SendGrid, or Supabase email integrations.
- Slack later if the client wants operational alerts in a channel.

**Implementation notes:**

- Notification settings card was removed from the UI; do not add configurable notification channels in v1 unless requested.
- Keep alert records in the database even if email/Slack delivery fails.

