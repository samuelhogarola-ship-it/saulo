alter table students
  add column if not exists payment_received_at timestamptz,
  add column if not exists waiting_room_token text unique,
  add column if not exists waiting_room_sent_at timestamptz,
  add column if not exists waiting_room_consumed_at timestamptz;

create index if not exists students_waiting_room_token_idx
  on students(waiting_room_token);
