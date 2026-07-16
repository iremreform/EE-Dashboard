create extension if not exists pgcrypto;

do $$
begin
  create type public.ee_account_status as enum ('active', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_submission_type as enum ('delivery', 'pickup');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_submission_status as enum ('submitted', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_payment_status as enum ('verified', 'not_verified');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_media_kind as enum ('photo', 'video', 'license', 'signature', 'pdf');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_alert_status as enum ('open', 'resolved', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_alert_severity as enum ('info', 'warning', 'critical');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ee_actor_type as enum ('admin', 'driver', 'system');
exception
  when duplicate_object then null;
end $$;

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create or replace function public.ee_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.ee_set_updated_at() from public, anon, authenticated;
grant execute on function public.ee_set_updated_at() to service_role;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  status public.ee_account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  status public.ee_account_status not null default 'active',
  last_active_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_number text not null unique,
  guest_first_name text not null,
  guest_last_name text not null,
  guest_phone text,
  member_number text,
  start_at timestamptz,
  end_at timestamptz,
  dropoff_location text,
  pickup_location text,
  vehicle_make_model text,
  vehicle_color text,
  vehicle_plate text,
  vin_or_fleet_id text,
  calendar_event_id text,
  source text not null default 'google_calendar',
  raw_source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reservations_calendar_event_id_key
  on public.reservations (calendar_event_id)
  where calendar_event_id is not null;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  reservation_id uuid not null references public.reservations(id) on delete restrict,
  driver_id uuid references public.drivers(id) on delete set null,
  submission_type public.ee_submission_type not null,
  status public.ee_submission_status not null default 'submitted',
  linked_delivery_submission_id uuid references public.submissions(id) on delete set null,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  mileage numeric(10, 1),
  fuel_level_percent integer
    check (fuel_level_percent is null or fuel_level_percent between 0 and 100),
  pickup_match_needs_review boolean not null default false,
  location_changed boolean not null default false,
  has_new_damage boolean not null default false,
  has_smoking_evidence boolean not null default false,
  has_late_return boolean not null default false,
  has_missing_keys boolean not null default false,
  has_low_fuel boolean not null default false,
  payment_status public.ee_payment_status not null default 'not_verified',
  form_payload jsonb not null default '{}'::jsonb,
  checklist_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_reservation_id_idx
  on public.submissions (reservation_id);
create index if not exists submissions_driver_id_idx
  on public.submissions (driver_id);
create index if not exists submissions_type_status_idx
  on public.submissions (submission_type, status);
create index if not exists submissions_submitted_at_idx
  on public.submissions (submitted_at desc);

create table if not exists public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  is_verified boolean not null default false,
  verified_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  media_kind public.ee_media_kind not null,
  label text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  captured_live boolean not null default false,
  google_drive_file_id text,
  google_drive_url text,
  created_at timestamptz not null default now()
);

create index if not exists submission_media_submission_id_idx
  on public.submission_media (submission_id);
create unique index if not exists submission_media_storage_path_key
  on public.submission_media (storage_bucket, storage_path);

create table if not exists public.submission_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_admin_user_id uuid references public.admin_users(id) on delete set null,
  author_driver_id uuid references public.drivers(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint submission_notes_single_author check (
    (author_admin_user_id is not null and author_driver_id is null)
    or (author_admin_user_id is null and author_driver_id is not null)
  )
);

create index if not exists submission_notes_submission_id_idx
  on public.submission_notes (submission_id);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  alert_type text not null,
  severity public.ee_alert_severity not null default 'warning',
  status public.ee_alert_status not null default 'open',
  title text not null,
  message text,
  resolved_by_admin_user_id uuid references public.admin_users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alerts_status_created_at_idx
  on public.alerts (status, created_at desc);
create index if not exists alerts_submission_id_idx
  on public.alerts (submission_id);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_type public.ee_actor_type not null,
  actor_admin_user_id uuid references public.admin_users(id) on delete set null,
  actor_driver_id uuid references public.drivers(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_actor_shape check (
    (actor_type = 'admin' and actor_admin_user_id is not null and actor_driver_id is null)
    or (actor_type = 'driver' and actor_driver_id is not null and actor_admin_user_id is null)
    or (actor_type = 'system' and actor_admin_user_id is null and actor_driver_id is null)
  )
);

create index if not exists audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, created_at desc);
create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.ee_set_updated_at();

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at
before update on public.drivers
for each row execute function public.ee_set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.ee_set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.ee_set_updated_at();

drop trigger if exists payment_verifications_set_updated_at on public.payment_verifications;
create trigger payment_verifications_set_updated_at
before update on public.payment_verifications
for each row execute function public.ee_set_updated_at();

drop trigger if exists alerts_set_updated_at on public.alerts;
create trigger alerts_set_updated_at
before update on public.alerts
for each row execute function public.ee_set_updated_at();

alter table public.admin_users enable row level security;
alter table public.drivers enable row level security;
alter table public.reservations enable row level security;
alter table public.submissions enable row level security;
alter table public.payment_verifications enable row level security;
alter table public.submission_media enable row level security;
alter table public.submission_notes enable row level security;
alter table public.alerts enable row level security;
alter table public.audit_events enable row level security;

revoke all privileges on table
  public.admin_users,
  public.alerts,
  public.audit_events,
  public.drivers,
  public.payment_verifications,
  public.reservations,
  public.submission_media,
  public.submission_notes,
  public.submissions
from anon, authenticated;

grant all privileges on table
  public.admin_users,
  public.alerts,
  public.audit_events,
  public.drivers,
  public.payment_verifications,
  public.reservations,
  public.submission_media,
  public.submission_notes,
  public.submissions
to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'submission-media',
    'submission-media',
    false,
    524288000,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'application/pdf'
    ]
  ),
  (
    'submission-pdfs',
    'submission-pdfs',
    false,
    52428800,
    array['application/pdf']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
