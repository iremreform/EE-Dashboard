# Supabase migrations

`migrations/20260716090000_portal_baseline.sql` is the seed-free baseline for the portal's current database shape and verified security posture.

The baseline includes:

- application enums, tables, constraints, indexes, and timestamp triggers
- default-deny RLS on every application table
- server-only table/function grants for `service_role`
- hardened default privileges for future objects created by `postgres`
- private `submission-media` and `submission-pdfs` bucket configuration

It intentionally excludes Auth users, admin/driver accounts, reservations, submissions, media objects, and all other demo or production data. Auth users must be created through the Supabase dashboard or the portal's admin workflow and then linked through `auth_user_id`.

The current hosted project predates this migration file and was configured manually. Do not blindly run the baseline against production. For a new environment, apply it to an empty Supabase project. Before adopting Supabase CLI migration deployment for the existing project, reconcile or mark the baseline as already applied.
