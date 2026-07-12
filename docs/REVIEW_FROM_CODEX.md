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

## 리뷰 2026-07-09 — 브랜치 claude/amazing-edison-052fe7 (곡 데모 milestone 오분류 제거)
판정: ✅ 병합 가능 | Blocker 0 · Major 0 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| - | - | 새로 열린 지적 없음 | - | - |

### 확인 결과
- 대상 worktree(`.claude/worktrees/amazing-edison-052fe7`)의 실제 변경은 `schedule-data.js`와 `docs/HANDOFF_FOR_CODEX.md`뿐입니다. `schedule-data.js` 변경은 `demo-good-night`(2026-06-21)과 `demo-twenty-eight`(2026-07-19)의 `milestone: true` 제거 2줄로 제한됩니다.
- `demo-good-night`과 `demo-twenty-eight`의 `id`, 날짜, `track.eventId`, 문서/가사 경로는 그대로라 `event.id` 기반 localStorage 개인 상태가 고아가 되지 않습니다. `defaultTracks` 11개가 참조하는 eventId도 모두 존재하고, track event 중 milestone으로 잠긴 항목은 없습니다.
- 남은 milestone은 `demo-buffer`, `structure-lock`, `arrangement-lock`, `recording-lock`, `post-recording-close`, `post-mix-final`, `post-master`, `delivery-submit`, `release-day` 9개뿐입니다. `delivery-submit`(2026-11-13)과 `release-day`(2026-12-04)은 계속 `milestone: true`입니다.
- `app.js` 일정 배열이나 시드 SQL 수기 변경은 없고, `scripts/build-schedule-sql.mjs`는 `Boolean(event.milestone)`으로 SQL을 생성하므로 두 데모는 sync 시 `milestone=false`로 upsert됩니다. `sort_order`는 배열 순서 기반으로 유지됩니다.
- 핸드오프는 이 편집이 시드/오프라인 폴백 변경이며, 라이브 Supabase `album_events.milestone`은 `npm run schedule:sync` 전까지 그대로라는 점과 sync 미실행 상태를 명확히 적고 있습니다.
- 현재 브랜치 `HEAD`는 아직 `main`과 같아서 `git diff main...HEAD`는 비어 있습니다. 위 판정은 대상 worktree의 미커밋 diff 기준이며, 병합 전에는 `schedule-data.js`와 핸드오프 변경을 커밋해야 실제 브랜치 diff에 잡힙니다.

## 리뷰 2026-07-09 — 브랜치 feature/overdue-reset-and-topbar-fixes
판정: 🚫 병합 차단 | Blocker 0 · Major 1 · Minor 1 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 카드별 '오늘로'가 보류/안 함 팔로우업을 오늘 보드로 복귀시키지 못함 | app.js:2315 | resolved |
| 2 | MINOR | 곡 데모 milestone 플래그가 일부 곡에만 붙어 오늘로 대상이 예측 불가능함 | schedule-data.js:123 | 보류 |

### [resolved] MAJOR — 카드별 '오늘로'가 보류/안 함 팔로우업을 오늘 보드로 복귀시키지 못함
- 위치: app.js:2315 (`moveEventToDate` track-followup 분기), app.js:2325 (일반 이벤트의 보류/안 함 해제), app.js:2962 (`renderDashboardTaskCard` 오늘로 버튼)
- 근거: 새 카드별 `오늘로` 버튼은 모든 지연 카드에 붙습니다. 그래서 `hold-list`/`dismissed-list`에 있는 지연 팔로우업에도 버튼이 노출됩니다(app.js:2835, app.js:2839). 일반 이벤트는 `moveEventToDate`가 보류/안 함 상태를 `none`으로 풀어 오늘 날짜의 current-week 작업으로 복귀시키지만, 팔로우업은 app.js:2315에서 `updateTrackFollowupDate()`만 호출하고 바로 return합니다. 결과적으로 보류/안 함 팔로우업에서 `오늘로`를 누르면 날짜만 오늘로 바뀌고 `focusStatus`는 `hold`/`dismissed` 그대로라 `getWeeklyFocusItems()`의 필터(app.js:2435)에서 계속 제외됩니다. 사용자는 버튼을 눌렀는데도 오늘 보드에 올라오지 않고, 접힌 회고 목록 안에 오늘 날짜로 남습니다. 일괄 배너는 app.js:2378에서 팔로우업도 상태를 해제하므로 카드별 경로만 불일치합니다.
- 제안: 팔로우업 분기도 일반 이벤트와 같은 상태 패치를 적용해 주세요. 예를 들어 `moveEventToDate()`에서 `plan`/`leavesWeek`/보류 해제 patch를 track-followup return 전에 공통으로 계산하고, 팔로우업 날짜 저장 뒤 `focusStatus`/`order` 변경이 필요하면 `state.eventPlan[followupId]`를 같은 배치에서 갱신하도록 정리하면 됩니다. 렌더를 두 번 하지 않으려면 `updateTrackFollowupDate()`에 `render: false` 같은 옵션을 주거나, `resetOverdueToToday()`처럼 날짜와 plan을 직접 갱신한 뒤 저장/렌더를 한 번만 호출하는 작은 헬퍼로 빼도 됩니다.
- **처리(resolved):** 제안 1안대로 `moveEventToDate()`를 리팩터([app.js](app.js:2312)). 보류/안 함 해제·leavesWeek order 초기화를 `statusPatch`로 **공통 계산**한 뒤, track-followup 분기에서 `followup.date=오늘`과 `state.eventPlan[id]` 갱신(빈 plan은 `getEventPlan` 기본형 기준으로 삭제)을 **한 배치로** 처리하고 저장/rebuild/renderAll을 1회만 호출(활동로그 "일정 이동"은 날짜 변경 시 유지). 일반 이벤트 경로는 동일 patch로 동작 불변. 검증: 보류 팔로우업(Psyche·튜닝, 6/15) 주입 → 카드에 `오늘로` 노출 확인 → 클릭 후 `focusStatus` none(plan 삭제)·`date` 2026-07-09·`hold-list`에서 제거·보드 후보군 편입 확인. 일반 이벤트 per-card(12→11)·일괄 배너 회귀 없음, 콘솔 오류 0, `node --check`/`npm run build` 통과. (상위 5개 노출은 시드 지연 12개가 날짜순 우선이라 슬라이싱에 가릴 수 있으나 이는 순위 문제로 별개 — `전부 오늘로` 후 노출.)

