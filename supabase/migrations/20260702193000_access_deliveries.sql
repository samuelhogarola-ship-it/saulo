create table if not exists access_deliveries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  channel text,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists access_deliveries_student_created_idx
  on access_deliveries(student_id, created_at desc);
