# 개발 협업 지침 — Claude 구현 / Codex 리뷰

이 문서는 두 에이전트의 역할과 리뷰 루프를 정의하는 **공유 기준**이다.
Claude는 [CLAUDE.md](../CLAUDE.md)를, Codex는 [AGENTS.md](../AGENTS.md)를 각각 자동으로 읽고, 둘 다 이 문서를 기준으로 움직인다.

## 1. 역할 분담

| | Claude Code | Codex |
|---|---|---|
| 주 역할 | **구현**(개발·수정·리팩터·검증) | **리뷰**(검토·지적) |
| 산출물 | 코드 변경 + `HANDOFF_FOR_CODEX.md` 항목 | `REVIEW_FROM_CODEX.md` 지적 항목 |
| 하지 않는 것 | 자기 코드에 "리뷰 통과" 자체 선언 | **소스 파일 직접 수정** (수정은 Claude가 한다. 필요하면 제안 diff 스니펫만 지적에 첨부) |

원칙: **구현자와 리뷰어를 분리**한다. Claude는 "동작한다"까지 책임지고, Codex는 "이대로 병합/배포해도 되는가"를 판단한다.

**Codex는 코드를 작성/수정하지 않는다.** 작은 수정이라도 직접 고치지 말고 `REVIEW_FROM_CODEX.md`에 지적으로만 남긴다. 모든 실제 수정은 Claude가 한다. (유일한 예외: 사용자가 Codex에게 명시적으로 구현을 지시한 경우.)

## 2. 리뷰 루프

```
Claude 구현 ─▶ 자가 점검 통과 ─▶ HANDOFF_FOR_CODEX.md 기록 ─▶ "리뷰 요청"
                                                              │
                                                              ▼
        Claude 수정 ◀─ REVIEW_FROM_CODEX.md 지적 ◀─ Codex 리뷰(diff + HANDOFF)
              │
              ▼
   각 지적 resolved 표시 + HANDOFF 후속 기록 ─▶ (필요 시) 재리뷰 ─▶ 병합/배포
```

- 리뷰 단위는 **하나의 작업 브랜치 diff**다. Codex는 `git diff main...HEAD`와 HANDOFF 최신 항목을 함께 본다.
- **Blocker/Major가 하나라도 열려 있으면 병합·배포하지 않는다.**

## 3. 파일 채널

| 파일 | 방향 | 내용 |
|---|---|---|
| [HANDOFF_FOR_CODEX.md](HANDOFF_FOR_CODEX.md) | Claude → Codex | 무엇을/왜 바꿨는지, 바꾼 파일, 커밋·배포 여부, **리뷰에서 특히 봐줬으면 하는 곳** (최신이 위) |
| [REVIEW_FROM_CODEX.md](REVIEW_FROM_CODEX.md) | Codex → Claude | 지적사항(파일:줄, 심각도, 근거, 제안). Claude가 처리 후 상태 갱신 (최신이 위) |

## 4. Codex 리뷰 체크리스트 (이 프로젝트 특화)

각 변경을 아래 축으로 본다. **근거는 반드시 `파일:줄`로 지목**한다.

**정확성**
- 로직 버그, 경계 조건, `null`/`undefined` 접근, 이벤트 핸들러 중복 바인딩.
- 렌더 함수가 매 상호작용마다 과하게 전체 재생성하지 않는지.

**데이터 일관성 (이 저장소의 핵심 리스크)**
- 일정/곡 변경이 `schedule-data.js`에서만 나오는가? `app.js` 배열이나 시드 SQL을 손으로 이중 관리하지 않았는가?
- `events`/`tracks`가 항상 같은 소스에서 오는가(원자적 폴백)? `sortOrder`(날짜 → sort_order)가 유지되는가?
- `track.eventId ↔ event.id` 참조 무결성. localStorage 개인 상태가 묶인 `event.id`를 함부로 바꾸지 않았는가?
- 관리자 UI 라이브 편집(Supabase)과 `schedule-data.js`(시드/폴백)의 관계를 흐리지 않았는가?

**보안**
- 사용자·DB(관리자 편집)·인증 이메일 유래 문자열을 `innerHTML`에 넣을 때 `escapeHtml`을 통과하는가?
- `href`가 `safeUrl`(http/https/상대경로 화이트리스트, `javascript:` 차단)을 통과하는가?
- RLS: `album_events`·`album_tracks`·공모전 쓰기가 admin 전용으로 유지되는가? 서비스 키가 클라이언트에 노출되지 않았는가?

