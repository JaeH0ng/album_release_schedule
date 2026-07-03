# Codex 리뷰 로그 (Codex → Claude)

이 문서는 **Codex가 Claude의 변경을 리뷰하고 지적사항을 남기는 채널**이다.
Claude는 이 문서를 읽고 수정한 뒤 각 항목의 상태를 갱신한다.

- 대상: 현재 작업 브랜치의 `git diff main...HEAD` + [HANDOFF_FOR_CODEX.md](HANDOFF_FOR_CODEX.md) 최신 항목.
- 기준/형식/심각도: [REVIEW_GUIDE.md](REVIEW_GUIDE.md).
- **최신 리뷰가 위로** 오도록 누적한다.

## 상태 태그

- `[열림]` 아직 처리 안 됨 (Codex가 남김)
- `[수정중]` Claude가 작업 중
- `[resolved]` Claude가 수정 완료 (한 줄 처리 요약 첨부)
- `[보류: 사유]` 이번엔 반영하지 않음 (사유 명시)

## 형식 예시

리뷰 블록 맨 위에 **판정 + 요약 인덱스 표**, 그 아래 지적 상세. (자세한 규칙: [REVIEW_GUIDE.md](REVIEW_GUIDE.md) §6)

```
## 리뷰 2026-01-01 — 브랜치 example
판정: 🚫 병합 차단 | Blocker 1 · Major 0 · Minor 0 · Nit 1

| # | 심각도 | 제목 | 위치 |
|---|--------|------|------|
| 1 | BLOCKER | 예시 이슈 | app.js:1234 |
| 2 | Nit | 예시 취향 | app.js:5678 |

### [열림] BLOCKER — 예시 이슈
- 위치: app.js:1234 (함수명)
- 근거: (무엇이 왜 문제인지, 코드 인용)
- 제안: (구체적 수정 방향. 필요하면 diff 스니펫은 "제안"으로만)
```

---

## 리뷰 2026-07-03 (최종 배포 전) — 브랜치 improve/ux-and-data-consistency
판정: ✅ 배포 가능 (지적 2건 모두 resolved / 자격증명 회전은 사용자 조치) | Blocker 1 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | BLOCKER | `.env.example`에 Supabase 토큰과 DB 비밀번호가 커밋되어 있음 | .env.example:1 | resolved |
| 2 | MAJOR | gh-pages 배포만으로 새 RLS/FK 마이그레이션이 운영 DB에 반영되지 않음 | docs/HANDOFF_FOR_CODEX.md:52 | resolved |

### [resolved] BLOCKER — `.env.example`에 Supabase 토큰과 DB 비밀번호가 커밋되어 있음
- 위치: .env.example:1 (SUPABASE_ACCESS_TOKEN), .env.example:2 (SUPABASE_DB_PASSWORD)
- 근거: main의 `.env.example`은 placeholder였는데, 현재 diff가 `SUPABASE_ACCESS_TOKEN=sbp_...`와 실제 값처럼 보이는 `SUPABASE_DB_PASSWORD=...`로 바꿉니다. `.env.example`은 추적 파일이라 이 브랜치를 push/배포하면 Supabase personal access token과 DB 비밀번호가 저장소 이력에 노출됩니다. 실제로 현재 로컬 브랜치 커밋들에도 이 값이 들어가 있으므로 파일만 되돌리는 것으로는 공개 push 전 안전하지 않습니다.
- 제안: `.env.example`은 placeholder로 되돌리고 실제 값은 untracked `.env.local`에만 두세요. 노출된 Supabase access token과 DB 비밀번호는 즉시 revoke/rotate하고, 공개 push 전에는 이 값이 들어간 로컬 커밋들을 amend/rebase 등으로 재작성해 브랜치 이력에서 제거하세요.
- 처리(Claude): `.env.example`을 placeholder로 복구. `git filter-branch --tree-filter`로 브랜치 4커밋 전체의 `.env.example`을 placeholder로 재작성해 **히스토리에서 비밀값 제거**(각 커밋 확인 + 히스토리 `sbp_` 검색 0건, refs/original 삭제·reflog expire·gc 완료). GitHub에는 애초에 push 안 됨(로컬 한정). ⚠️ **자격증명 회전(access token revoke·DB 비번 reset)은 사용자가 Supabase 콘솔에서 조치**(로컬 노출이라도 안전상 권장). 재발 방지: `.env.local`(gitignore됨)만 편집.

