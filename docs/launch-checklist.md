# Production Launch Checklist

Use this as the final handoff checklist before the Energetic Exotics portal handles live reservations, reports, and media. Keep credentials out of this file, Git, Slack, and support messages.

## Client-owned accounts and access

- [ ] Client creates or takes ownership of the production Resend account.
- [ ] Client creates or takes ownership of the production Cloudflare account and R2 bucket.
- [ ] Transfer the Vercel project to the client's account and confirm owner/billing access.
- [ ] Client provides the production Google Sheet and grants the agreed integration access.
- [ ] Required developers are invited with the minimum permissions needed for setup and support.
- [ ] Recovery methods and billing contacts are configured for every external account.

## Domains and DNS

- [ ] Choose the final portal domain, such as `app.energeticexotics.com`.
- [ ] Connect the portal domain to Vercel and verify HTTPS.
- [ ] Choose a transactional email subdomain, such as `auth.energeticexotics.com`.
- [ ] Add Resend's SPF and DKIM records to the client's DNS.
- [ ] Add a DMARC record appropriate for the client's existing email setup.
- [ ] Verify the sending domain in Resend.
- [ ] Use a production sender such as `portal@auth.energeticexotics.com` instead of `onboarding@resend.dev`.
- [ ] Disable click tracking and open tracking for authentication emails.

## Supabase authentication

- [ ] Connect the client-owned Resend account under **Authentication → Emails → SMTP Settings**.
- [ ] Store the Resend API key only in Supabase SMTP settings; never in application code.
- [ ] Update the Supabase Site URL to the final production portal domain.
- [ ] Add the production reset URL: `https://<portal-domain>/admin/reset-password`.
- [ ] Keep `http://localhost:3000/admin/reset-password` only if local recovery testing is still needed.
- [ ] Replace the Reset password template with the token-hash template documented in `external-sources.md`.
- [ ] Set an appropriate password-reset expiry and email rate limit.
- [ ] Test admin recovery from request through successful sign-in.
- [ ] Confirm disabled admins cannot complete recovery.
- [ ] Confirm drivers still use the administrator-managed password-reset process.
- [ ] Revoke temporary, test, and previously exposed Resend API keys.

## Media storage

- [ ] Confirm Cloudflare R2 as the production media provider.
- [ ] Create a private production R2 bucket in the appropriate region/jurisdiction.
- [ ] Create least-privilege R2 credentials for the portal.
- [ ] Add R2 credentials to Vercel production environment variables.
- [ ] Implement direct multipart/resumable uploads for large mobile videos.
- [ ] Raise the current video limit to support the client's 1–2 minute 4K walk-around videos.
- [ ] Keep media metadata in Supabase and use short-lived signed URLs for viewing/downloading.
- [ ] Decide whether existing Supabase Storage test media should be migrated or deleted.
- [ ] Add storage usage monitoring and an admin capacity alert.
- [ ] Confirm whether Google Drive receives an archive copy or is not required.

## Reservations and Google Sheet

- [ ] Agree on the final Google Sheet columns and validation rules.
- [ ] Confirm who owns and maintains the Sheet.
- [ ] Grant the portal read access using the agreed Google integration account.
- [ ] Implement scheduled or on-demand synchronization into Supabase reservations.
- [ ] Define how corrections, duplicates, cancellations, and deleted rows are handled.
- [ ] Test delivery and pickup lookup against representative live-format records.

## Data and security

- [ ] Preserve a versioned production database schema/migration in the repository.
- [ ] Review Supabase RLS, service-key boundaries, and storage access policies.
- [ ] Rotate any credentials that were shared during development.
- [ ] Confirm production secrets exist only in approved provider settings and local ignored files.
- [ ] Remove or clearly identify all demo/test users, reservations, reports, and media.
- [ ] Confirm reports and media are retained indefinitely and are never automatically deleted.
- [ ] Confirm audit events cover submission, view, edit, status, note, export, and archive actions.
- [ ] Decide whether Marker.io remains enabled once real guest data is present.

## Final verification

- [ ] Run lint and a clean production build.
- [ ] Test driver and admin permissions with separate real test accounts.
- [ ] Test create, disable, re-enable, and reset-driver workflows.
- [ ] Test delivery and pickup from current iPhone/iPad and Android devices where applicable.
- [ ] Test live camera capture, gallery fallback, 4K video upload, removal, retry, and interrupted upload recovery.
- [ ] Test reservation matching, incorrect reservation clearing, and unmatched pickup alerts.
- [ ] Test signatures, admin editing, statuses, notifications, audit history, and PDF export.
- [ ] Test password recovery from a different browser/device and with common content blockers enabled.
- [ ] Check responsive layouts on desktop, tablet, mobile landscape, and mobile portrait.
- [ ] Verify accessibility basics: labels, focus states, keyboard navigation, contrast, and touch targets.
- [ ] Complete a final client acceptance pass using non-sensitive test data.

## Launch and handoff

- [ ] Deploy the approved production commit to Vercel.
- [ ] Verify all production environment variables after deployment.
- [ ] Confirm the final domain, SSL, Supabase redirects, SMTP, R2, and Google Sheet sync in production.
- [ ] Give the client a short admin guide covering drivers, submissions, reservations, alerts, PDFs, and password recovery.
- [ ] Document support ownership and the process for access, billing, storage, and incident issues.
- [ ] Record the launch date and responsible contacts without storing credentials.
