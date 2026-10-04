begin;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  review_reminders boolean not null default false,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  next_eligible_at timestamptz,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from public, anon, authenticated;
grant select (user_id, review_reminders), insert (user_id, review_reminders), update (review_reminders)
  on public.notification_preferences to authenticated;
grant all on public.notification_preferences to service_role;
drop policy if exists notification_preferences_read on public.notification_preferences;
create policy notification_preferences_read on public.notification_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists notification_preferences_insert on public.notification_preferences;
create policy notification_preferences_insert on public.notification_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists notification_preferences_update on public.notification_preferences;
create policy notification_preferences_update on public.notification_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists notification_preferences_candidates on public.notification_preferences (last_checked_at nulls first, user_id)
  where review_reminders;

-- A newly enabled subscription invalidates old unsubscribe links, while keeping the send cooldown.
create or replace function public.touch_notification_preference() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  if new.review_reminders and not old.review_reminders then
    new.unsubscribe_token := gen_random_uuid();
  end if;
  return new;
end;
$$;
revoke all on function public.touch_notification_preference() from public, anon, authenticated;
drop trigger if exists notification_preference_changed on public.notification_preferences;
create trigger notification_preference_changed before update of review_reminders on public.notification_preferences
  for each row execute function public.touch_notification_preference();

create table if not exists public.review_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.notification_preferences(user_id) on delete cascade,
  claimed_at timestamptz not null default now(),
  status text not null default 'claimed' check (status in ('claimed','sent','failed')),
  acknowledged_at timestamptz
);
alter table public.review_reminder_deliveries enable row level security;
revoke all on public.review_reminder_deliveries from public, anon, authenticated;
grant all on public.review_reminder_deliveries to service_role;
drop policy if exists review_reminder_deliveries_service on public.review_reminder_deliveries;
create policy review_reminder_deliveries_service on public.review_reminder_deliveries for all to service_role
  using (true) with check (true);
create index if not exists review_reminder_deliveries_user_time on public.review_reminder_deliveries (user_id, claimed_at desc);

-- Row lock + cooldown update + ledger insert form one transaction, including concurrent callers.
create or replace function public.claim_review_reminder(p_user_id uuid)
returns table(delivery_id uuid, unsubscribe_token uuid)
language plpgsql security invoker set search_path = '' as $$
declare preference public.notification_preferences%rowtype; delivery uuid;
begin
  select * into preference from public.notification_preferences where user_id = p_user_id for update;
  if not found or not preference.review_reminders or preference.next_eligible_at > now() then return; end if;
  update public.notification_preferences set next_eligible_at = now() + interval '7 days', last_checked_at = now()
    where user_id = p_user_id;
  insert into public.review_reminder_deliveries(user_id) values (p_user_id) returning id into delivery;
  return query select delivery, preference.unsubscribe_token;
end;
$$;
revoke all on function public.claim_review_reminder(uuid) from public, anon, authenticated;
grant execute on function public.claim_review_reminder(uuid) to service_role;

create or replace function public.acknowledge_review_reminder(p_delivery_id uuid, p_status text)
returns table(status text)
language plpgsql security invoker set search_path = '' as $$
begin
  if p_status not in ('sent','failed') then raise exception 'Invalid delivery status'; end if;
  update public.review_reminder_deliveries d set status = p_status, acknowledged_at = now()
    where d.id = p_delivery_id and d.status = 'claimed';
  return query select d.status from public.review_reminder_deliveries d where d.id = p_delivery_id;
end;
$$;
revoke all on function public.acknowledge_review_reminder(uuid,text) from public, anon, authenticated;
grant execute on function public.acknowledge_review_reminder(uuid,text) to service_role;

commit;
