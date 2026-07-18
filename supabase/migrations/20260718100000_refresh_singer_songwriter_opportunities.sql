-- 싱어송라이터 공모전 후보 최신화 (2026-07-18 기준)
-- 기존 시드(yjh-2026 / ebs-hellorookie-watch / hiddenstage-2026)의 상태를 현재에 맞게 갱신하고,
-- GROUNZ 자동수집 후 공식 소스로 검증한 자작곡 성격 신규 후보 2건을 upsert 한다.
--   * 기존 id는 개인 판단 상태(수락/보류/제외) 보존을 위해 그대로 유지한다.
--   * 신규 항목은 GROUNZ id 공간(grounz-*)을 그대로 써서 이후 자동수집이 이어받게 한다.
-- 출처: 유재하 yjh.or.kr / EBS 스페이스 공감 / 히든스테이지 공식 / 경산 Again(imweb) / 전일가요제(GGN)
-- app.js 의 defaultOpportunities 폴백과 값이 일치해야 한다.

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
    'grounz-5805',
    10,
    '제4회 경산 Again 대학가요제',
    '영남일보 (경산시·대구대학교 후원)',
    '2026-05-21',
    '2026-07-31',
    'open',
    '확인 필요',
    3,
    '대상 700만원의 창작곡 부문에 미발표 자작곡을 내는 대학가요제. 전국 대학 재학·휴학생만 참가할 수 있고 기성곡 부문이 병행되니 참가 자격을 먼저 확인해야 한다.',
    '미발표 창작곡 음원·실연 영상, 대학 재학/휴학 증빙, 공식 홈페이지 참가신청서',
    'https://gsacsf-mo.imweb.me/index',
    'GROUNZ 자동수집 후 공식(imweb) 확인 · 접수 5/21~7/31, 본선 9/16 대구대',
    '2026-07-18T00:00:00+09:00'
  ),
  (
    'grounz-5809',
    20,
    '2026 전일가요제 (VOC MUSIC FESTIVAL)',
    '글로벌광주방송(GGN)',
    '2026-06-01',
    '2026-09-06',
    'open',
    '잘 맞음',
    4,
    '광주 지역 가요제이지만 자작곡 1곡 의무 제출(AI 생성 금지)을 요구해 창작곡으로 도전할 수 있다. 월별 예선(6~9월 회차)을 거쳐 10월 5·18민주광장 최종 무대, 대상 500만원.',
    '자작곡 1곡(AI 생성 불가) + 자유곡 1곡, 남은 8·9월 회차 접수',
    'https://www.ggn.or.kr/bbs/view.do?bcId=comm_notice&baId=100972&menuNo=99',
    'GROUNZ 자동수집 후 공식(GGN) 확인 · 월별 회차, 최종 마감 9/6',
    '2026-07-18T00:00:00+09:00'
  ),
  (
    'ebs-hellorookie-watch',
    30,
    'EBS 헬로루키',
    'EBS 스페이스 공감',
    null,
    null,
    'watch',
    '잘 맞음',
    4,
    '4년 만에 부활한 EBS 스페이스 공감 신인 발굴 프로젝트. 2026년 5~9월 월별 공모의 마지막 회차 접수가 7/6 마감돼 올해 창구는 닫혔고, 앨범 이력이 없거나 2024년 이후 첫 정규/EP를 낸 신인 싱어송라이터라면 2027년 재개를 지켜본다.',
    '대표곡 MP3(또는 영상 URL)와 아티스트 소개를 다음 회차 공고 시 바로 접수할 수 있게 정리',
    'https://www.ebs.co.kr/space/rookie/audition',
    'EBS 스페이스 공감 공식 헬로루키 페이지 기준, 2027 재개 모니터링',
    '2026-07-18T00:00:00+09:00'
  ),
  (
    'yjh-2026',
    40,
    '제37회 유재하음악경연대회',
    '유재하음악장학회 (CJ문화재단)',
    '2026-06-12',
    '2026-07-03',
    'closed',
    '아주 잘 맞음',
    5,
    '국내 유일의 싱어송라이터 발굴 대중음악 경연(작사·작곡·편곡·연주 본인 수행). 제37회 접수가 7/3 마감돼 현재 신청은 닫혔고 본선은 11/7 예정이며, 다음 제38회는 2027년 중반쯤 열릴 것으로 보인다.',
    '제38회 공고(2027년 4~5월경) 전에 본인 작사·작곡·편곡·연주 자작곡 음원과 실연 영상 정리',
    'https://yjh.or.kr/application',
    '유재하음악장학회 공식 기준 · 제37회 접수 종료, 제38회 2027 예상',
    '2026-07-18T00:00:00+09:00'
  ),
  (
    'hiddenstage-2026',
    50,
    '2026 히든스테이지 (제4회)',
    '뉴스핌 · 감엔터테인먼트',
    '2026-03-16',
    '2026-04-24',
    'closed',
    '잘 맞음',
    4,
    '미발표 창작곡 싱어송라이터 등용문(참가비 무료). 제4회(2026) 접수는 4/24 마감돼 현재 본선이 진행 중이며, 매년 3월경 열리는 연례 대회라 제5회는 2027년 3월경 재오픈이 예상된다.',
    '제5회 공고(2027년 2~3월경) 전에 미발표 창작곡 음원(mp3)·실연 영상·가사지·프로필 갱신',
    'https://hiddenstage.co.kr/',
    '공식 사이트 기준 · 제4회 접수 종료·본선 진행, 제5회 2027 예상',
    '2026-07-18T00:00:00+09:00'
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
