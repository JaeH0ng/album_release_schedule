# Supabase 웹 연동 개발 계획

## 목표

- 2026-12-04 발매일과 2026-11-13 유통사 전달 마감을 계속 눈에 띄게 보여준다.
- 휴대폰으로 수시 확인할 수 있는 모바일 친화형 웹사이트를 만든다.
- 일정과 곡 상태는 Supabase에서 읽어와 여러 기기에서 같은 게시 일정을 본다.
- 체크박스 완료 상태는 우선 각 기기 브라우저에 저장해 가볍게 사용한다.

## 구현 범위

1. 기존 정적 캘린더를 유지하면서 Supabase REST API 읽기 연동을 추가한다.
2. `album_events`, `album_tracks` 테이블을 만들고 단일 소스 `schedule-data.js`에서 생성한 시드를 넣는다(`npm run schedule:sync`).
3. 모바일에서 표를 카드형으로 읽기 쉽게 바꾸고 새로고침 버튼, 동기화 상태, 홈 화면 추가용 PWA 메타데이터를 넣는다.
4. 배포용 `dist/` 빌드를 만들고 문서와 가사 기준본만 함께 복사한다.

## 데이터 원칙

- 일정 변경 시 기준 문서는 계속 `docs/SCHEDULE.md`, `docs/DEMO_PLAN.md`, `docs/TRACK_STATUS.md`다.
- 일정/곡 데이터의 단일 소스는 `schedule-data.js`다. 브라우저(`app.js`)와 SQL 생성기(`scripts/build-schedule-sql.mjs`)가 이 파일을 공유하므로, `app.js` 배열이나 시드 SQL을 손으로 이중 관리하지 않는다. 반영은 `npm run schedule:sync`.
- 런타임 소스는 Supabase다. 관리자 로그인(`admin_users`) 시 화면에서 `album_events`/`album_tracks`를 라이브로 편집하며, `schedule-data.js`는 시드·오프라인 폴백 역할이다.
- 가사는 `lyrics` 폴더 기준본을 유지하고 임의 수정하지 않는다.

## 개발 순서

1. 프런트엔드에 Supabase 읽기 연동과 동기화 UI를 붙인다.
2. 모바일 레이아웃과 PWA 메타데이터를 정리한다.
3. **정식 전체 초기화는 `supabase/migrations`를 `npm run supabase:sync`(= `supabase db push`)로 적용**한다. 이 경로가 관리자 쓰기 RLS와 `on delete restrict` FK까지 최종 상태로 만든다. `supabase/setup_album_calendar.sql`은 관리자 권한이 없는 읽기 전용 빠른 시작/역사적 시드일 뿐이다.
4. 시드/일정 반영은 `npm run schedule:sync`(단일 소스 `schedule-data.js` 기준)로 한다.
5. `npm run build`로 정적 배포본을 만들고, 정적 호스트에 `dist/`를 배포한다. Supabase는 데이터 백엔드로 유지한다.

## 배포 메모

- Supabase는 이번 구조에서 데이터 백엔드 역할에 집중한다.
- 프런트엔드 호스팅은 정적 호스트가 더 안정적이다.
- 필요하면 `dist/`를 별도 호스트에 올리고, 사이트는 Supabase URL과 publishable key로 데이터를 읽는다.
