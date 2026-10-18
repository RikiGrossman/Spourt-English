-- Spourt English – database for the Supabase backend (static site + Android app).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to run again: every statement is idempotent.

-- Display names, filled from the sign-up metadata by the trigger below.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  created_at timestamptz not null default now()
);

-- One progress document per learner (same shape as the app's Progress type).
create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- XP earned, for the weekly league. Capped per row like the Express server.
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  xp integer not null check (xp between 0 and 50),
  created_at timestamptz not null default now()
);
create index if not exists xp_events_created_at on public.xp_events (created_at);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.xp_events enable row level security;

-- Learners only ever see and change their own rows.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- XP rows can only be added (no reading other learners' rows, no edits).
drop policy if exists "add own xp" on public.xp_events;
create policy "add own xp" on public.xp_events
  for insert with check (user_id = auth.uid());

-- Creates the profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)), 30)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Top 20 learners by XP over the last 7 days. Exposes display names only (never emails).
create or replace function public.weekly_leaderboard()
returns table (rank integer, display_name text, weekly_xp bigint, is_me boolean)
language sql
stable
security definer set search_path = ''
as $$
  select
    (row_number() over (order by sum(e.xp) desc, max(e.created_at) asc))::integer,
    p.display_name,
    sum(e.xp)::bigint,
    coalesce(e.user_id = auth.uid(), false)
  from public.xp_events e
  join public.profiles p on p.id = e.user_id
  where e.created_at >= now() - interval '7 days'
  group by e.user_id, p.display_name
  having sum(e.xp) > 0
  order by 1
  limit 20;
$$;

grant execute on function public.weekly_leaderboard() to anon, authenticated;
