-- Run with a trusted SQL connection. All fixtures and writes are rolled back.
begin;
select set_config('qa.admin',gen_random_uuid()::text,true),set_config('qa.learner',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('qa.admin')::uuid),(current_setting('qa.learner')::uuid);
insert into public.site_admins(user_id) values(current_setting('qa.admin')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('qa.learner'),true);
do $$ begin
 if exists(select 1 from public.site_admins) then raise exception 'Learner can read another admin'; end if;
 begin
  insert into public.site_admins(user_id) values(auth.uid());
  raise exception 'Learner promoted themselves';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_site_draft('navigation','{"items":[]}',0);
  raise exception 'Learner saved a draft';
 exception when insufficient_privilege then null; end;
 begin
  perform public.publish_site_draft('navigation',1,0);
  raise exception 'Learner published';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.admin'),true);
-- Use an isolated module key so existing editorial data is never overwritten.
select public.save_site_draft('module:qa-permission-test','{"id":"qa-permission-test","title":"QA"}',0);
do $$ begin
 if exists(select 1 from public.site_published where key='module:qa-permission-test') then raise exception 'Draft went live before publishing';end if;
 begin
  perform public.save_site_draft('module:qa-permission-test','{"title":"stale"}',0);
  raise exception 'Stale draft overwrote current content';
 exception when serialization_failure then null;end;
end $$;
select public.publish_site_draft('module:qa-permission-test',1,0);
do $$ begin
 if (select count(*) from public.site_revisions where key='module:qa-permission-test')<>1 then raise exception 'Missing publish history';end if;
 begin
  perform public.publish_site_draft('module:qa-permission-test',1,0);
  raise exception 'Stale publication succeeded';
 exception when serialization_failure then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.learner'),true);
do $$ declare n integer; begin
 if exists(select 1 from public.site_drafts where key='module:qa-permission-test') then raise exception 'Learner can read drafts';end if;
 if exists(select 1 from public.site_revisions where key='module:qa-permission-test') then raise exception 'Learner can read private history';end if;
 update public.site_published set payload='{"title":"unauthorized"}' where key='module:qa-permission-test';
 get diagnostics n=row_count;if n<>0 then raise exception 'Learner updated publication';end if;
end $$;
set local role anon;
do $$ begin
 if not exists(select 1 from public.site_published where key='module:qa-permission-test') then raise exception 'Guest cannot read published lesson';end if;
 begin
  perform key from public.site_drafts;
  raise exception 'Guest can read drafts';
 exception when insufficient_privilege then null;end;
 begin
  perform public.save_site_draft('navigation','{"items":[]}',0);
  raise exception 'Guest can save';
 exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'PASS: admin publication, history, optimistic conflicts, guest reads, draft privacy, learner write denial, and self-promotion denial; fixtures rolled back' as result;
