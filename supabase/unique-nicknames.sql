-- Public nicknames used for friend search. Nicknames are unique ignoring case and spaces.

alter table public.profiles
  add column if not exists nickname_key text
  generated always as (lower(btrim(username))) stored;

alter table public.profiles
  drop constraint if exists profiles_nickname_format_check;

alter table public.profiles
  add constraint profiles_nickname_format_check
  check (
    username is null
    or (
      username = btrim(username)
      and char_length(username) between 3 and 32
    )
  );

create unique index if not exists profiles_nickname_key_unique_idx
  on public.profiles (nickname_key)
  where nickname_key is not null and nickname_key <> '';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, 'utente_' || substr(replace(new.id::text, '-', ''), 1, 8), '')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
