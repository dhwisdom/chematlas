-- WebCenter 25.03-inspired component rights; existing site_admins remain protected owners.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table public.site_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null unique check(length(trim(name)) between 1 and 80),
 rights text[] not null default '{}' check(rights <@ array['menus','dashboards','content','publish','access']::text[]),
 version bigint not null default 1
);
create table public.site_group_members (
 group_id uuid not null references public.site_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key(group_id,user_id)
);
create index site_group_members_user_idx on public.site_group_members(user_id);
alter table public.site_groups enable row level security;
alter table public.site_group_members enable row level security;
revoke all on public.site_groups,public.site_group_members from public,anon,authenticated;
grant select,insert,update,delete on public.site_groups,public.site_group_members to authenticated;
-- Private, fixed-search-path helper avoids recursive membership RLS. Caller identity is never a parameter.
create function private.site_can(p_right text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (exists(select 1 from public.site_admins where user_id=auth.uid())
 or exists(select 1 from public.site_group_members m join public.site_groups g on g.id=m.group_id where m.user_id=auth.uid() and p_right=any(g.rights)));
$$;
revoke all on function private.site_can(text) from public,anon;
grant execute on function private.site_can(text) to authenticated;
create function public.site_my_rights() returns text[] language sql stable security invoker set search_path='' as $$
 select coalesce(array_agg(r),array[]::text[]) from unnest(array['menus','dashboards','content','publish','access']) r where private.site_can(r);
$$;
revoke all on function public.site_my_rights() from public,anon;
grant execute on function public.site_my_rights() to authenticated;
create policy group_read on public.site_groups for select to authenticated using(private.site_can('access') or exists(select 1 from public.site_group_members m where m.group_id=id and m.user_id=auth.uid()));
create policy group_manage on public.site_groups for all to authenticated using(private.site_can('access')) with check(private.site_can('access'));
create policy member_read on public.site_group_members for select to authenticated using(user_id=auth.uid() or private.site_can('access'));
create policy member_manage on public.site_group_members for all to authenticated using(private.site_can('access')) with check(private.site_can('access'));
-- Account picker returns only identity fields, never learner progress or tutor messages.
create function private.site_account_directory() returns table(user_id uuid,email text,owner boolean) language plpgsql stable security definer set search_path='' as $$
 begin
 if not private.site_can('access') then raise exception 'Access management required' using errcode='42501'; end if;
 return query select u.id,u.email::text,exists(select 1 from public.site_admins a where a.user_id=u.id) from auth.users u where u.email_confirmed_at is not null order by u.email limit 1000;
 end;
$$;
revoke all on function private.site_account_directory() from public,anon;
grant execute on function private.site_account_directory() to authenticated;
create function public.site_account_directory() returns table(user_id uuid,email text,owner boolean) language sql stable security invoker set search_path='' as $$ select * from private.site_account_directory(); $$;
revoke all on function public.site_account_directory() from public,anon;
grant execute on function public.site_account_directory() to authenticated;
create function private.site_document_right(p_key text) returns text language sql immutable security invoker set search_path='' as $$
 select case when p_key='navigation' then 'menus' when p_key='dashboard' then 'dashboards' when p_key like 'module:%' then 'content' else 'invalid' end;
$$;
revoke all on function private.site_document_right(text) from public,anon;
grant execute on function private.site_document_right(text) to authenticated;
alter table public.site_drafts drop constraint site_drafts_key_check;
alter table public.site_drafts add constraint site_drafts_key_check check(key in ('navigation','dashboard') or key ~ '^module:[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.site_published drop constraint published_key_format;
alter table public.site_published add constraint published_key_format check(key in ('navigation','dashboard') or key ~ '^module:[a-z0-9]+(-[a-z0-9]+)*$');
drop policy admin_edit on public.site_drafts;
drop policy admin_edit on public.site_published;
drop policy admin_edit on public.site_revisions;
create policy draft_edit on public.site_drafts for all to authenticated using(private.site_can(private.site_document_right(key))) with check(private.site_can(private.site_document_right(key)));
create policy live_edit on public.site_published for all to authenticated using(private.site_can(private.site_document_right(key)) and private.site_can('publish')) with check(private.site_can(private.site_document_right(key)) and private.site_can('publish'));
create policy revision_read on public.site_revisions for select to authenticated using(private.site_can(private.site_document_right(key)));
create policy revision_append on public.site_revisions for insert to authenticated with check(private.site_can(private.site_document_right(key)) and private.site_can('publish'));
create or replace function public.save_site_draft(p_key text,p_payload jsonb,p_expected bigint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare old_version bigint; new_version bigint;
begin
 if not private.site_can(private.site_document_right(p_key)) then
  raise exception 'Admin access required' using errcode='42501';
 end if;
 select version into old_version from public.site_drafts where key=p_key for update;
 if coalesce(old_version,0)<>p_expected then raise exception 'This draft changed in another window. Reload before saving.' using errcode='40001'; end if;
 new_version:=coalesce(old_version,0)+1;
 if old_version is null then
  insert into public.site_drafts(key,payload,version,updated_by) values(p_key,p_payload,new_version,(select auth.uid()));
 else
  update public.site_drafts set payload=p_payload,version=new_version,updated_at=now(),updated_by=(select auth.uid()) where key=p_key;
 end if;
 return new_version;
end $$;

create or replace function public.publish_site_draft(p_key text,p_expected_draft bigint,p_expected_live bigint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare draft public.site_drafts; live_version bigint; new_version bigint;
begin
 if not private.site_can(private.site_document_right(p_key)) or not private.site_can('publish') then
  raise exception 'Admin access required' using errcode='42501';
 end if;
 select * into draft from public.site_drafts where key=p_key for update;
 if draft.key is null or draft.version<>p_expected_draft then raise exception 'The draft changed. Reload before publishing.' using errcode='40001'; end if;
 select version into live_version from public.site_published where key=p_key;
 if coalesce(live_version,0)<>p_expected_live then raise exception 'A newer version is live. Reload before publishing.' using errcode='40001'; end if;
 new_version:=coalesce(live_version,0)+1;
 insert into public.site_revisions(key,payload,version,published_by) values(p_key,draft.payload,new_version,(select auth.uid()));
 insert into public.site_published(key,payload,version,published_by) values(p_key,draft.payload,new_version,(select auth.uid()))
 on conflict(key) do update set payload=excluded.payload,version=excluded.version,published_at=now(),published_by=excluded.published_by;
 return new_version;
end $$;
revoke all on function public.save_site_draft(text,jsonb,bigint) from public,anon;
revoke all on function public.publish_site_draft(text,bigint,bigint) from public,anon;
grant execute on function public.save_site_draft(text,jsonb,bigint) to authenticated;
grant execute on function public.publish_site_draft(text,bigint,bigint) to authenticated;

-- Unassigned starter groups do not change anyone's access.
insert into public.site_groups(name,rights) values
 ('Content editors',array['content']),
 ('Site designers',array['menus','dashboards']),
 ('Publishers',array['content','menus','dashboards','publish']);