**PWA / 캐시 / 배포**
- 서비스워커의 `.js/.css` 강제 최신화, 빌드 버전 스탬핑(`build-static-site.mjs`), `controllerchange` 자동 리로드를 깨지 않았는가?
- 새 정적 파일을 추가했다면 빌드 복사 목록에 넣었는가?

**UX / 접근성**
- 곡 워크플로: 단일 포커스 뷰·칩·검색·딥링크(`#track-NN`)가 유지되는가?
- 탭 ARIA(`role=tab/tabpanel`), 뷰 전환 시 포커스/스크롤, `aria-live` 상태 통지.

**문서 / 핸드오프**
- 데이터·배포 절차를 바꿨으면 `AGENTS.md`/`README.md`/`CLAUDE.md`가 최신인가?
- 고정 마감(`2026-12-04`, `2026-11-13`)과 가사 기준본을 건드리지 않았는가?

## 5. 심각도 등급

| 등급 | 의미 | 처리 |
|---|---|---|
| **Blocker** | 데이터 손상·보안 취약·크래시·기능 파손 | 병합/배포 차단. Claude가 즉시 수정 |
| **Major** | 명확한 버그·일관성 위반이나 우회 가능 | 병합 전 수정 |
| **Minor** | 동작엔 문제없는 개선(가독성·중복·소소한 UX) | 이번 또는 다음 턴에 수정 |
| **Nit** | 취향·스타일 | 선택. 반영 안 하면 사유 한 줄 |

## 6. 리뷰 결과를 주는 형식

리뷰 한 번은 **채팅 요약**과 **파일 상세** 두 형태로 준다.

### 6-1. 채팅 요약 (리뷰 직후 바로 보이는 것)

**판정 한 줄 + 항목별 한 줄**로 준다. 파일을 열기 전에 무엇을/어디를 봐야 하는지 바로 보이게 한다.

```
리뷰 완료 — 판정: 🚫 병합 차단 (Blocker 2)
- BLOCKER  이벤트 삭제가 곡까지 cascade 삭제           app.js:2477
- BLOCKER  npm run deploy가 라이브 편집을 seed로 되돌림   package.json:12
- MAJOR    부분 시드 시 error 미표면화                  app.js:675
- MAJOR    escape 누락(overlap 제목·data 속성 등)         app.js:2691 외
→ 상세: docs/REVIEW_FROM_CODEX.md
```

- 판정: `🚫 병합 차단`(Blocker/Major 있음) / `✅ 병합 가능`(Minor/Nit만 또는 없음).
- 각 줄 = `심각도 · 제목 · 위치(file:line)`.

### 6-2. 파일 상세 (REVIEW_FROM_CODEX.md)

리뷰 블록 맨 위에 **판정 + 요약 인덱스 표**를 얹고, 그 아래에 지적 상세를 붙인다.

```
## 리뷰 2026-07-03 — 브랜치 improve/ux-and-data-consistency
판정: 🚫 병합 차단 | Blocker 2 · Major 2 · Minor 0 · Nit 0

| # | 심각도 | 제목 | 위치 |
|---|--------|------|------|
| 1 | BLOCKER | 이벤트 삭제 cascade | app.js:2477 |
| 2 | BLOCKER | deploy가 라이브 편집 prune | package.json:12 |
| … |

### [열림] BLOCKER — 제목
- 위치: app.js:1234 (함수명)
- 근거: (무엇이 왜 문제인지, 코드 인용)
- 제안: (구체적 수정 방향. 필요하면 diff 스니펫은 "제안"으로만)
```

- 상태 태그: `[열림]` → Claude가 처리 후 `[수정중]` → `[resolved]` (또는 반영 안 하면 `[보류: 사유]`).
- 한 항목 = 한 이슈. 최신 리뷰 블록이 문서 위로 온다.

## 7. Claude의 대응 규칙

- 열린 Blocker/Major를 모두 처리하기 전에는 "리뷰 통과"를 선언하지 않는다.
- 각 항목을 고치면 상태를 갱신하고, 반영하지 않을 항목은 `[보류: 사유]`로 근거를 남긴다.
- 처리 결과는 `HANDOFF_FOR_CODEX.md`에 후속 항목으로 요약해 다음 리뷰가 이어지게 한다.

## 8. 공통 불변 규칙

- 브랜치에서 작업, `main` 직접 변경 금지. 저장소 인증이 `JaeH0ng`으로 확인되기 전 push 금지.
- 고정 마감 `2026-12-04`(발매)·`2026-11-13`(유통) 임의 변경 금지.
- 가사(`lyrics/`) 임의 교정·재작성 금지.
- 자세한 프로젝트 전제는 [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md) 참조.