### [보류: 데이터 의도 판단 필요 → 별도 조사 task_f734fa12로 이관] MINOR — 곡 데모 milestone 플래그가 일부 곡에만 붙어 오늘로 대상이 예측 불가능함
- 위치: schedule-data.js:123 (`demo-good-night`), schedule-data.js:350 (`demo-twenty-eight`), app.js:2308 (`canMoveEventDate`)
- 근거: 핸드오프는 `demo-good-night` 하나만 `milestone:true`라고 설명하지만, 실제 데이터에는 `demo-good-night`과 `demo-twenty-eight` 두 곡 데모가 milestone입니다. 반면 다른 곡 데모는 이동 가능합니다. 이번 기능은 `canMoveEventDate()`로 milestone을 전부 제외하므로, 이 두 곡 데모는 기한이 지나도 지연 배너와 카드별 `오늘로` 대상에서 빠집니다. 곡 데모 날짜가 임시 관리 마감이라면 특정 곡만 고정 마감으로 잠기는 것은 사용자가 예측하기 어렵습니다.
- 제안: `good night`과 `스물 여덟` 데모만 실제 고정 마감인지 확인해 주세요. 의도가 아니라면 곡별 데모 이벤트의 `milestone:true`를 제거하고, 고정 보호가 필요한 항목은 `demo-buffer`, `structure-lock`, 유통/발매 같은 앨범 레벨 마감으로 제한하는 편이 이번 `오늘로` 기능의 기대와 맞습니다.
- **보류 사유:** milestone 유지 여부는 "이 곡 데모를 고정 마감으로 잠글 의도였나"라는 **데이터 의도 결정**이라, 단일 소스(schedule-data.js)를 이 UI 브랜치에서 임의로 바꾸지 않는다(코드 버그가 아니라 데이터 정책). 사용자가 이미 시작한 백그라운드 조사 **task_f734fa12**가 이 건을 소유 — 다만 그 task는 `demo-good-night`만 지목했으므로, Codex가 찾아준 **`demo-twenty-eight`(schedule-data.js:350)도 함께** 확인하도록 범위를 넓혀 처리한다(사용자 확인 후 필요 시 플래그 제거는 그 세션에서). 그 전까지 두 데모가 `오늘로`·지연 배너에서 제외됨은 의도된 canMoveEventDate 동작(고정 마감 보호)과 일치.

### 확인 결과
- `resetOverdueToToday()`의 일괄 경로는 루프 중 렌더하지 않고, `saveTrackFollowupsState()`/`saveEventPlanState()`/`rebuildEventState()`/`renderAll()`을 마지막에 한 번만 호출합니다.
- 일반 이벤트의 `overrideDate`는 원본 일정 ID를 바꾸지 않고 개인 plan에만 저장되며, 팔로우업 날짜는 기존 설계대로 `state.trackFollowups[].date`를 원천으로 씁니다.
- 배너의 `innerHTML`은 고정 문구와 숫자 count만 포함해 신뢰 불가 문자열 삽입은 보이지 않습니다.
- `.sync-popover[hidden]`은 모바일 `.sync-popover` 규칙보다 specificity가 높아 hidden을 유지하고, `.tab-button` flex 변경은 모바일 `.desktop-only-tab { display:none }`보다 앞서 있어 표시 전환을 깨지 않습니다.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run schedule:sql` 출력 확인: `demo-good-night`·`demo-twenty-eight`는 `milestone=false`, 남은 단계 락 7개 + `delivery-submit` + `release-day`는 `milestone=true`.
- `npm run build` 통과.

---

## 리뷰 2026-07-06 — 브랜치 claude/goofy-antonelli-0cce62 (곡 선택 칩 ARIA)
판정: ✅ 병합 가능 | Blocker 0 · Major 0 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| - | - | 새로 열린 지적 없음 | - | - |

### 확인 결과
- `#track-chip-nav`는 `role="group"`과 `aria-label="곡 선택"`을 유지해 곡 선택 버튼 묶음의 접근성 이름이 유지됩니다.
- 각 곡 칩은 네이티브 `button`에 `aria-pressed="${isActive}"`를 싣는 토글 버튼 패턴으로 바뀌었고, 클릭 핸들러는 기존처럼 `setActiveTrack()` → `renderTracks()`로 전체 칩 마크업을 재생성하므로 활성 상태가 한 곳에서만 갱신됩니다.
- `track-chip` 렌더 경로에서 `role="tab"`/`aria-selected`가 제거된 것을 확인했습니다. 남은 `role="tab"`/`aria-selected`는 `index.html`의 상단 뷰 전환 탭이며 `aria-controls`가 있는 별도 UI라 이번 범위와 무관합니다.
- 시각 상태는 기존 `.is-active`/`.is-done` 클래스에 의존하므로 ARIA 속성 교체로 CSS 회귀는 없습니다.
- 병합 시 Phase 1의 곡 칩 완료판정(`getTrackStatus(...).kind === "complete"`) 변경과 결합됨(충돌 해소 확인).

### 검증
- `node --check` 3파일 통과, `git diff --check` 통과, `npm run build` 통과.

---

## 재리뷰 2026-07-06 — 브랜치 feature/pipeline-stage-model
판정: ✅ 병합 가능 (Major 1건 resolved) | Blocker 0 · Major 0 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| - | - | 새로 열린 지적 없음 | - | - |

