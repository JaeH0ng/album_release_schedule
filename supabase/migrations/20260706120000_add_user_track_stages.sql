-- 곡별 현재 제작 단계(데모/편곡/녹음/믹스/완료)를 계정에 동기화하는 개인 상태 테이블.
-- track_number는 로컬 폴백 곡·관리자 추가 곡의 번호를 모두 담을 수 있어 album_tracks에
-- FK를 걸지 않는다(user_event_plans와 동일한 개인 오버레이 정책 — 게시 곡 목록과 독립).
-- 기본값(demo)인 곡은 행을 만들지 않고, demo로 돌아오면 행을 삭제한다(빈 항목=행 없음).
create table if not exists public.user_track_stages (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_number text not null,
  stage text not null default 'demo' check (stage in ('demo', 'arrange', 'record', 'mix', 'done')),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, track_number)
);

alter table public.user_track_stages enable row level security;

grant select, insert, update, delete on public.user_track_stages to authenticated;

drop policy if exists "Users can read own track stages" on public.user_track_stages;
create policy "Users can read own track stages"
on public.user_track_stages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own track stages" on public.user_track_stages;
create policy "Users can insert own track stages"
on public.user_track_stages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own track stages" on public.user_track_stages;
create policy "Users can update own track stages"
on public.user_track_stages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own track stages" on public.user_track_stages;
create policy "Users can delete own track stages"
on public.user_track_stages
for delete
to authenticated
using (auth.uid() = user_id);
