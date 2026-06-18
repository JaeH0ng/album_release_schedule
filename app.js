const STORAGE_KEY = "album-release-completed-tasks-v1";
const RELEASE_DATE = "2026-12-04";
const CALENDAR_START = "2026-06-15";
const CALENDAR_END = "2026-12-06";

const phases = [
  { id: "demo", label: "판단용 데모", color: "#2f7d69" },
  { id: "structure", label: "키·구조 확정", color: "#b58418" },
  { id: "arrangement", label: "편곡 테스트", color: "#4b6fa8" },
  { id: "recording", label: "본녹음", color: "#b65043" },
  { id: "post", label: "편집·믹스·마스터", color: "#725f9e" },
  { id: "delivery", label: "유통 준비", color: "#4f626c" },
  { id: "release", label: "발매", color: "#1f2522" },
];

const tracks = [
  {
    number: "01",
    title: "Psyche",
    due: "2026-06-25",
    eventId: "demo-psyche",
    document: "tracks/01_psyche.md",
    lyrics: "lyrics/01_Psyche.txt",
  },
  {
    number: "02",
    title: "괜한 말",
    due: "2026-06-28",
    eventId: "demo-gwaenhan-mal",
    document: "tracks/02_gwaenhan-mal.md",
    lyrics: "lyrics/02_괜한_말.txt",
  },
  {
    number: "03",
    title: "날 좀 봐줘요, 좀 봐줘요",
    due: "2026-07-01",
    eventId: "demo-look-at-me",
    document: "tracks/03_look-at-me.md",
    lyrics: "lyrics/03_날_좀_봐줘요_좀_봐줘요.txt",
  },
  {
    number: "04",
    title: "누군가의",
    due: "2026-07-03",
    eventId: "demo-nugungaui",
    document: "tracks/04_nugungaui.md",
    lyrics: "lyrics/04_누군가의.txt",
  },
  {
    number: "05",
    title: "대동제",
    due: "2026-07-05",
    eventId: "demo-daedongje",
    document: "tracks/05_daedongje.md",
    lyrics: "lyrics/05_대동제.txt",
  },
  {
    number: "06",
    title: "또다시",
    due: "2026-07-09",
    eventId: "demo-ttodasi",
    document: "tracks/06_ttodasi.md",
    lyrics: "lyrics/06_또다시.txt",
  },
  {
    number: "07",
    title: "새벽 두 시",
    due: "2026-07-12",
    eventId: "demo-2am",
    document: "tracks/07_2am.md",
    lyrics: "lyrics/07_새벽_두_시.txt",
  },
  {
    number: "08",
    title: "소란스러운 밤",
    due: "2026-07-16",
    eventId: "demo-noisy-night",
    document: "tracks/08_noisy-night.md",
    lyrics: "lyrics/08_소란스러운_밤.txt",
  },
  {
    number: "09",
    title: "스물 여덟",
    due: "2026-07-19",
    eventId: "demo-twenty-eight",
    document: "tracks/09_twenty-eight.md",
    lyrics: "lyrics/09_스물_여덟.txt",
  },
  {
    number: "10",
    title: "good night",
    due: "2026-06-21",
    eventId: "demo-good-night",
    document: "tracks/10_good-night.md",
    lyrics: "lyrics/10_good_night.txt",
  },
];

const demoDetail =
  "처음부터 끝까지 이어지는 통기타+보컬 파일을 남긴다. 연주 실수보다 키, BPM과 구조를 판단할 수 있는지가 중요하다.";

