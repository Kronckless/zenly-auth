-- Execute no editor SQL do Supabase. Os perfis ficam vinculados à identidade
-- autenticada, e cada operação é limitada pelo RLS ao próprio usuário.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create policy "Usuários leem o próprio perfil"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Usuários criam o próprio perfil"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Usuários atualizam o próprio perfil"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);