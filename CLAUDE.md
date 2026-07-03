# Claude Code 작업 지침 (구현 담당)

이 저장소는 **역할을 나눠 협업**한다.

- **Claude Code = 구현.** 기능 개발, 버그 수정, 리팩터링, 검증을 담당한다.
- **Codex = 리뷰.** Claude가 만든 변경을 검토하고 지적사항을 남긴다.

전체 규칙과 리뷰 기준은 [docs/REVIEW_GUIDE.md](docs/REVIEW_GUIDE.md)에 있다. 여기서는 **구현자(Claude)가 매번 지켜야 할 것**만 요약한다.

## 협업 루프 (Claude 시점)

1. 작업 브랜치에서 구현한다. `main`에 직접 쓰지 않는다.
2. 아래 **핸드오프 전 자가 점검**을 통과시킨다.
3. `docs/HANDOFF_FOR_CODEX.md` 맨 위에 이번 변경 항목을 추가한다 (Stop 훅이 누락을 막는다).
4. 사용자에게 "Codex 리뷰 준비 완료"라고 알린다.
5. Codex가 `docs/REVIEW_FROM_CODEX.md`에 지적을 남기면, 그것을 읽고 고친 뒤 각 항목을 `resolved`로 표시하고 HANDOFF에 후속 항목을 남긴다.

## 핸드오프(리뷰 요청) 전 자가 점검

- [ ] `node --check app.js && node --check schedule-data.js && node --check service-worker.js` 통과
- [ ] `npm run build` 성공 (스탬핑/캐시 버전 확인)
- [ ] 브라우저 미리보기로 실제 동작 확인, **콘솔 오류 0건**
- [ ] 사용자·DB·인증 유래 문자열을 `innerHTML`에 넣을 때 `escapeHtml`, `href`에 넣을 때 `safeUrl` 적용
- [ ] 일정/곡을 바꿨다면 `schedule-data.js`만 고치고 `npm run schedule:sql` 출력이 정상인지 확인 (app.js 배열·시드 SQL 손대지 않음)

## 이 프로젝트에서 절대 어기면 안 되는 것

- **단일 소스:** 일정/곡의 원본은 `schedule-data.js`다. `app.js`의 일정 배열이나 시드 마이그레이션을 손으로 이중 관리하지 않는다. 반영은 `npm run schedule:sync`.
- **런타임 소스:** 배포 환경에서 진짜 소스는 Supabase다. 관리자 UI가 `album_events`/`album_tracks`를 라이브로 편집한다. `schedule-data.js`는 시드·오프라인 폴백일 뿐이다.
- **XSS:** 모든 `innerHTML` 보간의 신뢰 불가 값은 `escapeHtml`, 링크는 `safeUrl` 화이트리스트(http/https/상대경로)를 통과해야 한다.
- **RLS/보안:** `album_events`·`album_tracks`·`singer_songwriter_opportunities` 쓰기는 `admin_users` 전용, 익명은 읽기 전용이다. 이 정책을 약화시키지 않는다. anon publishable key만 클라이언트에 둔다(서비스 키 금지).
- **PWA 캐시:** 서비스워커의 `.js/.css` 강제 최신화, 빌드 버전 스탬핑, `controllerchange` 자동 새로고침을 깨지 않는다.
- **폴백 원자성:** `events`와 `tracks`는 항상 같은 소스(둘 다 Supabase이거나 둘 다 기본값)에서 와야 하고, `sortOrder`(날짜 → sort_order 정렬)를 유지한다.
- **개인 상태 키:** 완료/체크/계획은 `event.id` 문자열에 묶여 localStorage에 저장된다. id를 함부로 재발급하면 사용자 기록이 고아가 된다.
- **고정 마감:** `2026-12-04` 발매, `2026-11-13` 유통 마감은 임의로 옮기지 않는다.
- **가사:** 아티스트 표현을 임의로 교정/재작성하지 않는다. `lyrics/`가 기준본이다.
- **푸시:** 저장소 인증이 `JaeH0ng`으로 확인되기 전에는 GitHub에 push하지 않는다.

## 참고

- Codex의 기본 읽기 목록과 프로젝트 규칙: [AGENTS.md](AGENTS.md)
- 리뷰 기준·심각도·형식: [docs/REVIEW_GUIDE.md](docs/REVIEW_GUIDE.md)
- Claude→Codex 변경 로그: [docs/HANDOFF_FOR_CODEX.md](docs/HANDOFF_FOR_CODEX.md)
- Codex→Claude 지적 로그: [docs/REVIEW_FROM_CODEX.md](docs/REVIEW_FROM_CODEX.md)
