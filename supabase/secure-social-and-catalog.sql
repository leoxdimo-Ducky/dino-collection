-- Security and catalog alignment for the expanded Release The Creature app.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop function if exists public.handle_new_user();

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, update on table public.profiles to authenticated;

drop policy if exists "Cerca profili pubblici" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Authenticated users can find profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter table public.friendships enable row level security;
revoke all on table public.friendships from anon;
revoke all on table public.friendships from authenticated;
grant select, insert, update, delete on table public.friendships to authenticated;

drop policy if exists "Accetta o rifiuta" on public.friendships;
drop policy if exists "Elimina amicizia" on public.friendships;
drop policy if exists "Manda richiesta" on public.friendships;
drop policy if exists "Vedi le tue amicizie" on public.friendships;

create policy "Users can view their friendships"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "Users can send friend requests"
  on public.friendships for insert to authenticated
  with check (
    (select auth.uid()) = requester_id
    and requester_id <> addressee_id
    and status = 'pending'
  );

create policy "Recipients can answer requests"
  on public.friendships for update to authenticated
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status in ('accepted', 'declined'));

create policy "Users can remove their friendships"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create index if not exists friendships_addressee_id_idx
  on public.friendships (addressee_id);

create index if not exists friendships_requester_id_idx
  on public.friendships (requester_id);

alter table public.friendships
  drop constraint if exists friendships_requester_id_addressee_id_key;

drop index if exists public.friendships_requester_id_addressee_id_key;

create unique index if not exists friendships_one_active_pair_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  )
  where status in ('pending', 'accepted');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;

  if to_regclass('public.friend_messages') is not null
    and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'friend_messages'
  ) then
    alter publication supabase_realtime add table public.friend_messages;
  end if;
end
$$;

alter table public.collection_snapshots enable row level security;
revoke all on table public.collection_snapshots from anon;
revoke all on table public.collection_snapshots from authenticated;
grant select, insert, update on table public.collection_snapshots to authenticated;

drop policy if exists "Aggiorna i tuoi snapshot" on public.collection_snapshots;
drop policy if exists "Inserisci i tuoi snapshot" on public.collection_snapshots;
drop policy if exists "Vedi solo i tuoi snapshot" on public.collection_snapshots;

create policy "Users can view own snapshots"
  on public.collection_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own snapshots"
  on public.collection_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own snapshots"
  on public.collection_snapshots for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.card_images enable row level security;
revoke all on table public.card_images from anon;
revoke all on table public.card_images from authenticated;
grant select, insert, update, delete on table public.card_images to authenticated;

drop policy if exists "Vedi le tue immagini" on public.card_images;
drop policy if exists "Inserisci le tue immagini" on public.card_images;
drop policy if exists "Aggiorna le tue immagini" on public.card_images;
drop policy if exists "Elimina le tue immagini" on public.card_images;

create policy "Users can view own card images"
  on public.card_images for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own card images"
  on public.card_images for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own card images"
  on public.card_images for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own card images"
  on public.card_images for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own cards" on public.collections;
create policy "Users and friends can view collection cards"
  on public.collections for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.friendships friendship
      where friendship.status = 'accepted'
        and (
          (friendship.requester_id = (select auth.uid()) and friendship.addressee_id = collections.user_id)
          or
          (friendship.addressee_id = (select auth.uid()) and friendship.requester_id = collections.user_id)
        )
    )
  );

alter table public.cards drop constraint if exists cards_rarity_check;
delete from public.cards;

alter table public.cards
  add constraint cards_rarity_check check (
    rarity in (
      'Comune', 'Tear C', 'Tear B', 'Tear A', 'Tear S',
      'Time Shifted', 'Land scape', 'Safari', 'Master piece',
      'Boom', 'Explosion'
    )
  );

insert into public.cards (card_id, name, rarity, sort_order)
select
  'main-' || lpad(card_number::text, 3, '0') || '-' || rarity_slug,
  'Dino ' || lpad(card_number::text, 3, '0'),
  rarity,
  card_number * 100 + rarity_position
from generate_series(1, 150) card_number
cross join (
  values
    ('Comune', 'comune', 0),
    ('Tear C', 'tear-c', 1),
    ('Tear B', 'tear-b', 2),
    ('Tear A', 'tear-a', 3),
    ('Tear S', 'tear-s', 4)
) as rarity_list(rarity, rarity_slug, rarity_position);

insert into public.cards (card_id, name, rarity, sort_order)
select
  'time-shifted-' || lpad(card_number::text, 3, '0') || '-time-shifted',
  'Time Shifted ' || lpad(card_number::text, 3, '0'),
  'Time Shifted',
  10000 + card_number * 100
from generate_series(1, 30) card_number;

insert into public.cards (card_id, name, rarity, sort_order)
select
  'special-' || lpad(card_number::text, 3, '0') || '-' || rarity_slug,
  'Special ' || lpad(card_number::text, 3, '0'),
  rarity,
  20000 + card_number * 100 + rarity_position
from generate_series(1, 9) card_number
cross join (
  values
    ('Land scape', 'land-scape', 0),
    ('Safari', 'safari', 1),
    ('Master piece', 'master-piece', 2)
) as rarity_list(rarity, rarity_slug, rarity_position);

insert into public.cards (card_id, name, rarity, sort_order)
select
  'pre-order-' || lpad(card_number::text, 3, '0') || '-' || rarity_slug,
  'Pre Order ' || lpad(card_number::text, 3, '0'),
  rarity,
  30000 + card_number * 100 + rarity_position
from generate_series(1, 9) card_number
cross join (
  values
    ('Boom', 'boom', 0),
    ('Explosion', 'explosion', 1)
) as rarity_list(rarity, rarity_slug, rarity_position);
