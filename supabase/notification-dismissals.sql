-- Notification dismissals are private to each signed-in user and persist
-- across devices so cleared social notices do not reappear on reload.

create table if not exists public.notification_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_key text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, notification_key)
);

alter table public.notification_dismissals enable row level security;
revoke all on table public.notification_dismissals from anon;
revoke all on table public.notification_dismissals from authenticated;
grant select, insert, delete on table public.notification_dismissals to authenticated;

drop policy if exists "Users can view dismissed notifications" on public.notification_dismissals;
drop policy if exists "Users can dismiss notifications" on public.notification_dismissals;
drop policy if exists "Users can restore dismissed notifications" on public.notification_dismissals;

create policy "Users can view dismissed notifications"
  on public.notification_dismissals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can dismiss notifications"
  on public.notification_dismissals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can restore dismissed notifications"
  on public.notification_dismissals for delete to authenticated
  using ((select auth.uid()) = user_id);
