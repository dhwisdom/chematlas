-- Append assessment evidence atomically so two devices cannot replace each other's attempts.
-- Uses the existing owner-only learner_state policies, without privileged execution.
create function public.merge_assessment_events(p_events jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to sync progress.' using errcode='42501'; end if;
  if p_events is null or jsonb_typeof(p_events)<>'array' then raise exception 'Expected an event array.'; end if;
  if octet_length(p_events::text)>5000000 then raise exception 'Event payload is too large.'; end if;
  if exists(select 1 from jsonb_array_elements(p_events) e where jsonb_typeof(e)<>'object'
    or coalesce(e->>'id','')='' or coalesce(e->>'moduleId','')=''
    or coalesce(e->>'type','') not in ('start','answer','finish')
    or coalesce(jsonb_typeof(e->'at'),'null')<>'number') then raise exception 'Invalid assessment event.'; end if;
  insert into public.learner_state(user_id,state_key,state_value,updated_at)
  values(auth.uid(),'chematlas-assessment-events-v1',
    (select coalesce(jsonb_agg(item),'[]'::jsonb) from
      (select distinct on (e->>'id') e as item from jsonb_array_elements(p_events) e order by e->>'id') deduplicated),now())
  on conflict(user_id,state_key) do update set
    state_value=(select coalesce(jsonb_agg(item),'[]'::jsonb) from
      (select distinct on (e->>'id') e as item
       from jsonb_array_elements(
         (case when jsonb_typeof(learner_state.state_value)='array' then learner_state.state_value else '[]'::jsonb end)
         || excluded.state_value) with ordinality as x(e,position)
       order by e->>'id',position) deduplicated),
    updated_at=now()
  returning state_value into result;
  return result;
end;
$$;
revoke all on function public.merge_assessment_events(jsonb) from public,anon;
grant execute on function public.merge_assessment_events(jsonb) to authenticated;
