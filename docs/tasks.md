# Tasks & Backend Plan

This task list reflects client answers received in `Driver Admin Portal Responses.docx` and the current frontend state.

## Confirm before backend implementation

- Google Calendar data shape: confirm which calendar(s), event title format, event description fields, and whether reservation numbers already exist in events.
- Google Drive organization: confirm folder structure, naming convention, permissions, and whether files should be copied immediately on submission or after admin review.

## Resolved backend assumptions

- Reservation "Number" means the guest phone number.
- Payment display is `Payment verified: Yes / No` only for now.
- Reports, photos, videos, and signatures should not be deleted automatically. Keep them indefinitely and alert admins when storage is close to full.

## Backend phase 1: foundation

- Choose and document the final backend stack. ✅ Supabase + Next.js server routes/actions is the current direction.
- Add environment variable documentation for Supabase, Google, Square, auth secrets, and app URLs. ✅ Supabase env vars are documented in `.env.example` and `README.md`.
- Create database schema/migrations for: ✅ Initial Supabase schema was applied in the dashboard on June 27, 2026.
  - admin users
  - drivers
  - reservations
  - submissions
  - submission media
  - submission notes
  - alerts
  - audit events
  - payment verification
- Add seed/sample data that matches current frontend examples. ✅ Seed data was applied in the dashboard on June 27, 2026.
- Add server-side data access helpers with a clear boundary between UI components and backend calls. ✅ Supabase helpers live in `src/lib/supabase/`.

## Backend phase 2: auth and access

- Implement username/password login for drivers and admins. ✅ Driver/admin login are wired to Supabase Auth and verify active `drivers` / `admin_users` rows.
- Separate driver and admin sessions/authorization. ✅ Driver/admin routes require active matching account rows.
- Support exactly the current admin operations:
  - admins can disable drivers immediately
  - admins can reset/change driver access later
  - only admins can edit submitted reports
- Keep `/driver/forgot-password` as password help unless the client changes the login approach.
- Add route protection for all dashboard/form/admin pages. ✅ Driver dashboard/delivery/pickup/complete and admin dashboard/drivers/create-driver/submissions/detail are protected.

## Backend phase 3: reservations and auto-fill

- Connect Google Calendar as the reservation source.
- Import or fetch reservations with:
  - reservation number
  - date(s)
  - guest name
  - guest phone number
  - drop-off location
  - pickup location
  - vehicle details if present in calendar data
- Build reservation search/lookup API for driver forms. ✅ First pass reads existing Supabase `reservations` rows.
- Auto-fill delivery and pickup fields from matched reservation data. ✅ First pass fills visible guest, reservation, vehicle, payment status, and pickup delivery-baseline fields from Supabase.
- If pickup cannot match a reservation/delivery report, flag the record as needs review.

## Backend phase 4: delivery and pickup submissions

- Persist delivery reports. ✅ First pass wired for text/checklist/payment/signature fields and selected media upload.
- Persist pickup/return reports. ✅ First pass wired for text/checklist/signature fields and selected media upload.
- Lock submitted driver reports except for driver notes. ✅ Completion screen supports immediate notes, and `/driver/reports/[id]` supports later follow-up notes on locked reports.
- Allow admins to edit submitted reports. ✅ Submission detail supports admin edits for status, guest/reservation/vehicle fields, mileage/fuel, payment status, and notes.
- Link every pickup report to the earlier delivery report for the same reservation. ✅ Stored in the pickup checklist payload when a delivery match exists.
- Compare pickup mileage and fuel against delivery mileage and fuel. ✅ First-pass comparison creates review alerts.
- Trigger alerts for new damage, smoking/vaping evidence, late return, missing keys, low fuel, different pickup/drop-off location, and unmatched pickup. ✅ First pass covers damage, smoking/vaping, late return, missing keys, low fuel, and missing delivery match; pickup/drop-off location comparison is pending reservation auto-fill.
- Implement statuses: `Submitted`, `Completed`, `Archived`. ✅ Admin submission detail can update these statuses.

## Backend phase 5: media and documents

- Implement live photo/video capture where browser support allows it.
- Keep gallery upload as fallback.
- Store files in Supabase Storage with database metadata. ✅ First pass uses signed browser uploads and finalizes metadata during delivery/pickup submit.
- Move captured signatures from form payload into Supabase Storage metadata flow.
- Copy submitted report media to Google Drive.
- Add admin media preview links from private Storage paths. ✅ Submission detail renders signed private Storage previews for uploaded photos/videos.
- Add explicit admin media download controls.
- Prepare PDF export from submission detail.
- Keep report/media files indefinitely.
- Add storage capacity alerts before storage becomes full.

## Backend phase 6: notifications and audit

- Notify admins for every submission.
- Record audit events with date/time stamps for:
  - submission created
  - driver note added
  - admin viewed report
  - admin edited report
  - status changed
  - PDF exported
  - report archived
- Add admin-visible history/audit trail on submission detail.

## Frontend follow-up tasks

- Replace static data in `src/content/portal.ts` with server data where appropriate. ✅ Admin dashboard recent submissions, admin submissions list, submission detail, alert summary, and drivers list now read from Supabase.
- Add loading, empty, error, and success states for all dynamic pages.
- Add real form validation and required checklist enforcement.
- Add media previews/progress states. ✅ Admin submission detail previews finalized media; driver upload progress polish is still pending.
- Add admin edit flows for submitted reports. ✅ First pass lives on submission detail.
- Add disabled-driver states and confirmation flows. Create-driver is wired to Supabase database + Auth, but reset/disable/re-enable actions are still pending.
- Add PDF export button behavior.
