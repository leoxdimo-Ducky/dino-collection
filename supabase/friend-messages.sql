-- Fixed-message chat available only between accepted friends.

create table if not exists public.friend_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  message_code text not null check (
    message_code in ('need_card', 'want_to_trade', 'great_collection', 'thanks')
  ),
  card_id text,
  created_at timestamptz not null default now(),
  constraint friend_messages_different_users check (sender_id <> recipient_id),
  constraint friend_messages_card_payload check (
    (message_code = 'need_card' and card_id is not null)
    or (message_code <> 'need_card' and card_id is null)
  )
);

alter table public.friend_messages enable row level security;
revoke all on table public.friend_messages from anon;
revoke all on table public.friend_messages from authenticated;
grant select, insert on table public.friend_messages to authenticated;

drop policy if exists "Friends can view quick messages" on public.friend_messages;
drop policy if exists "Friends can send quick messages" on public.friend_messages;

create policy "Friends can view quick messages"
  on public.friend_messages for select to authenticated
  using (
    (select auth.uid()) in (sender_id, recipient_id)
    and exists (
      select 1
      from public.friendships friendship
      where friendship.status = 'accepted'
        and (
          (friendship.requester_id = friend_messages.sender_id and friendship.addressee_id = friend_messages.recipient_id)
          or
          (friendship.requester_id = friend_messages.recipient_id and friendship.addressee_id = friend_messages.sender_id)
        )
    )
  );

create policy "Friends can send quick messages"
  on public.friend_messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> recipient_id
    and (
      message_code <> 'need_card'
      or (
        exists (
          select 1
          from public.collections available_card
          where available_card.user_id = friend_messages.recipient_id
            and available_card.card_id = friend_messages.card_id
            and coalesce(available_card.dupes, 0) > 0
        )
        and not exists (
          select 1
          from public.collections owned_card
          where owned_card.user_id = friend_messages.sender_id
            and owned_card.card_id = friend_messages.card_id
        )
      )
    )
    and exists (
      select 1
      from public.friendships friendship
      where friendship.status = 'accepted'
        and (
          (friendship.requester_id = sender_id and friendship.addressee_id = recipient_id)
          or
          (friendship.requester_id = recipient_id and friendship.addressee_id = sender_id)
        )
    )
  );

create index if not exists friend_messages_conversation_created_idx
  on public.friend_messages (sender_id, recipient_id, created_at desc);

create index if not exists friend_messages_recipient_id_idx
  on public.friend_messages (recipient_id);

do $$
begin
  if not exists (
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