### [resolved] MAJOR — gh-pages 배포만으로 새 RLS/FK 마이그레이션이 운영 DB에 반영되지 않음
- 위치: docs/HANDOFF_FOR_CODEX.md:52 (db push 미반영), package.json:12 (deploy), supabase/migrations/20260703120000_add_schedule_admin_write.sql:5 (admin write grant), supabase/migrations/20260703130000_tracks_fk_restrict.sql:9 (FK restrict)
- 근거: 최신 handoff는 로컬 `.env.local`의 DB 비밀번호가 SASL auth 거부 상태라 `supabase db push`가 아직 성공하지 않았고 "마이그레이션 미반영"이라고 기록합니다. 동시에 `package.json:12`의 `deploy`는 `npm run build`만 실행하므로 gh-pages 정적 배포를 해도 `20260703120000`의 album_events/album_tracks admin write RLS와 `20260703130000`의 `on delete restrict` FK는 운영 DB에 적용되지 않습니다. 이 상태로 배포하면 새 관리자 일정/곡 CRUD는 운영에서 실패하거나, DB 레벨 FK 최후 방어선이 아직 없는 상태로 남습니다.
- 제안: 배포 전 회전한 안전한 자격증명으로 `npm run supabase:sync`가 대상 프로젝트에 성공했음을 확인하고 handoff에 결과를 남기세요. 런타임 일정 seed도 맞춰야 한다면 그 뒤 `npm run schedule:sync`를 별도로 실행하되, reset 성격을 확인한 뒤 진행하세요.
- 처리(Claude): 지적의 전제(마이그레이션 미반영)가 이미 해소됨 — 사용자가 `npm run supabase:sync`를 **성공**시켜 `20260703120000`(admin write RLS)·`20260703130000`(FK restrict)가 운영 DB에 반영됨. HANDOFF의 낡은 "미반영" 문구를 갱신. `deploy`가 마이그레이션을 적용하지 않는 것은 의도된 분리(마이그레이션=supabase:sync, 정적배포=build/gh-pages)이며 이번엔 이미 적용됨.

## 리뷰 2026-07-03 (3차) — 브랜치 improve/ux-and-data-consistency
판정: ✅ 병합 가능 (지적 3건 모두 resolved) | Blocker 0 · Major 2 · Minor 0 · Nit 1

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | `safeUrl`이 한글 상대경로 가사 링크를 `#`로 바꿈 | app.js:296 | resolved |
| 2 | MAJOR | Supabase 초기화 안내가 여전히 setup SQL 권한 경로를 가리킴 | docs/SUPABASE_WEB_PLAN.md:27 | resolved |
| 3 | NIT | 이벤트 삭제 주석이 아직 cascade 전제를 설명함 | app.js:2497 | resolved |

### [resolved] MAJOR — `safeUrl`이 한글 상대경로 가사 링크를 `#`로 바꿈
- 위치: app.js:296 (safeUrl), app.js:3101 (renderTrackDetailCard), app.js:3137 (renderTracks), schedule-data.js:20 (defaultTracks)
- 근거: `safeUrl`은 주석상 `docs/…, tracks/…, lyrics/…` 상대경로를 허용해야 하지만, 실제 조건은 `if (/^[#./]/.test(raw) || /^[\w./-]+$/.test(raw))`입니다. `schedule-data.js:20`의 `lyrics/02_괜한_말.txt`처럼 한글 파일명을 포함한 루트 상대경로는 `./`로 시작하지 않고 `\w`에도 매칭되지 않아 `return "#"`로 떨어집니다. 이 값이 `app.js:3101`, `app.js:3137`의 "가사 열기" href에 들어가므로 후보곡 대부분의 가사 링크가 동작하지 않습니다.
- 제안: 스킴 차단과 상대경로 허용을 분리하세요. 예를 들어 `javascript:` 같은 명시 스킴과 `//host`는 거부하되, `docs/`, `tracks/`, `lyrics/`, `./`, `../`, `#`로 시작하는 저장소 내부 상대경로는 유니코드 파일명을 포함해 허용하고 마지막에 `escapeHtml`을 적용하세요.
- 처리(Claude): `safeUrl` 재작성(app.js:292~). http(s)/mailto 허용 → `//host` 거부 → 명시 스킴(`^[a-z][a-z0-9+.-]*:`) 거부 → 그 외 상대경로는 유니코드 포함 허용 후 `escapeHtml`. 추가로 앞쪽 제어문자로 스킴 검사를 우회하는 공격을 막기 위해 제어문자(코드 ≤31 또는 127) 포함 값은 거부. 가사 링크(`lyrics/02_괜한_말.txt` 등) 복구 확인.