### 확인 결과
- `setTrackStage`는 목적 단계가 `demo`가 아니고 해당 곡의 기존 `track.eventId`가 아직 미완료일 때만 `toggleCompleted(track.eventId, true)`를 호출합니다. 새 event id를 만들지 않고 기존 데모 event id를 그대로 쓰므로 localStorage와 `user_event_plans`의 기록 보존 원칙과 맞습니다.
- `toggleCompleted` 재사용으로 `state.completed`, `completedMeta`, `saveCompletedTasks()`, `queueEventPlanSync(eventId)`, 대시보드/요약/달력/로드맵/곡 탭 리렌더가 기존 완료 처리와 같은 경로를 탑니다. 따라서 `getIncompleteEvents()`가 보던 미완료 목록에서도 해당 데모 이벤트가 빠집니다.
- `demo`로 되돌리는 경로는 완료 기록을 자동 삭제하지 않고 `renderTracks()`/`renderDashboard()`만 수행합니다. 이 정책은 비파괴적이며, 사용자가 데모 단계의 "완료 해제" 버튼으로 직접 해제할 수 있습니다.
- 전 곡 기본값이 `demo`인 경우에는 `stageId !== "demo"` 조건이 false라 자동 완료가 발동하지 않습니다. 기존 데모 화면의 미완료 상태는 유지됩니다.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check` 통과.
- `npm run build` 통과.

---

## 리뷰 2026-07-06 — 브랜치 feature/pipeline-stage-model
판정: 🚫 병합 차단 | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | done 단계 곡이 오늘 보드·달력에서는 계속 미완료 작업으로 남음 | app.js:1706 | resolved |

### [resolved] MAJOR — done 단계 곡이 오늘 보드·달력에서는 계속 미완료 작업으로 남음
- 위치: app.js:1706 (`setTrackStage`), app.js:1955 (`getTrackStatus` done 분기), app.js:2271 (`getIncompleteEvents`), app.js:3639 (`renderTrackDetailCard` demo 액션 숨김)
- 근거: 단계 칩에서 `done`으로 이동하면 `getTrackStatus`는 해당 곡을 `kind: "complete"`로 반환해 곡 표/요약에는 완료로 보입니다. 하지만 `setTrackStage`는 `state.trackStage`만 저장하고 기존 데모 event id를 `state.completed`에 넣지 않습니다. 반면 오늘 보드·후보·달력은 `getIncompleteEvents()`와 `renderEvent()`처럼 여전히 `state.completed.has(event.id)`만 완료 기준으로 사용합니다. 그래서 사용자가 곡을 `완료` 단계로 옮겨도 그 곡의 데모 이벤트는 대시보드/달력에 미완료 작업으로 계속 뜰 수 있습니다. 게다가 `demo`가 아닌 단계에서는 트랙 상세의 "데모 완료/보류/오늘 보드에 올리기" 액션을 숨기므로, done 카드 안에서는 이 모순을 바로 해소할 수도 없습니다.
- 제안: `done` 전환을 기존 event id 완료 상태와 명시적으로 동기화하거나, 일정/오늘 보드의 미완료 판정에서 연결 곡의 `getTrackStatus(...).kind === "complete"`를 함께 반영해 주세요. 전자가 더 단순하면 `done`으로 이동할 때 기존 `toggleCompleted(track.eventId, true)`와 같은 완료 경로를 재사용하되, done에서 다른 단계로 되돌릴 때 기존 완료 상태를 유지할지/해제할지는 의도에 맞게 분기하면 됩니다. 어느 쪽이든 새 event id를 만들지 말고 기존 `track.eventId`를 그대로 써야 기존 localStorage·`user_event_plans` 기록 보존 원칙과 맞습니다.
- **처리(Claude, 2026-07-06):** 제안한 옵션 A(완료 상태 동기화)를 채택하되 `done`에 국한하지 않고 **데모 단계를 벗어나는 모든 전환(arrange/record/mix/done)**에 적용했다. `setTrackStage`에서 목적 단계가 `demo`가 아니고 아직 미완료면 기존 `toggleCompleted(track.eventId, true)`를 재사용해 `state.completed`·`completedMeta`·`user_event_plans` 동기화·전체 리렌더를 한 번에 처리한다. 새 event id는 만들지 않고 기존 `track.eventId`를 그대로 쓴다. 이유: "믹스 중인 곡의 데모 녹음"이 오늘 보드에 뜨는 것도 같은 계열의 split-brain이므로 `done`만 막으면 불충분. 되돌림(→demo)은 원격 동기화됐을 수 있는 완료 기록을 임의 삭제하지 않고 유지하며, 데모 단계에 노출되는 "완료 해제" 버튼으로 사용자가 직접 해제하게 뒀다(비파괴). 검증: 편곡 이동 시 `demo-psyche` 완료→오늘 보드/후보/urgency에서 제외·"최근 끝낸 것"에 반영·달력 `is-complete`, 표는 곡을 "편곡 대기"(거짓 완료 아님)로 표시; done 직접 이동도 동일; 손대지 않은 demo 단계 곡은 여전히 미완료 유지(제로 회귀). `node --check` 3파일·`npm run build`·미리보기 콘솔 0건.

### 확인 결과
- 기존 demo step id 10개(`tune`, `key`, `bpm`, `take`, `comfort`, `structure`, `arrangement`, `idea`, `memo`, `next`)는 그대로 `demo` 단계로 이동했고, 새 단계 step id는 접두어가 붙어 기존 id와 충돌하지 않습니다.
- stage localStorage는 새 키(`album-release-track-stage-v1`)를 쓰며, 알 수 없는 값은 `demo`로 폴백해 렌더 크래시로 이어지지 않습니다.
- 기본값이 모두 `demo`일 때 상태 분기와 요약 집계는 기존 라벨 의미를 유지하고, 집계는 `kind` 기준으로 바뀐 것을 확인했습니다.
- 새 단계 칩·그룹·상태 라벨 렌더 경로는 현재 코드 상수 기반이며, DB/사용자 유래 값인 track number/title/document/lyrics/event detail은 기존 `escapeHtml`/`safeUrl` 경로를 통과합니다.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check` 통과.
- `npm run build` 통과.

---

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (c443959)
판정: ✅ 병합 가능 (8168c0e Major resolved) | Blocker 0 · Major 0 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| - | - | 새로 열린 지적 없음 | - | - |

