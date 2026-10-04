begin;
insert into auth.users(id,email) values
 ('ad035ab0-12cb-49c7-938d-e6c50b580201','reminder-one@example.invalid'),
 ('ad035ab0-12cb-49c7-938d-e6c50b580202','reminder-two@example.invalid');
select set_config('request.jwt.claims','{"sub":"ad035ab0-12cb-49c7-938d-e6c50b580201","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 insert into public.notification_preferences(user_id) values ('ad035ab0-12cb-49c7-938d-e6c50b580201');
 if (select review_reminders from public.notification_preferences where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201') then raise exception 'Default opted in'; end if;
 update public.notification_preferences set review_reminders=true where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201';
 begin
  insert into public.notification_preferences(user_id) values ('ad035ab0-12cb-49c7-938d-e6c50b580202');
  raise exception 'Cross-account insert allowed';
 exception when insufficient_privilege then null; end;
 if has_column_privilege('authenticated','public.notification_preferences','next_eligible_at','UPDATE') then raise exception 'Client can reset cooldown'; end if;
 if has_column_privilege('authenticated','public.notification_preferences','unsubscribe_token','SELECT') then raise exception 'Unsubscribe tokens exposed'; end if;
 if has_table_privilege('authenticated','public.review_reminder_deliveries','SELECT') then raise exception 'Delivery ledger exposed'; end if;
 if has_table_privilege('anon','public.notification_preferences','SELECT') then raise exception 'Guest preference access'; end if;
 if has_function_privilege('authenticated','public.claim_review_reminder(uuid)','EXECUTE') or has_function_privilege('anon','public.claim_review_reminder(uuid)','EXECUTE') then raise exception 'Public claim execution'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"ad035ab0-12cb-49c7-938d-e6c50b580202","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
 if exists(select 1 from public.notification_preferences where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201') then raise exception 'Cross-account read'; end if;
 update public.notification_preferences set review_reminders=false where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-account update'; end if;
 insert into public.notification_preferences(user_id) values ('ad035ab0-12cb-49c7-938d-e6c50b580202');
end $$;
reset role;
set local role service_role;
do $$ declare first_claim record; n int; original_token uuid; rotated_token uuid; result text; begin
 if exists(select 1 from public.claim_review_reminder('ad035ab0-12cb-49c7-938d-e6c50b580202')) then raise exception 'Opt-out claim allowed'; end if;
 select * into first_claim from public.claim_review_reminder('ad035ab0-12cb-49c7-938d-e6c50b580201');
 if first_claim.delivery_id is null then raise exception 'Opt-in claim failed'; end if;
 if exists(select 1 from public.claim_review_reminder('ad035ab0-12cb-49c7-938d-e6c50b580201')) then raise exception 'Duplicate claim allowed'; end if;
 select status into result from public.acknowledge_review_reminder(first_claim.delivery_id,'sent');
 if result<>'sent' then raise exception 'Acknowledgement failed'; end if;
 select status into result from public.acknowledge_review_reminder(first_claim.delivery_id,'failed');
 if result<>'sent' then raise exception 'Final status overwritten'; end if;
 original_token:=first_claim.unsubscribe_token;
 update public.notification_preferences set review_reminders=false where unsubscribe_token=original_token;
 update public.notification_preferences set review_reminders=true where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201';
 select unsubscribe_token into rotated_token from public.notification_preferences where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201';
 if rotated_token=original_token then raise exception 'Old unsubscribe token reused'; end if;
 if exists(select 1 from public.claim_review_reminder('ad035ab0-12cb-49c7-938d-e6c50b580201')) then raise exception 'Re-enable reset cooldown'; end if;
 update public.notification_preferences set next_eligible_at=now()-interval '1 second' where user_id='ad035ab0-12cb-49c7-938d-e6c50b580201';
 if not exists(select 1 from public.claim_review_reminder('ad035ab0-12cb-49c7-938d-e6c50b580201')) then raise exception 'Elapsed cooldown blocks next reminder'; end if;
end $$;
reset role;
rollback;
