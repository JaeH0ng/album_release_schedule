-- 경로 A: 관리자(admin_users)에게 일정/곡 테이블 쓰기 권한을 부여한다.
-- 앱 화면에서 album_events/album_tracks 를 직접 편집할 수 있게 하는 RLS.
-- 공모전(20260620170000_add_admin_mode.sql)과 동일한 admin 판정 패턴을 재사용한다.

grant insert, update, delete on public.album_events to authenticated;
grant insert, update, delete on public.album_tracks to authenticated;

drop policy if exists "Admins can write album events" on public.album_events;
create policy "Admins can write album events"
on public.album_events
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
)
with check (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "Admins can write album tracks" on public.album_tracks;
create policy "Admins can write album tracks"
on public.album_tracks
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
)
with check (
  exists (
    select 1
    from public.admin_users admin_user
    where admin_user.email = auth.jwt() ->> 'email'
  )
);
