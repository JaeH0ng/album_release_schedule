-- 2026-07-18: '제4회 진주가인가요제'(grounz-5847) 활성 후보에서 제외.
-- 사유: 진주 출신 원로 작곡가 5인의 기성곡 커버/헌정 가요제로, 미발표 자작곡 경연이
--       아니라 싱어송라이터 성격에 부적합(적대적 재검증 결과). 예전 GROUNZ 자동수집으로
--       watch 상태로 남아 있어 공모전 탭에 계속 노출되던 항목이다.
-- 방식: GROUNZ 수집기의 이탈 처리와 동일하게 삭제가 아닌 status='closed' 로 내린다.
update public.singer_songwriter_opportunities
set
  status = 'closed',
  fit_label = '낮음',
  fit_score = 1,
  source_note = '커버/헌정 가요제로 싱어송라이터 부적합 판정 · 활성 후보 제외 (2026-07-18)',
  last_checked_at = timezone('utc'::text, now())
where id = 'grounz-5847';
