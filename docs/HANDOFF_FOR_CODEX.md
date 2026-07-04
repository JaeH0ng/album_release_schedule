# Codex 인수인계 로그

이 문서는 **Claude(Claude Code)로 진행한 작업을 Codex가 한 번에 이어받기 위한 기록**이다.
이 프로젝트는 주로 Codex로 개발해 왔고, 중간에 Claude로 일부 작업을 진행하면 그 내용을 여기에 **최신 항목이 위로 오도록** 누적한다.

새 Codex 세션은 `AGENTS.md`의 기본 읽기 목록(`PROJECT_CONTEXT.md`, `SCHEDULE.md`, `DEMO_PLAN.md`, `TRACK_STATUS.md`)을 먼저 읽고, **이 문서로 최근 변경분을 확인**한 뒤 작업을 이어간다.

---

## 작업 환경 차이 (중요)

- `AGENTS.md`의 기준 위치는 Windows 경로 `C:\workSpace\album_release`다. Claude 세션은 **macOS**에서 `/Users/jaell0ng/workspace/album_release_schedule` 경로로 같은 저장소를 작업했다. 동일 리포지토리이며 경로만 다르다.
- 원격: `https://github.com/JaeH0ng/album_release_schedule.git` (origin). Pages 사이트: <https://jaeh0ng.github.io/album_release_schedule/>
- GitHub Pages는 **legacy(브랜치) 방식**으로 `gh-pages` 브랜치 루트를 서빙한다. GitHub Actions 워크플로는 없다.

---

## 변경 로그

### 2026-07-04 (6차 재리뷰 반영) — 세션 generation 검사로 재로그인 stale write 차단 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
재리뷰(8168c0e)의 Major 1건 반영. `queuedUserId`만으론 **같은 A 계정 로그아웃→재로그인** 시 지연 체인 콜백이 검사를 통과해, 새 로그인 흐름의 backfill/삭제 존중 규칙을 우회하고 stale localStorage를 원격에 되쓸 수 있던 문제. 상세·처리는 `REVIEW_FROM_CODEX.md` 8168c0e 재리뷰 블록(`[resolved]`).

- **세션 generation**: `eventPlanSyncGeneration`(모듈 스코프) 도입. `setAuthSession`이 세션 경계(`prevUserId !== nextUserId`)마다 pending/체인 clear와 함께 +1.
- **큐잉 generation 캡처 + 실행 검증**: `queueEventPlanSync`가 `queuedGeneration`을 캡처, `syncEventPlanRow`는 `userId` AND `generation` 둘 다 현재값과 일치할 때만 write. 같은 계정 재로그인(A→null→A)은 generation 2회 증가 → 옛 콜백 차단.

