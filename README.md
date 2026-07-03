# 앨범 발매 작업실

이 디렉토리는 앨범의 내용, 곡별 진행 상태, 녹음 계획과 제작 결정을 한곳에서 관리하기 위한 작업 공간이다.

## 웹 캘린더

[앨범 제작 캘린더 열기](index.html)

별도 설치 없이 `index.html`을 브라우저로 열면 주차별 일정, 전체 제작 로드맵과 곡별 데모 현황을 확인할 수 있다.

Supabase 게시 일정이 준비되면 웹은 `album_events`, `album_tracks`, `singer_songwriter_opportunities` 테이블에서 최신 일정을 읽고, 체크 상태는 각 기기의 브라우저에 저장한다.

웹 첫 화면은 `이번 주 집중 대시보드`다. 여기서 이번 주에 반드시 끝낼 것, 30분 fallback, 지연 중인 작업, 최근 완료한 작업, 주간 체크인과 코덱스에게 보낼 메시지 초안을 바로 확인할 수 있다. `공모전` 탭에서는 매주 갱신되는 싱어송라이터 공모전 카드와 `수락/보류/제외` 상태를 바로 관리할 수 있다. 상단 이메일 로그인으로 들어가면 공모전 판단 상태가 폰과 PC 사이에 동기화되고, `admin_users`에 등록된 계정은 관리자 편집 패널도 사용할 수 있다.

`GROUNZ` 공고를 기준으로 후보를 다시 가져오려면 아래 명령을 실행한다.

```bash
npm run opportunities:grounz
```

이 명령은 `https://api.grounz.net/announcement`에서 최근 공고를 읽고, 싱어송라이터 성격에 맞는 후보만 골라 `public.singer_songwriter_opportunities`에 upsert한다.

## 빌드와 배포

```bash
npm run build
```

위 명령은 `dist/`에 모바일 확인용 정적 사이트를 만든다. 배포본에는 웹에 필요한 문서와 가사 기준본, 곡별 `README.md`만 포함되고 Logic Pro 작업 파일과 오디오는 포함하지 않는다.

Supabase 설정은 [docs/SUPABASE_WEB_PLAN.md](docs/SUPABASE_WEB_PLAN.md)를 참고한다. **정식 전체 초기화는 `supabase/migrations`를 `supabase db push`(`npm run supabase:sync`)로 적용하는 것**이다. 이 경로가 관리자 쓰기 RLS와 `on delete restrict` FK까지 최종 상태로 만든다. [supabase/setup_album_calendar.sql](supabase/setup_album_calendar.sql)은 기본 테이블과 시드(읽기 전용)만 담은 빠른 시작용이며, 관리자 편집 권한은 포함하지 않는다.

공모전 운영 기준은 [docs/OPPORTUNITIES.md](docs/OPPORTUNITIES.md)에 정리한다.

민감한 값은 저장소에 넣지 않는다. `Supabase` CLI 토큰과 DB 비밀번호는 `.env.local`에 두고, 예시는 [.env.example](/Users/jaell0ng/workspace/album_release_schedule/.env.example)을 따른다.

```bash
cp .env.example .env.local
```

값을 채운 뒤 원격 `Supabase`에 스키마와 시드를 다시 반영하려면:

```bash
npm run supabase:sync
```

일정과 곡 데이터는 `schedule-data.js` 한 파일이 단일 원본이다. 일정을 바꿀 때는 이 파일만 수정하고 아래 명령으로 원격 `album_events`/`album_tracks`에 반영한다. `app.js`의 일정 배열이나 시드 SQL을 손으로 이중 관리하지 않는다.

```bash
npm run schedule:sql   # 생성될 SQL을 미리 확인
npm run schedule:sync  # schedule-data.js → 원격 Supabase 반영
```

> ⚠️ `schedule:sync`는 **reset**이다. 생성 SQL이 `schedule-data.js`에 없는 원격 행을 정리(`delete … where … not in`)하므로, 관리자 화면에서 라이브로 편집한 일정/곡이 있으면 덮어쓴다. 관리자 편집을 유지하려면 먼저 `npm run schedule:sql`로 내용을 확인하고, 필요하면 `schedule-data.js`를 라이브 상태에 맞춘 뒤 실행한다. 일상 배포(`npm run deploy`)는 정적 빌드만 하고 `schedule:sync`를 실행하지 않는다.

## 바로가기

- [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md): 대화에서 합의한 앨범 전제와 운영 원칙
- [앨범 개요](docs/ALBUM.md): 앨범 제목, 컨셉, 트랙 순서와 전체 사운드
- [발매 일정](docs/SCHEDULE.md): 2026년 12월 초 발매를 위한 역산 일정
- [데모 계획](docs/DEMO_PLAN.md): 후보곡 11곡의 개별 마감과 완료 기준
- [트랙 현황](docs/TRACK_STATUS.md): 후보곡별 현재 단계와 다음 행동 (최종 8~9곡 선정 전)
- [이번 주 계획](docs/WEEKLY_PLAN.md): 매주 확보할 시간과 최소 결과물
- [결정 기록](docs/DECISIONS.md): 키, BPM, 편곡 등 되돌리지 않을 결정
- [공모전 운영](docs/OPPORTUNITIES.md): 싱어송라이터 공모전 후보, 상태와 주간 갱신 기준
- [곡별 문서](tracks/README.md): 가사, 데모, 편곡과 본녹음 계획
- [정제 가사](lyrics/README.md): 기호와 작업 메모를 제거한 가사 기준본
- [세션 기록](sessions/README.md): 실제 녹음 세션의 목표와 결과
- [곡별 작업 폴더](tracks/README.md): Logic Pro 프로젝트, 오디오, 바운스와 노트 정리 방식

## 디렉토리 구조

```text
docs/      앨범 일정, 결정, 주간 계획
lyrics/    곡별 기준 가사
sessions/  날짜 기준 녹음 세션 로그
tracks/    곡별 작업 폴더와 Logic Pro 프로젝트
```

## 운영 순서

1. `docs/ALBUM.md`에 앨범 전체 정보를 정리한다.
2. 곡 정보는 `tracks`의 해당 문서에 기록한다.
3. 진행 단계가 바뀔 때 `docs/TRACK_STATUS.md`를 갱신한다.
4. 매주 시작할 때 `docs/WEEKLY_PLAN.md`에 녹음 시간을 먼저 확보한다.
5. 키, BPM, 구조, 편곡 방향을 확정하면 `docs/DECISIONS.md`에 남긴다.
6. 녹음 전후에는 `sessions`에 세션 목표와 결과를 기록한다.

완벽하게 채우는 것보다, 현재 판단과 다음 행동이 보이게 유지하는 것이 우선이다.