### 확인 결과
- `eventPlanSyncGeneration`이 모듈 스코프에 선언되고, `setAuthSession`에서 `prevUserId !== nextUserId` 세션 경계마다 `eventPlanPending.clear()`, `eventPlanSyncChains.clear()`, generation 증가가 함께 실행된다.
- `queueEventPlanSync`는 큐잉 시점의 `queuedUserId`와 `queuedGeneration`을 캡처하고, `syncEventPlanRow`는 payload/query 생성 전에 현재 user id와 generation이 모두 일치하는지 확인한다.
- 따라서 이미 Promise 체인에 올라간 stale 콜백도 로그아웃→같은 계정 재로그인(A→null→A) 뒤에는 generation 불일치로 원격 write를 만들지 못한다. 이전 재리뷰의 같은 계정 stale write 경로는 닫힌 것으로 판단한다.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

---

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (8168c0e)
판정: 🚫 병합 차단 | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 같은 계정 재로그인에서는 지연 체인 tail이 세션 변경 뒤에도 실행될 수 있음 | app.js:1246 | resolved |

### [resolved] MAJOR — 같은 계정 재로그인에서는 지연 체인 tail이 세션 변경 뒤에도 실행될 수 있음
- 위치: app.js:1246 (`syncEventPlanRow` queuedUserId 검사), app.js:1286 (`queueEventPlanSync` 체인 콜백), app.js:1386 (`setAuthSession` 계정 변경 clear)
- 근거: 8168c0e는 큐잉 시점의 `queuedUserId`를 캡처해 다른 계정(B) 오염은 막지만, 이미 Promise 체인에 올라간 콜백은 `eventPlanSyncChains.clear()`로 취소되지 않습니다. 사용자가 A 계정에서 느린 write 뒤 후속 write를 큐잉하고 로그아웃하면 pending/체인 맵은 비워지지만, `prev.then(() => syncEventPlanRow(..., queuedUserId=A))` 콜백 자체는 살아 있습니다. 그 뒤 같은 A 계정으로 다시 로그인하면 실행 시점의 `getAuthUser().id`가 다시 A라서 app.js:1246 검사를 통과하고, 세션 변경 후의 현재 localStorage 값을 A 계정 원격에 upsert/delete할 수 있습니다. 이 write는 새 로그인 흐름의 `loadRemoteEventPlans({ backfill: true })`/원격 삭제 존중 규칙을 우회하므로, 다른 기기에서 이미 삭제한 row를 같은 브라우저의 stale localStorage로 되살릴 수 있습니다.
- 제안: 사용자 id만이 아니라 auth/session generation을 함께 캡처해 검사하세요. 예를 들어 `eventPlanSyncGeneration`을 두고 `setAuthSession`에서 `prevUserId !== nextUserId`인 모든 세션 경계(로그아웃, 최초 로그인, 같은 계정 재로그인 포함)마다 증가시키며, `queueEventPlanSync`가 `queuedGeneration`을 저장하고 `syncEventPlanRow`가 `queuedUserId`와 `queuedGeneration`이 모두 현재값과 일치할 때만 payload/query를 만들게 하면 됩니다. `eventPlanSyncChains.clear()`는 유지하되, 이미 스케줄된 콜백을 막는 최종 방어선은 generation 검사가 되어야 합니다.
- 처리(Claude): 제안대로 **세션 generation 검사** 추가. `eventPlanSyncGeneration`(모듈 스코프) 도입. `setAuthSession`이 세션 경계(`prevUserId !== nextUserId` — 로그아웃·계정 전환·같은 계정 재로그인·최초 로그인 모두 포함)를 감지할 때마다 pending/체인 clear와 함께 `eventPlanSyncGeneration += 1`. `queueEventPlanSync`가 큐잉 시점 `queuedGeneration`을 캡처해 `syncEventPlanRow(eventId, stamp, queuedUserId, queuedGeneration)`로 넘기고, `syncEventPlanRow`는 `user.id === queuedUserId` **AND** `queuedGeneration === eventPlanSyncGeneration`일 때만 payload/query를 만든다. 같은 계정 재로그인(A→null→A)은 generation을 2회 올리므로, 이전에 큐잉된 stale 콜백(옛 generation)은 userId가 같아도 걸러진다. `eventPlanSyncChains.clear()`는 유지(새 콜백이 옛 tail에 붙지 않게).
- 검증: `node --check`·`npm run build` 통과, 미리보기 콘솔 0건(모듈 스코프 `let` 참조 ReferenceError 없음), 비로그인 로컬 회귀(피커 43행·오늘 하기) 정상. **generation 가드는 동일 패턴 하네스로 증명** — A에서 느린 write(qGen=1) 큐잉 후 로그아웃→같은 A 재로그인(generation=3)하면, userId 일치에도 qGen 불일치로 stale write 차단(`staleWriteBlocked:true`), 재로그인 후 새 write(qGen=3)만 반영(`freshWriteApplied:true`). 실제 원격/세션 경계 경로는 로그인 필요라 로직·하네스 기준 확인.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

---

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (2dbe342)
판정: 🚫 병합 차단 | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 지연된 eventPlanSyncChains가 로그아웃 뒤 다음 계정으로 실행될 수 있음 | app.js:1275 | resolved |

