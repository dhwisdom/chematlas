-- Existing learner contract: additive setup for the previously empty project.
create table if not exists public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text, learning_goal text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.learner_state (
 user_id uuid not null references auth.users(id) on delete cascade,
 state_key text not null, state_value jsonb, updated_at timestamptz not null default now(),
 primary key(user_id,state_key)
);
create table if not exists public.tutor_threads (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text, course_context text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tutor_messages (
 id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.tutor_threads(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('user','assistant')), content text not null, model_name text,
 used_web boolean not null default false, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
alter table public.tutor_messages add column if not exists metadata jsonb not null default '{}'::jsonb;
do $$ declare t text; begin
 foreach t in array array['profiles','learner_state','tutor_threads','tutor_messages'] loop
  execute format('alter table public.%I enable row level security', t);
  if not exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t||'_self') then
   execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t||'_self',t);
  end if;
  execute format('revoke all on public.%I from anon',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create policy tutor_message_thread_owner on public.tutor_messages as restrictive for all to authenticated
 using (exists(select 1 from public.tutor_threads t where t.id=thread_id and t.user_id=(select auth.uid())))
 with check (exists(select 1 from public.tutor_threads t where t.id=thread_id and t.user_id=(select auth.uid())));
create index if not exists idx_tutor_messages_thread on public.tutor_messages(thread_id);
create index if not exists idx_tutor_threads_user_updated on public.tutor_threads(user_id,updated_at desc);

-- Admin membership can only be assigned through a trusted database operation.
-- No browser role (including an administrator) can grant itself or others admin.
create table public.site_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
revoke all on public.site_admins from public,anon,authenticated;
grant select on public.site_admins to authenticated;
create policy admin_self_read on public.site_admins for select to authenticated using(user_id=(select auth.uid()));

create table public.site_drafts (
 key text primary key check(key='navigation' or key ~ '^module:[a-z0-9]+(-[a-z0-9]+)*$'),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=250000),
 version bigint not null default 1, updated_at timestamptz not null default now(),
 updated_by uuid not null references auth.users(id)
);
create table public.site_published (
 key text primary key, payload jsonb not null,
 version bigint not null, published_at timestamptz not null default now(),
 published_by uuid not null references auth.users(id)
);
create table public.site_revisions (
 key text not null, version bigint not null, payload jsonb not null,
 published_at timestamptz not null default now(), published_by uuid not null references auth.users(id),
 primary key(key,version)
);
do $$ declare t text; begin
 foreach t in array array['site_drafts','site_published','site_revisions'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update on public.%I to authenticated',t);
  execute format('create policy admin_edit on public.%I for all to authenticated using (exists(select 1 from public.site_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.site_admins where user_id=(select auth.uid())))',t);
 end loop;
end $$;
-- Drafts and revision history are never public.
grant select(key,payload,version,published_at) on public.site_published to anon;
create policy published_read on public.site_published for select to anon,authenticated using(true);

create function public.save_site_draft(p_key text,p_payload jsonb,p_expected bigint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare old_version bigint; new_version bigint;
begin
 if not exists(select 1 from public.site_admins where user_id=(select auth.uid())) then
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

create function public.publish_site_draft(p_key text,p_expected_draft bigint,p_expected_live bigint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare draft public.site_drafts; live_version bigint; new_version bigint;
begin
 if not exists(select 1 from public.site_admins where user_id=(select auth.uid())) then
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
-- Version history is append-only for browser sessions.
revoke update on public.site_revisions from authenticated;
alter table public.site_published add constraint published_payload_object check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=250000);
alter table public.site_published add constraint published_key_format check(key='navigation' or key ~ '^module:[a-z0-9]+(-[a-z0-9]+)*$');