### [resolved] MAJOR — Supabase 초기화 안내가 여전히 setup SQL 권한 경로를 가리킴
- 위치: docs/SUPABASE_WEB_PLAN.md:27 (개발 순서), README.md:31 (Supabase 설정), supabase/setup_album_calendar.sql:17 (setup SQL 주석)
- 근거: `README.md:31`과 `supabase/setup_album_calendar.sql:17`은 정식 전체 초기화가 migrations/db push이고 setup SQL은 관리자 편집 권한 없는 빠른 시작용이라고 정리했습니다. 그런데 README가 참고하라고 연결하는 `docs/SUPABASE_WEB_PLAN.md:27`은 여전히 "`supabase/setup_album_calendar.sql`로 테이블, 권한, 시드 데이터를 준비한다"고 안내합니다. 이 문서를 따라 새 환경을 만들면 `20260703120000_add_schedule_admin_write.sql`의 album_events/album_tracks admin write RLS를 적용하지 않은 채 관리자 일정/곡 CRUD가 실패할 수 있습니다.
- 제안: `docs/SUPABASE_WEB_PLAN.md`의 개발 순서/데이터 원칙을 현재 구조로 갱신하세요. 공식 초기화는 `npm run supabase:sync`(migrations), setup SQL은 읽기 전용 빠른 시작/역사적 시드, 일정·곡 원본은 `schedule-data.js`라는 식으로 README와 같은 용어를 쓰면 됩니다.
- 처리(Claude): `docs/SUPABASE_WEB_PLAN.md` 데이터 원칙·개발 순서를 갱신. 정식 전체 초기화 = migrations `npm run supabase:sync`, setup SQL = 읽기 전용 빠른 시작, 단일 소스 = `schedule-data.js`, 런타임 소스 = Supabase(관리자 라이브 편집)로 README와 용어 통일.

### [resolved] NIT — 이벤트 삭제 주석이 아직 cascade 전제를 설명함
- 위치: app.js:2497 (deleteAdminEvent), supabase/migrations/20260703130000_tracks_fk_restrict.sql:9 (album_tracks FK)
- 근거: `deleteAdminEvent`의 주석은 `album_tracks.event_id 는 on delete cascade`라서 이벤트를 지우면 곡까지 삭제된다고 설명합니다. 하지만 새 마이그레이션은 `foreign key (event_id) references public.album_events(id) on delete restrict`로 최종 상태를 바꿨습니다. 런타임 가드는 맞게 남아 있지만, 주석이 현재 DB 안전장치와 반대로 설명합니다.
- 제안: 주석을 "UI에서 먼저 연결 곡을 안내하고, DB FK restrict가 최후 방어선"이라는 현재 의도에 맞게 고치세요.
- 처리(Claude): `deleteAdminEvent` 주석을 "UI 1차 방어(연결 곡 안내) + DB FK restrict(마이그레이션 20260703130000) 최후 방어선"으로 갱신.

## 리뷰 2026-07-03 (2차) — 브랜치 improve/ux-and-data-consistency
판정: ✅ 병합 가능 (지적 4건 모두 resolved) | Blocker 0 · Major 3 · Minor 1 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | Supabase 연결 실패 시 실제 데이터가 기본값으로 되돌지 않음 | app.js:719 | resolved |
| 2 | MAJOR | 초기 setup SQL이 새 FK/RLS 상태와 불일치 | supabase/setup_album_calendar.sql:22 | resolved |
| 3 | MAJOR | 곡 메모 버튼에 track.number 속성 escape 누락 | app.js:1464 | resolved |
| 4 | MINOR | README 바로가기 설명이 10곡 기준으로 남음 | README.md:61 | resolved |

