-- Transaction-only fixtures: test authorization with real Postgres roles, then roll back.
begin;
select set_config('qa.owner',gen_random_uuid()::text,true),set_config('qa.editor',gen_random_uuid()::text,true),set_config('qa.stranger',gen_random_uuid()::text,true),set_config('qa.group',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('qa.owner')::uuid),(current_setting('qa.editor')::uuid),(current_setting('qa.stranger')::uuid);
insert into public.site_admins(user_id) values(current_setting('qa.owner')::uuid);
insert into public.site_groups(id,name,rights) values(current_setting('qa.group')::uuid,'QA transient group',array['content']);
insert into public.site_group_members(group_id,user_id) values(current_setting('qa.group')::uuid,current_setting('qa.editor')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('qa.editor'),true);
do $$ begin
 if public.site_my_rights()<>array['content'] then raise exception 'Unexpected editor rights';end if;
 perform public.save_site_draft('module:qa-group-test','{"id":"qa-group-test"}',0);
 begin perform public.save_site_draft('dashboard','{"blocks":[]}',0);raise exception 'Editor changed dashboard';exception when insufficient_privilege then null;end;
 begin perform public.publish_site_draft('module:qa-group-test',1,0);raise exception 'Editor published';exception when insufficient_privilege then null;end;
 begin perform public.site_account_directory();raise exception 'Editor read directory';exception when insufficient_privilege then null;end;
 begin insert into public.site_groups(name,rights) values('QA self promotion',array['access']);raise exception 'Editor promoted self';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.site_groups where id<>current_setting('qa.group')::uuid) then raise exception 'Editor sees unrelated groups';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true);
do $$ begin
 if cardinality(public.site_my_rights())<>5 then raise exception 'Owner lost rights';end if;
 update public.site_groups set rights=array['content','publish'] where id=current_setting('qa.group')::uuid;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.editor'),true);
select public.publish_site_draft('module:qa-group-test',1,0);
do $$ begin
 begin insert into public.site_published(key,payload,version,published_by) values('dashboard','{}',1,auth.uid());raise exception 'Cross-area direct publish allowed';exception when insufficient_privilege then null;end;
 begin insert into public.site_group_members(group_id,user_id) values(current_setting('qa.group')::uuid,current_setting('qa.stranger')::uuid);raise exception 'Editor grants membership';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('qa.owner'),true);
delete from public.site_group_members where group_id=current_setting('qa.group')::uuid;
select set_config('request.jwt.claim.sub',current_setting('qa.editor'),true);
do $$ begin
 if cardinality(public.site_my_rights())<>0 then raise exception 'Revocation was not immediate';end if;
 if exists(select 1 from public.site_drafts) then raise exception 'Revoked member sees drafts';end if;
 begin perform public.save_site_draft('module:qa-group-test','{}',1);raise exception 'Revoked member can save';exception when insufficient_privilege then null;end;
end $$;
rollback;
select 'PASS: scoped draft rights, separate publishing, directory privacy, self-promotion denial, cross-area write denial, owner continuity, and immediate membership revocation; fixtures rolled back' result;
