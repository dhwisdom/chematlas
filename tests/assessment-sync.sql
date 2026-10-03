begin;
insert into auth.users(id,email) values ('ad035ab0-12cb-49c7-938d-e6c50b580101','assessment-test@example.invalid');
select set_config('request.jwt.claims','{"sub":"ad035ab0-12cb-49c7-938d-e6c50b580101","role":"authenticated"}',true);
set local role authenticated;
do $$ declare merged jsonb; begin
  perform public.merge_assessment_events('[{"id":"a","moduleId":"measurement","type":"start","at":100}]');
  merged := public.merge_assessment_events('[{"id":"b","moduleId":"atoms-moles","type":"start","at":200}]');
  if jsonb_array_length(merged)<>2 then raise exception 'Lost cross-device evidence'; end if;
  merged := public.merge_assessment_events('[{"id":"a","moduleId":"measurement","type":"start","at":999}]');
  if jsonb_array_length(merged)<>2 or not merged @> '[{"id":"a","at":100}]'::jsonb then raise exception 'Duplicate overwrote immutable evidence'; end if;
  if has_function_privilege('anon','public.merge_assessment_events(jsonb)','EXECUTE') then raise exception 'Anonymous execution permitted'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"ad035ab0-12cb-49c7-938d-e6c50b580102","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.learner_state where user_id='ad035ab0-12cb-49c7-938d-e6c50b580101') then raise exception 'Other learner history exposed'; end if;
end $$;
reset role;
rollback;
