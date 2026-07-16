# Tasks & Backend Plan

Current as of July 2026. This task list reflects the implemented application, the latest client answers, and the production decisions still waiting on external setup.

## Completed application foundation

- [x] Next.js App Router frontend using TypeScript, CSS modules, and shared design tokens.
- [x] Supabase Postgres schema for admins, drivers, reservations, submissions, media metadata, notes, alerts, audit events, and payment verification.
- [x] Separate active-account authorization for driver and admin routes.
- [x] Driver/admin email-and-password login, logout, required first-password change, and voluntary password change.
- [x] Admin self-service password recovery request, token-hash confirmation, recovery-mode password update, and expired-link handling.
- [x] Admin driver create, search, temporary-password reset, disable, re-enable, confirmation modal, and loading states.
- [x] Delivery and pickup forms with required validation, reservation lookup/autofill, signatures, media selection, upload progress, and submission loading states.
- [x] Delivery/pickup persistence, statuses (`Submitted`, `Completed`, `Archived`), payment verified state, driver ownership, and timestamps.
- [x] Pickup-to-delivery matching plus first-pass mileage/fuel and condition alerts.
- [x] Driver reports list/detail with locked report fields and append-only driver notes.
- [x] Admin dashboard, reservations list/detail, submissions list/detail, search/filters, report editing, status changes, and internal notes.
- [x] In-app admin notification menu with read, unread, delete, badge, overflow menu, and scroll behavior.
- [x] Admin-visible driver/submission audit history.
- [x] Private media previews, image click-to-zoom, video playback, signature rendering, and branded PDF export with photos/signature.
- [x] Marker.io staging integration.

## Active production work

### Reservation synchronization

- [ ] Receive or prepare the client-owned Google Sheet.
- [ ] Agree final columns, validation, ownership, and sharing permissions.
- [ ] Include at minimum: reservation number, dates, guest name, guest phone number, locations, vehicle details, and payment verified status where available.
- [ ] Choose scheduled synchronization versus on-demand refresh.
- [ ] Normalize Sheet rows into Supabase `reservations` so submitted reports remain stable if the Sheet changes later.
- [ ] Define duplicate, correction, cancellation, and deleted-row behavior.
- [ ] Test driver lookup/autofill against representative live-format data.

### Production media storage

- [ ] Obtain client approval for Cloudflare R2.
- [ ] Create a private client-owned R2 bucket and least-privilege credentials.
- [ ] Replace the current Supabase Storage media adapter with R2 signed reads and direct multipart/resumable uploads.
- [ ] Raise the current 450 MB video limit to support the client's approximately 0.8–1.7 GB 4K walk-around videos.
- [ ] Keep `submission_media` metadata in Supabase.
- [ ] Add explicit admin media download controls against signed R2 URLs if the client requires downloads beyond browser preview/playback.
- [ ] Decide whether existing staging media should be migrated or removed.
- [ ] Add storage-capacity monitoring and an admin alert; retain reports/media indefinitely.
- [ ] Confirm whether Google Drive is still required as a secondary archive. It is not required for portal viewing when R2 is used.

### Production authentication email

- [x] Configure temporary Resend SMTP in staging using `onboarding@resend.dev`.
- [x] Configure the token-hash Reset password template and scanner-safe Continue step.
- [ ] Client creates/takes ownership of the production Resend account.
- [ ] Verify a client-owned sending subdomain such as `auth.energeticexotics.com` with SPF, DKIM, and DMARC.
- [ ] Replace the temporary sender/API key in Supabase SMTP settings.
- [ ] Disable click/open tracking for authentication emails.
- [ ] Update Supabase Site URL and recovery redirect allowlist to the final portal domain.
- [ ] Revoke temporary/test/exposed API keys and test recovery from another browser/device.

## Launch hardening

- [ ] Preserve a versioned production schema/migration in the repository; keep demo seed data separate and non-production.
- [x] Audit Next.js authorization and service-key boundaries; protected data stays behind active-role checks and server-only Supabase admin clients.
- [x] Harden staging media routes with same-origin mutation checks, per-driver pending-path ownership, MIME/size allowlists, stored-object metadata verification, bounded descriptors, and private no-store responses.
- [x] Bind admin recovery mode to a short-lived signed HTTP-only proof rather than a client-controlled form/query value.
- [x] Update Next.js to `16.2.10`, override PostCSS to the fixed `8.5.19`, and verify `npm audit --omit=dev` reports zero vulnerabilities.
- [ ] Review the live Supabase RLS/database grants and Storage bucket policies in the Supabase dashboard; confirm the current one-hour staging signed-read expiry or shorten it after real 4K playback testing.
- [ ] Complete audit coverage for admin report views and explicit archive events; PDF exports, submission creation, notes, report edits/status changes, and driver account actions are recorded.
- [ ] Add focused automated coverage for authorization, form persistence, reservation matching, driver ownership, and status/audit behavior.
- [ ] Test 4K uploads, retries, interrupted connections, and mobile camera/gallery behavior on real phones and iPads.
- [ ] Complete desktop/tablet/mobile visual and accessibility QA.
- [ ] Remove or identify demo data and rotate development credentials.
- [ ] Decide whether Marker.io remains enabled when the portal contains live guest data.
- [ ] Transfer the Vercel project to the client's account and complete `launch-checklist.md`.

## Deferred unless requested

- Google OAuth or SSO; username/password remains the current direction.
- Square API integration; the portal currently stores only `Payment verified: Yes / No` and no PCI-sensitive data.
- External email/Slack submission notifications; v1 notifications are stored and managed in the in-app alert menu.
- Google Drive archive copy, pending a final client decision.
- Light theme and admin analytics/metric cards.
- Automatic deletion of reports or media; retention is indefinite.
