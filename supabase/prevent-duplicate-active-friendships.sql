-- Allow old declined requests, but keep only one pending or accepted
-- relationship for each unordered pair of users.

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
