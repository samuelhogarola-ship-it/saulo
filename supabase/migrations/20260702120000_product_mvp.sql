create extension if not exists pgcrypto;

create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete set null,
  name text not null,
  plan text not null default 'Plan personalizado',
  age text,
  weight text,
  goal text,
  summary text not null default 'Solo tú marcas tus límites.',
  profile_note_title text not null default 'Notas de perfil',
  profile_note text,
  access_token text not null unique,
  access_revoked_at timestamptz,
  next_photo_due_at date,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  status text not null default 'Membresía activa',
  summary text,
  started_at date,
  valid_until date,
  plan_label text,
  plan_end date,
  created_at timestamptz not null default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null default 'Rutina activa',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  title text not null,
  meta text not null default 'Plan activo',
  created_at timestamptz not null default now(),
  unique (routine_id, day_number)
);

create table if not exists routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  routine_day_id uuid not null references routine_days(id) on delete cascade,
  position integer not null default 1,
  name text not null,
  reps text,
  load text,
  rest text,
  video_url text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  direction text not null check (direction in ('inbox', 'sent', 'reminder')),
  title text not null,
  tag text not null,
  source text not null default 'App',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists workout_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  feedback text not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  slot text not null,
  label text not null,
  url text not null,
  status text not null default 'pending',
  captured_at timestamptz not null default now()
);

create index if not exists students_access_token_idx on students(access_token);
create index if not exists routine_days_routine_day_idx on routine_days(routine_id, day_number);
create index if not exists routine_exercises_day_position_idx on routine_exercises(routine_day_id, position);
create index if not exists messages_student_created_idx on messages(student_id, created_at desc);
create index if not exists workout_reports_student_created_idx on workout_reports(student_id, created_at desc);
create index if not exists progress_photos_student_created_idx on progress_photos(student_id, captured_at desc);
