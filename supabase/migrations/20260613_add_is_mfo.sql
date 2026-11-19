alter table public.profiles
  add column if not exists is_mfo boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'has_mfo'
  ) then
    execute '
      update public.profiles
      set is_mfo = true
      where has_mfo is true
    ';
  end if;
end
$$;