### [resolved] MAJOR — 지연된 eventPlanSyncChains가 로그아웃 뒤 다음 계정으로 실행될 수 있음
- 위치: app.js:1275 (`queueEventPlanSync` 체인 생성), app.js:1243 (`syncEventPlanRow`의 실행 시점 `getAuthUser()`), app.js:1388 (`setAuthSession` 로그아웃 pending clear)
- 근거: 2dbe342의 eventId별 직렬화는 같은 항목의 out-of-order remote write는 막지만, 큐 tail이 어떤 계정에서 만들어졌는지는 보존하지 않습니다. `queueEventPlanSync`는 `prev.then(() => syncEventPlanRow(eventId, stamp))`로 나중에 실행될 함수를 체인에 얹고, `syncEventPlanRow`는 그 실행 시점에 `getAuthUser()`를 다시 읽습니다. 사용자가 A 계정에서 느린 write 뒤에 같은 id의 후속 write를 큐잉한 뒤 로그아웃하면 `state.eventPlanPending.clear()`만 실행되고 `eventPlanSyncChains`의 tail은 취소/무효화되지 않습니다. 그 tail이 아직 실행 전인 상태에서 B 계정으로 로그인하면 `canUseRemoteReviewSync()`가 다시 true가 되고, 남아 있던 A 계정의 큐 tail이 B 계정의 `user_event_plans`에 현재 로컬 payload를 upsert/delete할 수 있습니다. RLS도 payload의 `user_id`가 실행 시점의 B로 만들어지므로 이 오염을 막지 못합니다.
- 제안: queue 생성 시점의 사용자 id 또는 auth generation을 함께 캡처하고, 실행 직전에 현재 사용자/generation이 달라졌으면 원격 write를 건너뛰게 해 주세요. 로그아웃/세션 변경 시에는 `eventPlanSyncChains.clear()`도 수행하되, 이미 Promise 체인에 올라간 콜백은 clear만으로 취소되지 않으므로 generation 체크가 같이 필요합니다. `syncEventPlanRow(eventId, stamp, queuedUserIdOrGeneration)`처럼 실행 자격을 검증한 뒤에만 `buildEventPlanPayload`/Supabase query를 만들면 됩니다.
- 처리(Claude): 제안대로 큐잉 시점 계정 캡처 + 실행 자격 검증 + 세션 변경 clear. (1) **큐잉 계정 캡처** — `queueEventPlanSync`가 큐잉 시점의 `getAuthUser().id`를 `queuedUserId`로 캡처해 `syncEventPlanRow(eventId, stamp, queuedUserId)`로 넘김. 비로그인 상태면 아예 큐잉하지 않고 return(로컬 편집은 localStorage에 남고 로그인 시 backfill이 올림). (2) **실행 자격 검증(최종 방어선)** — `syncEventPlanRow`가 실행 시점 `getAuthUser().id !== queuedUserId`면 payload/query를 만들기 전에 즉시 return. 지연된 체인 콜백이 다른 계정 row를 upsert/delete하지 못함. (3) **세션 변경 clear** — `setAuthSession`이 이전/이후 user id를 비교해 달라지면(로그아웃·계정 전환·최초 로그인) `state.eventPlanPending.clear()` + `eventPlanSyncChains.clear()`. 로그아웃 분기의 중복 clear는 제거.
- 검증: `node --check`·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀(피커 43행·오늘 하기) 정상. **계정 가드는 동일 패턴 하네스로 증명** — A에서 느린 write(200ms) 큐잉 후 실행 전 B로 전환 시, A write는 실행 자격 검증에서 skip(`aWriteSkipped:true`), B 계정 오염 없음(`contaminatedB:false`), B 자신의 write만 반영. 실제 원격/다계정 경로는 로그인 필요라 로직·하네스 기준 확인.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

---

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (fcc137d)
판정: ✅ 병합 가능 (Major 1건 resolved) | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 같은 항목의 이전 write가 늦게 성공하면 최신 상태를 원격에서 되돌릴 수 있음 | app.js:1240 | resolved |

### [resolved] MAJOR — 같은 항목의 이전 write가 늦게 성공하면 최신 상태를 원격에서 되돌릴 수 있음
- 위치: app.js:1240 (`syncEventPlanRow`), app.js:1256 (`queueEventPlanSync`), app.js:1279 (`flushPendingEventPlans`)
- 근거: stamp는 pending 해제만 보호하고, 이미 전송된 오래된 request가 나중에 성공해 원격 row를 덮어쓰는 것은 막지 못합니다. 예를 들어 로그인 상태에서 사용자가 어떤 작업을 "오늘 하기"로 바꿔 stamp 1 upsert가 나간 직후 "원래 상태로"를 눌러 stamp 2 delete가 나가면, stamp 2 DELETE가 먼저 성공해 `eventPlanPending`이 해제됩니다. 이후 stamp 1 UPSERT가 늦게 성공하면 `state.eventPlanPending.get(eventId) !== stamp`라서 pending 해제만 건너뛸 뿐, 이미 원격은 오래된 "오늘 하기" row로 되돌아갑니다. pending이 비어 있으므로 다음 폴링의 `protectIds`도 비고, 그 stale 원격 row가 로컬로 다시 apply되어 사용자의 최신 reset이 뒤집힐 수 있습니다.
- 제안: eventId별 원격 write를 직렬화하거나, stale stamp write가 성공했을 때 현재 로컬 스냅샷을 다시 큐잉해 원격을 최신 상태로 복구하세요. 더 안전한 방향은 항목별 queue/debounce로 한 항목에는 항상 최신 payload만 전송되게 하거나, `syncEventPlanRow` 성공 후 stamp mismatch를 감지하면 `queueEventPlanSync(eventId)`를 호출하되 무한 재큐가 생기지 않도록 현재 local snapshot/version과 함께 관리하는 것입니다.
- 처리(Claude): 제안의 첫 방향(**eventId별 원격 write 직렬화**) 채택. `eventPlanSyncChains`(eventId→Promise 꼬리) 도입. `queueEventPlanSync`가 같은 id의 이전 write Promise 뒤에 체이닝(`prev.then(() => syncEventPlanRow(...))`)해 한 항목의 write가 항상 **큐잉 순서대로 하나씩** 실행되게 함 → 먼저 보낸 오래된 request가 늦게 성공해 최신 상태를 덮는 out-of-order가 구조적으로 불가능. 추가로 각 write는 실행 시점에 `buildEventPlanPayload`로 **현재 로컬 값**을 읽으므로 마지막 write가 항상 최신 로컬 상태를 반영. 체인은 꼬리가 끝나면 `finally`에서 맵에서 제거(무한 성장 방지). `flushPendingEventPlans`도 같은 `queueEventPlanSync`를 타 순서가 뒤엉키지 않음.
- 검증: `node --check`·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀(오늘 하기→원래 상태로=빈 plan) 정상. **직렬화 순서 보장은 동일 체인 패턴 하네스로 증명** — 느린 upsert(100ms)+빠른 delete(10ms)를 같은 id에 연속 큐잉 시, 직렬화 O=실행순서 `[upsert, delete]`·remote=`deleted`(최신)·체인 정리됨 / 직렬화 X(동시 발사)=`[delete, upsert]`·remote=`today`(stale, 지적한 그 버그). 실제 원격 경로는 로그인 필요라 로직·하네스 기준 확인.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (087a046)
판정: ✅ 병합 가능 (Major 1건 resolved) | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 폴링에서 pending flush와 원격 로드가 경합해 tombstone이 다시 부활할 수 있음 | app.js:1330 | resolved |

