-- Add explicit card-for-card trade proposals to the existing friends chat.

alter table public.friend_messages
  add column if not exists offered_card_id text;

alter table public.friend_messages
  drop constraint if exists friend_messages_message_code_check;

alter table public.friend_messages
  add constraint friend_messages_message_code_check check (
    message_code in ('need_card', 'trade_offer', 'want_to_trade', 'great_collection', 'thanks')
  );

alter table public.friend_messages
  drop constraint if exists friend_messages_card_payload;

alter table public.friend_messages
  add constraint friend_messages_card_payload check (
    (message_code = 'need_card' and card_id is not null and offered_card_id is null)
    or (message_code = 'trade_offer' and card_id is not null and offered_card_id is not null and card_id <> offered_card_id)
    or (message_code not in ('need_card', 'trade_offer') and card_id is null and offered_card_id is null)
  );

drop policy if exists "Friends can send quick messages" on public.friend_messages;

create policy "Friends can send quick messages"
  on public.friend_messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> recipient_id
    and (
      message_code not in ('need_card', 'trade_offer')
      or (
        message_code = 'need_card'
        and exists (
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
      or (
        message_code = 'trade_offer'
        and exists (
          select 1
          from public.collections requested_card
          where requested_card.user_id = friend_messages.recipient_id
            and requested_card.card_id = friend_messages.card_id
            and coalesce(requested_card.dupes, 0) > 0
        )
        and exists (
          select 1
          from public.collections offered_card
          where offered_card.user_id = friend_messages.sender_id
            and offered_card.card_id = friend_messages.offered_card_id
            and coalesce(offered_card.dupes, 0) > 0
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
