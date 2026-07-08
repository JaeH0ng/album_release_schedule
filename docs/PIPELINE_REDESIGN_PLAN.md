# 파이프라인 개편 계획 (곡 × 단계 격자)

> 2026-07-06 사용자 요청. "대략적인 마감(데모/편곡/본녹음/최종)은 이해하지만
> 내부 단계에 참여가 애매하다" → 작업의 최소 단위를 **(곡 × 단계)** 한 칸으로
> 바꾸는 3단계 개편. 이 문서가 기준이고, 단계마다 Codex 리뷰를 거친다.

## 0. 진단 (왜 애매했나)

- 곡별 세부 이벤트는 사실상 **데모 단계에만** 존재한다 (`demo-*` + 데모 리뷰).
  편곡·본녹음·믹스는 곡 이름 없는 달력 덩어리("편곡 테스트 1주차", "본녹음 묶음 A")뿐.
- 곡별 체크리스트(`defaultTrackSteps` 10개)는 **전부 데모 작업**이고, 곡이 어느
  단계에 있든 항상 같은 목록이 뜬다.
- 곡의 "완료" = `track.eventId`(demo 이벤트) 완료. 즉 앱에서 곡 완료란 데모 완료가 전부.
- 결과: 8~10월(편곡→녹음→믹스)이 통째로 블랙박스. "Psyche 기타는 땄고 보컬은
  남았다" 같은 실제 진행을 담을 칸이 없다.

## 1. 목표 모델

**작업 단위 = (곡 × 단계).** 곡별 파이프라인 5단계:

```
데모(demo) → 편곡(arrange) → 녹음(record) → 믹스(mix) → 완료(done)
```

- 키·구조 확정(structure), 마스터링, 유통(delivery), 발매(release)는 곡 축이 아니라
  **앨범 단위 레일**(고정 마감·카운트다운)로 유지한다.
- 곡마다 "지금 어느 단계인가"가 데이터가 되고, 곡을 열면 **현재 단계의 체크리스트만** 뜬다.
- 달력·'오늘' 보드는 이 격자를 다르게 비춘 화면이 된다.

## 2. 단계별 체크리스트 (stepsByStage)

기존 데모 step id 10개는 **한 글자도 바꾸지 않고** demo 단계로 이동한다
(localStorage 체크 기록 보존). 새 단계 항목:

| 단계 | 그룹 | 항목 (id) |
| --- | --- | --- |
| arrange | 실험 | 앨범 팔레트 질감 확인(arr-palette) · 편곡안 A/B 비교(arr-ab) · 악기 하나씩 얹어 중심 확인(arr-instr, 반복) |
| arrange | 확정 | 곡의 역할·절정 한 줄 정리(arr-role) · 편곡안 확정+필요 악기 목록(arr-lock) |
| record | 테이크 | 최종 통기타 메인 테이크(rec-guitar, 반복) · 메인 보컬 테이크(rec-vocal, 반복) · 필수 더블링·코러스(rec-chorus, 반복) |
| record | 정리 | 베스트 테이크 표시·세션 정리(rec-best) · 참여자·악기 크레딧 기록(rec-credit) |
| mix | 기준 | 기준곡 대비 보컬 전면감(mix-vocal, 반복) · 통기타 크기·저역(mix-guitar, 반복) · 공간감·리버브 앨범 기준(mix-space) |
| mix | 검수 | 수정 요청 3개 이내 정리(mix-limit) · 연속 청취로 튀는 곳 확인(mix-check) |
| done | — | 체크리스트 없음 (터미널) |

## 3. 3단계 실행

### Phase 1 — 모델·데이터 (이번 변경)

- `defaultTrackSteps` → 단계별 맵 `trackStepsByStage` + 파생 `allTrackSteps`.
- `TRACK_STAGE_KEY = "album-release-track-stage-v1"` — 곡별 현재 단계를
  localStorage에 저장(개인 상태, 체크리스트와 동일 정책). 기본값 `demo`.
- `getTrackChecklistProgress`·`getTrackNextStep`·`getTrackStatus`를 **현재 단계
  기준**으로 계산. 상태 요약은 라벨 문자열 매칭 대신 `kind`
  (waiting/active/review/ready/complete)로 집계.
- 곡 상세 카드에 **단계 칩(이동 가능)** 추가 — 새 모델을 실제로 써볼 수 있는
  최소 UI. 격자 보드는 Phase 2.
- "다시 일정" 팔로우업이 단계별 phase 색(demo/arrangement/recording/post)을 따르게.
- 전 곡이 demo 단계에서 시작하므로 **기본 화면은 기존과 동일**해야 한다.

### Phase 2 — 파이프라인 보드

- `곡별 진행` 탭 상단을 격자 뷰(곡=행, 5단계=열, 현재 위치 강조)로 교체.
- 편곡/녹음/믹스용 합성 이벤트 `buildStageEvents()` (buildTrackFollowupEvents
  패턴) — 새 event id(`arrange-*` 등)로 기존 `user_event_plans` 행과 충돌 없음.
- 모바일: 격자 대신 곡 리스트+단계 진행바로 반응형 분기.

### Phase 3 — '오늘' 보드 자동화 + 레일화

- '오늘' 카드를 격자+다음 마감에서 자동 계산(오늘 마감 / 다음 당김 / 30분용).
- 배치 이벤트("본녹음 묶음 A" 등)를 작업 단위에서 빼고 마감·수용량 레일로 강등
  (삭제 아님 — 기존 완료 id·달력 보존).

## 4. 불변 조건 (어기면 실패)

- 기존 step id·event id를 **재발급하지 않는다.** 모든 확장은 덧붙이기(additive).
  localStorage 병합(`{...기본값, ...저장값}`)이 새 키를 흡수한다.
- `schedule-data.js` 단일 소스, Supabase 런타임 소스 원칙 유지. Phase 1은 스키마·
  시드를 건드리지 않는다 (단계는 개인 상태).
- XSS: 새 렌더 경로의 신뢰 불가 값은 `escapeHtml`/`safeUrl`.
- 고정 마감(2026-11-13 유통, 2026-12-04 발매) 불변.

## 5. 검증 체크리스트 (각 Phase 공통)

- `node --check app.js schedule-data.js service-worker.js`
- `npm run build`
- 미리보기 콘솔 오류 0건, 기존 데모 체크 상태 보존 확인
- 새로고침 후 상태 유지(localStorage) 확인
- `docs/HANDOFF_FOR_CODEX.md` 기록 → Codex 리뷰