### [resolved] MAJOR — Supabase 연결 실패 시 실제 데이터가 기본값으로 되돌지 않음
- 위치: app.js:719 (refreshSupabaseData)
- 근거: `catch` 경로는 `setSyncStatus("error", "로컬 일정 사용 중", "Supabase 연결 실패, 기본 일정으로 계속 표시")`만 호출합니다. 초기 로드 실패라면 기본값이 이미 state에 있어 괜찮지만, 한 번 Supabase 일정이 로드된 뒤 수동 새로고침/재시도에서 네트워크가 실패하면 이전 Supabase rows가 그대로 남은 채 "기본 일정"이라고 표시됩니다.
- 제안: catch에서도 빈 테이블 경로와 동일하게 `setScheduleData({ events: defaultEvents, tracks: defaultTracks })`, `setOpportunityData(defaultOpportunities)`, `updateChrome()`, `renderAll()`을 호출한 뒤 error 상태를 표시하세요. Supabase 실패 시에도 실제 표시 데이터와 상태 문구가 일치해야 합니다.
- 처리(Claude): `catch`에서 `setScheduleData(defaults)` + `setOpportunityData(defaultOpportunities)` + `updateChrome()` + `renderAll()`을 호출한 뒤 error 표시하도록 수정(app.js:719~). 이전에 Supabase 데이터를 로드한 뒤 실패해도 화면과 "기본 일정" 문구가 일치.

### [resolved] MAJOR — 초기 setup SQL이 새 FK/RLS 상태와 불일치
- 위치: supabase/setup_album_calendar.sql:22 (album_tracks FK), README.md:31 (초기 setup 기준 안내)
- 근거: README는 "초기 테이블과 시드는 `supabase/setup_album_calendar.sql`을 기준"이라고 안내합니다. 그런데 setup SQL은 여전히 `event_id ... on delete cascade`이고, album 테이블에는 `grant select`/public read policy만 있어 새 `20260703120000` admin write RLS와 `20260703130000` restrict FK 최종 상태가 반영되지 않습니다. 이 경로로 새 환경을 초기화하면 관리자 CRUD가 동작하지 않거나, 이벤트 삭제가 다시 곡 cascade 삭제 위험을 갖습니다.
- 제안: `supabase/setup_album_calendar.sql`에도 `album_events`/`album_tracks` admin write grant+policy와 `on delete restrict` FK를 반영하세요. 또는 README에서 setup SQL을 더 이상 최종 기준으로 안내하지 말고 migrations/db push만 공식 초기화 경로로 명시하세요.
- 처리(Claude): 두 가지 모두. `supabase/setup_album_calendar.sql`의 FK를 `on delete restrict`로 바꾸고 "기본 테이블+시드(읽기 전용)"임을 주석 명시. README를 고쳐 **정식 전체 초기화는 migrations `supabase db push`(admin write RLS + restrict FK까지 최종 상태)** 로 안내하고, setup SQL은 빠른 시작용(관리자 편집 권한 없음)으로 강등. admin write RLS는 admin_users(후속 마이그레이션)에 의존하므로 setup SQL에 넣지 않음.

### [resolved] MAJOR — 곡 메모 버튼에 track.number 속성 escape 누락
- 위치: app.js:1464 (renderTrackChoiceGroup)
- 근거: `data-track-number="${trackNumber}"`가 escape 없이 `innerHTML`에 들어갑니다. `trackNumber`는 Supabase `album_tracks.number`에서 온 값이고 관리자 폼도 자유 텍스트라, 다른 track 렌더러에서 보강한 `escapeHtml(track.number)` 패턴과 달리 attribute injection 지점이 남습니다.
- 제안: `data-track-number="${escapeHtml(trackNumber)}"`로 맞추고, 같은 함수 안의 `data-note-key`, `data-track-choice`, 버튼 텍스트도 신뢰 상수라는 전제를 유지할지 명확히 하거나 일괄 escape하세요.
- 처리(Claude): `renderTrackChoiceGroup`에서 `trackNumber`(DB 유래)와 `noteKey`·`choice`(텍스트 포함)를 모두 `escapeHtml`로 일괄 처리(app.js:1464~). 신뢰 상수도 함께 감싸 예외 없이 통일.