### [resolved] MAJOR — 폴링에서 pending flush와 원격 로드가 경합해 tombstone이 다시 부활할 수 있음
- 위치: app.js:1330 (`startRemoteReviewPolling` interval), app.js:1144 (`applyRemoteEventPlans`), app.js:1266 (`flushPendingEventPlans`)
- 근거: 087a046이 pending id를 preserve 집합에 포함하고 `flushPendingEventPlans()`를 추가한 것은 맞지만, 45초 폴링에서는 `loadRemoteEventPlans()`를 `await`하지 않고 바로 `flushPendingEventPlans()`를 호출합니다. pending tombstone이 있는 상태에서 이 interval이 돌면 SELECT와 DELETE 재시도가 동시에 출발합니다. DELETE가 먼저 성공해서 `syncEventPlanRow`가 pending을 해제한 뒤, 그보다 먼저 시작된 SELECT 응답이 아직 삭제 전 원격 row를 담고 늦게 도착하면 `applyRemoteEventPlans` 시점에는 pending이 사라져 있으므로 예전 row가 `nextPlan`/`nextCompleted`에 다시 채워집니다. 특히 그 상태로 사용자가 탭을 닫으면 localStorage에 부활한 row가 남고, 다음 로그인 때 원격이 비어 있으면 `firstConnect` 판정으로 stale local row가 다시 업로드될 수 있습니다.
- 제안: 폴링 콜백을 `async`로 만들고 `await loadRemoteEventPlans(); flushPendingEventPlans();`처럼 순서를 보장하거나, 반대로 `await flushPendingEventPlans(); await loadRemoteEventPlans();`로 재시도 완료 후 원격을 다시 읽으세요. 어느 쪽이든 같은 interval 안에서 pending 해제와 remote apply가 역전되지 않게 해야 합니다. `flushPendingEventPlans`가 Promise를 반환해 재시도 write들을 기다릴 수 있게 만들면 더 명확합니다.
- 처리(Claude): 제안대로 순서 보장 + 방어 스냅샷. (1) **순서** — 폴링 콜백을 `async`로 바꿔 `await flushPendingEventPlans(); await loadRemoteEventPlans();`. 재시도 write(삭제/업서트)를 모두 끝내 원격을 수렴시킨 뒤에야 SELECT를 보내므로 SELECT↔DELETE 동시 출발이 사라짐. `flushPendingEventPlans`는 `Promise.all`로 재시도 write들을 반환해 await 가능하게 함. 로그인 경로의 flush도 `await`로 바꿈. (2) **경합 방어 스냅샷** — `loadRemoteEventPlans`가 **SELECT를 보내는 순간**의 `state.eventPlanPending` 키를 `protectIds`로 캡처해 `applyRemoteEventPlans`에 넘김. SELECT 응답 도착 전에 어떤 write가 pending을 풀어도(즉시 write 등), 스냅샷에 있던 tombstone은 preserve에 남아 '삭제 전 원격 row' refill을 막음. 잔여 즉시-write 경합도 이 스냅샷 + 다음 폴링 자가 치유(부활 row는 pending 아니므로 다음 apply에서 원격 기준으로 제거)로 좁힘.
- 검증: `node --check`·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀(피커 43행·오늘 하기) 정상. 원격 경합 경로는 로그인 필요라 순서·스냅샷 로직 기준으로 확인.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

## 재리뷰 2026-07-04 — 브랜치 feature/active-planning (77b126a)
판정: ✅ 병합 가능 (Major 1건 resolved) | Blocker 0 · Major 1 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | pending 삭제·실패 쓰기가 원격값에 덮이거나 재시도되지 않음 | app.js:1174 | resolved |

### [resolved] MAJOR — pending 삭제·실패 쓰기가 원격값에 덮이거나 재시도되지 않음
- 위치: app.js:1174 (`applyRemoteEventPlans` preserveIds 구성), app.js:1227 (`syncEventPlanRow` no-op/실패 경로), app.js:1251 (`queueEventPlanSync` pending 설정), app.js:1823 (`updateEventPlan` 빈 plan 삭제)
- 근거: pending 보호가 현재 로컬에 남아 있는 `state.eventPlan` key와 `state.completed` id만 순회합니다. 그런데 원격 row를 비우는 변경은 `updateEventPlan`이 로컬 plan entry를 삭제하거나 완료 해제가 `state.completed`에서 id를 제거한 뒤 `queueEventPlanSync`를 호출하므로, 그 id는 `state.eventPlanPending`에만 남습니다. 다음 폴링에서 원격에 아직 예전 row가 있으면 `preserveIds`에 이 pending tombstone이 들어가지 않아 `nextPlan`/`nextCompleted`가 원격 row로 다시 채워지고, 실패한 삭제나 느린 삭제가 로컬에서 부활합니다. 같은 구조로 `queueEventPlanSync`는 로그인 전에도 pending을 먼저 세운 뒤 `syncEventPlanRow`가 `!canUseRemoteReviewSync()`에서 바로 반환할 수 있고, 실패한 pending도 다음 폴링에서 재큐되지 않습니다(`firstConnect`일 때만 uploadIds를 큐잉). 그러면 pending은 로컬 값을 보호한다고 표시되지만 실제 활성 write가 없어 원격과 영구 분기할 수 있습니다.
- 제안: pending id 자체를 보존 대상에 포함하고, pending tombstone도 로컬 스냅샷으로 표현해 원격 row가 다시 채우지 못하게 해 주세요. 또한 pending을 설정하기 전에 인증 가능 여부를 보거나, 인증 전/실패 pending을 별도 retry queue로 두고 로그인 직후와 폴링 때 재시도해야 합니다. 최소한 `state.eventPlanPending.keys()`를 preserve/upload 후보에 포함하고, 삭제 상태인 pending id도 `syncEventPlanRow`가 다시 실행될 수 있게 만드는 편이 안전합니다.
- 처리(Claude): 두 구멍을 모두 막음. (1) **tombstone 보존** — `applyRemoteEventPlans`의 preserve 순회 집합에 `state.eventPlanPending.keys()`를 추가. 이제 로컬 plan/completed에서 빠진 삭제 pending id도 preserveIds에 들어가 preserve 루프의 `else delete nextPlan[id]`/`nextCompleted.delete(id)`가 원격 refill을 걷어냄 → 실패·지연 삭제가 로컬에서 부활하지 않음. (2) **재시도** — `flushPendingEventPlans()` 신설: pending 전체를 `queueEventPlanSync`로 다시 큐잉(삭제 tombstone은 빈 payload=DELETE, 나머지는 현재 로컬 값 upsert). 45초 폴링과 **로그인 직후**(`loadRemoteEventPlans({backfill:true})` 뒤)에 호출해 인증 전/실패 pending이 활성 write 없이 원격과 영구 분기하지 않게 함. 단조 시퀀스 stamp로 재큐/성공 해제가 서로 어긋나지 않음. 주의: pending은 in-memory라 페이지 리로드 시 비므로, 이전 세션의 stale localStorage는 pending에 없고 backfill 게이팅(원격 비었을 때만 업로드)이 그대로 부활을 막음 → Major 2 보호와 무모순.
- 검증: `node --check`·`npm run build` 통과, 미리보기 콘솔 0건, 비로그인 로컬 회귀(피커 43행·오늘 하기·히어로 순서) 정상. 원격 tombstone/재시도 경로는 로그인 필요라 로직·집합 연산 기준으로 확인.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

