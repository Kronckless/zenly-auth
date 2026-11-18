-- Execute no editor SQL do Supabase. Os perfis ficam vinculados à identidade
-- autenticada, e cada operação é limitada pelo RLS ao próprio usuário.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  has_mfo boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists has_mfo boolean not null default false,
  add column if not exists is_booster boolean not null default false,
  add column if not exists is_socio boolean not null default false;

create table if not exists public.salas_comunidade (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  creator_name text not null default '',
  name text not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mensagens_comunidade
  add column if not exists room_id uuid references public.salas_comunidade (id) on delete cascade;

create index if not exists mensagens_comunidade_room_created_at_idx
  on public.mensagens_comunidade (room_id, created_at);

create table if not exists public.leituras_salas (
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id text not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

alter table public.leituras_salas enable row level security;
grant select, insert, update on public.leituras_salas to authenticated;

drop policy if exists "Usuários leem suas leituras de salas"
  on public.leituras_salas;
create policy "Usuários leem suas leituras de salas"
  on public.leituras_salas
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuários registram suas leituras de salas"
  on public.leituras_salas;
create policy "Usuários registram suas leituras de salas"
  on public.leituras_salas
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam suas leituras de salas"
  on public.leituras_salas;
create policy "Usuários atualizam suas leituras de salas"
  on public.leituras_salas
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.mensagens_comunidade
  add column if not exists is_super_chat boolean not null default false,
  add column if not exists dossier_url text,
  add column if not exists dossier_name text,
  add column if not exists dossier_size bigint;

insert into storage.buckets (id, name, public)
values ('dossiers', 'dossiers', true)
on conflict (id) do update set public = true;

drop policy if exists "MFO pode enviar dossies" on storage.objects;
create policy "MFO pode enviar dossies"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'dossiers'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and has_mfo = true
    )
  );

alter table public.profiles enable row level security;
alter table public.mensagens_comunidade enable row level security;

grant select on public.mensagens_comunidade to authenticated;

drop policy if exists "Usuários autenticados podem ler mensagens da comunidade"
  on public.mensagens_comunidade;
create policy "Usuários autenticados podem ler mensagens da comunidade"
  on public.mensagens_comunidade
  for select
  to authenticated
  using (true);

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

alter table public.salas_comunidade enable row level security;
grant select, insert on public.salas_comunidade to authenticated;

drop policy if exists "Usuários leem salas disponíveis" on public.salas_comunidade;
create policy "Usuários leem salas disponíveis"
  on public.salas_comunidade
  for select
  to authenticated
  using (not is_private or creator_id = (select auth.uid()));

drop policy if exists "Sócios criam até duas salas" on public.salas_comunidade;
create policy "Sócios criam até duas salas"
  on public.salas_comunidade
  for insert
  to authenticated
  with check (
    creator_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and is_socio = true
    )
    and (
      select count(*)
      from public.salas_comunidade
      where creator_id = (select auth.uid())
    ) < 2
  );

grant update (name), delete on public.salas_comunidade to authenticated;

drop policy if exists "Sócios editam salas após 30 dias" on public.salas_comunidade;
create policy "Sócios editam salas após 30 dias"
  on public.salas_comunidade
  for update
  to authenticated
  using (
    creator_id = (select auth.uid())
    and created_at <= now() - interval '30 days'
  )
  with check (
    creator_id = (select auth.uid())
    and created_at <= now() - interval '30 days'
  );

drop policy if exists "Sócios excluem salas após 30 dias" on public.salas_comunidade;
create policy "Sócios excluem salas após 30 dias"
  on public.salas_comunidade
  for delete
  to authenticated
  using (
    creator_id = (select auth.uid())
    and created_at <= now() - interval '30 days'
  );

create or replace function public.enforce_socio_room_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtextextended(new.creator_id::text, 0));

    if not exists (
      select 1 from public.profiles
      where id = new.creator_id and is_socio = true
    ) then
      raise exception 'Apenas sócios podem criar salas.';
    end if;

    if (
      select count(*) from public.salas_comunidade
      where creator_id = new.creator_id
    ) >= 2 then
      raise exception 'Limite de duas salas atingido.';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.creator_id is distinct from old.creator_id
      or new.creator_name is distinct from old.creator_name
      or new.is_private is distinct from old.is_private
      or new.created_at is distinct from old.created_at then
      raise exception 'Os dados de criação da sala são imutáveis.';
    end if;

    if old.created_at > now() - interval '30 days' then
      raise exception 'A sala só pode ser editada após 30 dias.';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.created_at > now() - interval '30 days' then
      raise exception 'A sala só pode ser excluída após 30 dias.';
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_socio_room_lifecycle on public.salas_comunidade;
create trigger enforce_socio_room_lifecycle
  before insert or update or delete on public.salas_comunidade
  for each row execute function public.enforce_socio_room_lifecycle();