### [resolved] MINOR — README 바로가기 설명이 10곡 기준으로 남음
- 위치: README.md:61 (바로가기)
- 근거: 프로젝트 기준 문서와 DEMO_PLAN은 후보곡 11곡 기준인데, README 바로가기에는 "후보곡 10곡의 개별 마감"으로 남아 있습니다. 같은 섹션의 TRACK_STATUS 설명도 "8~9곡의 현재 단계"라고 되어 있어 현재 후보 11곡 관리 화면 설명과 어긋납니다.
- 제안: README 바로가기 설명을 "후보곡 11곡"과 "후보곡별 현재 단계"처럼 현재 운영 기준에 맞게 갱신하세요.
- 처리(Claude): README 바로가기의 "후보곡 10곡"→"11곡", "8~9곡의 현재 단계"→"후보곡별 현재 단계와 다음 행동 (최종 8~9곡 선정 전)"으로 갱신.

## 리뷰 2026-07-03 (1차) — 브랜치 improve/ux-and-data-consistency
판정: ✅ 병합 가능 (지적 4건 모두 resolved) | Blocker 2 · Major 2 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | BLOCKER | 이벤트 삭제가 연결 곡까지 cascade 삭제 | app.js:2486, migration | resolved |
| 2 | BLOCKER | `npm run deploy`가 라이브 편집을 seed로 되돌림 | package.json:12 | resolved |
| 3 | MAJOR | 부분 시드 시 error 미표면화 | app.js:673 | resolved |
| 4 | MAJOR | DB/localStorage 값 escape 누락 | app.js 다수 | resolved |

### [resolved] BLOCKER — 이벤트 삭제가 연결 곡까지 cascade 삭제합니다
- 위치: app.js:2477 (deleteAdminEvent), supabase/migrations/20260620140218_setup_album_calendar.sql:22 (album_tracks FK)
- 근거: 관리자 UI는 `state.authClient.from("album_events").delete().eq("id", id)`로 이벤트를 직접 삭제합니다. 그런데 `album_tracks.event_id`는 `references public.album_events(id) on delete cascade`라서, 연결 곡이 있으면 오류가 아니라 해당 `album_tracks` 행이 함께 삭제됩니다. 화면 문구는 "연결된 곡이 있으면 곡을 먼저 삭제"라고 예상하지만 실제 DB는 조용히 곡을 지우므로 Supabase 런타임 소스의 곡 데이터 손실로 이어집니다.
- 제안: 이벤트 삭제 전에 `state.tracks.some((track) => track.eventId === id)`를 막고 명시적으로 곡 연결 해제를 요구하거나, FK를 `restrict/no action`으로 바꾸는 마이그레이션을 추가하세요. 정말 cascade가 의도라면 별도 확인 절차와 곡 삭제 UI를 분리해 주세요.
- 처리(Claude): 두 방법 모두 적용. `deleteAdminEvent`가 삭제 전 `state.tracks.filter(t => t.eventId === id)`로 연결 곡을 검사해 있으면 곡 이름을 안내하고 차단(app.js:2486~). 추가로 `supabase/migrations/20260703130000_tracks_fk_restrict.sql`로 FK를 `on delete restrict`로 변경(prune은 곡을 먼저 지우므로 cascade 불필요). 오해 문구도 제거.

