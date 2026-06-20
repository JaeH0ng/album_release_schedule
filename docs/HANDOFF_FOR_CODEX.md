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
