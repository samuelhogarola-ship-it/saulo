alter table if exists students
  add column if not exists delivery_status text,
  add column if not exists delivery_channel text,
  add column if not exists delivery_sent_at timestamptz,
  add column if not exists delivery_error text;
