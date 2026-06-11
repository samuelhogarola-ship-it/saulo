create extension if not exists pgcrypto;

create table if not exists public.questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  app_project_name text not null,
  access_system text not null,
  student_volume text,
  video_management text,
  photo_frequency text,
  technique_videos text,
  main_communication text,
  ai_assistant text,
  payments text,
  renewal_system text,
  meeting_date date,
  meeting_time text,
  extra_notes text,
  custom_requests text,
  routine_variables text[] not null default '{}',
  logo_file_name text,
  logo_storage_path text,
  logo_public_url text,
  payload jsonb not null
);

create index if not exists questionnaire_submissions_submitted_at_idx
  on public.questionnaire_submissions (submitted_at desc);
