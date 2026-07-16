# External Sources & Services

Current as of July 2026. This document distinguishes active services from recommended or optional integrations.

## Google Sheets

**Status:** Planned reservation source; waiting for the client to create/share the Sheet or approve a prepared template.

The client confirmed there is no existing reservation spreadsheet, so the workflow starts from scratch. The portal should regularly synchronize the client-maintained Sheet into Supabase `reservations`; driver forms should continue reading normalized Supabase rows rather than relying directly on mutable Sheet data.

Expected data:

- reservation number
- reservation dates
- guest first/last name
- guest phone number (the client's requested "Number" field)
- drop-off and pickup locations
- vehicle make/model, color/plate, VIN or fleet ID
- payment verified status where available

Still to confirm:

- final columns and validation rules
- Sheet owner and sharing model
- service account versus OAuth access
- synchronization frequency
- correction, duplicate, cancellation, and deletion behavior

## Cloudflare R2

**Status:** Recommended production media storage; awaiting client approval and account/bucket setup.

The sample 4K walk-around video is approximately 701 MB for 50 seconds. Expected 1–2 minute files can be approximately 0.8–1.7 GB, so Supabase Free storage and the current 450 MB application video limit are not production-suitable.

Planned use:

- private bucket for original photos and walk-around videos
- direct multipart/resumable browser uploads for unreliable mobile connections
- short-lived signed read URLs for portal previews/downloads
- Supabase `submission_media` remains the metadata and ownership source
- indefinite retention plus storage-capacity alerts

Existing Supabase Storage test files may remain during migration, but the final adapter must be able to resolve both old Supabase paths and new R2 objects until staging data is removed or migrated.

## Google Drive

**Status:** Optional secondary archive; final client confirmation is still needed.

R2 does not prevent admins from viewing or downloading files in the portal. Use Google Drive only if the client wants a second operational/archive copy outside the portal. If approved, confirm folder structure, naming, permissions, file types, and whether copy occurs on submission, completion, or archive.

## Supabase

**Status:** Active, client-owned database and authentication backend; Supabase Storage is the current staging media implementation.

Active responsibilities:

- Postgres records for admins, drivers, reservations, submissions, media metadata, notes, alerts, audit events, and payment verification
- Supabase Auth sessions for drivers/admins
- active-account and role checks behind Next.js server routes/actions
- current private `submission-media` storage and signed upload/read URLs
- server-side admin operations through `SUPABASE_SECRET_KEY`

Implemented workflows include login/logout, required password change, driver management, report persistence, reservation lookup, media finalization, notes, alerts, audit history, admin edits, and PDF export.

The Next.js application boundary review is complete: privileged clients remain server-only, protected routes require an active role, pending media is scoped to its driver, and private API responses are not cached. Production hardening still requires a versioned schema/migration, a live Supabase RLS/grants and Storage-policy review, credential rotation, and final provider URL/domain configuration.

### Admin password recovery

- Drivers continue to contact an administrator for password resets.
- Admins request recovery from `/admin/forgot-password`.
- Reset emails link to `/admin/reset-password?token_hash=...&type=recovery`.
- The GET page only displays a Continue action so email security scanners cannot consume the token.
- Continue verifies the recovery OTP, confirms an active `admin_users` record, creates a 15-minute signed HTTP-only recovery proof bound to that auth user, and redirects to `/admin/change-password?recovery=1`.
- The change-password action trusts the signed recovery proof, not the `recovery=1` query or form value.
- The recovery response remains generic so it does not reveal whether an email address belongs to an admin.

Current Reset password template:

```html
<h2>Reset your password</h2>
<p>We received a request to reset your password.</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset password</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
```

Allowed staging recovery URLs:

- `https://ee-dashboard-three.vercel.app/admin/reset-password`
- `http://localhost:3000/admin/reset-password`

Replace the production URL when the final portal domain is connected.

## Resend

**Status:** Temporary staging SMTP is configured with `onboarding@resend.dev`; client-owned account/domain handoff is pending.

Current staging verifies the password-reset flow but the shared sender may wrap links with a tracking domain that content blockers intercept. The scanner-safe confirmation page prevents prefetch from consuming recovery tokens.

Production requirements:

- client-owned Resend account
- verified transactional subdomain such as `auth.energeticexotics.com`
- SPF, DKIM, and DMARC records
- sender such as `portal@auth.energeticexotics.com`
- click/open tracking disabled for auth emails
- new API key entered only in Supabase SMTP settings
- temporary/test/exposed keys revoked

Resend SMTP values:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Resend API key (never store in the repository)

## Square

**Status:** No API integration planned for v1.

Payments are handled through Square invoice links sent to customers by email/text. The portal stores only `Payment verified: Yes / No`; do not store card data, Square links, or PCI-sensitive fields.

## Vercel

**Status:** Active staging deployment at `https://ee-dashboard-three.vercel.app`; transfer to the client's Vercel account is planned before launch.

- Keep production secrets in Vercel project settings.
- Update Supabase Site URL/redirect allowlists after the final portal domain is connected.
- Use preview deployments for client QA without treating preview domains as permanent auth URLs.
- Large production media must upload directly to R2 rather than passing through Vercel server-action request bodies.

## Marker.io

**Status:** Loaded globally for staging/client QA from `src/app/layout.tsx`.

- Project ID: `6a20413903d28bc4520d2e1d`
- Source: `snippet`
- Network/content blockers may prevent the Marker.io widget even when its script loads.
- Decide whether to disable it before the portal contains live guest data.

## Notifications

**Status:** In-app admin notifications are implemented.

Every new submission creates an alert record. The admin bell supports unread count, opening the related submission, mark-unread, and delete. External email/Slack submission notifications and user-configurable notification settings are deferred unless the client requests them.
