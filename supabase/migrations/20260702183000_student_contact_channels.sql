alter table if exists students
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
