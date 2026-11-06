-- Recovered by read-only inspection; do not replay against an existing hosted database.
-- Additive companion storage. Existing learner-state policies remain intact.
create table public.companion_request_nonces (
 nonce uuid primary key,
 expires_at timestamptz not null
);
create index companion_nonce_expiry on public.companion_request_nonces(expires_at);
alter table public.companion_request_nonces enable row level security;
revoke all on public.companion_request_nonces from public,anon,authenticated;
grant select,insert,delete on public.companion_request_nonces to service_role;

create table public.companion_practice_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 module_id text not null,
 questions jsonb not null,
 run jsonb not null,
 choices jsonb,
 result jsonb,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '2 hours',
 submitted_at timestamptz
);
create index companion_sessions_user_created on public.companion_practice_sessions(user_id,created_at desc);
alter table public.companion_practice_sessions enable row level security;
revoke all on public.companion_practice_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.companion_practice_sessions to service_role;

create function public.companion_submit_practice(p_user_id uuid,p_session_id uuid,p_choices jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.companion_practice_sessions; q jsonb; answer_item jsonb; events jsonb; details jsonb:='[]'::jsonb; n int; i int; picked int; correct_count int:=0; now_ms bigint; report jsonb;
begin
 select * into s from public.companion_practice_sessions where id=p_session_id and user_id=p_user_id for update;
 if not found then raise exception 'Practice set not found.'; end if;
 if s.submitted_at is not null then
   if s.choices<>p_choices then raise exception 'This practice set was already submitted with different answers.'; end if;
   return s.result;
 end if;
 if s.expires_at<now() then raise exception 'Practice set expired. Start a new set.'; end if;
 n:=jsonb_array_length(s.questions);
 if p_choices is null or jsonb_typeof(p_choices)<>'array' or jsonb_array_length(p_choices)<>n then raise exception 'Answer every question using its zero-based choice index.'; end if;
 now_ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
 events:=jsonb_build_array(s.run);
 for i in 0..n-1 loop
   q:=s.questions->i;
   if jsonb_typeof(p_choices->i)<>'number' or (p_choices->>i)!~'^[0-9]+$' then raise exception 'Invalid choice index.'; end if;
   picked:=(p_choices->>i)::int;
   if picked<0 or picked>=jsonb_array_length(q->'choices') then raise exception 'Choice index out of range.'; end if;
   if picked=(q->>'answer')::int then correct_count:=correct_count+1; end if;
   answer_item:=jsonb_build_object('id',s.id::text||'-answer-'||i,'type','answer','run',s.id::text,'moduleId',s.module_id,'questionId',q->>'id','choice',picked,'correct',picked=(q->>'answer')::int,'at',now_ms+i,'source','chemwaypoint-companion');
   events:=events||jsonb_build_array(answer_item);
   details:=details||jsonb_build_array(jsonb_build_object('questionId',q->>'id','question',q->>'question','choice',picked,'correct',picked=(q->>'answer')::int,'correctChoice',(q->>'answer')::int,'explanation',q->>'explanation','callback',q->'callback'));
 end loop;
 events:=events||jsonb_build_array(jsonb_build_object('id',s.id::text||'-finish','type','finish','run',s.id::text,'moduleId',s.module_id,'at',now_ms+n,'source','chemwaypoint-companion'));
 insert into public.learner_state(user_id,state_key,state_value,updated_at)
 values(p_user_id,'chematlas-assessment-events-v1',events,now())
 on conflict(user_id,state_key) do update set state_value=(
 select coalesce(jsonb_agg(item),'[]'::jsonb) from (
 select distinct on(e->>'id') e as item from jsonb_array_elements(
 (case when jsonb_typeof(learner_state.state_value)='array' then learner_state.state_value else '[]'::jsonb end)||excluded.state_value) with ordinality x(e,position)
 order by e->>'id',position) deduplicated),updated_at=now();
 report:=jsonb_build_object('sessionId',s.id,'moduleId',s.module_id,'correct',correct_count,'total',n,'details',details,'saved',true,'savedTo','ChemWaypoint learner_state','mode',s.run->>'mode','eligibleSpacedReview',s.run->'eligible','completedAt',now_ms+n,'url','https://www.chemwaypoint.com/progress');
 update public.companion_practice_sessions set choices=p_choices,result=report,submitted_at=now() where id=s.id;
 return report;
end;
$$;
revoke all on function public.companion_submit_practice(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.companion_submit_practice(uuid,uuid,jsonb) to service_role;