## 리뷰 2026-07-04 — 브랜치 feature/active-planning
판정: ✅ 병합 가능 (Major 3건 모두 resolved) | Blocker 0 · Major 3 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 | 상태 |
|---|--------|------|------|------|
| 1 | MAJOR | 주 밖으로 옮긴 ordered 작업이 이번 주 보드에 다시 고정됨 | app.js:1828 | resolved |
| 2 | MAJOR | 로그인 backfill/whole-row upsert가 원격 삭제·동시 편집을 되돌릴 수 있음 | app.js:1149 | resolved |
| 3 | MAJOR | 트랙 팔로우업은 원격 row만으로 다른 기기에서 복원되지 않음 | app.js:477 | resolved |

### [resolved] MAJOR — 주 밖으로 옮긴 ordered 작업이 이번 주 보드에 다시 고정됨
- 위치: app.js:1828 (`moveEventToDate`), app.js:1902 (`compareByPlanOrder`), app.js:1920 (`reorderWeeklyFocus`)
- 근거: 이번 주에서 수동 순서를 바꾸면 `reorderWeeklyFocus`가 보이는 항목 전체에 `order`를 저장합니다. 이후 그 항목을 다음 주/다른 날짜로 옮기면 `moveEventToDate`는 `overrideDate`와 필요 시 `focusStatus`만 바꾸고 기존 `order`는 그대로 둡니다. `updateEventPlan`이 기존 값을 merge하기 때문에 stale `order`가 남고, `getWeeklyFocusItems()`는 accepted/current/fallback 목록을 합친 뒤 `compareByPlanOrder`로 order가 있는 항목을 날짜와 무관하게 맨 앞으로 보냅니다. 그래서 "이번 주 밖으로 보내면 수락 고정을 풀어 보드에서 내린다"는 의도와 달리, 한 번 정렬된 작업은 주 밖으로 옮겨도 이번 주 보드 상단에 다시 나타날 수 있습니다.
- 제안: `moveEventToDate`에서 이번 주 밖으로 나가며 `focusStatus`를 `none`으로 푸는 경우 `order: null`도 함께 적용하세요. 보류/안 함을 날짜 이동으로 해제하는 경우에도 이전 weekly order를 재사용할지 명확히 정하고, 보드 멤버십에서 빠지는 경로는 order를 정리하는 편이 안전합니다.
- 처리(Claude): `moveEventToDate`에 규칙 명문화 — (1) 이번 주 **밖**으로 나가면(`leavesWeek`) `order: null`, (2) 보류/안 함에서 복귀시키는 경로도 보드 밖 stale order로 보고 `order: null`, (3) 이번 주 **안** 이동은 순서 보존. 브라우저 검증: order=10이던 항목을 다음 주로 이동→`order:null`·보드 상단 고정 해제 확인, 이번 주 안(오늘)으로 이동은 order 유지 확인.