const events = [
  {
    id: "demo-template",
    date: "2026-06-18",
    end: "2026-06-20",
    title: "데모 녹음 템플릿 준비",
    phase: "demo",
    duration: "60분",
    result: "입력 레벨, 파일명, 기본 트랙과 저장 경로 확정",
    detail: "첫 녹음 전에 반복해서 사용할 최소한의 세션 템플릿을 만든다. 소리 선택이나 플러그인 비교는 하지 않는다.",
    document: "DEMO_PLAN.md",
  },
  {
    id: "demo-good-night",
    date: "2026-06-21",
    title: "good night 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "good night",
    document: "tracks/10_good-night.md",
    lyrics: "lyrics/10_good_night.txt",
    milestone: true,
  },
  {
    id: "demo-psyche",
    date: "2026-06-25",
    title: "Psyche 데모",
    phase: "demo",
    duration: "60~90분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "Psyche",
    document: "tracks/01_psyche.md",
    lyrics: "lyrics/01_Psyche.txt",
  },
  {
    id: "demo-gwaenhan-mal",
    date: "2026-06-28",
    title: "괜한 말 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "괜한 말",
    document: "tracks/02_gwaenhan-mal.md",
    lyrics: "lyrics/02_괜한_말.txt",
  },
  {
    id: "demo-look-at-me",
    date: "2026-07-01",
    title: "날 좀 봐줘요, 좀 봐줘요 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "날 좀 봐줘요, 좀 봐줘요",
    document: "tracks/03_look-at-me.md",
    lyrics: "lyrics/03_날_좀_봐줘요_좀_봐줘요.txt",
  },
  {
    id: "demo-nugungaui",
    date: "2026-07-03",
    title: "누군가의 데모",
    phase: "demo",
    duration: "60~90분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "누군가의",
    document: "tracks/04_nugungaui.md",
    lyrics: "lyrics/04_누군가의.txt",
  },
  {
    id: "demo-daedongje",
    date: "2026-07-05",
    title: "대동제 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "대동제",
    document: "tracks/05_daedongje.md",
    lyrics: "lyrics/05_대동제.txt",
  },
  {
    id: "demo-ttodasi",
    date: "2026-07-09",
    title: "또다시 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "또다시",
    document: "tracks/06_ttodasi.md",
    lyrics: "lyrics/06_또다시.txt",
  },
  {
    id: "demo-2am",
    date: "2026-07-12",
    title: "새벽 두 시 데모",
    phase: "demo",
    duration: "60~90분",
    result: "전체 1테이크와 대체 가사 판단 메모",
    detail: demoDetail,
    track: "새벽 두 시",
    document: "tracks/07_2am.md",
    lyrics: "lyrics/07_새벽_두_시.txt",
  },
  {
    id: "demo-noisy-night",
    date: "2026-07-16",
    title: "소란스러운 밤 데모",
    phase: "demo",
    duration: "60~90분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "소란스러운 밤",
    document: "tracks/08_noisy-night.md",
    lyrics: "lyrics/08_소란스러운_밤.txt",
  },
  {
    id: "demo-twenty-eight",
    date: "2026-07-19",
    title: "스물 여덟 데모",
    phase: "demo",
    duration: "60분",
    result: "전체 1테이크, 임시 키/BPM, 불편한 구간 메모",
    detail: demoDetail,
    track: "스물 여덟",
    document: "tracks/09_twenty-eight.md",
    lyrics: "lyrics/09_스물_여덟.txt",
    milestone: true,
  },
  {
    id: "demo-buffer",
    date: "2026-07-20",
    end: "2026-07-21",
    title: "전곡 데모 보충 및 마감",
    phase: "demo",
    duration: "최대 2시간",
    result: "후보 10곡 모두 판단 가능한 파일 보유",
    detail: "누락 파일과 판단이 불가능한 테이크만 보충한다. 새 아이디어나 음색 탐색은 다음 단계로 넘긴다.",
    document: "DEMO_PLAN.md",
    milestone: true,
  },
  {
    id: "structure-listen",
    date: "2026-07-22",
    end: "2026-07-24",
    title: "10곡 연속 청취와 비교",
    phase: "structure",
    duration: "2회 × 90분",
    result: "각 곡의 키, 템포, 구조 문제 목록",
    detail: "녹음 직후의 감각이 아닌 앨범 전체 흐름으로 판단한다. 곡마다 바꿀 것 한 가지와 유지할 것 한 가지를 적는다.",
    document: "DEMO_PLAN.md",
  },
  {
    id: "structure-retest",
    date: "2026-07-25",
    end: "2026-07-28",
    title: "키·BPM 재테스트",
    phase: "structure",
    duration: "최대 4곡",
    result: "판단이 어려운 곡의 후보 키/BPM 비교 파일",
    detail: "모든 곡을 다시 녹음하지 않는다. 최고음, 최저음 또는 그루브가 불분명한 최대 네 곡만 짧게 비교한다.",
    document: "DEMO_PLAN.md",
  },
  {
    id: "structure-lock",
    date: "2026-07-29",
    end: "2026-07-31",
    title: "키·BPM·구조 확정",
    phase: "structure",
    duration: "3시간",
    result: "최종 후보 8~9곡과 곡별 기본 정보 확정",
    detail: "편곡 테스트가 시작된 뒤 반복해서 되돌아가지 않도록 곡의 뼈대를 결정 기록에 남긴다.",
    document: "DECISIONS.md",
    milestone: true,
  },
  {
    id: "arrangement-palette",
    date: "2026-08-01",
    end: "2026-08-02",
    title: "앨범 사운드 팔레트 설정",
    phase: "arrangement",
    duration: "2시간",
    result: "통기타·보컬의 공통 질감과 추가 악기 원칙",
    detail: "곡마다 별개의 세계를 만들기 전에 앨범 전체에 반복될 공간감, 악기 수와 보컬 거리감을 정한다.",
    document: "ALBUM.md",
  },
  {
    id: "arrangement-week-1",
    date: "2026-08-03",
    end: "2026-08-09",
    title: "편곡 테스트 1주차",
    phase: "arrangement",
    duration: "3곡",
    result: "3곡의 편곡안 A/B와 선택 메모",
    detail: "중요도가 높은 곡 세 곡부터 추가 악기, 리듬과 공간감의 두 가지 안을 빠르게 비교한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "arrangement-week-2",
    date: "2026-08-10",
    end: "2026-08-16",
    title: "편곡 테스트 2주차",
    phase: "arrangement",
    duration: "3곡",
    result: "다음 3곡의 편곡 방향 확정",
    detail: "첫 주에 정한 앨범 팔레트를 적용하되 곡별 역할이 겹치지 않는지 확인한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "arrangement-week-3",
    date: "2026-08-17",
    end: "2026-08-22",
    title: "편곡 테스트 3주차",
    phase: "arrangement",
    duration: "남은 2~3곡",
    result: "전곡 편곡 방향과 본녹음 순서",
    detail: "남은 곡을 정리하고 본녹음에 필요한 악기, 연주자와 세션 순서를 확정한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "arrangement-lock",
    date: "2026-08-23",
    title: "전곡 편곡 방향 마감",
    phase: "arrangement",
    duration: "마감",
    result: "본녹음에 들어갈 최종 편곡안",
    detail: "이후에는 연주의 완성도와 소리의 품질에 집중한다. 새로운 편곡 방향은 추가하지 않는다.",
    document: "DECISIONS.md",
    milestone: true,
  },
  {
    id: "recording-batch-a",
    date: "2026-08-24",
    end: "2026-08-30",
    title: "본녹음 묶음 A",
    phase: "recording",
    duration: "2곡",
    result: "최종 통기타·메인 보컬 2곡",
    detail: "편곡 확신이 가장 높은 두 곡부터 최종 통기타와 메인 보컬을 녹음한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "recording-batch-b",
    date: "2026-08-31",
    end: "2026-09-06",
    title: "본녹음 묶음 B",
    phase: "recording",
    duration: "2곡",
    result: "최종 통기타·메인 보컬 누적 4곡",
    detail: "메인 테이크를 우선 확정하고 더블링과 코러스는 별도 세션으로 분리한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "recording-batch-c",
    date: "2026-09-07",
    end: "2026-09-13",
    title: "본녹음 묶음 C",
    phase: "recording",
    duration: "2곡 + 크레딧 초안",
    result: "최종 녹음 누적 6곡, 참여자 크레딧 목록",
    detail: "두 곡을 녹음하면서 지금까지 참여한 연주자, 엔지니어와 사용 악기를 함께 기록한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "recording-batch-d",
    date: "2026-09-14",
    end: "2026-09-19",
    title: "본녹음 묶음 D",
    phase: "recording",
    duration: "남은 2~3곡",
    result: "전곡 최종 통기타·메인 보컬",
    detail: "남은 곡과 필수 코러스, 더블링을 마친다. 선택적 장식 파트는 우선순위를 낮춘다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "recording-lock",
    date: "2026-09-20",
    title: "본녹음 핵심 마감",
    phase: "recording",
    duration: "마감",
    result: "전곡 최종 통기타·메인 보컬 확보",
    detail: "이 날짜 이후 본녹음은 누락과 명백한 문제를 해결하는 보충 녹음으로만 제한한다.",
    document: "SCHEDULE.md",
    milestone: true,
  },
  {
    id: "post-edit-week",
    date: "2026-09-21",
    end: "2026-09-27",
    title: "보충 녹음·컴핑·편집",
    phase: "post",
    duration: "1주",
    result: "베스트 테이크, 튠과 타이밍 정리",
    detail: "재녹음 목록을 먼저 닫고 컴핑, 호흡, 노이즈와 타이밍을 정리한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "post-recording-close",
    date: "2026-09-28",
    end: "2026-09-30",
    title: "녹음 완전 마감·믹스 준비",
    phase: "post",
    duration: "3일",
    result: "정리된 세션, 트랙명, 믹스 전달 파일",
    detail: "사용하지 않는 트랙을 숨기고 파일명, 시작점, 샘플레이트와 레퍼런스 바운스를 확인한다.",
    document: "SCHEDULE.md",
    milestone: true,
  },
  {
    id: "post-mix-prep",
    date: "2026-10-01",
    end: "2026-10-04",
    title: "믹스 기준 설정",
    phase: "post",
    duration: "4일",
    result: "기준곡 1곡과 앨범 믹스 원칙",
    detail: "보컬의 전면감, 통기타 크기와 저역 기준을 한 곡에서 먼저 확정한다.",
    document: "SCHEDULE.md",
  },
  {
    id: "post-mix-a",
    date: "2026-10-05",
    end: "2026-10-11",
    title: "1차 믹스 전반부",
    phase: "post",
    duration: "4곡",
    result: "전반부 곡 1차 믹스",
    detail: "개별 곡의 화려함보다 기준곡과의 보컬·통기타 크기 일관성을 확인한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "post-mix-b",
    date: "2026-10-12",
    end: "2026-10-18",
    title: "1차 믹스 후반부",
    phase: "post",
    duration: "남은 4~5곡",
    result: "전곡 1차 믹스와 연속 청취본",
    detail: "전곡을 순서대로 들으며 음량, 공간감과 곡 사이의 전환을 기록한다.",
    document: "TRACK_STATUS.md",
  },
  {
    id: "post-mix-revision-1",
    date: "2026-10-19",
    end: "2026-10-25",
    title: "믹스 수정 1차·가사/크레딧 교정",
    phase: "post",
    duration: "1주",
    result: "수정 믹스와 확정 가사·크레딧",
    detail: "믹스 수정은 곡마다 핵심 세 가지 이내로 제한한다. 동시에 제출용 가사와 크레딧을 교정한다.",
    document: "ALBUM.md",
  },
  {
    id: "post-mix-final",
    date: "2026-10-26",
    end: "2026-10-30",
    title: "최종 믹스 마감",
    phase: "post",
    duration: "5일",
    result: "마스터링용 전곡 최종 믹스",
    detail: "음악적 아이디어 추가를 중단하고 클릭, 노이즈, 출력 형식과 곡 시작·끝을 검수한다.",
    document: "SCHEDULE.md",
    milestone: true,
  },
  {
    id: "post-master",
    date: "2026-10-31",
    end: "2026-11-06",
    title: "마스터링·트랙 순서 확정",
    phase: "post",
    duration: "1주",
    result: "전곡 마스터와 최종 트랙 순서",
    detail: "다양한 재생 환경에서 확인하고 트랙 간 음량, 질감과 여백을 확정한다.",
    document: "SCHEDULE.md",
    milestone: true,
  },
  {
    id: "delivery-package",
    date: "2026-11-07",
    end: "2026-11-09",
    title: "유통 제출 패키지 조립",
    phase: "delivery",
    duration: "3일",
    result: "마스터, 커버, 가사, 크레딧, 메타데이터",
    detail: "곡 제목 표기, 참여자 이름, 작사·작곡·편곡 정보와 파일명을 하나의 제출본으로 모은다.",
    document: "ALBUM.md",
  },
  {
    id: "delivery-qa",
    date: "2026-11-10",
    end: "2026-11-12",
    title: "제출 전 최종 검수",
    phase: "delivery",
    duration: "3일",
    result: "오탈자와 파일 오류가 없는 최종 패키지",
    detail: "처음부터 다시 입력하지 말고 체크리스트에 따라 파일과 메타데이터를 대조한다.",
    document: "SCHEDULE.md",
  },
  {
    id: "delivery-submit",
    date: "2026-11-13",
    title: "유통사 전달",
    phase: "delivery",
    duration: "고정 마감",
    result: "앨범 발매 자료 제출 완료",
    detail: "12월 4일 발매를 위해 움직일 수 없는 최종 제출일이다.",
    document: "SCHEDULE.md",
    milestone: true,
  },
  {
    id: "release-distribution-check",
    date: "2026-11-16",
    end: "2026-11-22",
    title: "유통 반영 확인·발매 콘텐츠 준비",
    phase: "release",
    duration: "1주",
    result: "플랫폼 정보 확인과 발매 공지 자료",
    detail: "유통사에서 전달되는 미리보기와 표기를 확인하고 발매 공지에 필요한 이미지와 문구를 확정한다.",
    document: "SCHEDULE.md",
  },
  {
    id: "release-promo-week",
    date: "2026-11-23",
    end: "2026-11-29",
    title: "발매 전 공개 일정 실행",
    phase: "release",
    duration: "1주",
    result: "티저와 발매 안내 공개",
    detail: "준비된 콘텐츠를 일정대로 공개하고 음악 파일 자체는 다시 수정하지 않는다.",
    document: "SCHEDULE.md",
  },
  {
    id: "release-final-week",
    date: "2026-11-30",
    end: "2026-12-03",
    title: "발매 주 최종 확인",
    phase: "release",
    duration: "4일",
    result: "링크, 소개문, 크레딧과 당일 게시물 준비",
    detail: "발매 당일 필요한 링크와 게시물을 준비하고 휴식 시간을 확보한다.",
    document: "SCHEDULE.md",
  },
  {
    id: "release-day",
    date: "2026-12-04",
    title: "정규 앨범 발매",
    phase: "release",
    duration: "발매일",
    result: "앨범 공개와 플랫폼 재생 확인",
    detail: "플랫폼별 앨범 표기와 재생 상태를 확인하고 발매 공지를 게시한다.",
    document: "ALBUM.md",
    milestone: true,
  },
];

