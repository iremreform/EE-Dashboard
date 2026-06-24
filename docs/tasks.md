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

- Choose and document the final backend stack.
- Add environment variable documentation for Supabase, Google, Square, auth secrets, and app URLs.
- Create database schema/migrations for:
  - admin users
  - drivers
  - reservations
  - submissions
  - submission media
  - submission notes
  - alerts
  - audit events
  - payment verification
- Add seed/sample data that matches current frontend examples.
- Add server-side data access helpers with a clear boundary between UI components and backend calls.

## Backend phase 2: auth and access

- Implement username/password login for drivers and admins.
- Separate driver and admin sessions/authorization.
- Support exactly the current admin operations:
  - admins can disable drivers immediately
  - admins can reset/change driver access later
  - only admins can edit submitted reports
- Keep `/driver/forgot-password` as password help unless the client changes the login approach.
- Add route protection for all dashboard/form/admin pages.

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
- Build reservation search/lookup API for driver forms.
- Auto-fill delivery and pickup fields from matched reservation data.
- If pickup cannot match a reservation/delivery report, flag the record as needs review.

## Backend phase 4: delivery and pickup submissions

- Persist delivery reports.
- Persist pickup/return reports.
- Lock submitted driver reports except for driver notes.
- Allow admins to edit submitted reports.
- Link every pickup report to the earlier delivery report for the same reservation.
- Compare pickup mileage and fuel against delivery mileage and fuel.
- Trigger alerts for new damage, smoking/vaping evidence, late return, missing keys, low fuel, different pickup/drop-off location, and unmatched pickup.
- Implement statuses: `Submitted`, `Completed`, `Archived`.

## Backend phase 5: media and documents

- Implement live photo/video capture where browser support allows it.
- Keep gallery upload as fallback.
- Store files in Supabase Storage with database metadata.
- Copy submitted report media to Google Drive.
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

- Replace static data in `src/content/portal.ts` with server data where appropriate.
- Add loading, empty, error, and success states for all dynamic pages.
- Add real form validation and required checklist enforcement.
- Add media previews/progress states.
- Add admin edit flows for submitted reports.
- Add disabled-driver states and confirmation flows.
- Add PDF export button behavior.
