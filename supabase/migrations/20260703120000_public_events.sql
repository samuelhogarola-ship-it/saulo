create extension if not exists pgcrypto;

create or replace function public.is_trainer_auth_user(trainer_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.trainers
    where trainers.id = trainer_uuid
      and trainers.auth_user_id = auth.uid()
  );
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainers (id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text not null,
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  price_label text not null default 'Plazas limitadas',
  poster_url text not null default '/event-assets/girl-power-hero.png',
  cta_label text not null default 'Reservar plaza',
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_published_idx on public.events (is_published);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  message text,
  status text not null default 'pending',
  source text not null default 'public_form',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists event_registrations_event_id_idx
  on public.event_registrations (event_id, created_at desc);

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Public read published events" on public.events;
create policy "Public read published events"
on public.events
for select
using (is_published = true);

drop policy if exists "Trainer manage events" on public.events;
create policy "Trainer manage events"
on public.events
for all
using (public.is_trainer_auth_user(trainer_id))
with check (public.is_trainer_auth_user(trainer_id));

drop policy if exists "Public insert event registrations" on public.event_registrations;
create policy "Public insert event registrations"
on public.event_registrations
for insert
with check (true);

drop policy if exists "Trainer read event registrations" on public.event_registrations;
create policy "Trainer read event registrations"
on public.event_registrations
for select
using (
  exists (
    select 1
    from public.events
    where public.events.id = event_registrations.event_id
      and public.is_trainer_auth_user(public.events.trainer_id)
  )
);