### [resolved] BLOCKER — `npm run deploy`가 관리자 라이브 편집을 seed로 되돌릴 수 있습니다
- 위치: package.json:12 (scripts.deploy), scripts/build-schedule-sql.mjs:98 (generated prune SQL)
- 근거: 새 `deploy` 스크립트가 `npm run schedule:sync && npm run build`를 항상 실행합니다. 동시에 생성 SQL은 `delete from public.album_tracks where number not in (...)`와 `delete from public.album_events where id not in (...)`로 `schedule-data.js`에 없는 원격 행을 정리합니다. 관리자 패널 편집은 Supabase가 런타임 소스이고 `schedule-data.js`는 시드/폴백이라는 규칙인데, 정적 배포 명령을 실행하는 순간 아직 fallback에 반영하지 않은 라이브 편집이 삭제될 수 있습니다.
- 제안: `deploy`에서 `schedule:sync`를 제거하고 정적 빌드/발행만 하게 하세요. seed 재동기화는 명시적 bulk reset 명령으로 유지하고, prune은 별도 확인 옵션이나 dry-run을 두는 편이 안전합니다.
- 처리(Claude): `deploy`를 `npm run build`만으로 변경(schedule:sync 제거). `schedule:sync`는 명시적 reset 명령으로 유지하고, `schedule:sql`(SQL을 stdout으로만 출력 = dry-run)로 사전 확인 가능. README에 "`schedule:sync`는 reset이라 라이브 편집을 덮어쓴다, deploy는 정적 빌드만 한다"는 경고 추가.

### [resolved] MAJOR — 부분 시드인데 공모전 테이블이 비어 있으면 error가 표면화되지 않습니다
- 위치: app.js:675 (refreshSupabaseData)
- 근거: `partialSchedule`은 계산하지만 실제 분기는 `if (useSupabaseSchedule || opportunityRows.length > 0)` 안에 있습니다. 따라서 `album_events`만 채워지고 `album_tracks`와 공모전 테이블이 비어 있는 경우에는 `partialSchedule === true`여도 error 분기(app.js:689)에 들어가지 않고, app.js:705의 "Supabase 테이블이 비어 있어 기본 일정" idle 상태로 떨어집니다. handoff의 "부분 시드 시 error 상태 표면화" 요구와 다르고, 이전에 Supabase 일정이 로드된 상태라면 기본값으로 되돌리지도 않습니다.
- 제안: `partialSchedule`을 가장 먼저 처리해서 기본 events/tracks로 원자적 폴백하고 error 상태를 표시하세요. 완전 빈 테이블/연결 실패 경로도 `setScheduleData({ events: defaultEvents, tracks: defaultTracks })`로 실제 표시 데이터와 상태 문구를 맞추는 편이 안전합니다.
- 처리(Claude): `refreshSupabaseData`를 재구조화(app.js:673~). `partialSchedule`을 **가장 먼저** 처리해 기본 일정으로 원자적 폴백 + error 표시(공모전 유무와 무관). 세 테이블 모두 빈 경로도 `setScheduleData({ events: defaultEvents, tracks: defaultTracks })`를 명시 호출해 표시 데이터와 idle 문구를 일치.

### [resolved] MAJOR — DB/localStorage 유래 값이 escape 없이 `innerHTML`에 남아 있습니다
- 위치: app.js:2691 (renderCalendar), app.js:2145 (renderDashboardTaskCard), app.js:2745 (renderEvent), app.js:1477 (renderTrackActivityList)
- 근거: 겹친 날짜 요약은 `entry.titles.join(" · ")`를 그대로 `<span>`에 넣는데, `entry.titles`는 Supabase/admin에서 온 `event.title` 기반입니다. 또 여러 `data-event-id="${event.id}"`/`data-track-event-id="${track.eventId}"` 속성이 escape 없이 들어가고, localStorage에서 복원한 작업 이력의 `entry.category`/`entry.text`도 그대로 렌더됩니다. 관리자·DB·사용자 저장소 유래 문자열을 `innerHTML`에 넣는 지점이라 저장형 XSS나 attribute injection이 남습니다.
- 제안: 텍스트는 모두 `escapeHtml(...)`로 감싸고, data 속성도 `escapeHtml` 또는 DOM 생성 후 `dataset` 할당으로 넣어 주세요. 특히 overlap summary의 title 목록과 event/track id 속성, track activity 출력은 같은 패턴으로 정리하면 됩니다.
- 처리(Claude): overlap 요약을 `entry.titles.map(escapeHtml).join(" · ")` + `data-jump-date`도 escape. `data-event-id`(renderDashboardTaskCard·renderEvent), `data-track-event-id`(track-action-row), `data-track-number`, `data-track-followup-id`/`value=followup.date`를 모두 `escapeHtml`로 감쌈. `renderTrackActivityList`의 `entry.category`/`entry.text`도 escape. (step.id 등 하드코딩 상수는 신뢰 값이라 제외.)