const roadmap = [
  {
    phase: "demo",
    dates: "06.18 - 07.21",
    title: "후보 10곡의 판단용 데모",
    detail: "주당 2~3곡, 곡당 60~90분. 완성도보다 키·BPM·구조 판단을 우선한다.",
  },
  {
    phase: "structure",
    dates: "07.22 - 07.31",
    title: "키·BPM·구조와 최종 후보 확정",
    detail: "전곡을 비교하고 필요한 최대 네 곡만 재테스트한다.",
  },
  {
    phase: "arrangement",
    dates: "08.01 - 08.23",
    title: "앨범 팔레트와 곡별 편곡 방향",
    detail: "세 묶음으로 편곡안을 비교하고 본녹음에 사용할 방향을 잠근다.",
  },
  {
    phase: "recording",
    dates: "08.24 - 09.20",
    title: "최종 통기타·보컬 본녹음",
    detail: "주당 두 곡을 기본으로 네 묶음에 나누어 녹음한다.",
  },
  {
    phase: "post",
    dates: "09.21 - 11.06",
    title: "편집·믹스·마스터링",
    detail: "9월 말 녹음을 닫고 10월 30일 최종 믹스, 11월 6일 마스터를 마감한다.",
  },
  {
    phase: "delivery",
    dates: "11.07 - 11.13",
    title: "유통 제출 패키지",
    detail: "마스터, 커버, 가사, 크레딧과 메타데이터를 검수해 전달한다.",
  },
  {
    phase: "release",
    dates: "11.16 - 12.04",
    title: "발매 준비와 공개",
    detail: "유통 반영을 확인하고 준비한 공개 일정을 실행한다.",
  },
];

