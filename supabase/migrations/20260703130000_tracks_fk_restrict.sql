-- Blocker 방지: album_tracks.event_id 의 on delete cascade 를 restrict 로 바꾼다.
-- 연결 곡이 있는 이벤트를 실수로 삭제해도 곡이 조용히 함께 사라지지 않게 한다.
-- (schedule:sync 의 prune 은 album_tracks 를 먼저 삭제하므로 cascade 에 의존하지 않는다.)

alter table public.album_tracks drop constraint if exists album_tracks_event_id_fkey;

alter table public.album_tracks
  add constraint album_tracks_event_id_fkey
  foreign key (event_id) references public.album_events(id) on delete restrict;
