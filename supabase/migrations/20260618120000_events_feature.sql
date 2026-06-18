create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'event_payment_status'
  ) then
    create type public.event_payment_status as enum ('pending', 'paid');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'event_registration_source'
  ) then
    create type public.event_registration_source as enum ('public_form', 'manual_admin');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'event_collaborator_role'
  ) then
    create type public.event_collaborator_role as enum ('event_viewer', 'event_manager');
  end if;
end
$$;

create table if not exists public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  event_date date not null,
  event_time time not null,
  location text not null,
  price numeric(10, 2) not null default 0,
  registration_deadline date not null,
  teachers text,
  poster_url text,
  organizer_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  email text,
  phone text not null,
  comments text,
  payment_status public.event_payment_status not null default 'pending',
  registered_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  source public.event_registration_source not null default 'public_form'
);

create table if not exists public.event_notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  registration_id uuid references public.event_registrations(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_collaborators (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.event_collaborator_role not null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);
create index if not exists event_registrations_payment_status_idx on public.event_registrations (payment_status);
create index if not exists event_notifications_event_id_idx on public.event_notifications (event_id);
create index if not exists event_collaborators_user_id_idx on public.event_collaborators (user_id);

create or replace function public.is_event_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('owner', 'admin'), false);
$$;

create or replace function public.has_event_role(target_event_id uuid, allowed_roles public.event_collaborator_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_collaborators collaborator
    where collaborator.event_id = target_event_id
      and collaborator.user_id = auth.uid()
      and collaborator.role = any(allowed_roles)
  );
$$;

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.event_notifications enable row level security;
alter table public.event_collaborators enable row level security;

drop policy if exists "Public can view active events" on public.events;
create policy "Public can view active events"
on public.events
for select
to anon, authenticated
using (
  is_active = true
  or public.is_event_admin()
  or public.has_event_role(id, array['event_viewer', 'event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Only admins manage events" on public.events;
create policy "Only admins manage events"
on public.events
for all
to authenticated
using (public.is_event_admin())
with check (public.is_event_admin());

drop policy if exists "Admins and collaborators can read registrations" on public.event_registrations;
create policy "Admins and collaborators can read registrations"
on public.event_registrations
for select
to authenticated
using (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_viewer', 'event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Public can insert active event registrations" on public.event_registrations;
create policy "Public can insert active event registrations"
on public.event_registrations
for insert
to anon, authenticated
with check (
  (
    exists (
      select 1
      from public.events event_record
      where event_record.id = event_registrations.event_id
        and event_record.is_active = true
        and event_record.registration_deadline >= current_date
    )
    and created_by is null
    and source = 'public_form'
  )
  or public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins and managers can update registrations" on public.event_registrations;
create policy "Admins and managers can update registrations"
on public.event_registrations
for update
to authenticated
using (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
)
with check (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins and managers can delete registrations" on public.event_registrations;
create policy "Admins and managers can delete registrations"
on public.event_registrations
for delete
to authenticated
using (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins and collaborators can read notifications" on public.event_notifications;
create policy "Admins and collaborators can read notifications"
on public.event_notifications
for select
to authenticated
using (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_viewer', 'event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins and managers can update notifications" on public.event_notifications;
create policy "Admins and managers can update notifications"
on public.event_notifications
for update
to authenticated
using (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
)
with check (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins and managers can insert notifications" on public.event_notifications;
create policy "Admins and managers can insert notifications"
on public.event_notifications
for insert
to authenticated
with check (
  public.is_event_admin()
  or public.has_event_role(event_id, array['event_manager']::public.event_collaborator_role[])
);

drop policy if exists "Admins can manage collaborators" on public.event_collaborators;
create policy "Admins can manage collaborators"
on public.event_collaborators
for all
to authenticated
using (public.is_event_admin())
with check (public.is_event_admin());

drop policy if exists "Collaborators can read their assignments" on public.event_collaborators;
create policy "Collaborators can read their assignments"
on public.event_collaborators
for select
to authenticated
using (
  public.is_event_admin()
  or user_id = auth.uid()
);

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do nothing;