const state = {
  activePhase: "all",
  activeView: "calendar",
  completed: loadCompletedTasks(),
};

const phaseMap = new Map(phases.map((phase) => [phase.id, phase]));
const eventMap = new Map(events.map((event) => [event.id, event]));
const today = new Date();
today.setHours(12, 0, 0, 0);

function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - ((day + 6) % 7));
  result.setHours(12, 0, 0, 0);
  return result;
}

function formatShortDate(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateRange(event) {
  if (!event.end || event.end === event.date) return formatShortDate(event.date);
  return `${formatShortDate(event.date)} - ${formatShortDate(event.end)}`;
}

function loadCompletedTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function saveCompletedTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.completed]));
  } catch {
    // The calendar still works when a browser blocks storage for local files.
  }
}

function renderPhaseFilters() {
  const container = document.querySelector("#phase-filters");
  const filters = [{ id: "all", label: "전체 일정", color: "#7b8580" }, ...phases];

  container.innerHTML = filters
    .map((phase) => {
      const count = phase.id === "all" ? events.length : events.filter((event) => event.phase === phase.id).length;
      const active = state.activePhase === phase.id;
      return `
        <button
          class="phase-filter${active ? " is-active" : ""}"
          type="button"
          data-phase="${phase.id}"
          aria-pressed="${active}"
          style="--swatch:${phase.color}"
        >
          <span class="swatch" aria-hidden="true"></span>
          <span>${phase.label}</span>
          <span class="phase-count">${count}</span>
        </button>
      `;
    })
    .join("");

  container.querySelectorAll(".phase-filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePhase = button.dataset.phase;
      renderPhaseFilters();
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const weekList = document.querySelector("#week-list");
  const firstWeek = startOfWeek(parseDate(CALENDAR_START));
  const lastDate = parseDate(CALENDAR_END);
  const todayIso = toIso(today);
  const todayWeekIso = toIso(startOfWeek(today));
  const filteredEvents =
    state.activePhase === "all" ? events : events.filter((event) => event.phase === state.activePhase);
  const weeks = [];

  let weekStart = firstWeek;
  let weekNumber = 1;
  while (weekStart <= lastDate) {
    const weekEnd = addDays(weekStart, 6);
    const weekEventCount = filteredEvents.filter((event) => {
      const eventDate = parseDate(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    }).length;

    if (state.activePhase === "all" || weekEventCount > 0) {
      const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
      const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
      const dayCells = days
        .map((day, index) => {
          const iso = toIso(day);
          const dayEvents = filteredEvents.filter((event) => event.date === iso);
          const classes = ["day-cell"];
          if (index >= 5) classes.push("is-weekend");
          if (iso === todayIso) classes.push("is-today");
          if (dayEvents.length === 0) classes.push("is-empty");

          return `
            <div class="${classes.join(" ")}">
              <div class="day-heading">
                <span>${dayNames[index]}</span>
                <span class="day-number">${day.getDate()}</span>
              </div>
              <div class="day-events">
                ${dayEvents.map(renderEvent).join("")}
              </div>
            </div>
          `;
        })
        .join("");

      const weekIso = toIso(weekStart);
      const isCurrent = weekIso === todayWeekIso;
      weeks.push(`
        <article class="week-row${isCurrent ? " is-current" : ""}" data-week-start="${weekIso}">
          <header class="week-header">
            <div>
              <span class="week-range">${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}</span>
              <span class="week-label"> · 제작 ${weekNumber}주차</span>
            </div>
            ${isCurrent ? '<span class="current-label">현재 주</span>' : ""}
          </header>
          <div class="week-grid">${dayCells}</div>
        </article>
      `);
    }

    weekStart = addDays(weekStart, 7);
    weekNumber += 1;
  }

  weekList.innerHTML = weeks.length
    ? weeks.join("")
    : '<div class="empty-week">선택한 단계의 일정이 없습니다.</div>';

  bindEventControls();
}

function renderEvent(event) {
  const phase = phaseMap.get(event.phase);
  const complete = state.completed.has(event.id);
  const classes = ["calendar-event"];
  if (event.milestone) classes.push("is-milestone");
  if (complete) classes.push("is-complete");

  return `
    <div class="${classes.join(" ")}" style="--event-color:${phase.color}" data-event-id="${event.id}">
      <div class="event-topline">
        <input
          class="event-check"
          type="checkbox"
          aria-label="${event.title} 완료"
          ${complete ? "checked" : ""}
        />
        <button class="event-title-button" type="button">${event.title}</button>
      </div>
      <p class="event-meta">${event.end ? formatDateRange(event) : event.duration}</p>
    </div>
  `;
}

function bindEventControls() {
  document.querySelectorAll(".calendar-event").forEach((element) => {
    const eventId = element.dataset.eventId;
    const checkbox = element.querySelector(".event-check");
    const titleButton = element.querySelector(".event-title-button");

    checkbox.addEventListener("change", () => toggleCompleted(eventId, checkbox.checked));
    titleButton.addEventListener("click", () => openTaskDialog(eventMap.get(eventId)));
  });
}

function toggleCompleted(eventId, complete) {
  if (complete) state.completed.add(eventId);
  else state.completed.delete(eventId);
  saveCompletedTasks();
  renderSummary();
  renderCalendar();
  renderRoadmap();
  renderTracks();
}

function renderSummary() {
  const completedCount = events.filter((event) => state.completed.has(event.id)).length;
  const progress = Math.round((completedCount / events.length) * 100);
  const progressFill = document.querySelector("#progress-fill");
  const progressTrack = document.querySelector(".progress-track");
  document.querySelector("#progress-percent").textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));

  const currentPhase = getCurrentPhase(today);
  document.querySelector("#current-phase").textContent = currentPhase.label;

  const incomplete = events
    .filter((event) => !state.completed.has(event.id))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const overdue = incomplete.filter((event) => parseDate(event.date) < today);
  const next = overdue[0] || incomplete.find((event) => parseDate(event.date) >= today) || events.at(-1);
  document.querySelector("#next-deadline").textContent = next.title;
  document.querySelector("#next-deadline-date").textContent =
    parseDate(next.date) < today ? `${formatShortDate(next.date)} · 지연` : formatShortDate(next.date);

  const release = parseDate(RELEASE_DATE);
  const distance = Math.ceil((release - today) / 86400000);
  document.querySelector("#countdown").textContent = distance >= 0 ? `D-${distance}` : `D+${Math.abs(distance)}`;

  drawWaveform(progress);
}

