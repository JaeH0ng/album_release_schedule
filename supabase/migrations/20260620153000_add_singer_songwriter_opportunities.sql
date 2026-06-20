create table if not exists public.singer_songwriter_opportunities (
  id text primary key,
  sort_order integer,
  title text not null,
  host text not null,
  application_open date,
  deadline date,
  status text not null check (status in ('open', 'watch', 'closed')),
  fit_label text not null,
  fit_score integer not null default 0,
  summary text not null,
  preparation text not null,
  official_url text not null,
  source_note text,
  last_checked_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.singer_songwriter_opportunities enable row level security;

grant select on public.singer_songwriter_opportunities to anon, authenticated;

drop policy if exists "Public can read singer songwriter opportunities" on public.singer_songwriter_opportunities;
create policy "Public can read singer songwriter opportunities"
on public.singer_songwriter_opportunities
for select
to anon, authenticated
using (true);

insert into public.singer_songwriter_opportunities (
  id,
  sort_order,
  title,
  host,
  application_open,
  deadline,
  status,
  fit_label,
  fit_score,
  summary,
  preparation,
  official_url,
  source_note,
  last_checked_at
)
values
  (
    'yjh-2026',
    10,
    '제37회 유재하음악경연대회',
    '유재하음악장학회',
    '2026-06-12',
    '2026-07-03',
    'open',
    '아주 잘 맞음',
    5,
    '모든 장르의 싱어송라이터를 대상으로 하는 대표 자작곡 경연. 미발표 창작곡 mp3와 실연 영상이 필요하다.',
    '대표 자작곡 1곡 선정, mp3 정리, 라이브 영상 링크 준비, 곡 소개 문장 초안 작성',
    'https://yjh.or.kr/application',
    '유재하음악장학회 공식 공고 확인',
    '2026-06-20T10:30:00+09:00'
  ),
  (
    'ebs-hellorookie-watch',
    20,
    'EBS 헬로루키',
    'EBS 스페이스 공감',
    null,
    null,
    'watch',
    '잘 맞음',
    4,
    '신인 창작 뮤지션 발굴 프로젝트. 자작곡 기반 아티스트에게 적합하지만 회차별 공고 시점 확인이 필요하다.',
    '라이브 영상과 대표곡 링크를 바로 제출할 수 있게 정리해두기',
    'https://about.ebs.co.kr/kor/pr/release?boardId=31&boardTypeId=1&cmd=view&no=1&pageNo=1&postId=30004974029',
    'EBS 공식 보도자료 기준, 다음 회차 공고 모니터링',
    '2026-06-20T10:30:00+09:00'
  ),
  (
    'hiddenstage-2026',
    30,
    '2026 히든스테이지',
    '히든스테이지',
    '2026-03-16',
    '2026-04-24',
    'closed',
    '잘 맞음',
    4,
    '싱어송라이터 성격과는 잘 맞지만 올해 모집은 종료. 다음 시즌 재오픈 여부를 추적하기 좋은 항목이다.',
    '내년 재오픈 전에 대표곡과 라이브 촬영본 업데이트',
    'https://hiddenstage.co.kr/',
    '공식 사이트 기준 2026 모집 종료',
    '2026-06-20T10:30:00+09:00'
  )
on conflict (id) do update
set
  sort_order = excluded.sort_order,
  title = excluded.title,
  host = excluded.host,
  application_open = excluded.application_open,
  deadline = excluded.deadline,
  status = excluded.status,
  fit_label = excluded.fit_label,
  fit_score = excluded.fit_score,
  summary = excluded.summary,
  preparation = excluded.preparation,
  official_url = excluded.official_url,
  source_note = excluded.source_note,
  last_checked_at = excluded.last_checked_at;