**바꾼 파일**
- `app.js`(`eventPlanSyncGeneration` 선언, `setAuthSession` 세션 경계 시 증가, `queueEventPlanSync` generation 캡처, `syncEventPlanRow` generation 검사 파라미터), `docs/REVIEW_FROM_CODEX.md`(8168c0e Major resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning` 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행.
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건, 로컬 회귀 정상. **generation 가드는 하네스로 증명**(A 큐잉→로그아웃→같은 A 재로그인 시 옛 write 차단, 새 write만 반영). 실제 세션 경계 경로는 로그인 필요.

### 2026-07-04 (5차 재리뷰 반영) — 지연 체인 계정 오염 방지 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
재리뷰(2dbe342)의 Major 1건 반영. eventId별 직렬화 체인 tail이 계정 정보를 안 들고 있어, A 계정에서 큐잉된 지연 write가 로그아웃→B 로그인 후 실행되면 B의 `user_event_plans`를 오염시킬 수 있던 문제. 상세·처리는 `REVIEW_FROM_CODEX.md` 2dbe342 재리뷰 블록(`[resolved]`).

- **큐잉 계정 캡처**: `queueEventPlanSync`가 큐잉 시점 `getAuthUser().id`를 `queuedUserId`로 캡처해 `syncEventPlanRow`에 전달. 비로그인이면 큐잉 안 함(로컬 편집은 localStorage→로그인 시 backfill 업로드).
- **실행 자격 검증(최종 방어선)**: `syncEventPlanRow`가 실행 시점 계정이 `queuedUserId`와 다르면 payload/query 만들기 전에 즉시 return.
- **세션 변경 clear**: `setAuthSession`이 user id 변경(로그아웃·전환·최초 로그인) 감지 시 `eventPlanPending.clear()` + `eventPlanSyncChains.clear()`.

**바꾼 파일**
- `app.js`(`syncEventPlanRow` queuedUserId 파라미터·검증, `queueEventPlanSync` 계정 캡처·비로그인 no-op, `setAuthSession` 계정 변경 clear, 로그아웃 분기 중복 clear 제거), `docs/REVIEW_FROM_CODEX.md`(2dbe342 Major resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning` 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행.
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건, 로컬 회귀 정상. **계정 가드는 하네스로 증명**(A 큐잉→B 전환 시 A write skip, B 오염 0). 실제 다계정 경로는 로그인 필요.

### 2026-07-04 (4차 재리뷰 반영) — eventId별 원격 write 직렬화 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
재리뷰(fcc137d)의 Major 1건 반영. stamp는 pending 해제만 막고 원격 write 순서는 못 막아, 같은 항목에 upsert→delete가 빠르게 이어질 때 먼저 나간 오래된 request가 늦게 성공해 최신 상태를 stale로 덮던 out-of-order 문제. 상세·처리는 `REVIEW_FROM_CODEX.md` fcc137d 재리뷰 블록(`[resolved]`).

- **직렬화**: `eventPlanSyncChains`(eventId→Promise 꼬리) 도입. `queueEventPlanSync`가 같은 id의 이전 write 뒤에 체이닝해 한 항목의 write가 큐잉 순서대로 하나씩 실행 → out-of-order 구조적 불가. 각 write는 실행 시점 현재 로컬 값을 읽어 마지막 write가 항상 최신 반영. 체인은 꼬리 완료 시 맵에서 제거(무한 성장 방지). `flushPendingEventPlans`도 같은 경로.

**바꾼 파일**
- `app.js`(`eventPlanSyncChains` + `queueEventPlanSync` 체이닝, `flushPendingEventPlans`가 queueEventPlanSync 경유), `docs/REVIEW_FROM_CODEX.md`(fcc137d Major resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning` 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행.
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건, 로컬 회귀 정상. **직렬화 순서 보장은 동일 체인 패턴 하네스로 증명**(느린 upsert+빠른 delete → 직렬화 O=remote 최신, 직렬화 X=remote stale). 실제 원격 경로는 로그인 필요.

### 2026-07-04 (3차 재리뷰 반영) — 폴링 flush/load 경합 제거 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
재리뷰(087a046)의 Major 1건 반영. 45초 폴링이 `loadRemoteEventPlans()`를 await하지 않고 `flushPendingEventPlans()`를 동시에 돌려, DELETE 성공→pending 해제와 삭제 전 SELECT 응답 apply가 역전되면 tombstone이 부활하던 경합. 상세·처리는 `REVIEW_FROM_CODEX.md` 087a046 재리뷰 블록(`[resolved]`).

- **순서 보장**: 폴링 콜백을 `async`로, `await flushPendingEventPlans(); await loadRemoteEventPlans();`. 재시도 write로 원격을 수렴시킨 뒤 SELECT. `flushPendingEventPlans`는 `Promise.all`로 반환. 로그인 경로 flush도 await.
- **경합 방어 스냅샷**: `loadRemoteEventPlans`가 SELECT 발신 시점의 pending 키를 `protectIds`로 캡처→`applyRemoteEventPlans`가 apply까지 보존. SELECT 응답 전에 pending이 풀려도 그 시점 tombstone은 refill 안 됨.

**바꾼 파일**
- `app.js`(폴링 콜백 async+순서, `flushPendingEventPlans` Promise 반환, `loadRemoteEventPlans` protectIds 스냅샷, `applyRemoteEventPlans` protectIds preserve, 로그인 flush await), `docs/REVIEW_FROM_CODEX.md`(087a046 Major resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning` 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행.
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀 정상. 원격 경합 경로는 로그인 필요라 순서·스냅샷 로직 기준 확인.

### 2026-07-04 (재리뷰 반영) — pending tombstone 보존 + 재시도 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
재리뷰(77b126a)의 Major 1건 반영. pending 보호가 tombstone(삭제) id를 놓쳐 원격 row로 부활하고, 실패/인증 전 pending이 재시도되지 않던 문제. 상세·처리는 `REVIEW_FROM_CODEX.md` 최신 재리뷰 블록(`[resolved]`).

- **tombstone 보존**: `applyRemoteEventPlans` preserve 순회 집합에 `state.eventPlanPending.keys()` 추가 → 로컬에서 지운 삭제 pending도 preserve 루프가 원격 refill을 걷어냄.
- **재시도**: `flushPendingEventPlans()` 신설 — pending 전체를 `queueEventPlanSync`로 재큐(tombstone=DELETE, 나머지=현재 로컬 upsert). 45초 폴링 + 로그인 직후(backfill 뒤)에 호출.
- pending은 in-memory라 리로드 시 비고, 이전 세션 stale localStorage는 pending에 없어 backfill 게이팅으로 부활 차단 → Major 2 보호와 무모순.

**바꾼 파일**
- `app.js`(preserve 집합에 pending keys, `flushPendingEventPlans` 신설, 폴링·로그인 후 호출), `docs/REVIEW_FROM_CODEX.md`(재리뷰 Major resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning` 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행.
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀 정상. 원격 tombstone/재시도 경로는 로그인 필요라 로직 기준 확인.

### 2026-07-04 (리뷰 반영) — 능동 계획 Major 3건 처리 (브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
Codex 리뷰 `feature/active-planning`의 Major 3건을 모두 반영. 상세·처리 요약은 `REVIEW_FROM_CODEX.md` 최신 블록(3건 모두 `[resolved]`).

- **Major 1 — 주 밖 이동 시 stale order (`moveEventToDate`)**: 이번 주 밖으로 나가면 `order: null`, 보류/안 함에서 복귀하는 경로도 보드 밖 stale order로 보고 `order: null`, 이번 주 안 이동은 순서 보존. 브라우저로 두 경로 확인.
- **Major 2 — backfill/whole-row upsert 되돌림 (동기화 코어 재작성)**: backfill을 **원격이 완전히 빈 최초 연결(`firstConnect`)에만** 로컬 업로드하도록 게이팅(그 외엔 원격 삭제 존중). `state.eventPlanPending`(eventId→단조 시퀀스)로 미반영 로컬 쓰기를 폴링 병합에서 보호(성공 시에만 해제, 실패 시 유지). 로그아웃 시 pending clear.
- **Major 3 — 트랙 팔로우업 원격 복원 불가**: `isLocalOnlyPlanId`(`track-followup-*`)를 원격 sync에서 제외(유령 완료 row 방지), 폴링/백필에서 로컬 전용 id의 plan·completed를 항상 로컬 값으로 보존.

**바꾼 파일**
- `app.js`(`moveEventToDate` order 규칙, `applyRemoteEventPlans`/`syncEventPlanRow`/`queueEventPlanSync` 재작성, `isLocalOnlyPlanId` 신설, `state.eventPlanPending` + `eventPlanSyncSeq`, 로그아웃 pending clear), `docs/REVIEW_FROM_CODEX.md`(3건 resolved).

**커밋·배포 여부**
- 브랜치 `feature/active-planning`에 후속 커밋. main 병합·push·gh-pages·`supabase:sync` 미실행(리뷰 전 상태 유지).
- 검증: `node --check` 3파일·`npm run build` 통과, 미리보기 콘솔 0건. Major 1은 UI로 직접 확인, Major 2·3의 원격 경로는 로그인 필요라 로직·`node --check` 기준(비로그인 시 `canUseRemoteReviewSync` no-op).

**남은 한계 / 후속 과제 (리뷰 재확인 요청)**
- **동시 편집**: 두 기기가 같은 항목의 독립 필드(예: 한쪽 날짜 이동, 다른 쪽 완료)를 거의 동시에 바꾸면 whole-row upsert 특성상 **last-write-wins로 수렴**한다(유령/부활/분기는 없음, 필드 단위 머지는 아님). 이 클라이언트-온리 구조에서 완전한 필드 머지는 서버 로직/CRDT가 필요해 이번 범위 밖으로 두었다. pending 보호로 "내 진행 중 변경이 폴링에 사라지는" 흔한 케이스는 막았다.
- **트랙 팔로우업 계정 동기화**: 현재 로컬 전용. 계정 간 이동까지 필요하면 `user_track_followups`(또는 `user_event_plans` 확장 컬럼 `track_number`·`step_id`·`date`)로 재구성 정보를 저장하고 로드 시 `state.trackFollowups` 복원이 후속 과제.

**Codex 재확인 요청 포인트**
- `applyRemoteEventPlans`의 `firstConnect` 판정과 pending/로컬 전용 보존이 삭제 존중과 충돌하지 않는지(원격에서 지운 항목이 pending도 로컬 전용도 아니면 로컬에서 제거되는지).
- `eventPlanPending` 해제 조건(성공 & 재큐 없음)이 연속 변경·실패 재시도에서 항목을 영구 잠그거나 조기 해제하지 않는지.

### 2026-07-04 — 능동 계획 기능 4종: 날짜 자유 이동·가져오기 시트·수동 순서·달력 DnD + 개인 계획 계정 동기화 (⭐ Codex 리뷰 요청, 브랜치 feature/active-planning)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
사용자 피드백 "작성된 일정을 능동적으로 끌어와서 할 수가 없다"에 대해, 기존 `eventPlan` 오버레이(focusStatus + overrideDate)를 재사용해 4단계로 확장했다. 원본 일정(Supabase `album_events`/시드)은 어느 단계에서도 건드리지 않는다.

- **plan(1/4) `20e28e4` — 날짜 자유 이동 + 작업 가져오기 시트**
  - `moveEventToDate(eventId, iso)`: overrideDate로 임의 날짜 이동. 보류/안 함은 이동 시 `none`으로 해제, 이번 주 밖으로 나가면 `accepted`도 해제. **고정 마감(milestone)·공모전은 이동 불가**(`canMoveEventDate`), 팔로우업은 `updateTrackFollowupDate` 경로로 위임.
  - 이벤트 다이얼로그에 "날짜 옮기기" 섹션(`renderDialogSchedule`): 오늘/내일/이번 주말/다음 주 퀵 칩(중복 날짜 칩·현재 날짜 칩은 자동 제외) + date input(min/max=달력 범위) + override 시 "원래 날짜로 되돌리기". 공모전 다이얼로그에서는 섹션 비움.
  - 작업 가져오기 시트(`#picker-dialog`): 미완료 이동 가능 작업 **전체**(기존 후보 5개 잘림 해소)를 검색(제목·곡·상세)+단계 칩 필터로 표시. [오늘 하기]=`pullEventIntoThisWeek`, 제목 클릭=상세 다이얼로그(중첩 모달). 대시보드("전체에서 가져오기")·달력("작업 가져오기")에서 진입. `renderAll`에서 시트가 열려 있으면 목록 동기 갱신.
- **plan(2/4) `928495e` — 이번 주 수동 순서**: `eventPlan.order` 추가(빈 항목 정리 조건·`resetEventPlan`에 반영). `getWeeklyFocusItems`가 `compareByPlanOrder`(order 지정 항목 우선, 나머지 날짜순) 정렬. `reorderWeeklyFocus`는 보이는 목록 순서 전체를 order(10,20,…)로 저장. UI: 이번 주 카드 ↑/↓, 히어로 "뒤로 미루기" ↓(2개 이상일 때).
- **plan(3/4) `8b80d15` — 달력 드래그 앤 드롭**: 문서 레벨 위임(`initCalendarDragAndDrop`, 재렌더 무관). 데스크톱 HTML5 DnD(dragover 셀 하이라이트→drop). 모바일 0.5초 long-press 리프트(진동)→고스트+`elementFromPoint` 셀 하이라이트→놓으면 이동. 리프트 전 8px 이상 이동은 스크롤로 취급, 리프트 후에만 touchmove preventDefault(passive:false). 가장자리 자동 스크롤, 드롭 직후 잔여 click 1회 캡처로 삼킴. draggable은 `canMoveEventDate` 카드만.
- **plan(4/4) `c5fd23b` — 개인 계획 계정 동기화**: 마이그레이션 `20260704090000_add_user_event_plans.sql`(user_id+event_id PK, focus_status/override_date/plan_order/is_completed/completed_at, RLS 본인 행만 — opportunity_reviews와 동일 패턴, event_id는 합성 id 포함이라 FK 없음). 첫 로그인 backfill(로컬 전용 기록을 지우지 않고 원격 업로드), 45초 폴링은 원격 기준 수렴(기존 reviewSyncTimer 합류). 변경 즉시 upsert(빈 항목은 행 삭제): `updateEventPlan`/순서 변경/완료 토글/팔로우업 생성·제거. 실패는 콘솔 기록 후 폴링 수렴(UI 비차단). 로그아웃 시 localStorage 복원. 로그인 안내·푸터 문구 갱신.

**바꾼 파일**
- `app.js`(moveEventToDate/canMoveEventDate/getQuickMoveTargets/renderDialogSchedule/피커 4함수/compareByPlanOrder/reorderWeeklyFocus/initCalendarDragAndDrop/loadRemoteEventPlans·applyRemoteEventPlans·syncEventPlanRow·queueEventPlanSync + 훅), `index.html`(#dialog-schedule, #picker-dialog, 진입 버튼 2개), `styles.css`(schedule-chip/picker/DnD 고스트·드롭 타깃·reorder 버튼), `supabase/migrations/20260704090000_add_user_event_plans.sql`(신규), `.claude/launch.json`(미리보기 포트 대체 구성 — 앱 무관).

**커밋·배포 여부**
- 브랜치 `feature/active-planning`(main에서 분기) 4커밋. main 병합·push·gh-pages 발행 안 함.
- ⚠️ **마이그레이션 미반영**: `npm run supabase:sync`는 운영 DB 변경이라 실행하지 않았다(권한 정책상 차단, 리뷰 전 배포 방지). 리뷰 통과 후 사용자가 실행해야 로그인 동기화가 동작한다. 테이블이 없는 동안에도 앱은 동작하며, 로그인 시 `user_event_plans` 조회 실패가 콘솔 error로만 남는다(기능 저하: 동기화만 건너뜀).
- 검증: `node --check` 3파일·`npm run build` 통과. 브라우저(데스크톱+375px 모바일) 콘솔 오류/경고 0. 확인한 플로우 — 가져오기 시트 43건 표시→[오늘 하기]로 6/18 지연 작업이 7/4로 이동(기간 3일 유지, 이번 주 칩, 버튼 '오늘 잡음' 비활성)→상세의 "원래 날짜로 되돌리기"로 plan 항목 삭제·원위치, 퀵 칩 구성(오늘·주말 중복 자동 제외, 다음 주=월요일), 히어로 ↓로 강등·↑로 복귀(order 10~50 저장), 달력 DnD 합성 이벤트로 dragover 하이라이트→drop 시 7/10 이동·잔여 하이라이트 0, milestone 25건 draggable 0건·다이얼로그 잠금 문구. 스크린샷 도구는 이 임베디드 미리보기에서 타임아웃(기존 IntersectionObserver 이슈와 같은 환경 한계, 기능 검증은 DOM 검사로 대체).

**Codex가 특히 봐줬으면 하는 곳 (리뷰 요청)**
- `moveEventToDate`의 focusStatus 전이 규칙(보류/안 함 해제, 주 밖 이동 시 수락 해제)이 getEventPlan 상태기계·기존 다이얼로그 액션(accept/pull/hold/dismiss/restore)과 모순이 없는지.
- `applyRemoteEventPlans`의 backfill 병합: 첫 로그인 시 로컬 기록 보존 + 이후 폴링 원격 기준 수렴 — 두 기기 동시 편집·행 삭제 시나리오에서 유령 부활/유실 케이스.
- 모바일 long-press DnD: pointercancel/터치 스크롤과의 상호작용, 드롭 직후 click 삼킴(350ms 캡처)이 다른 클릭 흐름을 방해할 가능성.
- 중첩 모달(picker 위 task-dialog)의 백드롭 클릭 닫기·ESC 동작.
- 피커 innerHTML 보간의 escapeHtml 누락 여부(제목/메타/칩), plan_order 등 원격 값 신뢰 처리.

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
사용자 피드백 "여전히 보기·쓰기 불편하다"에 대해 4개 렌즈(첫 화면 위계/시간 탐색/모바일 한 손/시각 피로) 디자인 비평을 돌리고, 실측(크롬 320px=뷰포트 44%, 달력 스크롤 9,576px, 필/배지 303개, 11–12px 텍스트 121개, 44px 미만 터치 타깃 49개)으로 근거를 잡아 3커밋으로 개편했다.

- **ux(1/3) `cabbede` — quick-win 7종**
  - 🔴 버그: 모바일 하단 탭바 `sticky bottom`이 (nav가 문서 상단이라) 발동 불가 → `fixed`로 수정, standalone 무효화 제거. 이제 어느 깊이서든 엄지 밑 탭바.
  - 터치 44px(체크박스 22px, 칩/버튼), 모바일 메타 12px+, 장식 영문 키커 22곳 삭제.
  - 탭별 스크롤 위치 기억(instant 복원), 달력 첫 진입 '오늘' 착지.
  - 달력: 지난달 `<details>` 접힘, 빈 셀 44px, 스티키 월 헤더, 우하단 '오늘' FAB(**스크롤 리스너** — 이 임베디드 미리보기에서 IntersectionObserver 콜백이 아예 안 옴을 확인하고 회피).
  - 한눈에 0건 카드 미렌더, APP HOME 카드 삭제, 로드맵 행 클릭→달력 점프.
- **ux(2/3) `39b1232` — 단일 헤더**: topbar+glance+summary-band+sync-strip 4층 → 56px 한 줄(브랜드·D-day·다음 마감·동기화 색점) + 2px 진행률 라인(파형 캔버스 대체). 동기화는 색점+팝오버, 오류시만 전폭 배너. '현재 단계/유통일'은 한눈에 카드로. **실측 크롬 320px(44%) → 112px(14%)**.
- **ux(3/3) `f78d720` — 히어로/이번 주**: 오늘 보드 최상단 '오늘의 다음 액션 1개' 히어로([완료]+⋯), 작업 카드 5버튼→1+⋯(보조 처리는 다이얼로그 액션), 달력 상단 '이번 주' 가로 스트립, 이벤트 셀 2줄 다이어트. **달력 스크롤 9,576→6,222px**.

**바꾼 파일**
- `index.html`(헤더/팝오버/배너/히어로/FAB/dialog-actions, glance·summary·sync-strip·APP HOME 삭제), `app.js`(renderSummary/setSyncStatus/updateAuthChrome/updateAppModeChrome 재작성, renderHeroCard 신설, 카드·다이얼로그 액션, 주간 스트립, renderEvent 다이어트, 스크롤 기억, FAB, waveform·mobile-utility 삭제), `styles.css`(±500줄: 헤더/팝오버/히어로/주간 스트립/접힘 추가, 크롬 4층·app-home CSS 삭제).

**커밋·배포 여부**
- 브랜치 `improve/visual-calm`(main에서 분기) 3커밋. main 병합·push·gh-pages 발행 안 함.
- 검증: `node --check`·`npm run build` 통과, 데스크톱/모바일 콘솔 오류 0, 5개 탭 회귀, 히어로 완료 플로우(완료→다음 작업 승격→최근 완료 반영→원복), 팝오버 열림/바깥닫힘, 탭바 fixed, FAB 표시/숨김/클릭, 주간 스트립 6개, 스크롤 기억/오늘 착지 모두 브라우저 확인.

**Codex가 특히 봐줬으면 하는 곳 (리뷰 요청)**
- 제거된 요소(#waveform, mobile-glance, summary-band, sync-strip, #app-home-panel, mobile-utility)를 참조하는 잔존 코드가 남았는지 (grep 기준 0이지만 재확인).
- setActiveView의 스크롤 기억/오늘 착지/포커스 로직이 딥링크(#track-NN, 곡 점프, jumpToCurrentWeek)와 충돌하지 않는지.
- 다이얼로그 액션(complete/accept/pull/hold/dismiss/restore)의 상태 전이가 getEventPlan 상태기계와 일관적인지.
- 주간 스트립이 renderEvent를 재사용하므로 bindEventControls 이중 바인딩/이벤트 중복이 없는지.
- 지난달 접힘 상태에서 overlap 점프/로드맵 점프가 details를 여는 경로.

### 2026-07-03 (배포 전 최종 리뷰 반영) — .env.example 비밀값 유출 제거 + 마이그레이션 반영 확인

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
Codex 최종 배포 전 리뷰 지적 2건 처리.

- **[Blocker] `.env.example`에 실제 Supabase access token·DB 비밀번호가 커밋됨** — `git add -A`가 사용자가 실수로 실값을 넣은 `.env.example`을 커밋(cce6b3a)했다. `.env.example`을 placeholder로 복구하고, **`git filter-branch`로 브랜치 4커밋 전체의 `.env.example`을 placeholder로 재작성**해 히스토리에서 비밀값을 제거했다(각 커밋 검증 + `sbp_` 검색 0건, refs/original 삭제·reflog expire·gc). GitHub push는 안 된 상태라 노출은 로컬 한정. ⚠️ **자격증명 회전(access token revoke + DB 비번 reset)은 사용자가 Supabase 콘솔에서 조치**해야 안전(권장). 앞으로 실값은 `.env.local`(gitignore됨)에만.
- **[Major] 마이그레이션 반영** — 지적의 전제(미반영)는 이미 해소됨. 사용자가 `npm run supabase:sync`를 성공시켜 `20260703120000`(admin write RLS)·`20260703130000`(FK restrict)가 **운영 DB에 반영됨**. (아래 3차 항목의 "미반영" 문구는 과거 시점 기록.)

**바꾼 파일**
- `.env.example`(placeholder 복구 + 히스토리 재작성), `docs/REVIEW_FROM_CODEX.md`·`docs/HANDOFF_FOR_CODEX.md`(상태 갱신).
- ⚠️ 히스토리 재작성으로 d6b61be 이후 커밋 해시가 바뀜(d1821fb·d053a7b·5e50f79). 미push 상태라 문제 없음.

**남은 조치(사용자)**
- Supabase access token revoke/재발급 + DB 비밀번호 reset → `.env.local` 갱신(권장).
- 그 뒤 배포: `main` 병합 → `npm run build` → `npx gh-pages -d dist`.

### 2026-07-03 (자체 적대 검증) — safeUrl 백슬래시 우회 + 스크립트 명령 인젝션 방어

**작업자:** Claude (Claude Code, Windows) — Claude가 돌린 3-에이전트 적대적 검증 워크플로의 지적을 반영(Codex 리뷰와 별개).

**무엇을 / 왜**
- **[Major] safeUrl 백슬래시 우회** — `\\evil.com`, `/\evil.com`, `\/evil.com`이 `//host` 차단을 우회(브라우저가 `\`→`/` 정규화 → 외부 호스트). `new URL` 검증으로 확인. safeUrl에 백슬래시 포함 값 거부 + 제로폭/BOM/NBSP 거부(코드포인트 검사) 추가. `target=_blank`인 admin 편집 링크의 오픈리다이렉트 차단. 공격 벡터 17종 단위 테스트 통과.
- **[Major] projectRef 명령 인젝션** — `supabase link --project-ref ${projectRef}`를 `shell:true`로 실행해 오염된 ref가 셸 명령이 될 수 있었다. `supabaseCmd`를 **args 배열 + shell:false**로 리팩터(Windows에서 supabase.exe 직접 실행 확인)해 셸 보간 자체를 제거. 추가로 projectRef를 `^[a-z0-9]{20}$`로 검증. tmpPath 셸 확장 위험(minor)도 함께 해소.
- **[Minor] .env.local 파싱** — 따옴표 없는 값의 인라인 주석(` # ...`) 제거 추가(따옴표 값은 공백 보존).
- escape 커버리지 감사(별도 에이전트)는 지적 0건 — app.js innerHTML/속성 이스케이프는 완전.

**바꾼 파일**
- `app.js`(safeUrl), `scripts/lib/supabase-run.mjs`(supabaseCmd 시그니처·projectRef 검증·env 파싱), `scripts/supabase-sync.mjs`(배열 호출).

**커밋·배포 여부**
- 브랜치 스테이징, 커밋 예정. `node --check` 전부·`npm run build` 통과, 미리보기 콘솔 오류 0, 가사 링크 정상, safeUrl 공격벡터 테스트/스크립트 가드 테스트 통과.

### 2026-07-03 (리뷰 반영 3차 + 스크립트 크로스플랫폼) — Codex 3차 지적 3건 + Windows bash 의존 제거

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
- **[Major] `safeUrl`이 한글 가사 링크를 깨뜨림** — 이전 XSS 수정에서 `\w`가 한글을 배제해 `lyrics/…한글.txt` 가 `#`로 떨어졌다. `safeUrl`을 "스킴/`//host`/제어문자 거부 → 그 외 상대경로(유니코드 포함) 허용 + escapeHtml"로 재작성(app.js:292~). 가사 링크 복구 확인.
- **[Major] SUPABASE_WEB_PLAN 초기화 안내 불일치** — `docs/SUPABASE_WEB_PLAN.md`를 migrations(`supabase:sync`) 정식 초기화 + setup SQL 읽기전용 + `schedule-data.js` 단일소스로 갱신.
- **[Nit] deleteAdminEvent 주석** — cascade 전제 → FK restrict 최후방어선 + UI 1차 가드로 수정.
- **[Windows] `npm run supabase:sync` 등이 PowerShell에서 실패** — npm 스크립트가 `bash *.sh`를 호출하는데 PowerShell PATH에 bash가 없었다. 3개 스크립트를 크로스플랫폼 Node(.mjs)로 전환(`scripts/lib/supabase-run.mjs` 공용 헬퍼). 비밀값은 셸 인자가 아니라 child env로만 전달(Supabase CLI가 env 자동 사용). `.sh` 3개 삭제.

**바꾼 파일**
- `app.js`(safeUrl, deleteAdminEvent 주석), `docs/SUPABASE_WEB_PLAN.md`, `docs/REVIEW_FROM_CODEX.md`(상태 갱신).
- `scripts/lib/supabase-run.mjs`·`scripts/supabase-sync.mjs`·`scripts/update-schedule.mjs`·`scripts/update-grounz-opportunities.mjs`(신규), `scripts/*.sh` 3개 삭제, `package.json` 스크립트 갱신.

**커밋·배포 여부**
- 브랜치 스테이징 예정, 커밋/푸시 안 함. `node --check`·`npm run build` 통과, 미리보기 콘솔 오류 0, 가사 링크 복구 확인.
- 참고: 로컬 `.env.local`은 존재하나 DB 비밀번호가 SASL auth 거부 상태 → 실제 `supabase db push`는 아직 안 됨(마이그레이션 미반영). 스크립트 자체는 크로스플랫폼으로 정상 실행됨.

**Codex가 봐줬으면 하는 곳 (재리뷰)**
- `safeUrl`에 남은 XSS 우회(스킴/제어문자/유니코드 정규화)가 있는지.
- 크로스플랫폼 스크립트의 비밀값 취급·임시파일·projectRef 인젝션 여부.

### 2026-07-03 (리뷰 반영 2차) — Codex 2차 리뷰 지적 4건 처리 (Major 3 + Minor 1)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
`docs/REVIEW_FROM_CODEX.md` 2차 리뷰 지적 4건을 모두 반영하고 `[resolved]`로 표시했다.

- **[Major] 연결 실패(catch) 시 표시 데이터 불일치** — `refreshSupabaseData` catch에서 `setScheduleData(defaults)`+`setOpportunityData`+`updateChrome`+`renderAll` 후 error. 이전에 Supabase 로드 후 실패해도 화면과 "기본 일정" 문구가 일치(app.js:719~).
- **[Major] 초기화 경로 불일치** — `supabase/setup_album_calendar.sql` FK를 `on delete restrict`로, 주석으로 "기본 테이블+시드(읽기 전용)" 명시. README를 고쳐 정식 전체 초기화는 migrations `db push`로 안내.
- **[Major] renderTrackChoiceGroup escape 누락** — `data-track-number`(및 noteKey/choice)를 `escapeHtml`로 일괄 처리(app.js:1464~).
- **[Minor] README 곡 수** — 바로가기 "10곡"→"11곡" 등 현재 기준으로.

**바꾼 파일**
- `app.js`, `README.md`, `supabase/setup_album_calendar.sql`, `docs/REVIEW_FROM_CODEX.md`(상태 갱신).

**커밋·배포 여부**
- 브랜치 `improve/ux-and-data-consistency` 스테이징, 커밋/푸시 안 함. `node --check`·`npm run build` 통과, 미리보기 콘솔 오류 0.

**Codex가 봐줬으면 하는 곳 (재리뷰)**
- catch 폴백이 initial/refresh 실패 양쪽에서 데이터·문구 일치를 보장하는지.
- setup SQL/migrations 초기화 경로 안내가 이제 일관적인지.

### 2026-07-03 (리뷰 반영 1차) — Codex 리뷰 지적 4건 처리 (Blocker 2 + Major 2)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
`docs/REVIEW_FROM_CODEX.md`의 2026-07-03 리뷰 지적 4건을 모두 반영하고 `[resolved]`로 표시했다.

- **[Blocker] 이벤트 삭제 cascade** — `deleteAdminEvent`가 삭제 전 연결 곡을 검사해 있으면 차단(app.js). FK를 `on delete restrict`로 바꾸는 마이그레이션 `supabase/migrations/20260703130000_tracks_fk_restrict.sql` 추가.
- **[Blocker] deploy가 라이브 편집 prune** — `package.json`의 `deploy`를 `npm run build`만으로 변경(schedule:sync 제거). `schedule:sync`는 명시적 reset로 유지, README에 덮어쓰기 경고 추가.
- **[Major] 부분 시드 error 미표면화** — `refreshSupabaseData` 재구조화: `partialSchedule` 최우선 처리(기본값 폴백+error), 빈 테이블도 `setScheduleData(defaults)` 명시.
- **[Major] escape 누락** — overlap 요약 제목, `data-event-id`/`data-track-event-id`/`data-track-number`/followup 속성, track activity `category`/`text`를 `escapeHtml` 적용.

**바꾼 파일**
- `app.js`, `package.json`, `README.md`, `supabase/migrations/20260703130000_tracks_fk_restrict.sql`(신규), `docs/REVIEW_FROM_CODEX.md`(상태 갱신).
- 리뷰 응답 형식(판정+인덱스)을 `docs/REVIEW_GUIDE.md`에 확정, `AGENTS.md`/`REVIEW_GUIDE.md`를 "Codex는 코드 직접 수정 안 함(리뷰 전용)"으로 조임.

**커밋·배포 여부**
- 브랜치 `improve/ux-and-data-consistency` 스테이징, 커밋/푸시 안 함. `node --check`·`npm run build` 통과, 미리보기 콘솔 오류 0.
- 새 FK 마이그레이션(20260703130000)은 `npm run supabase:sync`로 push 필요.

**Codex가 봐줬으면 하는 곳 (재리뷰)**
- `refreshSupabaseData` 재구조화가 세 소스(부분/완전빈/정상) 분기를 빠짐없이 덮는지.
- `deleteAdminEvent` 가드 + FK restrict 조합이 데이터 손실을 확실히 막는지.
- escape 보강에서 놓친 `innerHTML`/속성 보간이 더 있는지.

### 2026-07-03 — 사용성·데이터 정합·보안 대개편 + 관리자 편집 + 리뷰 프로세스 도입 (⭐ Codex 리뷰 요청)

**작업자:** Claude (Claude Code, Windows)

**무엇을 / 왜**
사용자 불만 3가지(사용 편의성 부족, 곡별 워크플로 찾기 어려움, UI 수정이 Supabase에 일관되게 반영 안 됨)를 다각도 감사 후 개선했다. 핵심 원인은 (1) 일정/곡 데이터가 `app.js` 하드코딩 + 시드 SQL + localStorage 3중으로 손 관리되어 어긋남, (2) 곡 선택 상태 부재로 11곡을 통째 렌더, (3) 첫 화면 카드 과부하였다.

- **P0 데이터/안정/보안**
  - `sortEvents`/`sortTracks`를 날짜 → `sort_order` 정렬로 바꾸고 정규화가 `sort_order`를 보존하도록 수정. 기본 데이터에도 인덱스 `sortOrder` 주입.
  - `refreshSupabaseData`의 폴백을 **원자화**(events/tracks는 둘 다 Supabase이거나 둘 다 기본값), 부분 시드 시 error 상태 표면화, `validateScheduleIntegrity`로 dangling `eventId` 경고.
  - `ensureTrackState`로 Supabase가 새 곡을 내려줘도 체크박스 클릭 시 크래시하지 않게 가드.
  - `escapeHtml`/`safeUrl` 유틸 추가 후 사용자·DB·인증 유래 값의 `innerHTML`/`href`에 적용(저장형 XSS 방지).
  - 서비스워커가 `.js/.css`도 강제 최신화 + `controllerchange` 자동 새로고침 + 빌드 미경유 캐시 버전 폴백.
- **P1 곡 워크플로:** `state.activeTrackNumber` 도입, 단일 곡 포커스 뷰 + 곡 칩 + 검색 + 표 행 클릭 + 일정 dialog/대시보드 딥링크 + `#track-NN` 해시 복원.
- **P1 단일 소스(경로 B):** 일정/곡 데이터를 `schedule-data.js`로 추출해 브라우저(app.js)와 SQL 생성기가 공유. `scripts/build-schedule-sql.mjs`가 upsert+prune SQL 생성, `npm run schedule:sync`로 반영.
- **P2 사용성:** 탭 재배치(오늘→곡별 진행→달력→전체 일정→공모전) + ARIA 탭 패턴 + 전환 시 포커스/스크롤, 동기화 상태 색상+`aria-live`+모바일 에러 배너, 데스크톱 집중 토글, 회고 카드 접이식(`<details>`), 온보딩 카드.
- **관리자 편집(경로 A):** 죽어 있던 공모전 관리자 폼 HTML 복구 + 일정/곡 편집 폼·CRUD 추가(`album_events`/`album_tracks` admin write RLS 마이그레이션 포함). Supabase=런타임 소스, `schedule-data.js`=시드/폴백으로 정리.
- **협업/리뷰 프로세스:** `CLAUDE.md`, `docs/REVIEW_GUIDE.md`, `docs/REVIEW_FROM_CODEX.md` 신설, `AGENTS.md`에 Codex=리뷰어 역할 명시.

**바꾼 파일**
- `app.js` — 정렬·폴백·무결성·크래시 가드·XSS·SW 등록·곡 포커스 뷰·딥링크·관리자 CRUD·온보딩·탭 포커스.
- `index.html` — 곡 검색/칩 컨테이너, 탭 재배치+ARIA, 관리자 패널(공모전/일정/곡 폼), 온보딩 컨테이너, 회고 `<details>`, sync-strip `aria-live`.
- `styles.css` — 곡 칩/검색/행, 동기화 상태, 관리자 폼, 온보딩, 회고 섹션.
- `service-worker.js` — `.js/.css` 강제 최신화, SKIP_WAITING, 캐시 버전 폴백.
- `schedule-data.js`(신규) — 일정/곡 단일 소스. `scripts/build-schedule-sql.mjs`(신규), `scripts/update-schedule.sh`(신규).
- `supabase/migrations/20260703120000_add_schedule_admin_write.sql`(신규) — 일정/곡 admin write RLS.
- `scripts/build-static-site.mjs` — `schedule-data.js` 빌드 복사. `package.json` — `type:module` + `schedule:sql`/`schedule:sync`/`deploy` 스크립트.
- `CLAUDE.md`·`docs/REVIEW_GUIDE.md`·`docs/REVIEW_FROM_CODEX.md`(신규), `AGENTS.md`·`README.md`(갱신).

**커밋·배포 여부**
- 브랜치 `improve/ux-and-data-consistency`에 **스테이징만, 커밋/푸시 안 함**. `npm run build` 통과, 브라우저 미리보기 콘솔 오류 0건.
- **아직 반영 안 됨:** 새 RLS 마이그레이션은 `npm run supabase:sync`로 push 필요. `admin_users`에 운영자 이메일 등록 전에는 관리자 편집이 실제 write되지 않는다. 관리자 저장/삭제의 실제 Supabase write는 인증·프로덕션 변경이 필요해 구조·배선까지만 검증했다.

**Codex가 특히 봐줬으면 하는 곳 (리뷰 요청)**
- `app.js` `refreshSupabaseData` 원자적 폴백/에러 표면화, `sortEvents`/정규화의 `sort_order` 처리.
- `escapeHtml`/`safeUrl` 적용 누락 지점(놓친 `innerHTML` 보간이 있는지).
- 관리자 CRUD의 RLS 가정·payload(특히 `album_events`의 `"end"` 컬럼, `album_tracks.event_id` FK)와 `schedule-data.js` 단일 소스 관계.
- 서비스워커 캐시 전략이 오프라인 폴백을 깨지 않는지.
- 지적은 `docs/REVIEW_FROM_CODEX.md`에 남겨주세요(형식: `docs/REVIEW_GUIDE.md`).

### 2026-06-29 — 달력에서 전곡 데모를 녹음/리뷰 슬롯으로 보이게 하고 Supabase 게시 일정도 동기화

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 아티스트가 실제로는 문서보다 웹 달력을 먼저 보고 작업 순서를 정하기 때문에, `전곡 데모 = 기타+보컬 녹음 + 데모 리뷰/악기 아이디어 정리` 구조가 달력에서 바로 읽혀야 한다고 다시 정리했다.
- 확인 결과 웹은 배포된 `app.js`뿐 아니라 Supabase `album_events` 게시 데이터를 우선 읽고 있었고, 그 데이터가 예전 10곡 기준이라 로컬 수정이 달력에 그대로 보이지 않았다.
- 그래서 달력 카드 자체에서 `녹음`과 `리뷰`를 시각적으로 구분하도록 바꾸고, Supabase 일정 데이터도 현재 `app.js` 기준으로 다시 적재하는 마이그레이션을 추가했다.

**바꾼 파일**
- `app.js`, `styles.css` — 달력 이벤트에서 곡명 중심 제목과 `녹음`/`리뷰` 구분 배지, 보조 설명 노출.
- `supabase/migrations/20260629210000_refresh_album_schedule.sql` — 현재 일정 기준으로 `album_events`, `album_tracks` 재적재.
- `supabase/setup_album_calendar.sql` — 초기 세팅용 기준 SQL도 최신 일정에 맞게 갱신.

**Codex가 알아야 할 점**
- 이번 수정이 실제 웹 달력에 보이려면 정적 배포만이 아니라 `npm run supabase:sync`로 원격 일정 테이블도 갱신해야 한다.
- 이후 데모 일정 구조를 바꾸면 `app.js` 기본 데이터와 Supabase 일정 SQL을 함께 맞춰야 다시 어긋나지 않는다.

### 2026-06-29 — 전곡 데모를 녹음 슬롯과 데모 리뷰 슬롯으로 세분화

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 아티스트가 데모 계획을 `기타+보컬 녹음`만이 아니라, `데모를 다시 들으며 다른 악기 구성을 고민하는 데모 리뷰 슬롯`까지 포함하도록 더 세분화해 달라고 요청했다.
- 이에 맞춰 7월 말까지의 전체 계획과 고정 마감은 그대로 두고, 전곡 데모를 `녹음 슬롯 + 30분 데모 리뷰 슬롯` 구조로 재정리했다.

**바꾼 파일**
- `docs/DEMO_PLAN.md` — 전곡을 `녹음 날짜 / 데모 리뷰 날짜`로 재구성하고 주간 묶음 갱신.
- `docs/TRACK_STATUS.md` — 전곡의 다음 행동 문구와 병목 설명을 두 슬롯 구조에 맞게 조정.
- `tracks/06_ttodasi/README.md` — 데모 리뷰 날짜 조정.
- `app.js` — 전곡의 `데모 리뷰 + 악기 아이디어 정리` 30분 이벤트 추가.

**Codex가 알아야 할 점**
- 이번 추가 슬롯은 아직 편곡 확정 단계가 아니라, 데모 안에서 다음 편곡 실험 출발점을 남기는 `30분` 보조 일정이다.
- 고정 마감인 `2026-12-04` 발매와 `2026-11-13` 유통 마감은 바꾸지 않았다.

### 2026-06-26 — PWA 서비스워커 캐시를 빌드 버전별로 분리

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 설치된 PWA에서 새 배포가 바로 반영되지 않거나 오래된 앱 셸을 붙잡는 증상을 줄이기 위해, 서비스워커 캐시 이름을 고정 문자열이 아니라 빌드 버전 기준으로 바꾸었다.
- 현재 배포본은 모바일 브라우저 기준으로 달력 렌더링과 기본 동작이 확인됐고, 문제는 설치된 PWA 쪽의 오래된 캐시/셸일 가능성이 높아 보여 이 업데이트 경로를 더 강하게 만들었다.

**바꾼 파일**
- `service-worker.js` — 캐시 이름을 빌드 버전 기반으로 변경할 수 있도록 플레이스홀더 추가.
- `scripts/build-static-site.mjs` — `dist/service-worker.js`에 실제 빌드 버전을 주입하도록 스탬프 로직 추가.

**Codex가 알아야 할 점**
- `dist/service-worker.js`는 빌드 시점 버전 문자열이 들어가며, 새 배포가 올라가면 기존 PWA 캐시가 별도 이름으로 분리된다.
- 이미 꼬여 있는 설치본은 한 번 `pwa-reset.html`을 열거나 앱 재설치가 필요할 수 있다.

### 2026-06-25 — `또다시` 우선 제출 기준으로 데모 상태와 대시보드 우선순위 갱신

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 아티스트가 `누군가의` 판단용 데모는 완료했다고 공유했고, `괜한 말`과 `부둣가`는 진행 중, 다음 주 금요일인 `2026-07-03`까지는 `Psyche`보다 `또다시`에 더 집중하겠다고 방향을 정했다.
- 이에 맞춰 문서 상태를 `누군가의 완료`, `또다시 진행`, `부둣가 진행`으로 갱신하고, 웹 대시보드의 현재 진행 곡과 이번 확인 포인트도 `또다시` 중심으로 바꿨다.

**바꾼 파일**
- `docs/TRACK_STATUS.md` — 곡 상태, 병목, 가장 위험한 마감 갱신.
- `tracks/02_gwaenhan-mal/README.md`, `tracks/04_nugungaui/README.md`, `tracks/06_ttodasi/README.md`, `tracks/11_budutga/README.md` — 현재 단계, 다음 행동, 작업 기록 갱신.
- `app.js` — 주간 집중 문구와 데모 진행 곡/스포트라이트를 `또다시` 우선 흐름으로 조정.

**Codex가 알아야 할 점**
- 이번 변경은 데모 마감일 자체를 옮긴 것이 아니라, 현재 주간 우선순위를 조정한 것이다. 고정 마감인 `2026-12-04` 발매와 `2026-11-13` 유통 마감은 그대로다.
- Supabase 스키마나 기본 일정 테이블 데이터는 이번에 바꾸지 않았고, 상태/우선순위 반영은 문서와 프론트 기본 UI 데이터 중심으로 처리했다.

### 2026-06-21 — 달력의 겹친 일정 요약 표시 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 같은 날짜에 일정이 여러 개 겹칠 때, 기존에는 같은 날짜 칸 안에 전부 쌓여서 보이기만 했다.
- 겹친 날짜를 한눈에 찾기 어렵다는 문제를 줄이기 위해, 날짜 칸에 `겹침` 표시를 넣고 월 헤더 아래에 겹친 날짜 요약 목록을 추가했다.

**바꾼 파일**
- `app.js` — 월별 겹친 날짜 집계, 요약 버튼 렌더링, 해당 날짜로 스크롤하는 동작 추가.
- `styles.css` — 겹침 칩, 겹친 날짜 셀 강조, 요약 목록 스타일 추가.

### 2026-06-21 — 편곡 전 모니터 스피커 준비 일정과 데모 이후 방향 논의 문서 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 데모 단계까지는 모니터 스피커 없이 진행하고, 편곡 판단에 들어가기 전에는 모니터링 스피커를 구매·배치해야 한다는 작업 원칙을 일정에 반영했다.
- 데모에서는 간단한 편곡까지 한번 얹어본 상태라고 보고, 데모 마감 직후 어떤 기준으로 다음 방향을 정할지 논의할 수 있도록 별도 문서 `POST_DEMO_DIRECTION.md`를 추가했다.

**바꾼 파일**
- `docs/SCHEDULE.md`, `docs/PROJECT_CONTEXT.md`, `docs/DEMO_PLAN.md` — 모니터 스피커 준비와 데모 이후 방향 논의 반영.
- `docs/POST_DEMO_DIRECTION.md` — 데모 이후 논의 질문과 결과물 기준 문서 추가.
- `app.js` — `post-demo-direction`, `arrangement-monitoring` 이벤트 추가, 편곡 단계 초반 일정 조정, 로드맵 문구 수정.

**Codex가 알아야 할 점**
- 고정 마감인 `2026-12-04` 발매와 `2026-11-13` 유통 마감은 유지했다.
- 편곡 1주차 시작은 모니터 스피커 셋업 이후인 `2026-08-05`로 뒤로 밀었지만, 전체 편곡 마감 `2026-08-23`은 유지했다.

### 2026-06-21 — 오늘 대시보드에 데모 진행 곡과 `대동제` 확인 포인트 노출

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- `오늘 한눈에 보기` 카드에서 현재 데모 작업 중인 곡들을 바로 확인할 수 있게 했다.
- 같은 위치에 `대동제`의 이번 데모 확인 포인트도 함께 보여, 오늘 대시보드만 봐도 지금 만지는 곡과 체크할 내용이 바로 보이도록 정리했다.

**바꾼 파일**
- `app.js` — 대시보드용 데모 진행 곡 목록과 `대동제` 포인트 상수, 렌더링 로직 추가.
- `styles.css` — 넓은 개요 카드와 불릿 리스트 스타일 추가.

### 2026-06-21 — Logic 작업 폴더 기준으로 데모 진행 상태 재분류

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 곡별 `logic/` 아래 실제 작업 흔적이 있는 곡은 판단용 데모를 이미 만지고 있는 것으로 보고 상태를 `진행`으로 재분류했다.
- 현재 기준으로 `괜한 말`, `누군가의`, `대동제`, `good night`를 데모 진행 곡으로 반영했고, `대동제`는 이번 데모에서 확인할 구체 작업 메모도 함께 추가했다.

**바꾼 파일**
- `docs/TRACK_STATUS.md` — 데모 상태 업데이트.
- `tracks/02_gwaenhan-mal/README.md`, `tracks/04_nugungaui/README.md`, `tracks/05_daedongje/README.md`, `tracks/10_good-night/README.md` — 현재 단계와 작업 기록 업데이트.
- `app.js` — `대동제` 데모 이벤트 설명을 구체화하고 로드맵의 후보곡 수 문구를 11곡으로 수정.

**Codex가 알아야 할 점**
- 이번 분류는 빈 `logic/` 폴더가 아니라, 그 안에 실제 프로젝트나 작업 흔적이 있는 경우를 기준으로 했다.
- `대동제` 데모 메모에는 드럼/베이스 박자·강세 정리, 보컬/기타 재녹음, 후반 일렉 솔로 테스트를 반영했다.

### 2026-06-21 — 헤더 로고와 파형 클릭으로 새로고침 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 상단 헤더의 로고 영역과 파형 이미지를 눌렀을 때 사이트를 바로 갱신할 수 있게 했다.
- 특히 GitHub Pages/PWA에서 방금 바뀐 화면을 다시 확인하고 싶을 때, 별도 버튼을 찾지 않고 헤더를 눌러 새로고침하는 동선을 만들기 위한 변경이다.

**바꾼 파일**
- `index.html` — 로고 영역과 `waveform` 캔버스에 새로고침 트리거 속성, 키보드 접근성 속성 추가.
- `app.js` — `refreshAppShell()` 추가. Supabase 데이터 재확인 후 서비스워커 업데이트를 시도하고 페이지를 다시 로드하도록 연결.
- `styles.css` — 클릭 가능 커서와 hover 반응 추가.

### 2026-06-21 — `부둣가` 후보곡 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 아티스트가 새 곡 `부둣가`를 후보곡에 추가해 달라고 요청해, 임시 번호 `11`, 슬러그 `budutga`, 판단용 데모 마감 `2026-07-20` 기준으로 프로젝트 전반에 반영했다.
- 가사 기준본, 곡 문서, 데모 세션 문서를 만들고, 후보곡 수가 11곡으로 바뀐 데 맞춰 데모 계획과 웹 기본 일정 데이터도 함께 갱신했다.

**바꾼 파일**
- `lyrics/11_부둣가.txt` — 아티스트가 보낸 원문 기준 가사 추가.
- `tracks/11_budutga/README.md` — 곡별 작업 문서 추가.
- `sessions/2026-07-20_11_demo.md` — 판단용 데모 세션 문서 추가.
- `docs/PROJECT_CONTEXT.md`, `docs/TRACK_STATUS.md`, `docs/DEMO_PLAN.md`, `tracks/README.md` — 후보곡 목록과 데모 계획 반영.
- `app.js` — 기본 트랙/이벤트 데이터에 `부둣가` 추가, `10곡` 기준 문구를 `11곡` 기준으로 수정.

**Codex가 알아야 할 점**
- `demo-buffer`는 `2026-07-21` 하루짜리 완충일로 조정했다.
- `부둣가`는 아직 판단용 데모 전이라 상태는 다른 신규 후보곡과 동일하게 `대기`로 시작한다.

### 2026-06-21 — 곡 체크 탭에 최근 작업 이력과 반복 일정 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 곡 체크 탭에서 각 곡별로 “무슨 작업을 해왔는지”가 눈에 잘 들어오도록 `최근 작업` 패널을 추가했다.
- 체크박스, 선택형 메모, 반복 일정 추가/이동/완료/삭제를 할 때마다 곡별 이력에 자동으로 쌓이게 해서, 나중에 다시 열어도 어떤 작업 흐름이 있었는지 바로 확인할 수 있게 했다.
- `편곡 아이디어 정리`처럼 한 번 체크한 뒤에도 다시 해야 할 수 있는 작업을 위해, 체크리스트 항목 옆 `다시 일정` 버튼으로 반복 작업을 별도 일정으로 추가할 수 있게 했다.

**바꾼 파일**
- `app.js` — 곡별 작업 이력 localStorage 추가, 반복 작업 일정(localStorage) 추가, 트랙 카드 UI 확장, 반복 일정 이벤트를 오늘 보드/캘린더 흐름에 병합.
- `styles.css` — 최근 작업/반복 일정 패널, 반복 일정 버튼, 모바일 레이아웃 스타일 추가.

**Codex가 알아야 할 점**
- 새 브라우저 저장 키는 `album-release-track-activity-v1`, `album-release-track-followups-v1`다.
- 반복 일정은 기본 일정과 별개인 로컬 커스텀 이벤트로 들어가며, 추가 시 자동으로 이번 주 보드 흐름에 포함되도록 `accepted` 상태로 만든다.
- 체크리스트의 진행률과 “한 번 해봤는지”는 그대로 유지되고, 반복 작업은 별도 일정으로 관리된다.

### 2026-06-21 — 데모 마감 체크리스트에 `다음 편곡 아이디어 정리` 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 아티스트 피드백을 반영해 데모 작업의 `마감` 단계에 `다음 편곡 아이디어 정리`를 독립 체크 항목으로 추가했다.
- 기존에도 `얹어볼 악기·질감 1개 메모`는 있었지만, 아이디어 메모와 “다음 세션에서 실제로 뭘 해볼지”를 분리하면 데모 이후 편곡으로 넘어갈 때 훨씬 바로 움직일 수 있게 하려는 목적이다.

**바꾼 파일**
- `app.js` — 곡별 데모 체크리스트의 `마감` 그룹에 `idea` 항목 추가.
- `docs/DEMO_PLAN.md` — 데모 한 곡의 완료 조건과 `마감` 설명에 같은 항목 추가.
- `docs/PROJECT_CONTEXT.md` — 데모 완료 기준 목록에 “다음 편곡에서 바로 시험할 아이디어 1개” 추가.

**Codex가 알아야 할 점**
- 체크리스트 저장은 기존 localStorage 키(`album-release-track-checklist-v1`)를 그대로 사용한다.
- 새 `idea` 항목은 기본값 `false`로 자동 병합되므로, 기존에 체크해 둔 곡 진행 데이터는 유지되고 새 항목만 미체크로 보인다.

### 2026-06-21 — 공모전 상세 모달과 빌드 버전 캐시 무효화 추가

**작업자:** Codex (GPT-5, macOS)

**무엇을 / 왜**
- 공모전 카드에서 제목이나 요약을 눌렀을 때, 같은 페이지 안에서 어떤 공모전인지 바로 확인할 수 있도록 상세 모달을 연결했다.
- GitHub Pages/PWA에서 이전 `app.js`나 `styles.css`가 남아 화면이 늦게 바뀌는 문제를 줄이기 위해, 빌드 시 `index.html`에 버전 쿼리를 자동으로 붙이고 서비스워커도 새 버전을 우선 가져오도록 정리했다.

**바꾼 파일**
- `app.js` — 공모전 카드 클릭 시 `task-dialog`를 재사용해 상세 정보를 열도록 연결. 서비스워커 등록 시 빌드 버전 쿼리 사용.
- `styles.css` — 공모전 카드 제목 버튼/클릭 영역 스타일 추가.
- `service-worker.js` — HTML은 네트워크 우선, 정적 셸은 `cache: "reload"` 우선으로 조정하고 `index.html`만 오프라인 대비 캐시에 유지.
- `scripts/build-static-site.mjs` — 배포용 `dist/index.html`에 `data-build-version`과 정적 자산 버전 쿼리를 주입.

**검증**
- `node --check app.js`
- `npm run build`
- 로컬 브라우저에서 공모전 탭 진입 후 카드 클릭 시 상세 모달 오픈 확인
- 로컬 브라우저에서 공모전 `수락` 클릭 시 후보 보드에서 빠지고 Accepted 보드로 즉시 이동하는지 확인

**Codex가 알아야 할 점**
- 소스 `index.html`은 그대로 두고, 배포 산출물 `dist/index.html`에서만 자산 버전 쿼리를 주입한다.
- 기존 PWA를 이미 설치한 기기에서는 한 번 정도 재실행이나 새로고침이 필요할 수 있지만, 이후 배포부터는 `app.js?v=...`, `styles.css?v=...` 형태로 이전 파일을 오래 붙잡는 문제가 훨씬 줄어든다.

### 2026-06-20 — 핸드오프 자동 갱신용 Claude Stop 훅 추가

**작업자:** Claude (Claude Code, macOS)

**무엇을 / 왜**
- "Claude로 작업을 끝낼 때마다 이 핸드오프 로그를 자동으로 갱신"하도록 고정. Claude Code의 **Stop 훅**으로 구현했다.
- 동작: 세션 종료(Stop) 시 작업 트리를 검사해, **문서화 대상(코드/문서) 변경이 남아 있고 `HANDOFF_FOR_CODEX.md`는 아직 안 건드린 경우에만** 한 번 차단하며 "핸드오프 항목을 추가하라"고 Claude에게 알린다. 핸드오프 문서를 건드리는 순간 조건이 풀려(자가-해제) 더는 막지 않는다. `node_modules`/`dist`/`.claude/`와 무변경 대화 turn에서는 발동하지 않는다.

**바꾼/추가한 파일**
- `.claude/settings.json` — Stop 훅 등록 (`bash "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/handoff-reminder.sh"`).
- `.claude/hooks/handoff-reminder.sh` — 위 판정 로직(git porcelain 기반, `jq`로 JSON 출력).
- `.gitignore` — `node_modules/` 추가(가십 산출물 무시).

**Codex가 알아야 할 점**
- 이 훅은 **Claude 전용**이다. Codex는 `.claude/` 훅을 실행하지 않으므로 Codex 작업 흐름에는 영향이 없다. 단, **Codex로 작업한 변경도 이 핸드오프 로그에 같은 형식으로 직접 남겨야** Claude/Codex가 서로의 변경을 추적할 수 있다.
- 훅은 강제가 아니라 "한 번 알림" 수준이며, 변경이 사소하면 기록 없이 종료해도 된다.

---

### 2026-06-20 — 판단용 데모 체크리스트를 `세션`/`마감` 2국면으로 재구성

**작업자:** Claude (Claude Code, macOS)
**커밋:** `main cc2905b` → `gh-pages 569d85a` (배포 완료, Pages 빌드 `built` 확인)

**무엇을 / 왜**
- 아티스트 요청: 데모 작업을 더 잘게 쪼개 "하나씩 지워나가며 성취감"을 느끼고, 능동적으로 작업할 수 있게 한다. **전체 일정 날짜는 그대로 유지.**
- 기존 곡별 체크리스트는 4그룹(`녹음`/`판단`/`실험`/`기록`)에 동일한 9개 항목이었다. 이를 작업 동선에 맞춰 **2국면**으로 재편했다.
  - **세션 (60분, 악기 앞에서)**: 튜닝+현재 키 확인 → 후렴·최고음 키 테스트 → 메트로놈 BPM 후보 2개 비교 → 멈추지 않은 전체 1테이크 → 바로 청취하며 불편 구간 표시
  - **마감 (세션 직후, 책상에서)**: 키·카포·BPM·구조 곡 문서에 기록 → 얹어볼 악기·질감 1개 메모 → 파일명 정리+문서 연결 → 다음에 이어갈 것 1줄
- 순서가 그대로 `DEMO_PLAN.md`의 60분 세션 타임라인 + 직후 마감 동선과 일치한다.

**바꾼 파일**
- `app.js` — `defaultTrackSteps`(9개 항목)와 `trackStepGroups`(4→2그룹) 재정의. 렌더링/진행률/상태 뱃지 로직은 데이터 기반이라 그대로 동작.
- `docs/DEMO_PLAN.md` — "데모 한 곡의 완료 조건"과 "쪼개서 보는 기준" 섹션을 동일한 세션/마감 구조로 다시 씀.
- `dist/` — `npm run build`로 재생성 후 `gh-pages`에 발행.

**Codex가 알아야 할 점**
- 이 체크리스트는 **순수 프론트엔드 + 브라우저 localStorage**다. 저장 키: `album-release-track-checklist-v1` (`app.js` 상단 `TRACK_CHECKLIST_KEY`). **Supabase 테이블과 무관** — 이 변경에는 `supabase:sync`가 필요 없었다.
- 기존 체크 진행을 보존하려고 **의미가 같은 항목은 기존 `id`를 재사용**했다(`key`,`bpm`,`take`,`comfort`,`structure`,`arrangement`,`memo`,`next`). 새로 추가된 `tune`만 미체크로 시작. 삭제된 `sketch` id의 잔여 저장값은 진행률 계산에서 무시되므로 안전.
- 항목 수는 9개로 유지 → 상태 뱃지 임계값(`getTrackStatus`의 `total - 2`)은 수정 불필요.

---

## 배포 런북 (GitHub Pages)

소스(`main`)와 배포물(`gh-pages`)이 분리돼 있다. `dist/`는 `.gitignore` 대상이라 `main`에 올라가지 않는다.

```bash
# 1) 소스 커밋·푸시
git add <changed files>
git commit -m "feat: ..."
git push origin main

# 2) 정적 사이트 빌드 (dist/ 생성)
npm run build

# 3) dist/ 내용을 gh-pages 브랜치로 발행 (force-push)
npx gh-pages -d dist -m "deploy: update site"
```

- 발행 후 GitHub Pages가 약 1분 내 반영. 확인: <https://jaeh0ng.github.io/album_release_schedule/>
- 빌드 스크립트는 `scripts/build-static-site.mjs`. 복사 대상: 루트 정적 파일 + `assets/icon.svg` + `docs/*.md` + `lyrics/*.{txt,md}` + `tracks/**/README.md`. (Logic Pro 파일·오디오는 제외)
- **PWA 캐시 주의**: `service-worker.js`로 캐시되므로 배포 후 옛 화면이 보일 수 있다. 강력 새로고침, 또는 `/album_release_schedule/pwa-reset.html`로 리셋.

### Supabase는 언제 푸시하나
- 일정/공모전 **데이터·스키마**(`supabase/setup_album_calendar.sql`)를 바꿨을 때만 `npm run supabase:sync`.
- 프론트엔드는 `app.js`의 하드코딩된 `SUPABASE_URL` + publishable(anon) key로 직접 REST 접근. 일정 테이블(`album_events`, `album_tracks`)이 비어 있거나 접속 실패 시 `app.js`의 기본 일정으로 폴백한다.
- 시드/스키마를 바꾸면 `app.js`의 기본 일정 데이터도 함께 맞춰야 화면 폴백과 일치한다.

---

## 후속 제안 / 미해결

- **곡별 "이 곡만의 확인 1개"**: 동일 체크리스트의 단조로움을 줄이려고 곡마다 맞춤 항목 1개를 넣는 안을 논의만 함(미구현). 넣으려면 각 곡 가사/메모를 읽고 항목을 정해 `app.js` 체크리스트와 `DEMO_PLAN.md`에 반영.
- **성취 시각화**: 진행률 바·남은 개수 카운트다운·체크 시 줄 긋기/완료 더미 이동 인터랙션은 미구현(아이디어 단계).
- **문서 정합성**: `docs/PROJECT_CONTEXT.md`의 "데모 완료 기준" 항목 목록은 아직 구(舊) 8항목 표현이다. 세션/마감 구조와 맞추려면 추후 갱신 필요(이번엔 손대지 않음).
