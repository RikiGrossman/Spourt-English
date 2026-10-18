-- Acceptance checks for the Supabase SQL (docs/spec/v2.md §9): run by supabase/tests/run.sh
-- after 00-stub-auth.sql, schema.sql, analytics-views.sql and analytics-seed.sql.
-- Every check raises an exception when it fails, so psql -v ON_ERROR_STOP=1 exits non-zero.
\set ON_ERROR_STOP 1

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000000000a', 'a@example.com', '{"display_name":"Learner A"}'),
  ('00000000-0000-4000-8000-00000000000b', 'b@example.com', '{"display_name":"Learner B"}')
on conflict do nothing;

-- US-U1 AC7: an old client saving progress without u7l1 keeps it (trigger keep_completed_lessons).
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000a', false);
insert into public.progress (user_id, data)
values ('00000000-0000-4000-8000-00000000000a', '{"xp":100,"completed":{"u1l1":1,"u7l1":1}}');
update public.progress set data = '{"xp":110,"completed":{"u1l1":2}}'
where user_id = '00000000-0000-4000-8000-00000000000a';
do $$ declare c jsonb; begin
  select data -> 'completed' into c from public.progress where user_id = '00000000-0000-4000-8000-00000000000a';
  if c is distinct from '{"u1l1":2,"u7l1":1}'::jsonb then raise exception 'US-U1 AC7 failed: %', c; end if;
end $$;

-- US-R6 AC1/AC2/AC3: merge_srs – newer last wins, equal last keeps the lower box and max seen/wrong,
-- invalid keys, box 7 and a due date two years ahead are skipped.
select count(*) from public.merge_srs(jsonb_build_object(
  'w:dog', jsonb_build_object('box', 3, 'due', current_date::text, 'seen', 2, 'wrong', 0, 'last', 100),
  's:u1l1:0', jsonb_build_object('box', 2, 'due', current_date::text, 'seen', 1, 'wrong', 1, 'last', 50)));
select count(*) from public.merge_srs(jsonb_build_object(
  'w:dog', jsonb_build_object('box', 1, 'due', current_date::text, 'seen', 3, 'wrong', 1, 'last', 200),
  's:u1l1:0', jsonb_build_object('box', 4, 'due', current_date::text, 'seen', 5, 'wrong', 0, 'last', 50),
  'bad key', jsonb_build_object('box', 1, 'due', current_date::text, 'seen', 1, 'wrong', 0, 'last', 1),
  'w:seven', jsonb_build_object('box', 7, 'due', current_date::text, 'seen', 1, 'wrong', 0, 'last', 1),
  'w:later', jsonb_build_object('box', 1, 'due', (current_date + 730)::text, 'seen', 1, 'wrong', 0, 'last', 1)));
do $$ declare r record; n int; begin
  select * into r from public.srs_state where item_key = 'w:dog';
  if r.box <> 1 or r.last <> 200 or r.seen <> 3 or r.wrong <> 1 then raise exception 'US-R6 AC1 failed: %', r; end if;
  select * into r from public.srs_state where item_key = 's:u1l1:0';
  if r.box <> 2 or r.seen <> 5 or r.wrong <> 1 then raise exception 'US-R6 AC2 failed: %', r; end if;
  select count(*) into n from public.srs_state;
  if n <> 2 then raise exception 'US-R6 AC3 failed: % rows', n; end if;
end $$;
do $$ begin
  perform public.merge_srs('[1,2]'::jsonb);
  raise exception 'US-R6 AC3 failed: a non-object body was accepted';
exception when raise_exception then
  if sqlerrm <> 'invalid_srs' then raise; end if;
end $$;

-- US-R6 AC4: learner B sees none of A's rows.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000b', false);
do $$ declare n int; begin
  select count(*) into n from public.srs_state;
  if n <> 0 then raise exception 'US-R6 AC4 failed: B sees % rows', n; end if;
  select count(*) into n from public.merge_srs('{}'::jsonb);
  if n <> 0 then raise exception 'US-R6 AC4 failed: merge_srs returned % rows to B', n; end if;
end $$;
reset role;

-- US-T1 AC6: anon can insert an event but cannot read any row of events (or the views).
set role anon;
select set_config('request.jwt.claim.sub', '', false);
insert into public.events (anon_id, name, client_ts, local_date, local_hour, platform)
values ('11111111-1111-4111-8111-111111111111', 'app_open', now(), current_date, 9, 'web');
do $$ declare n int; begin
  select count(*) into n from public.events;
  if n <> 0 then raise exception 'US-T1 AC6 failed: anon reads % events', n; end if;
end $$;
do $$ begin
  perform 1 from public.v_lesson_funnel limit 1;
  raise exception 'US-T1 AC6 failed: anon can read v_lesson_funnel';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into public.events (anon_id, user_id, name, client_ts, local_date, local_hour, platform)
  values ('11111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-00000000000a', 'app_open',
          now(), current_date, 9, 'web');
  raise exception 'US-T1 AC6 failed: anon inserted an event for another user';
exception when insufficient_privilege then null;
end $$;
reset role;

-- US-T1 AC7: every view of §8.5 runs on the seed data.
do $$ declare v text; n bigint; begin
  foreach v in array array['v_daily_active', 'v_cohort_retention', 'v_lesson_funnel', 'v_item_difficulty',
                           'v_exercise_type_accuracy', 'v_error_code_accuracy', 'v_review_engagement',
                           'v_signup_funnel'] loop
    execute format('select count(*) from public.%I', v) into n;
    raise notice '% rows: %', v, n;
  end loop;
end $$;
do $$ declare n bigint; begin
  select count(*) into n from public.v_lesson_funnel;
  if n = 0 then raise exception 'US-T1 AC7 failed: v_lesson_funnel is empty on the seed'; end if;
end $$;

select 'supabase acceptance: all checks passed' as result;
