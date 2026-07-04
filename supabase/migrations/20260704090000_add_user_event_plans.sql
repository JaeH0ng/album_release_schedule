-- 개인 계획(당겨오기 overrideDate·수동 순서·완료 체크)을 계정에 동기화하는 테이블.
-- event_id는 로컬 폴백 일정·트랙 팔로우업 같은 합성 id도 담을 수 있어
-- album_events에 FK를 걸지 않는다(개인 오버레이 — 게시 일정과 독립).
create table if not exists public.user_event_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  focus_status text not null default 'none' check (focus_status in ('none', 'accepted', 'hold', 'dismissed')),
  override_date date,
  plan_order integer,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, event_id)
);

alter table public.user_event_plans enable row level security;

grant select, insert, update, delete on public.user_event_plans to authenticated;

drop policy if exists "Users can read own event plans" on public.user_event_plans;
create policy "Users can read own event plans"
on public.user_event_plans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own event plans" on public.user_event_plans;
create policy "Users can insert own event plans"
on public.user_event_plans
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own event plans" on public.user_event_plans;
create policy "Users can update own event plans"
on public.user_event_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own event plans" on public.user_event_plans;
create policy "Users can delete own event plans"
on public.user_event_plans
for delete
to authenticated
using (auth.uid() = user_id);