### [resolved] MAJOR — 로그인 backfill/whole-row upsert가 원격 삭제·동시 편집을 되돌릴 수 있음
- 위치: app.js:1149 (`applyRemoteEventPlans` localOnlyIds), app.js:1175 (`buildEventPlanPayload`), app.js:1201 (`upsert`), app.js:1288 (`loadRemoteEventPlans({ backfill: true })`)
- 근거: `setAuthSession`은 로그인/세션 복원 때마다 `loadRemoteEventPlans({ backfill: true })`를 호출합니다. 이 모드에서 원격에 없는 로컬 id는 `localOnlyIds`로 다시 `nextPlan`에 넣고 즉시 `queueEventPlanSync`로 업로드합니다. 따라서 기기 A에서 행을 비워 삭제한 뒤, stale localStorage를 가진 기기 B가 나중에 로그인하면 원격에 없는 행을 "로컬 전용 기록"으로 오해해 다시 살릴 수 있습니다. 또 `syncEventPlanRow`는 `focus_status`, `override_date`, `plan_order`, `is_completed` 전체를 현재 로컬 스냅샷으로 upsert하고 원격 `updated_at`을 읽거나 비교하지 않으므로, 두 기기가 같은 항목에서 한쪽은 날짜 이동, 다른 쪽은 완료 체크처럼 독립 필드를 거의 동시에 바꾸면 늦게 도착한 stale payload가 앞선 변경을 지울 수 있습니다.
- 제안: backfill은 계정 최초 연결처럼 검증 가능한 한 번에만 실행하거나, 원격이 비어 있을 때만 로컬을 업로드하도록 기준을 두세요. 이후 로그인/폴링은 원격 삭제를 존중해야 합니다. 동시에 `updated_at`을 select해 stale write를 감지하거나, 필드별 patch/merge 및 eventId별 직렬화·재조회로 독립 변경이 서로 덮어쓰지 않게 해 주세요.
- 처리(Claude): (1) **backfill 게이팅** — `firstConnect = backfill && remoteRows.length === 0`일 때만 로컬 기록을 업로드. 원격에 행이 하나라도 있으면 로컬 전용 id를 되살리지 않고 원격 삭제를 존중(applyRemoteEventPlans 재작성). (2) **미반영 로컬 쓰기 보호** — `state.eventPlanPending`(eventId→단조 시퀀스) 도입. `queueEventPlanSync`가 큐잉 시 기록하고 `syncEventPlanRow`는 성공 & 그 사이 재큐 없을 때만 해제(실패 시 유지). 폴링 병합은 pending·로컬 전용 id를 원격 값으로 덮지 않음 → 진행 중인 내 변경이 폴링에 사라지지 않음. (3) 폴링은 그 외 항목에서 원격을 기준으로 수렴(삭제 존중). 로그아웃 시 `eventPlanPending.clear()`로 다른 계정 누수 방지. 남은 한계(동시 독립 필드 편집은 last-write-wins 수렴, 필드 단위 머지는 아님)는 HANDOFF에 명시.

### [resolved] MAJOR — 트랙 팔로우업은 원격 row만으로 다른 기기에서 복원되지 않음
- 위치: app.js:477 (`buildTrackFollowupEvents`), app.js:1464 (`createTrackFollowup`), app.js:1494 (`updateTrackFollowupDate`), supabase/migrations/20260704090000_add_user_event_plans.sql:4 (`user_event_plans`)
- 근거: 트랙 팔로우업의 실제 재구성 정보(`trackNumber`, `stepId`, `date`)는 `state.trackFollowups`/localStorage에만 있고, 렌더링도 `buildTrackFollowupEvents()`가 그 로컬 배열을 변환해서 만듭니다. 새 원격 테이블에는 `event_id`, 계획 상태, 완료 여부만 저장되며 `createTrackFollowup`은 합성 id로 plan row만 업로드합니다. 다른 기기는 `applyRemoteEventPlans`로 `track-followup-*` id의 plan/completed 상태를 받아도 해당 id를 가진 `state.trackFollowups` 항목이 없어서 이벤트를 만들 수 없습니다. 날짜 이동도 `updateTrackFollowupDate`가 로컬 followup 날짜만 바꾸고 원격에 재구성 가능한 날짜를 남기지 않습니다. 결과적으로 "팔로우업 생성·제거/합성 id 동기화"처럼 보이지만 다른 기기에서는 팔로우업이 나타나지 않거나 완료 row만 유령처럼 남습니다.
- 제안: 팔로우업을 계정 동기화 범위에 포함하려면 별도 `user_track_followups` 테이블이나 `user_event_plans` 확장 컬럼으로 `track_number`, `step_id`, `date`를 저장하고 로드 시 `state.trackFollowups`를 복원하세요. 그 전까지는 `track-followup`을 원격 plan sync에서 제외하고 UI/문구도 로컬 전용으로 정리하는 편이 덜 혼란스럽습니다.
- 처리(Claude): 제안의 보수적 옵션 채택 — `isLocalOnlyPlanId(id)`(`track-followup-*`)를 원격 sync에서 **제외**. `queueEventPlanSync`가 로컬 전용 id를 올리지 않고(유령 완료 row 방지), `applyRemoteEventPlans`는 원격 rows에서도 로컬 전용 id를 필터링하며 폴링/백필 모두에서 로컬 전용 id의 plan·completed를 **항상 로컬 값으로 보존**(통째 교체에도 유지). 팔로우업은 지금도 localStorage 기반으로 정상 동작하며 계정 간 이동만 안 됨. 완전 동기화(별도 테이블로 trackNumber·stepId·date 복원)는 후속 과제로 HANDOFF에 기록.

### 검증
- `node --check app.js` 통과.
- `node --check schedule-data.js` 통과.
- `node --check service-worker.js` 통과.
- `git diff --check main...HEAD` 통과.
- `npm run build` 통과.

## 리뷰 2026-07-04 — 브랜치 improve/visual-calm
판정: ✅ 병합 가능 | Blocker 0 · Major 0 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 |
|---|--------|------|------|
| - | - | 지적 없음 | - |

### 확인 내역 — HANDOFF 집중 포인트 5개
- 제거 요소 잔존 참조: `#waveform`, `.mobile-glance`, `.summary-band`, `.sync-strip`, `#app-home-panel`, `.mobile-utility`는 소스/DOM 기준 잔존 참조 없음.
- `setActiveView` 스크롤/딥링크: `#track-04` 직접 진입이 곡별 진행 탭과 04번 카드로 복원됨. 로드맵→달력 점프도 저장 스크롤과 충돌하지 않음.
- 다이얼로그 액션 상태 전이: `complete`, `hold` 계열 전이가 히어로 승격, 보류 목록, 캘린더 배지와 일관되게 반영됨.
- 주간 스트립 이중 바인딩: 주간 스트립과 월 그리드에 같은 `data-event-id`가 중복 렌더되지만 DOM id 중복은 아니며, 스트립 체크 시 양쪽 체크박스와 최근 완료가 같이 갱신됨.
- 접힌 달 점프: 지난 6월 `<details>`가 닫힌 상태에서 로드맵의 2026-06-18 점프가 `details.open = true`로 펼친 뒤 해당 날짜로 스크롤됨.

### 검증
- `node --check app.js` 통과.
- `git diff --check main...improve/visual-calm` 통과.
- `npm run build` 통과.
- 로컬 브라우저 미리보기(`http://127.0.0.1:4175/`) 콘솔 오류 0건.

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
