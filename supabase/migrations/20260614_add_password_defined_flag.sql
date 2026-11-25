alter table public.profiles
  add column if not exists senha_definida boolean not null default false;