function getCurrentPhase(date) {
  const iso = toIso(date);
  if (iso <= "2026-07-21") return phaseMap.get("demo");
  if (iso <= "2026-07-31") return phaseMap.get("structure");
  if (iso <= "2026-08-23") return phaseMap.get("arrangement");
  if (iso <= "2026-09-20") return phaseMap.get("recording");
  if (iso <= "2026-11-06") return phaseMap.get("post");
  if (iso <= "2026-11-13") return phaseMap.get("delivery");
  return phaseMap.get("release");
}

function renderRoadmap() {
  const container = document.querySelector("#roadmap-list");
  container.innerHTML = roadmap
    .map((item) => {
      const phase = phaseMap.get(item.phase);
      const phaseEvents = events.filter((event) => event.phase === item.phase);
      const completed = phaseEvents.filter((event) => state.completed.has(event.id)).length;
      const progress = phaseEvents.length ? Math.round((completed / phaseEvents.length) * 100) : 0;
      return `
        <article class="roadmap-row" style="--phase-color:${phase.color}">
          <div class="roadmap-phase"><span class="swatch" aria-hidden="true"></span>${phase.label}</div>
          <div class="roadmap-dates">${item.dates}</div>
          <div class="roadmap-detail">
            <strong>${item.title}</strong>
            <p>${item.detail}</p>
          </div>
          <div class="roadmap-progress">
            ${completed}/${phaseEvents.length}
            <div class="mini-progress" aria-hidden="true"><span style="width:${progress}%"></span></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTracks() {
  const body = document.querySelector("#track-table-body");
  body.innerHTML = tracks
    .map((track) => {
      const complete = state.completed.has(track.eventId);
      return `
        <tr>
          <td class="track-number">${track.number}</td>
          <td class="track-name">${track.title}</td>
          <td>${formatShortDate(track.due)}</td>
          <td><span class="status-pill${complete ? " is-complete" : ""}">${complete ? "완료" : "대기"}</span></td>
          <td>
            <div class="document-links">
              <a href="${track.document}" target="_blank">작업</a>
              <a href="${track.lyrics}" target="_blank">가사</a>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function openTaskDialog(event) {
  const dialog = document.querySelector("#task-dialog");
  const phase = phaseMap.get(event.phase);
  dialog.style.setProperty("--dialog-color", phase.color);
  document.querySelector("#dialog-phase").textContent = phase.label;
  document.querySelector("#dialog-title").textContent = event.title;
  document.querySelector("#dialog-date").textContent = formatDateRange(event);
  document.querySelector("#dialog-detail").textContent = event.detail;

  const meta = [
    ["예상 시간", event.duration],
    ["완료 결과", event.result],
  ];
  if (event.track) meta.unshift(["곡", event.track]);
  document.querySelector("#dialog-meta").innerHTML = meta
    .map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`)
    .join("");

  const links = [];
  if (event.document) links.push(`<a href="${event.document}" target="_blank">관련 문서 열기</a>`);
  if (event.lyrics) links.push(`<a href="${event.lyrics}" target="_blank">가사 열기</a>`);
  document.querySelector("#dialog-links").innerHTML = links.join("");
  dialog.showModal();
}

function setActiveView(view) {
  state.activeView = view;
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".view-panel").forEach((panel) => {
    const active = panel.id === `${view}-view`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

function jumpToCurrentWeek() {
  setActiveView("calendar");
  state.activePhase = "all";
  renderPhaseFilters();
  renderCalendar();
  const currentWeek = document.querySelector(`[data-week-start="${toIso(startOfWeek(today))}"]`);
  (currentWeek || document.querySelector(".week-row"))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawWaveform(progress) {
  const canvas = document.querySelector("#waveform");
  const context = canvas.getContext("2d");
  const values = [5, 11, 7, 16, 25, 12, 8, 20, 31, 14, 6, 10, 23, 17, 9, 29, 18, 7, 12, 21, 10, 6, 16, 8, 4];
  const center = canvas.height / 2;
  const gap = canvas.width / values.length;
  const activeBars = Math.round((values.length * progress) / 100);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 3;
  context.lineCap = "round";

  values.forEach((value, index) => {
    context.strokeStyle = index < activeBars ? "#f2c76c" : "rgba(226, 235, 230, 0.48)";
    context.beginPath();
    context.moveTo(index * gap + 2, center - value / 2);
    context.lineTo(index * gap + 2, center + value / 2);
    context.stroke();
  });
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

document.querySelector("#jump-today").addEventListener("click", jumpToCurrentWeek);
document.querySelector("#close-dialog").addEventListener("click", () => document.querySelector("#task-dialog").close());
document.querySelector("#task-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

renderPhaseFilters();
renderCalendar();
renderRoadmap();
renderTracks();
renderSummary();
