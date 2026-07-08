import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY = "album-release-completed-tasks-v1";
const TRACK_CHECKLIST_KEY = "album-release-track-checklist-v1";
const TRACK_STAGE_KEY = "album-release-track-stage-v1";
const TRACK_NOTES_KEY = "album-release-track-notes-v1";
const TRACK_ACTIVITY_KEY = "album-release-track-activity-v1";
const TRACK_FOLLOWUPS_KEY = "album-release-track-followups-v1";
const WEEKLY_CHECKIN_KEY = "album-release-weekly-checkin-v1";
const OPPORTUNITY_REVIEW_KEY = "album-release-opportunity-review-v1";
const EVENT_PLAN_KEY = "album-release-event-plan-v1";
const MOBILE_COMPACT_KEY = "album-release-mobile-compact-v1";
const ONBOARDING_KEY = "album-release-onboarding-dismissed-v1";
const RELEASE_DATE = "2026-12-04";
const CALENDAR_START = "2026-06-15";
const CALENDAR_END = "2026-12-06";
const BASELINE_DATE = "2026-06-18";
const SUPABASE_URL = "https://udbtglztjkijxwzhfxgr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aOLCnLPzDgr-E3SjF5lbsg_oPJb2nCJ";
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_HEADERS = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  Accept: "application/json",
};
const AUTH_REDIRECT_URL = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
let deferredInstallPrompt = null;
const PHASE_BOUNDARIES = [
  { phase: "demo", eventId: "demo-buffer", field: "end" },
  { phase: "structure", eventId: "structure-lock", field: "end" },
  { phase: "arrangement", eventId: "arrangement-lock", field: "date" },
  { phase: "recording", eventId: "recording-lock", field: "date" },
  { phase: "post", eventId: "post-master", field: "end" },
  { phase: "delivery", eventId: "delivery-submit", field: "date" },
];

const phases = [
  { id: "demo", label: "판단용 데모", color: "#2f7d69" },
  { id: "structure", label: "키·구조 확정", color: "#b58418" },
  { id: "arrangement", label: "편곡 테스트", color: "#4b6fa8" },
  { id: "recording", label: "본녹음", color: "#b65043" },
  { id: "post", label: "편집·믹스·마스터", color: "#725f9e" },
  { id: "delivery", label: "유통 준비", color: "#4f626c" },
  { id: "opportunity", label: "공모전", color: "#bc5f2f" },
  { id: "release", label: "발매", color: "#1f2522" },
];

// 곡별 제작 파이프라인 5단계. phase는 달력·팔로우업 색 매핑용(phases 배열의 id).
// 단계(현재 위치)는 개인 상태로 localStorage(TRACK_STAGE_KEY)에 저장한다.
const trackStages = [
  { id: "demo", label: "데모", phase: "demo" },
  { id: "arrange", label: "편곡", phase: "arrangement" },
  { id: "record", label: "녹음", phase: "recording" },
  { id: "mix", label: "믹스", phase: "post" },
  { id: "done", label: "완료", phase: "release" },
];
const trackStageMap = new Map(trackStages.map((stage) => [stage.id, stage]));

// 단계별 체크리스트. demo의 step id는 기존 기록(localStorage) 보존을 위해
// 절대 바꾸지 않는다. 새 단계 id는 기존과 겹치지 않게 접두어를 붙인다.
const trackStepsByStage = {
  demo: [
    { id: "tune", group: "세션", label: "튜닝 + 현재 키 확인" },
    { id: "key", group: "세션", label: "후렴·최고음으로 키 테스트", repeatable: true },
    { id: "bpm", group: "세션", label: "메트로놈 BPM 후보 2개 비교", repeatable: true },
    { id: "take", group: "세션", label: "멈추지 않은 전체 1테이크 확보", repeatable: true },
    { id: "comfort", group: "세션", label: "바로 청취하며 불편한 구간 표시", repeatable: true },
    { id: "structure", group: "마감", label: "키·카포·BPM·구조 곡 문서에 기록" },
    { id: "arrangement", group: "마감", label: "얹어볼 악기·질감 1개 메모", repeatable: true },
    { id: "idea", group: "마감", label: "다음 편곡 아이디어 정리", repeatable: true },
    { id: "memo", group: "마감", label: "파일명 정리 + 곡 문서·세션 노트 연결" },
    { id: "next", group: "마감", label: "다음에 이어갈 것 1줄 기록" },
  ],
  arrange: [
    { id: "arr-palette", group: "실험", label: "앨범 팔레트 기준으로 질감 확인" },
    { id: "arr-ab", group: "실험", label: "편곡안 A/B 두 가지 비교", repeatable: true },
    { id: "arr-instr", group: "실험", label: "악기 하나씩 얹어 중심 유지 확인", repeatable: true },
    { id: "arr-role", group: "확정", label: "곡의 역할·절정 지점 한 줄 정리" },
    { id: "arr-lock", group: "확정", label: "편곡안 확정 + 필요 악기 목록 기록" },
  ],
  record: [
    { id: "rec-guitar", group: "테이크", label: "최종 통기타 메인 테이크 확보", repeatable: true },
    { id: "rec-vocal", group: "테이크", label: "메인 보컬 테이크 확보", repeatable: true },
    { id: "rec-chorus", group: "테이크", label: "필수 더블링·코러스 녹음", repeatable: true },
    { id: "rec-best", group: "정리", label: "베스트 테이크 표시 + 세션 정리" },
    { id: "rec-credit", group: "정리", label: "참여자·사용 악기 크레딧 기록" },
  ],
  mix: [
    { id: "mix-vocal", group: "기준", label: "기준곡 대비 보컬 전면감 맞추기", repeatable: true },
    { id: "mix-guitar", group: "기준", label: "통기타 크기·저역 기준 확인", repeatable: true },
    { id: "mix-space", group: "기준", label: "공간감·리버브 앨범 기준 적용" },
    { id: "mix-limit", group: "검수", label: "수정 요청 3개 이내로 정리" },
    { id: "mix-check", group: "검수", label: "연속 청취로 튀는 곳 확인" },
  ],
  done: [],
};

// 각 step이 어느 단계 소속인지 역참조할 수 있게 stage를 새겨 둔다(팔로우업 phase 매핑용).
for (const [stageId, steps] of Object.entries(trackStepsByStage)) {
  for (const step of steps) step.stage = stageId;
}
// 전체 step 플랫 목록 — 체크리스트 기본값·id 조회 등 단계 무관 연산에 사용.
const allTrackSteps = Object.values(trackStepsByStage).flat();

const trackStepGroupsByStage = {
  demo: [
    { id: "세션", label: "세션 (60분, 악기 앞에서)" },
    { id: "마감", label: "마감 (세션 직후, 책상에서)" },
  ],
  arrange: [
    { id: "실험", label: "실험 (스피커 앞에서)" },
    { id: "확정", label: "확정 (실험 직후, 책상에서)" },
  ],
  record: [
    { id: "테이크", label: "테이크 (녹음 세션)" },
    { id: "정리", label: "정리 (세션 직후)" },
  ],
  mix: [
    { id: "기준", label: "기준 맞추기 (스피커 앞에서)" },
    { id: "검수", label: "검수 (연속 청취)" },
  ],
  done: [],
};

function getStageSteps(stageId) {
  return trackStepsByStage[stageId] || [];
}

function getStageGroups(stageId) {
  return trackStepGroupsByStage[stageId] || [];
}

const defaultTrackNotes = {
  completedThisWeek: [],
  arrangementIdeas: [],
  nextUp: [],
};

const trackNoteLabels = {
  completedThisWeek: "이번 주에 한 것",
  arrangementIdeas: "얹어볼 악기 / 편곡 방향",
  nextUp: "다음에 할 것",
};

const trackNoteOptions = {
  completedThisWeek: ["키/BPM 잡음", "전체 1테이크", "구조 정리", "후렴만 재확인", "데모 완료"],
  arrangementIdeas: ["패드", "코러스 기타", "리듬 퍼커션", "베이스 느낌", "아직 안 얹음"],
  nextUp: ["전체 데모 닫기", "후렴 키 재확인", "악기 하나 더 얹기", "구조 다시 정리", "다음 곡으로 이동"],
};

import { defaultTracks, defaultEvents } from "./schedule-data.js";
const roadmap = [
  {
    phase: "demo",
    dates: "06.18 - 07.21",
    title: "후보 11곡의 판단용 데모",
    detail: "주당 2~3곡, 곡당 60~90분. 완성도보다 키·BPM·구조 판단을 우선한다.",
  },
  {
    phase: "structure",
    dates: "07.22 - 08.01",
    title: "키·BPM·구조와 데모 이후 방향 정리",
    detail: "전곡을 비교하고 필요한 최대 네 곡만 재테스트한 뒤, 최종 후보와 편곡 출발점, 모니터 스피커 준비 계획을 정한다.",
  },
  {
    phase: "arrangement",
    dates: "08.01 - 08.23",
    title: "모니터링 환경 준비와 곡별 편곡 방향",
    detail: "초반에 모니터 스피커를 준비하고, 세 묶음으로 편곡안을 비교해 본녹음에 사용할 방향을 잠근다.",
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

const weeklyFocus = {
  period: "2026-06-25 ~ 2026-07-03",
  mustFinish: [
    {
      title: "또다시 판단용 데모 우선 완성",
      detail: "2026년 7월 3일 유재하 경연 제출을 기준으로, 통기타+보컬 전체 파일과 임시 키/BPM, 톤 아이디어 메모를 먼저 닫는다.",
      meta: ["고정 제출 목표 7월 3일", "메인 60분 블록 우선 확보"],
    },
    {
      title: "괜한 말은 남는 시간에 이어가기",
      detail: "또다시 메인 블록 이후 남은 시간에 데모를 이어가고, 최소한 편곡 스케치 한 줄까지 남긴다.",
      meta: ["진행 곡 유지", "6월 28일 기존 마감 참고"],
    },
    {
      title: "부둣가는 보조 트랙으로 유지",
      detail: "부둣가도 작업 중 상태를 유지하되, 또다시와 괜한 말 뒤 남는 시간에 후렴 키/BPM 후보를 만져본다.",
      meta: ["보조 블록", "30분 세션 활용"],
    },
  ],
  fallback30: [
    "최고음 구간으로 키 확인 5분",
    "임시 BPM 하나 선택 5분",
    "멈추지 않고 전체 1테이크 15분",
    "파일명 정리 또는 편곡 아이디어 한 줄 메모 5분",
  ],
  codexPrompts: [
    "오늘 확보 가능한 시간과 곡 이름을 보내면 세션 계획을 다시 짜달라고 하기",
    "녹음 후 결과와 파일 경로를 보내고 다음 행동 한 가지만 정리해달라고 하기",
  ],
};

const dashboardDemoMonitor = {
  // '작업 중' 목록은 이제 격자(각 곡의 현재 단계)에서 파생한다 — getDashboardActiveTracks().
  // (예전 하드코딩 activeTrackNumbers는 곡이 단계를 진행하면 stale해져 제거함.)
  spotlight: {
    trackNumber: "06",
    bullets: [
      "유재하 제출 기준으로 전체 1테이크 닫기",
      "임시 키/BPM과 구조 메모 남기기",
      "톤 아이디어 1개만 바로 기록하기",
    ],
  },
};

const defaultOpportunities = [
  {
    id: "yjh-2026",
    title: "제37회 유재하음악경연대회",
    host: "유재하음악장학회",
    applicationOpen: "2026-06-12",
    deadline: "2026-07-03",
    status: "open",
    fitLabel: "아주 잘 맞음",
    fitScore: 5,
    summary:
      "모든 장르의 싱어송라이터를 대상으로 하는 대표 자작곡 경연. 미발표 창작곡 mp3와 실연 영상이 필요하다.",
    preparation:
      "대표 자작곡 1곡 선정, mp3 정리, 라이브 영상 링크 준비, 곡 소개 문장 초안 작성",
    officialUrl: "https://yjh.or.kr/application",
    sourceNote: "유재하음악장학회 공식 공고 확인",
    lastCheckedAt: "2026-06-20T10:30:00+09:00",
    sortOrder: 10,
  },
  {
    id: "ebs-hellorookie-watch",
    title: "EBS 헬로루키",
    host: "EBS 스페이스 공감",
    applicationOpen: null,
    deadline: null,
    status: "watch",
    fitLabel: "잘 맞음",
    fitScore: 4,
    summary:
      "신인 창작 뮤지션 발굴 프로젝트. 자작곡 기반 아티스트에게 적합하지만 회차별 공고 시점 확인이 필요하다.",
    preparation: "라이브 영상과 대표곡 링크를 바로 제출할 수 있게 정리해두기",
    officialUrl: "https://about.ebs.co.kr/kor/pr/release?boardId=31&boardTypeId=1&cmd=view&no=1&pageNo=1&postId=30004974029",
    sourceNote: "EBS 공식 보도자료 기준, 다음 회차 공고 모니터링",
    lastCheckedAt: "2026-06-20T10:30:00+09:00",
    sortOrder: 20,
  },
  {
    id: "hiddenstage-2026",
    title: "2026 히든스테이지",
    host: "히든스테이지",
    applicationOpen: "2026-03-16",
    deadline: "2026-04-24",
    status: "closed",
    fitLabel: "잘 맞음",
    fitScore: 4,
    summary:
      "싱어송라이터 성격과는 잘 맞지만 올해 모집은 종료. 다음 시즌 재오픈 여부를 추적하기 좋은 항목이다.",
    preparation: "내년 재오픈 전에 대표곡과 라이브 촬영본 업데이트",
    officialUrl: "https://hiddenstage.co.kr/",
    sourceNote: "공식 사이트 기준 2026 모집 종료",
    lastCheckedAt: "2026-06-20T10:30:00+09:00",
    sortOrder: 30,
  },
];

const completionState = loadCompletionState();

const state = {
  activePhase: "all",
  activeView: "dashboard",
  completed: completionState.completed,
  completedMeta: completionState.completedMeta,
  eventPlan: loadEventPlanState(),
  // 아직 원격에 반영되지 않은 로컬 변경(eventId → 큐잉 시각). 폴링 병합이
  // 이 항목을 원격 값으로 덮어쓰지 않도록 보호한다.
  eventPlanPending: new Map(),
  // 단계 원격 동기화의 pending(trackNumber → 큐잉 시각). eventPlanPending과 같은 정책.
  trackStagePending: new Map(),
  trackChecklist: loadTrackChecklistState(),
  trackStage: loadTrackStageState(),
  trackNotes: loadTrackNotesState(),
  trackActivity: loadTrackActivityState(),
  trackFollowups: loadTrackFollowupsState(),
  weeklyCheckin: loadWeeklyCheckinState(),
  opportunityReview: loadOpportunityReviewState(),
  mobileCompact: loadMobileCompactState(),
  baseEvents: sortEvents(defaultEvents),
  events: [],
  tracks: sortTracks(defaultTracks),
  activeTrackNumber: null,
  trackSearch: "",
  opportunities: sortOpportunities(defaultOpportunities),
  eventMap: new Map(),
  syncStatus: "idle",
  syncDetail: "로컬 일정 사용 중",
  authClient: null,
  session: null,
  authReady: false,
  reviewSyncTimer: null,
  isAdmin: false,
  adminLoaded: false,
};

const phaseMap = new Map(phases.map((phase) => [phase.id, phase]));
const today = new Date();
today.setHours(12, 0, 0, 0);
rebuildEventState();

function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 사용자/DB(관리자 편집)·인증 이메일 등 신뢰할 수 없는 문자열을 innerHTML에
// 넣기 전에 이스케이프한다. 저장형 XSS 방지.
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// href에 들어갈 링크는 http(s)/mailto와 저장소 내부 상대경로만 허용한다.
// 위험한 스킴(javascript:, data: 등)과 protocol-relative(//host)는 차단.
// 상대경로는 한글 등 유니코드 파일명(lyrics/02_괜한_말.txt)도 그대로 허용한다.
function safeUrl(value) {
  if (!value) return "#";
  const raw = String(value).trim();
  // 제어문자·제로폭·BOM·NBSP 등 보이지 않는 문자가 섞이면 스킴 검사 우회(브라우저가
  // 앞쪽 문자를 무시/정규화)나 파서 차이 위험이 있어 거부한다.
  if (
    [...raw].some((ch) => {
      const code = ch.charCodeAt(0);
      return (
        code <= 31 ||
        code === 127 ||
        code === 0x00a0 ||
        code === 0xfeff ||
        (code >= 0x200b && code <= 0x200d)
      );
    })
  ) {
    return "#";
  }
  if (/^(https?:|mailto:)/i.test(raw)) return escapeHtml(raw);
  // 이하 스킴 없는 값은 저장소 내부 상대경로로 간주한다.
  // 백슬래시는 브라우저가 / 로 바꿔 //host(외부)로 샐 수 있으므로 거부.
  if (raw.includes("\\")) return "#";
  // //host 형태(프로토콜 상대)는 외부로 나갈 수 있으므로 거부.
  if (/^\/\//.test(raw)) return "#";
  // 명시 스킴이 붙은 값(javascript:, data:, vbscript: …)은 거부.
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "#";
  // 그 외는 저장소 내부 상대경로(#앵커, ./, ../, docs/…, lyrics/한글.txt)로 보고 허용.
  return escapeHtml(raw);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDayOffset(fromIso, toIso) {
  return Math.round((parseDate(toIso) - parseDate(fromIso)) / 86400000);
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - ((day + 6) % 7));
  result.setHours(12, 0, 0, 0);
  return result;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
}

function formatShortDate(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatDateRange(event) {
  if (!event.end || event.end === event.date) return formatShortDate(event.date);
  return `${formatShortDate(event.date)} - ${formatShortDate(event.end)}`;
}

function formatDotDate(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`;
}

function formatSyncTimestamp(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTrackActivityTimestamp(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sortEvents(items) {
  return [...items].sort((left, right) => {
    const dateGap = parseDate(left.date) - parseDate(right.date);
    if (dateGap !== 0) return dateGap;
    // 같은 날짜의 작업(예: 녹음 → 리뷰 슬롯)은 sort_order로 순서를 지킨다.
    return (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999);
  });
}

function sortTracks(items) {
  return [...items].sort((left, right) => {
    const sortGap = (left.sortOrder ?? 9999) - (right.sortOrder ?? 9999);
    if (sortGap !== 0) return sortGap;
    return left.number.localeCompare(right.number, "en");
  });
}

function sortOpportunities(items) {
  const statusRank = { open: 0, watch: 1, closed: 2 };
  return [...items].sort((left, right) => {
    const sortGap = (left.sortOrder || 9999) - (right.sortOrder || 9999);
    if (sortGap !== 0) return sortGap;
    const statusGap = (statusRank[left.status] ?? 9) - (statusRank[right.status] ?? 9);
    if (statusGap !== 0) return statusGap;
    const leftDate = left.deadline || left.applicationOpen || "9999-12-31";
    const rightDate = right.deadline || right.applicationOpen || "9999-12-31";
    return parseDate(leftDate) - parseDate(rightDate);
  });
}

function findTrack(trackNumber) {
  return state.tracks.find((track) => track.number === trackNumber);
}

// 이 eventId가 어떤 곡의 데모 이벤트인가? (곡의 데모 이벤트 완료를 stage 권위의 투영으로 다룬다)
function findTrackByEventId(eventId) {
  if (!eventId) return null;
  return state.tracks.find((track) => track.eventId === eventId) || null;
}

function findTrackStep(stepId) {
  return allTrackSteps.find((step) => step.id === stepId);
}

function setScheduleData({ events = state.events, tracks = state.tracks }) {
  state.baseEvents = sortEvents(events);
  state.tracks = sortTracks(tracks);
  ensureTrackState();
  rebuildEventState();
  validateScheduleIntegrity();
}

// state.tracks(로컬 기본값이든 Supabase든)에 있는 모든 곡이 체크리스트/메모/활동
// 항목을 갖도록 보장한다. Supabase가 defaultTracks에 없는 곡(예: 12번)을 내려줘도
// 체크박스 클릭 시 undefined 접근으로 곡 탭이 죽지 않게 하는 안전장치.
function ensureTrackState() {
  for (const track of state.tracks) {
    const number = track.number;
    if (!state.trackChecklist[number]) {
      state.trackChecklist[number] = Object.fromEntries(allTrackSteps.map((step) => [step.id, false]));
    }
    if (!trackStageMap.has(state.trackStage[number])) {
      state.trackStage[number] = "demo";
    }
    if (!state.trackNotes[number]) {
      state.trackNotes[number] = { completedThisWeek: [], arrangementIdeas: [], nextUp: [] };
    }
    if (!state.trackActivity[number]) {
      state.trackActivity[number] = [];
    }
  }
}

// 곡이 참조하는 event가 실제로 존재하는지 확인한다. events/tracks가 서로 다른
// 소스에서 섞여 오면 참조가 끊겨 곡 상태 배지가 잘못 뜨는데, 이를 표면화한다.
function validateScheduleIntegrity() {
  const orphans = state.tracks.filter((track) => track.eventId && !state.eventMap.has(track.eventId));
  if (orphans.length > 0) {
    console.warn(
      "[schedule] 곡이 참조하는 이벤트를 찾을 수 없습니다 (일정 데이터 불일치):",
      orphans.map((track) => `${track.number} ${track.title} → ${track.eventId}`)
    );
  }
  return orphans;
}

function setOpportunityData(opportunities = state.opportunities) {
  state.opportunities = sortOpportunities(opportunities);
  rebuildEventState();
}

function rebuildEventState() {
  const acceptedEvents = buildAcceptedOpportunityEvents();
  const trackFollowupEvents = buildTrackFollowupEvents();
  state.events = sortEvents(
    [...state.baseEvents, ...acceptedEvents, ...trackFollowupEvents].map((event) => applyEventPlan(event))
  );
  state.eventMap = new Map(state.events.map((event) => [event.id, event]));
}

function buildTrackFollowupEvents() {
  return state.trackFollowups
    .map((followup) => {
      const track = findTrack(followup.trackNumber);
      const step = findTrackStep(followup.stepId);
      if (!track || !step) return null;

      return {
        id: followup.id,
        date: followup.date,
        title: `${track.title} · ${step.label}`,
        // step이 속한 제작 단계의 phase 색(demo/arrangement/recording/post)을 따른다.
        phase: trackStageMap.get(step.stage)?.phase || "demo",
        duration: "30분",
        result: "반복 확인 메모 1개",
        detail: `이전에 했던 "${step.label}" 작업을 다시 점검하고, 다음에 이어갈 판단을 남긴다.`,
        track: track.title,
        document: track.document,
        lyrics: track.lyrics,
        kind: "track-followup",
        trackNumber: track.number,
        stepId: step.id,
        isFollowup: true,
      };
    })
    .filter(Boolean);
}

function applyEventPlan(event) {
  const plan = state.eventPlan[event.id] || {};
  const originalDate = event.originalDate || event.date;
  const originalEnd = event.originalEnd || event.end || null;
  const overrideDate = plan.overrideDate || null;
  const nextDate = overrideDate || originalDate;
  const offsetDays = overrideDate ? getDayOffset(originalDate, overrideDate) : 0;
  return {
    ...event,
    originalDate,
    originalEnd,
    date: nextDate,
    end: originalEnd ? toIso(addDays(parseDate(originalEnd), offsetDays)) : null,
    focusStatus: plan.focusStatus || "none",
    overrideDate,
  };
}

function findEvent(eventId) {
  return state.eventMap.get(eventId);
}

function getCalendarBounds() {
  if (state.events.length === 0) {
    return {
      start: parseDate(CALENDAR_START),
      end: parseDate(CALENDAR_END),
    };
  }

  const first = parseDate(state.events[0].date);
  const lastEvent = state.events.at(-1);
  const last = parseDate(lastEvent.end || lastEvent.date);
  return { start: first, end: last };
}

function updateChrome() {
  const releaseEvent = findEvent("release-day");
  const deliveryEvent = findEvent("delivery-submit");
  const demoEvent = findEvent("demo-buffer");
  const arrangementEvent = findEvent("arrangement-lock");
  const recordingEvent = findEvent("recording-lock");
  const mixEvent = findEvent("post-mix-final");

  document.querySelector("#release-date-display").textContent = `${(releaseEvent?.date || RELEASE_DATE).replaceAll("-", ".")} 발매`;
  document.querySelector("#critical-demo").textContent = formatDotDate(demoEvent?.end || demoEvent?.date || "2026-07-21");
  document.querySelector("#critical-arrangement").textContent = formatDotDate(arrangementEvent?.date || "2026-08-23");
  document.querySelector("#critical-recording").textContent = formatDotDate(recordingEvent?.date || "2026-09-20");
  document.querySelector("#critical-mix").textContent = formatDotDate(mixEvent?.end || mixEvent?.date || "2026-10-30");
  document.querySelector("#critical-delivery").textContent = formatDotDate(deliveryEvent?.date || "2026-11-13");
  document.querySelector("#footer-baseline").textContent = `일정 기준일 ${BASELINE_DATE.replaceAll("-", ".")}`;
  document.querySelector("#footer-storage-note").textContent = canUseRemoteReviewSync()
    ? "공모전 판단 상태는 Supabase로 동기화되고, 게시 일정은 Supabase에서 불러옴"
    : SUPABASE_PUBLISHABLE_KEY
      ? "공모전 판단 상태는 이 브라우저에 저장되고, 게시 일정은 Supabase에서 불러옴"
      : "체크 상태는 이 브라우저에 저장됨";
}

function setSyncStatus(status, summary, detail) {
  state.syncStatus = status;
  state.syncDetail = detail;
  document.querySelector("#sync-status-text").textContent = summary;
  document.querySelector("#sync-status-detail").textContent = detail;
  // 평상시엔 헤더의 색 점 하나로만 상태를 전달하고,
  const dot = document.querySelector("#sync-dot");
  if (dot) dot.dataset.syncStatus = status;
  const refreshButton = document.querySelector("#refresh-data");
  if (refreshButton) refreshButton.disabled = status === "loading";
  // 오류일 때만 전폭 배너로 승격한다 — 오래된 데이터를 최신으로 오인하지 않게.
  const banner = document.querySelector("#sync-error-banner");
  if (banner) {
    if (status === "error") {
      banner.textContent = `${summary} — ${detail}`;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }
}

function normalizeEventRow(row) {
  return {
    id: row.id,
    date: row.date,
    end: row.end || null,
    title: row.title,
    phase: row.phase,
    duration: row.duration,
    result: row.result,
    detail: row.detail,
    track: row.track || null,
    document: row.document || null,
    lyrics: row.lyrics || null,
    milestone: Boolean(row.milestone),
    kind: row.kind || "album",
    sortOrder: row.sort_order ?? null,
  };
}

function normalizeTrackRow(row) {
  return {
    number: String(row.number).padStart(2, "0"),
    title: row.title,
    due: row.due,
    eventId: row.event_id,
    document: row.document,
    lyrics: row.lyrics,
    sortOrder: row.sort_order ?? null,
  };
}

function normalizeOpportunityRow(row) {
  return {
    id: row.id,
    title: row.title,
    host: row.host,
    applicationOpen: row.application_open || null,
    deadline: row.deadline || null,
    status: row.status || "watch",
    fitLabel: row.fit_label || "확인 필요",
    fitScore: Number(row.fit_score || 0),
    summary: row.summary || "",
    preparation: row.preparation || "",
    officialUrl: row.official_url,
    sourceNote: row.source_note || "",
    lastCheckedAt: row.last_checked_at || null,
    sortOrder: row.sort_order || 9999,
  };
}

async function fetchSupabaseTable(table, select, order) {
  const url = new URL(`${SUPABASE_REST_URL}/${table}`);
  url.searchParams.set("select", select);
  if (order) url.searchParams.set("order", order);

  const response = await fetch(url, {
    headers: SUPABASE_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`${table} fetch failed: ${response.status}`);
  }

  return response.json();
}

async function refreshSupabaseData() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    setSyncStatus("idle", "로컬 일정 사용 중", "Supabase 설정이 비어 있음");
    return;
  }

  setSyncStatus("loading", "Supabase 일정 확인 중", "게시된 변경 사항을 가져오는 중");

  try {
    const [eventRows, trackRows, opportunityRows] = await Promise.all([
      fetchSupabaseTable(
        "album_events",
        "id,date,end,title,phase,duration,result,detail,track,document,lyrics,milestone,sort_order",
        "sort_order.asc.nullslast,date.asc"
      ),
      fetchSupabaseTable(
        "album_tracks",
        "number,title,due,event_id,document,lyrics,sort_order",
        "sort_order.asc.nullslast,number.asc"
      ),
      fetchSupabaseTable(
        "singer_songwriter_opportunities",
        "id,title,host,application_open,deadline,status,fit_label,fit_score,summary,preparation,official_url,source_note,last_checked_at,sort_order",
        "sort_order.asc.nullslast,deadline.asc.nullslast,title.asc"
      ),
    ]);

    // events와 tracks는 event_id로 서로를 참조하므로 반드시 같은 소스에서 와야 한다.
    // 한쪽만 채워진 상태(부분 시드)에서 섞으면 곡↔이벤트 참조가 끊긴다.
    const useSupabaseSchedule = eventRows.length > 0 && trackRows.length > 0;
    const partialSchedule = eventRows.length > 0 !== (trackRows.length > 0);
    const timestamp = formatSyncTimestamp(new Date());
    const nextOpportunities =
      opportunityRows.length > 0 ? opportunityRows.map(normalizeOpportunityRow) : defaultOpportunities;

    // 부분 시드: 공모전 테이블 유무와 무관하게 먼저 처리해, 기본 일정으로
    // 원자적 폴백하고 오류를 표면화한다. (실제 표시 데이터 = 기본값)
    if (partialSchedule) {
      setScheduleData({ events: defaultEvents, tracks: defaultTracks });
      setOpportunityData(nextOpportunities);
      updateChrome();
      renderAll();
      setSyncStatus(
        "error",
        "로컬 일정 사용 중",
        `일정/곡 테이블 중 하나만 채워져 있어 기본 일정을 사용합니다 (${timestamp})`
      );
      return;
    }

    if (useSupabaseSchedule || opportunityRows.length > 0) {
      setScheduleData({
        events: useSupabaseSchedule ? eventRows.map(normalizeEventRow) : defaultEvents,
        tracks: useSupabaseSchedule ? trackRows.map(normalizeTrackRow) : defaultTracks,
      });
      setOpportunityData(nextOpportunities);
      updateChrome();
      renderAll();
      setSyncStatus(
        "ready",
        useSupabaseSchedule ? "Supabase 게시 일정 사용 중" : "로컬 일정 사용 중",
        `${timestamp} 동기화 완료`
      );
      return;
    }

    // 세 테이블 모두 비어 있음: 이전에 Supabase 데이터를 표시했더라도 기본값으로 되돌려
    // 화면과 상태 문구를 일치시킨다.
    setScheduleData({ events: defaultEvents, tracks: defaultTracks });
    setOpportunityData(defaultOpportunities);
    updateChrome();
    renderAll();
    setSyncStatus("idle", "로컬 일정 사용 중", "Supabase 테이블이 비어 있어 기본 일정을 표시");
  } catch (error) {
    console.error(error);
    // 연결 실패 시에도 실제 표시 데이터를 기본값으로 되돌려 상태 문구("기본 일정")와
    // 화면을 일치시킨다. (이전에 Supabase 데이터를 로드한 뒤 실패해도 안전)
    setScheduleData({ events: defaultEvents, tracks: defaultTracks });
    setOpportunityData(defaultOpportunities);
    updateChrome();
    renderAll();
    setSyncStatus("error", "로컬 일정 사용 중", "Supabase 연결 실패, 기본 일정으로 표시");
  }
}

function loadCompletionState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) {
      const meta = Object.fromEntries(stored.map((id) => [id, { completedAt: null }]));
      return { completed: new Set(stored), completedMeta: new Map(Object.entries(meta)) };
    }

    const ids = Array.isArray(stored.ids) ? stored.ids : [];
    const meta = stored.meta && typeof stored.meta === "object" ? stored.meta : {};
    return { completed: new Set(ids), completedMeta: new Map(Object.entries(meta)) };
  } catch {
    return { completed: new Set(), completedMeta: new Map() };
  }
}

function saveCompletedTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ids: [...state.completed],
        meta: Object.fromEntries(state.completedMeta),
      })
    );
  } catch {
    // The calendar still works when a browser blocks storage for local files.
  }
}

function loadEventPlanState() {
  try {
    const stored = JSON.parse(localStorage.getItem(EVENT_PLAN_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveEventPlanState() {
  try {
    localStorage.setItem(EVENT_PLAN_KEY, JSON.stringify(state.eventPlan));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function loadMobileCompactState() {
  try {
    const stored = localStorage.getItem(MOBILE_COMPACT_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Ignore storage errors for local previews.
  }
  return typeof window !== "undefined" ? window.innerWidth <= 760 : false;
}

function saveMobileCompactState() {
  try {
    localStorage.setItem(MOBILE_COMPACT_KEY, String(state.mobileCompact));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function buildDefaultTrackNotes() {
  return Object.fromEntries(
    defaultTracks.map((track) => [
      track.number,
      {
        completedThisWeek: [...defaultTrackNotes.completedThisWeek],
        arrangementIdeas: [...defaultTrackNotes.arrangementIdeas],
        nextUp: [...defaultTrackNotes.nextUp],
      },
    ])
  );
}

function buildDefaultTrackActivity() {
  return Object.fromEntries(defaultTracks.map((track) => [track.number, []]));
}

function buildDefaultTrackChecklist() {
  return Object.fromEntries(
    defaultTracks.map((track) => [
      track.number,
      Object.fromEntries(allTrackSteps.map((step) => [step.id, false])),
    ])
  );
}

// defaultTracks 밖 곡(예: Supabase에서 추가된 12번)의 저장 항목을 merged에 보존한다.
// base(기본곡)에 없는 trackNumber만 대상. sanitize는 유효하면 정제값을, 무효면 null을
// 반환한다. base 키만 순회하는 로더는 이런 곡 기록을 새로고침마다 잃으므로, 세 개인상태
// 로더(체크리스트·노트·활동)가 이 헬퍼로 보존 정책을 한 곳에 모은다.
function preserveExtraTrackKeys(merged, stored, sanitize) {
  for (const [trackNumber, value] of Object.entries(stored)) {
    if (merged[trackNumber]) continue;
    const cleaned = sanitize(value);
    if (cleaned !== null) merged[trackNumber] = cleaned;
  }
  return merged;
}

function loadTrackChecklistState() {
  const base = buildDefaultTrackChecklist();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_CHECKLIST_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    const merged = Object.fromEntries(
      Object.entries(base).map(([trackNumber, defaults]) => [
        trackNumber,
        {
          ...defaults,
          ...(stored[trackNumber] || {}),
        },
      ])
    );
    return preserveExtraTrackKeys(merged, stored, (checks) =>
      checks && typeof checks === "object" ? { ...checks } : null
    );
  } catch {
    return base;
  }
}

function saveTrackChecklistState() {
  try {
    localStorage.setItem(TRACK_CHECKLIST_KEY, JSON.stringify(state.trackChecklist));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function buildDefaultTrackStages() {
  return Object.fromEntries(defaultTracks.map((track) => [track.number, "demo"]));
}

// 두 단계 맵이 의미상 같은지 비교. 키가 없거나 "demo"이면 같은 것으로 본다(demo=행 없음 정책).
function trackStagesEqual(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] || "demo") !== (b[key] || "demo")) return false;
  }
  return true;
}

// 곡별 현재 단계(개인 상태). 체크리스트와 같은 정책 — localStorage 전용,
// 알 수 없는 값은 demo로 폴백해 렌더가 깨지지 않게 한다.
function loadTrackStageState() {
  const base = buildDefaultTrackStages();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_STAGE_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    const merged = { ...base };
    for (const [trackNumber, stageId] of Object.entries(stored)) {
      if (trackStageMap.has(stageId)) {
        merged[trackNumber] = stageId;
      }
    }
    return merged;
  } catch {
    return base;
  }
}

function saveTrackStageState() {
  try {
    localStorage.setItem(TRACK_STAGE_KEY, JSON.stringify(state.trackStage));
  } catch {
    // Ignore storage errors for local previews.
  }
}

// 저장된 노트 한 곡분을 sanitize한다(모든 필드를 배열로 강제, 기본 키 채움).
function sanitizeTrackNote(stored) {
  return {
    ...defaultTrackNotes,
    ...Object.fromEntries(
      Object.entries(stored || {}).map(([key, value]) => [key, Array.isArray(value) ? value : []])
    ),
  };
}

function loadTrackNotesState() {
  const base = buildDefaultTrackNotes();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_NOTES_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    const merged = Object.fromEntries(
      Object.entries(base).map(([trackNumber, defaults]) => [
        trackNumber,
        {
          ...defaults,
          ...Object.fromEntries(
            Object.entries(stored[trackNumber] || {}).map(([key, value]) => [
              key,
              Array.isArray(value) ? value : [],
            ])
          ),
        },
      ])
    );
    return preserveExtraTrackKeys(merged, stored, (note) =>
      note && typeof note === "object" ? sanitizeTrackNote(note) : null
    );
  } catch {
    return base;
  }
}

function saveTrackNotesState() {
  try {
    localStorage.setItem(TRACK_NOTES_KEY, JSON.stringify(state.trackNotes));
  } catch {
    // Ignore storage errors for local previews.
  }
}

// 저장된 활동 배열 한 곡분을 sanitize한다(유효 항목만, 최근 20개).
function sanitizeTrackActivity(entries) {
  return entries
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.text === "string" &&
        typeof entry.createdAt === "string"
    )
    .slice(0, 20);
}

function loadTrackActivityState() {
  const base = buildDefaultTrackActivity();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_ACTIVITY_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    const merged = Object.fromEntries(
      Object.entries(base).map(([trackNumber, defaults]) => [
        trackNumber,
        Array.isArray(stored[trackNumber]) ? sanitizeTrackActivity(stored[trackNumber]) : defaults,
      ])
    );
    return preserveExtraTrackKeys(merged, stored, (entries) =>
      Array.isArray(entries) ? sanitizeTrackActivity(entries) : null
    );
  } catch {
    return base;
  }
}

function saveTrackActivityState() {
  try {
    localStorage.setItem(TRACK_ACTIVITY_KEY, JSON.stringify(state.trackActivity));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function loadTrackFollowupsState() {
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_FOLLOWUPS_KEY) || "[]");
    if (!Array.isArray(stored)) return [];

    return stored.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.trackNumber === "string" &&
        typeof item.stepId === "string" &&
        typeof item.date === "string"
    );
  } catch {
    return [];
  }
}

function saveTrackFollowupsState() {
  try {
    localStorage.setItem(TRACK_FOLLOWUPS_KEY, JSON.stringify(state.trackFollowups));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function loadOpportunityReviewState() {
  try {
    const stored = JSON.parse(localStorage.getItem(OPPORTUNITY_REVIEW_KEY) || "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveOpportunityReviewState() {
  try {
    localStorage.setItem(OPPORTUNITY_REVIEW_KEY, JSON.stringify(state.opportunityReview));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function getAuthUser() {
  return state.session?.user || null;
}

function canUseRemoteReviewSync() {
  return Boolean(state.authClient && getAuthUser());
}

function canUseAdminMode() {
  return Boolean(canUseRemoteReviewSync() && state.isAdmin);
}

function updateAuthChrome() {
  const user = getAuthUser();
  const authStatusText = document.querySelector("#auth-status-text");
  const authStatusDetail = document.querySelector("#auth-status-detail");
  const authGoogle = document.querySelector("#auth-google");
  const authSignout = document.querySelector("#auth-signout");
  const installButton = document.querySelector("#install-app");
  const dot = document.querySelector("#sync-dot");
  if (dot) dot.classList.toggle("is-authed", Boolean(user));

  const footerStorageNote = document.querySelector("#footer-storage-note");
  if (footerStorageNote) {
    footerStorageNote.textContent = user
      ? "체크·계획 상태가 계정에 동기화됨"
      : "체크 상태는 이 브라우저에 저장됨";
  }

  if (user) {
    authStatusText.textContent = user.email || "로그인됨";
    authStatusDetail.textContent = state.isAdmin
      ? "완료·계획·공모전 판단이 계정에 동기화됨 (관리자)"
      : "완료·계획·공모전 판단이 계정에 동기화됨";
    authGoogle.hidden = true;
    authSignout.hidden = false;
    installButton.hidden = !deferredInstallPrompt;
    return;
  }

  authStatusText.textContent = state.authReady ? "Google 로그인 전" : "로그인 확인 중";
  authStatusDetail.textContent = state.authReady
    ? "Google로 로그인하면 작업 상태와 관리자 권한을 이어서 사용합니다"
    : "Supabase 세션을 확인하는 중";
  authGoogle.hidden = false;
  authSignout.hidden = true;
  installButton.hidden = !deferredInstallPrompt;
}

function updateAppModeChrome() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const mobile = window.innerWidth <= 760;
  document.body.classList.toggle("body-standalone", standalone);
  // '집중 보기'는 데스크톱에서도 동작한다(보조 카드 접기).
  document.body.classList.toggle("body-mobile-compact", state.mobileCompact);
  document.body.classList.toggle("body-mobile", mobile);
  const toggle = document.querySelector("#mobile-focus-toggle");
  if (toggle) {
    toggle.hidden = false;
    toggle.textContent = state.mobileCompact ? "전체 보기" : "집중 보기";
  }
}

function updateAdminChrome() {
  const panel = document.querySelector("#admin-panel");
  const badge = document.querySelector("#admin-status-badge");
  if (!panel || !badge) return;

  if (!getAuthUser()) {
    panel.hidden = true;
    badge.textContent = "로그인 필요";
    return;
  }

  if (canUseAdminMode()) {
    panel.hidden = false;
    badge.textContent = "관리자 편집 가능";
    return;
  }

  panel.hidden = true;
  badge.textContent = state.adminLoaded ? "권한 없음" : "관리자 확인 중";
}

async function loadAdminAccess() {
  state.isAdmin = false;
  state.adminLoaded = true;

  if (!canUseRemoteReviewSync()) {
    updateAdminChrome();
    return;
  }

  const user = getAuthUser();
  const { data, error } = await state.authClient
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    console.error(error);
    updateAdminChrome();
    return;
  }

  state.isAdmin = Boolean(data);
  updateAdminChrome();
}

async function loadRemoteOpportunityReviews() {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  const { data, error } = await state.authClient
    .from("opportunity_reviews")
    .select("opportunity_id, review_status, updated_at")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  state.opportunityReview = Object.fromEntries(
    (data || []).map((row) => [
      row.opportunity_id,
      {
        status: row.review_status,
        updatedAt: row.updated_at,
      },
    ])
  );
  saveOpportunityReviewState();
  rebuildEventState();
  renderAll();
}

// ---- 개인 계획(끌어오기·순서·완료) 계정 동기화 ----
// 로그인하면 user_event_plans(RLS: 본인 행만)와 localStorage를 양쪽으로 맞춘다.
// 규칙:
// - 최초 연결(backfill이면서 원격이 완전히 비어 있을 때)에만 이 브라우저의 기록을
//   원격에 올린다. 원격에 행이 하나라도 있으면 다른 기기가 이미 동기화를 시작한
//   것이므로 로컬 전용 id를 되살리지 않고 원격 삭제를 존중한다.
// - 폴링(45초)은 원격을 기준으로 수렴하되, 아직 원격에 반영되지 않은 로컬 변경
//   (eventPlanPending)과 로컬 전용 id는 덮어쓰지 않는다.
// - 트랙 팔로우업(track-followup-*)은 재구성 정보(trackNumber·stepId·date)가
//   localStorage에만 있어 원격 row만으로는 다른 기기에서 복원할 수 없다. 유령 완료
//   row를 만들지 않도록 원격 sync에서 제외하고 로컬 전용으로 둔다.

// 원격 계정 동기화에서 제외하는 로컬 전용 계획 id.
function isLocalOnlyPlanId(eventId) {
  return typeof eventId === "string" && eventId.startsWith("track-followup-");
}

async function loadRemoteEventPlans({ backfill = false } = {}) {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  // SELECT를 보내는 시점의 pending을 스냅샷으로 잡아 둔다. 이 SELECT 응답이 도착하기
  // 전에 삭제(DELETE) 재시도가 성공해 pending이 풀려도, 스냅샷에 있던 tombstone은
  // apply에서 계속 보존해 '삭제 전 원격 row'가 다시 채워지는 경합을 막는다.
  const protectIds = new Set(state.eventPlanPending.keys());
  const { data, error } = await state.authClient
    .from("user_event_plans")
    .select("event_id, focus_status, override_date, plan_order, is_completed, completed_at")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  applyRemoteEventPlans(data || [], { backfill, protectIds });
}

function applyRemoteEventPlans(rows, { backfill = false, protectIds = new Set() } = {}) {
  // 원격 전용 id는 로컬 전용(track-followup)을 스킵한다 — 방어적. 서버에 남아 있는
  // 구버전 유령 row가 있어도 무시하고 로컬 배열을 기준으로 렌더한다.
  const remoteRows = rows.filter((row) => !isLocalOnlyPlanId(row.event_id));
  const nextPlan = {};
  const nextCompleted = new Set();
  const nextCompletedMeta = new Map();

  remoteRows.forEach((row) => {
    const plan = {
      focusStatus: row.focus_status || "none",
      overrideDate: row.override_date || null,
      order: typeof row.plan_order === "number" ? row.plan_order : null,
    };
    if (plan.focusStatus !== "none" || plan.overrideDate || plan.order != null) {
      nextPlan[row.event_id] = plan;
    }
    if (row.is_completed) {
      nextCompleted.add(row.event_id);
      nextCompletedMeta.set(row.event_id, { completedAt: row.completed_at || null });
    }
  });

  // 최초 연결(원격이 비어 있을 때)에만 이 브라우저의 기록 전체를 원격에 올린다.
  const firstConnect = backfill && remoteRows.length === 0;

  // 항상 로컬 값으로 보존해야 하는 id: 로컬 전용(track-followup) + 아직 원격에
  // 반영되지 않은 로컬 변경(pending) + 최초 연결 시 로컬 기록 전체.
  // pending에는 로컬 plan/completed에서 이미 빠진 '삭제 tombstone' id도 있으므로
  // eventPlan·completed key뿐 아니라 eventPlanPending key까지 함께 순회해야
  // 원격에 남아 있는 예전 row가 다시 채워지지 않는다.
  const uploadIds = [];
  const preserveIds = new Set();
  new Set([
    ...Object.keys(state.eventPlan),
    ...state.completed,
    ...state.eventPlanPending.keys(),
    ...protectIds,
  ]).forEach((id) => {
    const localOnly = isLocalOnlyPlanId(id);
    const pending = state.eventPlanPending.has(id);
    // protect = 지금 pending이거나, 이 SELECT를 보낸 시점에 pending이던 id(경합 방어).
    const protect = pending || protectIds.has(id);
    if (localOnly || protect || firstConnect) {
      preserveIds.add(id);
      // 원격에 올릴 대상은 로컬 전용을 제외한다(queueEventPlanSync도 재차 막는다).
      if (!localOnly && (pending || firstConnect)) uploadIds.push(id);
    }
  });

  preserveIds.forEach((id) => {
    if (state.eventPlan[id]) nextPlan[id] = { ...getEventPlan(id) };
    else delete nextPlan[id]; // 로컬에서 지운 항목(pending 삭제)은 로컬 기준으로 없앤다.
    if (state.completed.has(id)) {
      nextCompleted.add(id);
      nextCompletedMeta.set(id, state.completedMeta.get(id) || { completedAt: null });
    } else {
      nextCompleted.delete(id);
      nextCompletedMeta.delete(id);
    }
  });

  state.eventPlan = nextPlan;
  state.completed = nextCompleted;
  state.completedMeta = nextCompletedMeta;
  saveEventPlanState();
  saveCompletedTasks();
  rebuildEventState();
  renderAll();

  // 최초 연결 시 로컬 기록을 원격에 올린다(상태 반영 후). pending은 이미 큐에 있으므로
  // 중복 큐잉을 피하려 최초 연결 케이스만 여기서 올린다.
  if (firstConnect) uploadIds.forEach((id) => queueEventPlanSync(id));
}

// 곡별 단계(user_track_stages)를 계정과 맞춘다. user_event_plans와 같은 규칙:
// - 최초 연결(원격이 완전히 비어 있을 때)에만 이 브라우저의 비-demo 단계를 원격에 올린다.
// - 폴링(45초)은 원격을 기준으로 수렴하되, 아직 원격에 반영 안 된 로컬 변경(trackStagePending)은
//   덮어쓰지 않는다.
// - demo(기본값)는 행을 만들지 않는다 — 비어 있음 = 행 없음(user_event_plans의 empty 삭제와 동일).
async function loadRemoteTrackStages({ backfill = false } = {}) {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  // SELECT 시점의 pending을 스냅샷으로 잡아, 응답이 늦게 도착해도 그 사이 성공한 로컬
  // 변경(delete 포함)이 예전 원격 값으로 되살아나지 않게 한다(loadRemoteEventPlans와 동일).
  const protectIds = new Set(state.trackStagePending.keys());
  const { data, error } = await state.authClient
    .from("user_track_stages")
    .select("track_number, stage")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  applyRemoteTrackStages(data || [], { backfill, protectIds });
}

function applyRemoteTrackStages(rows, { backfill = false, protectIds = new Set() } = {}) {
  // 모든 곡을 demo로 초기화한 뒤 원격의 비-demo 행을 덮어쓴다(demo는 행이 없으므로 기본값 유지).
  const nextStage = buildDefaultTrackStages();
  rows.forEach((row) => {
    const trackNumber = String(row.track_number);
    if (trackStageMap.has(row.stage)) {
      nextStage[trackNumber] = row.stage;
    }
  });

  // 최초 연결(원격이 비어 있을 때)에만 이 브라우저의 로컬 단계를 원격에 올린다.
  const firstConnect = backfill && rows.length === 0;

  // 항상 로컬 값으로 보존할 곡번호: 최초 연결이면 로컬 전체, 아니면 아직 원격에 안 올라간
  // 로컬 변경(pending) + 이 SELECT를 보낸 시점에 pending이던 곡(경합 방어).
  // 최초 연결 시 pending·protectIds는 모두 state.trackStage 키의 부분집합이라 로컬 전체가 흡수한다.
  const preserve = firstConnect
    ? new Set(Object.keys(state.trackStage))
    : new Set([...state.trackStagePending.keys(), ...protectIds]);
  preserve.forEach((trackNumber) => {
    nextStage[trackNumber] = getTrackStage(trackNumber);
  });

  // 45초 폴링마다 무조건 렌더하면 event-plan 쪽 렌더와 합쳐 폴링당 full render가 2회가 되고,
  // 유휴 상태에서도 작성 중인 입력이 날아간다. 타 기기의 단계 변경은 드물므로 실제로 바뀐
  // 경우에만 저장·렌더한다(demo 기본값과 미기재 키를 동일 취급해 오탐 없이 비교).
  const changed = !trackStagesEqual(state.trackStage, nextStage);
  state.trackStage = nextStage;
  if (changed) {
    saveTrackStageState();
    renderAll();
  }

  // 최초 연결 시 로컬의 비-demo 단계를 원격에 올린다(상태 반영 후). demo는 행이 없어야 하므로 제외.
  if (firstConnect) {
    Object.keys(nextStage).forEach((trackNumber) => {
      if (getTrackStage(trackNumber) !== "demo") queueTrackStageSync(trackNumber);
    });
  }
}

function buildEventPlanPayload(eventId, userId) {
  const plan = getEventPlan(eventId);
  const completed = state.completed.has(eventId);
  return {
    user_id: userId,
    event_id: eventId,
    focus_status: plan.focusStatus || "none",
    override_date: plan.overrideDate || null,
    plan_order: typeof plan.order === "number" ? plan.order : null,
    is_completed: completed,
    completed_at: completed ? state.completedMeta.get(eventId)?.completedAt || null : null,
    updated_at: new Date().toISOString(),
  };
}

// 한 항목을 원격에 반영한다(빈 항목은 행 삭제). 실패는 콘솔에 남기고
// 다음 폴링에서 원격 기준으로 수렴한다 — UI를 막지 않는다.
async function syncEventPlanRow(eventId, stamp, queuedUserId, queuedGeneration) {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  // 큐잉 시점 이후 세션 경계가 있었으면(로그아웃·계정 전환·같은 계정 재로그인) 이 write를
  // 폐기한다. userId만으로는 같은 계정 재로그인을 못 걸러내므로, 세션 경계마다 증가하는
  // generation까지 대조한다. 이미 스케줄된 체인 콜백을 막는 최종 방어선.
  if (!user || user.id !== queuedUserId || queuedGeneration !== eventPlanSyncGeneration) return;
  const payload = buildEventPlanPayload(eventId, user.id);
  const empty =
    payload.focus_status === "none" && !payload.override_date && payload.plan_order == null && !payload.is_completed;
  const query = empty
    ? state.authClient.from("user_event_plans").delete().eq("user_id", user.id).eq("event_id", eventId)
    : state.authClient.from("user_event_plans").upsert(payload, { onConflict: "user_id,event_id" });

  const { error } = await query;
  if (error) {
    console.error(error);
    return; // 실패하면 pending을 유지해 다음 폴링이 로컬 변경을 덮지 않게 둔다.
  }
  // 이 write 이후 추가 변경이 없었을 때만 pending 해제(그 사이 재큐되면 최신 stamp가 처리).
  if (state.eventPlanPending.get(eventId) === stamp) {
    state.eventPlanPending.delete(eventId);
  }
}

// 같은 tick에 같은 항목을 여러 번 큐잉해도 최신 write를 구분하도록 단조 증가 시퀀스.
let eventPlanSyncSeq = 0;
// 세션 경계(로그아웃·계정 전환·같은 계정 재로그인)마다 증가한다. 큐잉 시점의 generation을
// 캡처해 실행 시점과 대조하면, 세션이 한 번이라도 바뀐 뒤의 stale 체인 콜백을 걸러낼 수 있다.
let eventPlanSyncGeneration = 0;
// eventId별 원격 write 직렬화 체인. 같은 항목의 write는 항상 큐잉 순서대로 실행돼,
// 먼저 보낸 오래된 request가 늦게 성공해 최신 상태를 덮는 out-of-order 문제를 막는다.
// 각 write는 실행 시점의 현재 로컬 값을 읽으므로(buildEventPlanPayload), 마지막 write가
// 항상 최신 로컬 상태를 원격에 반영한다.
const eventPlanSyncChains = new Map();

function queueEventPlanSync(eventId) {
  // 로컬 전용 id(track-followup)는 원격에 올리지 않는다.
  if (isLocalOnlyPlanId(eventId)) return Promise.resolve();
  // 비로그인 상태에서는 원격 큐잉을 하지 않는다. 로컬 편집은 localStorage에 남아 있고,
  // 로그인 시 backfill이 (원격이 비었을 때) 그 기록을 올린다. 큐잉 시점의 계정+generation을
  // 캡처해 실행 시점에 대조하므로, 지연 실행되는 체인이 다른 계정/다른 세션에 쓰이지 않는다.
  const user = getAuthUser();
  if (!user) return Promise.resolve();
  const queuedUserId = user.id;
  const queuedGeneration = eventPlanSyncGeneration;
  const stamp = ++eventPlanSyncSeq;
  state.eventPlanPending.set(eventId, stamp);
  const prev = eventPlanSyncChains.get(eventId) || Promise.resolve();
  // 앞선 write가 끝난 뒤에 실행(직렬화). catch로 항상 resolve시켜 체인이 끊기지 않게 한다.
  const next = prev
    .then(() => syncEventPlanRow(eventId, stamp, queuedUserId, queuedGeneration))
    .catch((error) => console.error(error));
  eventPlanSyncChains.set(eventId, next);
  // 체인 꼬리가 이 write에서 끝났으면 맵에서 제거(무한 성장 방지).
  next.finally(() => {
    if (eventPlanSyncChains.get(eventId) === next) eventPlanSyncChains.delete(eventId);
  });
  return next;
}

// 아직 원격에 반영되지 않은 로컬 변경(pending)을 재시도한다. 인증 전에 쌓였거나
// 네트워크로 실패한 write, 삭제 tombstone까지 현재 로컬 값(빈 항목이면 행 삭제)으로
// 다시 올린다. 로그인 직후와 45초 폴링에서 호출해 pending이 활성 write 없이 원격과
// 영구 분기하지 않게 한다. 성공하면 syncEventPlanRow가 해당 pending을 해제한다.
// queueEventPlanSync를 통해 eventId별 직렬화 체인을 타므로 진행 중인 write와 순서가
// 뒤엉키지 않는다. Promise를 반환해 호출부가 재시도 완료를 기다린 뒤 원격을 다시 읽게 한다.
function flushPendingEventPlans() {
  if (!canUseRemoteReviewSync()) return Promise.resolve();
  const ids = [...state.eventPlanPending.keys()];
  return Promise.all(ids.map((id) => queueEventPlanSync(id)));
}

// 단계 원격 write. eventPlan 쪽과 같은 직렬화·pending·세션 경계(generation) 방어를 쓴다.
// generation은 세션 경계 카운터라 eventPlanSyncGeneration을 공유한다(계정 전환 시 함께 무효화).
function buildTrackStagePayload(trackNumber, userId) {
  return {
    user_id: userId,
    track_number: trackNumber,
    stage: getTrackStage(trackNumber),
    updated_at: new Date().toISOString(),
  };
}

// 한 곡의 단계를 원격에 반영한다. demo(기본값)면 행 삭제, 그 외에는 upsert.
async function syncTrackStageRow(trackNumber, stamp, queuedUserId, queuedGeneration) {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  if (!user || user.id !== queuedUserId || queuedGeneration !== eventPlanSyncGeneration) return;
  const stage = getTrackStage(trackNumber);
  const query =
    stage === "demo"
      ? state.authClient.from("user_track_stages").delete().eq("user_id", user.id).eq("track_number", trackNumber)
      : state.authClient
          .from("user_track_stages")
          .upsert(buildTrackStagePayload(trackNumber, user.id), { onConflict: "user_id,track_number" });

  const { error } = await query;
  if (error) {
    console.error(error);
    return; // 실패하면 pending을 유지해 다음 폴링이 로컬 변경을 덮지 않게 둔다.
  }
  if (state.trackStagePending.get(trackNumber) === stamp) {
    state.trackStagePending.delete(trackNumber);
  }
}

let trackStageSyncSeq = 0;
const trackStageSyncChains = new Map();

function queueTrackStageSync(trackNumber) {
  const user = getAuthUser();
  if (!user) return Promise.resolve();
  const queuedUserId = user.id;
  const queuedGeneration = eventPlanSyncGeneration;
  const stamp = ++trackStageSyncSeq;
  state.trackStagePending.set(trackNumber, stamp);
  const prev = trackStageSyncChains.get(trackNumber) || Promise.resolve();
  const next = prev
    .then(() => syncTrackStageRow(trackNumber, stamp, queuedUserId, queuedGeneration))
    .catch((error) => console.error(error));
  trackStageSyncChains.set(trackNumber, next);
  next.finally(() => {
    if (trackStageSyncChains.get(trackNumber) === next) trackStageSyncChains.delete(trackNumber);
  });
  return next;
}

// 아직 원격에 반영되지 않은 단계 변경(pending)을 재시도한다. flushPendingEventPlans와 같은 역할.
function flushPendingTrackStages() {
  if (!canUseRemoteReviewSync()) return Promise.resolve();
  const numbers = [...state.trackStagePending.keys()];
  return Promise.all(numbers.map((trackNumber) => queueTrackStageSync(trackNumber)));
}

async function syncOpportunityReview(opportunityId, status) {
  if (!canUseRemoteReviewSync()) return;

  const user = getAuthUser();
  const payload = {
    user_id: user.id,
    opportunity_id: opportunityId,
    review_status: status,
    updated_at: new Date().toISOString(),
  };

  const query =
    status === "new"
      ? state.authClient.from("opportunity_reviews").delete().eq("user_id", user.id).eq("opportunity_id", opportunityId)
      : state.authClient.from("opportunity_reviews").upsert(payload, { onConflict: "user_id,opportunity_id" });

  const { error } = await query;
  if (error) {
    console.error(error);
    throw error;
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!state.authClient) return;
  document.querySelector("#auth-status-detail").textContent = "Google 로그인으로 이동하는 중";
  const { error } = await state.authClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_REDIRECT_URL,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "Google 로그인 시작 실패. Supabase Google 설정을 확인해 주세요";
    return;
  }
}

async function handleSignout() {
  if (!state.authClient) return;
  await state.authClient.auth.signOut();
}

function stopRemoteReviewPolling() {
  if (!state.reviewSyncTimer) return;
  window.clearInterval(state.reviewSyncTimer);
  state.reviewSyncTimer = null;
}

function startRemoteReviewPolling() {
  stopRemoteReviewPolling();
  if (!canUseRemoteReviewSync()) return;
  state.reviewSyncTimer = window.setInterval(async () => {
    loadRemoteOpportunityReviews();
    // 순서 보장: 실패·인증 전에 쌓인 pending write(삭제 tombstone 포함)를 먼저
    // 끝내 원격을 수렴시킨 뒤에 원격을 다시 읽는다. flush를 await하지 않고 SELECT와
    // 동시에 돌리면 삭제 성공→pending 해제와 삭제 전 SELECT 응답이 역전돼 부활할 수 있다.
    await flushPendingEventPlans();
    await loadRemoteEventPlans();
    // 단계도 같은 순서로: pending을 먼저 수렴시킨 뒤 원격을 다시 읽는다.
    await flushPendingTrackStages();
    await loadRemoteTrackStages();
  }, 45000);
}

async function setAuthSession(session) {
  const prevUserId = getAuthUser()?.id || null;
  state.session = session;
  state.authReady = true;
  state.adminLoaded = false;
  state.isAdmin = false;
  // 세션 경계(로그아웃·계정 전환·같은 계정 재로그인)마다 pending과 직렬화 체인 맵을 비우고
  // generation을 증가시킨다. 맵 clear는 새 콜백이 옛 tail 뒤에 붙는 것만 막고 이미 스케줄된
  // 콜백은 취소하지 못하므로, syncEventPlanRow의 generation 검사가 stale 콜백을 막는 최종
  // 방어선이다(userId만으로는 같은 계정 재로그인을 못 걸러낸다).
  const nextUserId = getAuthUser()?.id || null;
  if (prevUserId !== nextUserId) {
    state.eventPlanPending.clear();
    eventPlanSyncChains.clear();
    state.trackStagePending.clear();
    trackStageSyncChains.clear();
    eventPlanSyncGeneration += 1;
  }
  updateAuthChrome();
  updateAdminChrome();

  if (getAuthUser()) {
    await loadAdminAccess();
    startRemoteReviewPolling();
    await loadRemoteOpportunityReviews();
    // 첫 로그인: 이 브라우저에만 쌓인 계획/완료 기록을 지우지 않고 원격과 합친다.
    await loadRemoteEventPlans({ backfill: true });
    // 단계도 같은 규칙으로 병합(최초 연결이면 로컬 비-demo 단계를 원격에 올린다).
    await loadRemoteTrackStages({ backfill: true });
    // 로그인 전/실패로 쌓인 pending write를 이 시점에 밀어 넣는다(폴링 45초를 안 기다림).
    await flushPendingEventPlans();
    await flushPendingTrackStages();
    return;
  }

  stopRemoteReviewPolling();
  // pending·체인은 위 계정 변경 감지에서 이미 비웠다. 로컬 기준으로 복원한다.
  state.opportunityReview = loadOpportunityReviewState();
  state.eventPlan = loadEventPlanState();
  state.trackStage = loadTrackStageState();
  const localCompletion = loadCompletionState();
  state.completed = localCompletion.completed;
  state.completedMeta = localCompletion.completedMeta;
  rebuildEventState();
  renderAll();
}

async function initAuth() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    state.authReady = true;
    updateAuthChrome();
    return;
  }

  state.authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const { data, error } = await state.authClient.auth.getSession();
  if (error) console.error(error);
  await setAuthSession(data.session || null);

  state.authClient.auth.onAuthStateChange((_event, session) => {
    setAuthSession(session);
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // 새 서비스워커가 제어권을 넘겨받으면(=새 배포가 활성화되면) 열려 있는 탭도
  // 자동으로 최신 번들로 새로고침한다. 수동 새로고침/pwa-reset 의존을 없앤다.
  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    // 최초 등록(제어권 없던 상태 → 제어 시작)에서는 리로드하지 않는다.
    if (!navigator.serviceWorker.controller) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  try {
    const buildVersion = document.documentElement.dataset.buildVersion || "dev";
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(buildVersion)}`, {
      updateViaCache: "none",
    });
    // 이미 제어 중인 탭에서 새 워커가 대기 상태로 잡히면 즉시 활성화를 유도한다.
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && hadController && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
    registration.update().catch(() => null);
  } catch (error) {
    console.error(error);
  }
}

function bindPwaInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateAuthChrome();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateAuthChrome();
  });
}

async function promptInstallApp() {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice.catch(() => null);
  deferredInstallPrompt = null;
  updateAuthChrome();
}

async function refreshAppShell() {
  setSyncStatus("loading", "페이지 새로고침 준비 중", "최신 일정과 화면을 다시 불러오는 중");

  try {
    await refreshSupabaseData();
  } catch {
    // refreshSupabaseData already falls back to local data and reports status.
  }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    } catch {
      // Ignore service worker update errors and still refresh the page.
    }
  }

  window.location.reload();
}

function toggleMobileCompactMode() {
  state.mobileCompact = !state.mobileCompact;
  saveMobileCompactState();
  renderAll();
}

function loadWeeklyCheckinState() {
  const defaults = {
    available: "",
    completed: "",
    mustdo: "",
    blockers: "",
  };
  try {
    const stored = JSON.parse(localStorage.getItem(WEEKLY_CHECKIN_KEY) || "{}");
    return { ...defaults, ...(stored || {}) };
  } catch {
    return defaults;
  }
}

function saveWeeklyCheckinState() {
  try {
    localStorage.setItem(WEEKLY_CHECKIN_KEY, JSON.stringify(state.weeklyCheckin));
  } catch {
    // Ignore storage errors for local previews.
  }
}

function getTrackChecklist(trackNumber) {
  return state.trackChecklist[trackNumber] || {};
}

function getTrackStage(trackNumber) {
  const stageId = state.trackStage[trackNumber];
  return trackStageMap.has(stageId) ? stageId : "demo";
}

function setTrackStage(trackNumber, stageId) {
  if (!trackStageMap.has(stageId)) return;
  if (getTrackStage(trackNumber) === stageId) return;
  state.trackStage[trackNumber] = stageId;
  addTrackActivity(trackNumber, "단계 이동", `${trackStageMap.get(stageId).label} 단계로 이동`);
  saveTrackStageState();
  queueTrackStageSync(trackNumber); // 단계를 계정에 동기화(기기 간 desync 방지). 로그아웃 상태면 no-op.

  // 데모 이벤트 완료(state.completed)를 단계와 대칭으로 맞춘다(투영): 데모를 벗어나면 그 곡의
  // 데모는 끝난 것이므로 완료로, 데모로 되돌리면 완료를 해제한다. 이렇게 해야 곡 표/파이프라인은
  // 완료인데 오늘 보드·달력·요약은 같은 데모 이벤트를 미완료 작업으로 계속 띄우는 split-brain이
  // 생기지 않는다. 새 event id를 만들지 않고 기존 track.eventId를 그대로 쓴다.
  // 중요: state.completed를 직접 갱신한다 — toggleCompleted는 곡의 데모 이벤트를 다시
  // setTrackStage로 라우팅하므로(잠금/투영), 여기서 호출하면 재귀가 돼 미러가 실제로 안 써진다.
  const track = findTrack(trackNumber);
  let mirrorChanged = false;
  if (track && track.eventId) {
    // eventId가 빈 값/누락인 곡(관리자 공란·Supabase null·시드 폴백)은 건너뛴다 —
    // state.completed에 빈 키를 넣거나 빈 event_id로 원격 upsert하지 않도록(findTrackByEventId와 대칭).
    const eventId = track.eventId;
    const shouldComplete = stageId !== "demo";
    if (shouldComplete && !state.completed.has(eventId)) {
      state.completed.add(eventId);
      state.completedMeta.set(eventId, { completedAt: new Date().toISOString() });
      mirrorChanged = true;
    } else if (!shouldComplete && state.completed.has(eventId)) {
      state.completed.delete(eventId);
      state.completedMeta.delete(eventId);
      mirrorChanged = true;
    }
    if (mirrorChanged) {
      saveCompletedTasks();
      queueEventPlanSync(eventId); // 데모 이벤트 완료 미러를 계정에 동기화(로그아웃이면 no-op)
    }
  }

  // 단계·완료 미러가 달력·요약·로드맵·대시보드·표에 모두 영향을 주므로 전체 리렌더.
  renderAll();
}

function getTrackNotes(trackNumber) {
  return state.trackNotes[trackNumber] || { ...defaultTrackNotes };
}

function getTrackActivity(trackNumber) {
  return state.trackActivity[trackNumber] || [];
}

function addTrackActivity(trackNumber, category, text) {
  const entry = {
    id: `track-activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category,
    text,
    createdAt: new Date().toISOString(),
  };
  state.trackActivity[trackNumber] = [entry, ...getTrackActivity(trackNumber)].slice(0, 20);
  saveTrackActivityState();
}

function getTrackFollowups(trackNumber) {
  return state.trackFollowups
    .filter((followup) => followup.trackNumber === trackNumber)
    .sort((left, right) => parseDate(left.date) - parseDate(right.date));
}

function createTrackFollowup(trackNumber, stepId) {
  const step = findTrackStep(stepId);
  const track = findTrack(trackNumber);
  if (!step || !track) return;

  const date = toIso(addDays(today, 1));
  const id = `track-followup-${trackNumber}-${stepId}-${Date.now()}`;
  state.trackFollowups = [
    ...state.trackFollowups,
    {
      id,
      trackNumber,
      stepId,
      date,
      createdAt: new Date().toISOString(),
    },
  ];
  state.eventPlan[id] = {
    ...getEventPlan(id),
    focusStatus: "accepted",
    overrideDate: null,
  };
  addTrackActivity(trackNumber, "일정 추가", `${step.label} 다시 일정에 추가 (${formatShortDate(date)})`);
  saveTrackFollowupsState();
  saveEventPlanState();
  queueEventPlanSync(id);
  rebuildEventState();
  renderAll();
}

function updateTrackFollowupDate(followupId, nextDate) {
  const followup = state.trackFollowups.find((item) => item.id === followupId);
  if (!followup || !nextDate || followup.date === nextDate) return;

  followup.date = nextDate;
  if (state.eventPlan[followupId]?.overrideDate) {
    state.eventPlan[followupId] = {
      ...state.eventPlan[followupId],
      overrideDate: null,
    };
    saveEventPlanState();
  }
  const step = findTrackStep(followup.stepId);
  addTrackActivity(followup.trackNumber, "일정 이동", `${step?.label || "반복 작업"} 날짜를 ${formatShortDate(nextDate)}로 변경`);
  saveTrackFollowupsState();
  rebuildEventState();
  renderAll();
}

function removeTrackFollowup(followupId) {
  const followup = state.trackFollowups.find((item) => item.id === followupId);
  if (!followup) return;

  const step = findTrackStep(followup.stepId);
  state.trackFollowups = state.trackFollowups.filter((item) => item.id !== followupId);
  delete state.eventPlan[followupId];
  state.completed.delete(followupId);
  state.completedMeta.delete(followupId);
  addTrackActivity(followup.trackNumber, "일정 제거", `${step?.label || "반복 작업"} 다시 일정을 제거`);
  saveTrackFollowupsState();
  saveEventPlanState();
  saveCompletedTasks();
  queueEventPlanSync(followupId);
  rebuildEventState();
  renderAll();
}

function toggleTrackNoteChoice(trackNumber, noteKey, choice) {
  const current = new Set(getTrackNotes(trackNumber)[noteKey] || []);
  const removing = current.has(choice);
  if (removing) current.delete(choice);
  else current.add(choice);
  state.trackNotes[trackNumber][noteKey] = [...current];
  addTrackActivity(
    trackNumber,
    removing ? "메모 해제" : "메모",
    `${trackNoteLabels[noteKey] || "메모"}: ${choice}${removing ? " 제거" : ""}`
  );
  saveTrackNotesState();
  renderTracks();
}

function renderTrackChoiceGroup(trackNumber, noteKey, label, selectedChoices, wide = false) {
  const selected = new Set(selectedChoices || []);
  return `
    <section class="track-choice-group${wide ? " track-choice-group-wide" : ""}">
      <span>${label}</span>
      <div class="track-choice-buttons">
        ${trackNoteOptions[noteKey]
          .map(
            (choice) => `
              <button
                class="track-choice-button${selected.has(choice) ? " is-selected" : ""}"
                type="button"
                data-track-number="${escapeHtml(trackNumber)}"
                data-note-key="${escapeHtml(noteKey)}"
                data-track-choice="${escapeHtml(choice)}"
              >
                ${escapeHtml(choice)}
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTrackActivityList(trackNumber) {
  const entries = getTrackActivity(trackNumber).slice(0, 6);
  if (entries.length === 0) {
    return '<p class="track-empty-copy">아직 기록된 작업이 없습니다. 체크하거나 메모를 누르면 여기에 쌓입니다.</p>';
  }

  return `
    <ul class="track-activity-list">
      ${entries
        .map(
          (entry) => `
            <li class="track-activity-item">
              <span class="track-activity-kind">${escapeHtml(entry.category)}</span>
              <div>
                <strong>${escapeHtml(entry.text)}</strong>
                <span>${formatTrackActivityTimestamp(entry.createdAt)}</span>
              </div>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderTrackFollowupSection(track) {
  const followups = getTrackFollowups(track.number).filter((followup) => !state.completed.has(followup.id));

  return `
    <section class="track-log-card">
      <div class="track-log-header">
        <div>
          <h4>다시 잡아둘 작업</h4>
        </div>
        <span class="card-chip">${followups.length}개</span>
      </div>
      <p class="track-empty-copy">체크리스트 항목 옆 <code>다시 일정</code>으로 같은 작업을 다음 세션에 다시 올릴 수 있습니다.</p>
      ${
        followups.length > 0
          ? `
            <ul class="track-followup-list">
              ${followups
                .map((followup) => {
                  const step = findTrackStep(followup.stepId);
                  return `
                    <li class="track-followup-item">
                      <div>
                        <strong>${step?.label || "반복 작업"}</strong>
                        <span>다시 할 일정</span>
                      </div>
                      <div class="track-followup-controls">
                        <input type="date" value="${escapeHtml(followup.date)}" data-track-followup-date="${escapeHtml(followup.id)}" />
                        <button class="opportunity-action" type="button" data-track-followup-action="complete" data-track-followup-id="${escapeHtml(followup.id)}">완료</button>
                        <button class="opportunity-action is-danger" type="button" data-track-followup-action="remove" data-track-followup-id="${escapeHtml(followup.id)}">삭제</button>
                      </div>
                    </li>
                  `;
                })
                .join("")}
            </ul>
          `
          : '<p class="track-empty-copy">반복으로 다시 잡아둘 작업이 아직 없습니다.</p>'
      }
    </section>
  `;
}

// 진행률·상태는 모두 "현재 단계"의 체크리스트를 기준으로 계산한다.
function getTrackChecklistProgress(trackNumber, stageId = getTrackStage(trackNumber)) {
  const checklist = getTrackChecklist(trackNumber);
  const steps = getStageSteps(stageId);
  const completed = steps.filter((step) => checklist[step.id]).length;
  return { completed, total: steps.length };
}

// 현재 단계의 그룹별 진행률 목록 (demo면 세션/마감, arrange면 실험/확정 …).
function getTrackGroupProgress(trackNumber, stageId = getTrackStage(trackNumber)) {
  const checklist = getTrackChecklist(trackNumber);
  const steps = getStageSteps(stageId);
  return getStageGroups(stageId)
    .map((group) => {
      const groupSteps = steps.filter((step) => step.group === group.id);
      return {
        id: group.id,
        label: group.label,
        completed: groupSteps.filter((step) => checklist[step.id]).length,
        total: groupSteps.length,
      };
    })
    .filter((group) => group.total > 0);
}

function getTrackNextStep(trackNumber) {
  const stageId = getTrackStage(trackNumber);
  if (stageId === "done") return "전 단계 완료";
  const checklist = getTrackChecklist(trackNumber);
  const nextStep = getStageSteps(stageId).find((step) => !checklist[step.id]);
  if (nextStep) return nextStep.label;
  return stageId === "demo" ? "데모 완료 처리" : "다음 단계로 이동";
}

// kind: waiting | active | review | ready | complete — 요약 집계는 라벨 문자열이
// 아니라 kind로 한다(단계별로 라벨이 달라지므로).
function getTrackStatus(trackNumber, eventId) {
  const stageId = getTrackStage(trackNumber);
  const stage = trackStageMap.get(stageId);
  if (stageId === "done") return { label: "완료", className: "is-complete", kind: "complete" };
  // 데모 단계에서는 기존 의미(데모 이벤트 완료 = 곡 완료)를 유지한다.
  if (stageId === "demo" && state.completed.has(eventId)) {
    return { label: "완료", className: "is-complete", kind: "complete" };
  }
  const { completed, total } = getTrackChecklistProgress(trackNumber, stageId);
  const groups = getTrackGroupProgress(trackNumber, stageId);
  const isDemo = stageId === "demo";
  if (completed === 0) {
    return { label: isDemo ? "대기" : `${stage.label} 대기`, className: "", kind: "waiting" };
  }
  if (completed === total) {
    return {
      label: isDemo ? "데모 완료 체크" : `${stage.label} 마무리`,
      className: "is-ready",
      kind: "ready",
    };
  }
  const first = groups[0];
  if (first && first.completed > 0 && first.completed < first.total) {
    return { label: isDemo ? "세션 중" : `${stage.label} 중`, className: "is-active", kind: "active" };
  }
  if (first && first.completed === first.total && completed < total) {
    return { label: isDemo ? "정리 중" : `${stage.label} 정리`, className: "is-review", kind: "review" };
  }
  return { label: "진행", className: "is-active", kind: "active" };
}

function getOpportunityReview(opportunityId) {
  return state.opportunityReview[opportunityId] || { status: "new", updatedAt: null };
}

function getAcceptedOpportunities() {
  return state.opportunities.filter((opportunity) => getOpportunityReview(opportunity.id).status === "accepted");
}

function getHeldOpportunities() {
  return state.opportunities.filter((opportunity) => getOpportunityReview(opportunity.id).status === "hold");
}

function getDismissedOpportunities() {
  return state.opportunities.filter((opportunity) => getOpportunityReview(opportunity.id).status === "dismissed");
}

function getOpportunityCandidates() {
  return state.opportunities.filter((opportunity) => {
    const reviewStatus = getOpportunityReview(opportunity.id).status;
    return reviewStatus !== "accepted" && reviewStatus !== "hold" && reviewStatus !== "dismissed";
  });
}

function buildAcceptedOpportunityEvents() {
  return getAcceptedOpportunities()
    .filter((opportunity) => opportunity.deadline || opportunity.applicationOpen)
    .map((opportunity) => ({
      id: `opportunity-${opportunity.id}`,
      date: opportunity.deadline || opportunity.applicationOpen,
      end: null,
      title: `${opportunity.title} 마감`,
      phase: "opportunity",
      duration: "공모전 준비",
      result: "제출 여부 확정 또는 제출 완료",
      detail: `${opportunity.host} · ${opportunity.summary}`,
      track: null,
      document: opportunity.officialUrl,
      lyrics: null,
      milestone: true,
      opportunityId: opportunity.id,
      kind: "opportunity",
    }));
}

async function setOpportunityReview(opportunityId, status) {
  state.opportunityReview[opportunityId] = {
    status,
    updatedAt: new Date().toISOString(),
  };
  saveOpportunityReviewState();
  rebuildEventState();
  renderAll();

  try {
    await syncOpportunityReview(opportunityId, status);
  } catch {
    document.querySelector("#auth-status-detail").textContent = "원격 동기화에 실패해 현재 기기에만 저장했습니다";
  }
}

function formatOpportunityDateLabel(opportunity) {
  if (opportunity.deadline) return `마감 ${formatShortDate(opportunity.deadline)}`;
  if (opportunity.applicationOpen) return `확인일 ${formatShortDate(opportunity.applicationOpen)}`;
  return "상시 확인";
}

function formatOpportunityStatus(status) {
  if (status === "open") return "접수 중";
  if (status === "closed") return "마감";
  return "모니터링";
}

function getOpportunityStatusClass(status) {
  if (status === "closed") return "is-closed";
  if (status === "watch") return "is-watch";
  return "";
}

function formatOpportunityReview(reviewStatus) {
  if (reviewStatus === "accepted") return "캘린더 반영";
  if (reviewStatus === "hold") return "보류";
  if (reviewStatus === "dismissed") return "제외";
  return "미정";
}

function getEventPlan(eventId) {
  return state.eventPlan[eventId] || { focusStatus: "none", overrideDate: null, order: null };
}

function updateEventPlan(eventId, patch) {
  const current = getEventPlan(eventId);
  state.eventPlan[eventId] = {
    ...current,
    ...patch,
  };

  const next = state.eventPlan[eventId];
  if (next.focusStatus === "none" && !next.overrideDate && next.order == null) {
    delete state.eventPlan[eventId];
  }

  saveEventPlanState();
  queueEventPlanSync(eventId);
  rebuildEventState();
  renderAll();
}

function acceptEventForThisWeek(eventId) {
  updateEventPlan(eventId, { focusStatus: "accepted" });
}

function holdEvent(eventId) {
  updateEventPlan(eventId, { focusStatus: "hold" });
}

function dismissEvent(eventId) {
  updateEventPlan(eventId, { focusStatus: "dismissed", overrideDate: null });
}

function resetEventPlan(eventId) {
  updateEventPlan(eventId, { focusStatus: "none", overrideDate: null, order: null });
}

function pullEventIntoThisWeek(eventId) {
  const event = findEvent(eventId);
  if (!canMoveEventDate(event)) return;
  if (event.kind === "track-followup") {
    // 팔로우업은 날짜가 항목 자체에 저장되므로 그쪽 경로로 옮긴 뒤 수락만 표시한다.
    updateTrackFollowupDate(eventId, toIso(today));
    updateEventPlan(eventId, { focusStatus: "accepted" });
    return;
  }
  updateEventPlan(eventId, {
    focusStatus: "accepted",
    overrideDate: toIso(today) === event.originalDate ? null : toIso(today),
  });
}

// 날짜 자유 이동: 개인 오버레이(overrideDate)로만 옮기고 원본 일정(Supabase/시드)은
// 건드리지 않는다. 고정 마감(milestone)과 공모전 마감은 옮길 수 없다.
function canMoveEventDate(event) {
  return Boolean(event) && event.kind !== "opportunity" && !event.milestone;
}

function moveEventToDate(eventId, nextIso) {
  const event = findEvent(eventId);
  if (!canMoveEventDate(event) || !nextIso) return;
  if (event.kind === "track-followup") {
    updateTrackFollowupDate(eventId, nextIso);
    return;
  }
  const plan = getEventPlan(eventId);
  const leavesWeek = !isIsoInCurrentWeek(nextIso);
  const patch = { overrideDate: nextIso === event.originalDate ? null : nextIso };
  // 날짜를 옮기는 행동 자체가 "하겠다"는 뜻 — 보류/안 함은 해제한다.
  // 보류/안 함이던 항목은 이번 주 보드 밖에 있었으므로 남아 있던 순서(order)는
  // stale이다. 다시 잡을 때 초기화한다.
  if (plan.focusStatus === "hold" || plan.focusStatus === "dismissed") {
    patch.focusStatus = "none";
    patch.order = null;
  }
  // 이번 주 밖으로 보내면 '직접 수락' 고정도 풀어 이번 주 목록에서 내린다.
  if (plan.focusStatus === "accepted" && leavesWeek) patch.focusStatus = "none";
  // 이번 주 밖으로 나가면 보드 순서는 의미가 없다. order를 비워 compareByPlanOrder가
  // 이 항목을 날짜와 무관하게 보드 상단에 다시 고정하지 않도록 한다.
  if (leavesWeek) patch.order = null;
  updateEventPlan(eventId, patch);
}

// 다이얼로그·가져오기 시트에서 쓰는 빠른 이동 목적지. 같은 날짜가 겹치면 앞의 것만 남긴다.
function getQuickMoveTargets() {
  const weekStart = startOfWeek(today);
  const saturday = addDays(weekStart, 5);
  const weekend = saturday >= today ? saturday : addDays(weekStart, 6);
  const targets = [
    { iso: toIso(today), label: "오늘" },
    { iso: toIso(addDays(today, 1)), label: "내일" },
    { iso: toIso(weekend), label: "이번 주말" },
    { iso: toIso(addDays(weekStart, 7)), label: "다음 주" },
  ];
  const seen = new Set();
  return targets.filter((target) => {
    if (seen.has(target.iso)) return false;
    seen.add(target.iso);
    return true;
  });
}

function getAlbumPlanningEvents() {
  return state.events.filter((event) => event.kind !== "opportunity" && event.kind !== "track-followup");
}

function isEventInCurrentWeek(event) {
  return isIsoInCurrentWeek(event.date);
}

function isIsoInCurrentWeek(iso) {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const date = parseDate(iso);
  return date >= weekStart && date <= weekEnd;
}

function getWeeklyFocusItems() {
  const incomplete = getIncompleteEvents().filter((event) => event.kind !== "opportunity");
  const explicitAccepted = incomplete
    .filter((event) => getEventPlan(event.id).focusStatus === "accepted")
    .map((event) => ({ event, source: "accepted" }));
  const acceptedIds = new Set(explicitAccepted.map(({ event }) => event.id));
  const currentWeek = incomplete
    .filter((event) => {
      const status = getEventPlan(event.id).focusStatus;
      return !acceptedIds.has(event.id) && status !== "hold" && status !== "dismissed" && isEventInCurrentWeek(event);
    })
    .map((event) => ({ event, source: "current" }));
  const focusIds = new Set([...acceptedIds, ...currentWeek.map(({ event }) => event.id)]);
  const fallbackNext = incomplete
    .filter((event) => {
      const status = getEventPlan(event.id).focusStatus;
      return !focusIds.has(event.id) && status !== "hold" && status !== "dismissed";
    })
    .map((event) => ({ event, source: "next" }));

  return [...explicitAccepted, ...currentWeek, ...fallbackNext]
    .sort((left, right) => compareByPlanOrder(left.event, right.event))
    .slice(0, 5);
}

// 수동 순서(order)가 있는 항목이 그 순서대로 먼저, 나머지는 날짜순.
function getPlanOrder(eventId) {
  const order = getEventPlan(eventId).order;
  return typeof order === "number" ? order : null;
}

function compareByPlanOrder(left, right) {
  const leftOrder = getPlanOrder(left.id);
  const rightOrder = getPlanOrder(right.id);
  if (leftOrder !== null && rightOrder !== null) return leftOrder - rightOrder;
  if (leftOrder !== null) return -1;
  if (rightOrder !== null) return 1;
  return parseDate(left.date) - parseDate(right.date);
}

// 이번 주 목록 안에서 위/아래 이동. 지금 보이는 순서 전체를 order로 저장해
// 다음 렌더에서도 사용자가 정한 순서가 유지된다.
function reorderWeeklyFocus(eventId, direction) {
  const ids = getWeeklyFocusItems().map(({ event }) => event.id);
  const index = ids.indexOf(eventId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  ids.forEach((id, position) => {
    state.eventPlan[id] = { ...getEventPlan(id), order: (position + 1) * 10 };
  });
  saveEventPlanState();
  ids.forEach((id) => queueEventPlanSync(id));
  rebuildEventState();
  renderAll();
}

function getHeldEvents() {
  return getIncompleteEvents()
    .filter((event) => event.kind !== "opportunity" && getEventPlan(event.id).focusStatus === "hold")
    .slice(0, 4);
}

function getDismissedEvents() {
  return getIncompleteEvents()
    .filter((event) => event.kind !== "opportunity" && getEventPlan(event.id).focusStatus === "dismissed")
    .slice(0, 4);
}

function getPullForwardCandidates() {
  const acceptedIds = new Set(getWeeklyFocusItems().map(({ event }) => event.id));
  return getIncompleteEvents()
    .filter((event) => {
      const plan = getEventPlan(event.id);
      return (
        event.kind !== "opportunity" &&
        !acceptedIds.has(event.id) &&
        plan.focusStatus !== "hold" &&
        plan.focusStatus !== "dismissed"
      );
    })
    .sort((left, right) => parseDate(left.date) - parseDate(right.date))
    .slice(0, 5);
}

// 배치/수용량 이벤트("편곡 테스트 N주차", "본녹음 묶음 A~D", "1차 믹스 전/후반부")는
// 이제 곡×단계 격자가 실제 작업 단위를 담으므로, 작업 단위 목록(후보·이번 주·보류·당김·
// 오늘 보드·가져오기)에서는 빼고 달력에는 마감·수용량 레일로 남긴다(삭제 아님, 완료 id 보존).
// 레일 여부는 schedule-data.js의 rail 플래그가 단일 소스 — Supabase 런타임 이벤트에도 id로
// 투영한다(DB 컬럼/마이그레이션 없이 동작, album_events SELECT를 깨지 않음).
const railEventIds = new Set(defaultEvents.filter((event) => event.rail).map((event) => event.id));

function isRailEvent(event) {
  return Boolean(event) && railEventIds.has(event.id);
}

// 작업으로 계획 가능한 이벤트: 미완료 + 레일 아님. 후보/이번 주/다음 마감/주간 스트립 등
// 여러 곳이 같은 판정을 쓰므로 한 곳에서 정의해 드리프트를 막는다.
function isPlannableEvent(event) {
  return !state.completed.has(event.id) && !isRailEvent(event);
}

function getIncompleteEvents() {
  return state.events
    .filter(isPlannableEvent)
    .sort((left, right) => parseDate(left.date) - parseDate(right.date));
}

function getUrgencyEvents() {
  const incomplete = getIncompleteEvents();
  const overdue = incomplete.filter((event) => parseDate(event.date) < today);
  const upcoming = incomplete.filter((event) => parseDate(event.date) >= today).slice(0, 3);
  return [...overdue.slice(0, 2), ...upcoming].slice(0, 4);
}

function getRecentCompletedEvents() {
  return [...state.completedMeta.entries()]
    .filter(([, value]) => value?.completedAt)
    .sort((left, right) => new Date(right[1].completedAt) - new Date(left[1].completedAt))
    .slice(0, 4)
    .map(([eventId]) => findEvent(eventId))
    .filter(Boolean);
}

// '작업 중' = 제작 파이프라인에서 실제로 진행 중인 곡을 격자(현재 단계)에서 계산한다.
// 데모를 벗어나 아직 안 끝난 곡(편곡/녹음/믹스) + 데모 단계에서 착수한 곡. 미착수 데모·완료 곡은 제외.
function getDashboardActiveTracks() {
  return state.tracks.filter((track) => {
    const stage = getTrackStage(track.number);
    if (stage === "done") return false;
    const kind = getTrackStatus(track.number, track.eventId).kind;
    if (kind === "complete") return false; // 레거시 demo+completed 등 완료로 잡히는 곡 제외
    if (stage !== "demo") return true; // 편곡/녹음/믹스 = 제작 중
    return kind !== "waiting"; // 데모 단계는 체크를 시작한 곡만
  });
}

function getDashboardDemoSpotlight() {
  const track = findTrack(dashboardDemoMonitor.spotlight.trackNumber);
  if (!track) return null;
  return {
    track,
    bullets: dashboardDemoMonitor.spotlight.bullets,
  };
}

function populateWeeklyCheckinForm() {
  if (!document.querySelector("#checkin-available")) return;
  document.querySelector("#checkin-available").value = state.weeklyCheckin.available;
  document.querySelector("#checkin-completed").value = state.weeklyCheckin.completed;
  document.querySelector("#checkin-mustdo").value = state.weeklyCheckin.mustdo;
  document.querySelector("#checkin-blockers").value = state.weeklyCheckin.blockers;
}

function readWeeklyCheckinForm() {
  if (!document.querySelector("#checkin-available")) return;
  state.weeklyCheckin = {
    available: document.querySelector("#checkin-available").value.trim(),
    completed: document.querySelector("#checkin-completed").value.trim(),
    mustdo: document.querySelector("#checkin-mustdo").value.trim(),
    blockers: document.querySelector("#checkin-blockers").value.trim(),
  };
}

function buildCheckinPrompt() {
  const values = state.weeklyCheckin;
  return `이번 주 가능한 시간:\n${values.available || "(아직 미입력)"}\n\n완료한 작업:\n${values.completed || "(아직 미입력)"}\n\n꼭 해야 하는 작업:\n${values.mustdo || "(아직 미입력)"}\n\n막힌 부분:\n${values.blockers || "(아직 미입력)"}`;
}

function updateCheckinPromptPreview() {
  const preview = document.querySelector("#checkin-prompt-preview");
  if (!preview) return;
  preview.textContent = buildCheckinPrompt();
}

function saveWeeklyCheckin() {
  if (!document.querySelector("#checkin-available")) return;
  readWeeklyCheckinForm();
  saveWeeklyCheckinState();
  updateCheckinPromptPreview();
}

async function copyCheckinPrompt() {
  if (!document.querySelector("#checkin-available")) return;
  readWeeklyCheckinForm();
  updateCheckinPromptPreview();

  try {
    await navigator.clipboard.writeText(buildCheckinPrompt());
    document.querySelector("#copy-checkin-prompt").textContent = "복사됨";
    window.setTimeout(() => {
      document.querySelector("#copy-checkin-prompt").textContent = "복사";
    }, 1200);
  } catch {
    document.querySelector("#copy-checkin-prompt").textContent = "직접 복사";
  }
}

function renderPhaseFilters() {
  const container = document.querySelector("#phase-filters");
  const filters = [{ id: "all", label: "전체 일정", color: "#7b8580" }, ...phases];

  container.innerHTML = filters
    .map((phase) => {
      const count =
        phase.id === "all"
          ? state.events.length
          : state.events.filter((event) => event.phase === phase.id).length;
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

// 아직 완료한 작업이 없고 안내를 닫지 않은 사용자에게 기본 흐름을 1회 안내한다.
function renderOnboardingHint() {
  const host = document.querySelector("#onboarding-hint");
  if (!host) return;
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    dismissed = false;
  }
  const fresh = state.completed.size === 0;
  if (dismissed || !fresh) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  host.hidden = false;
  host.innerHTML = `
    <div class="onboarding-head">
      <strong>처음 오셨나요? 3단계로 시작하세요</strong>
      <button id="onboarding-dismiss" class="text-button" type="button" aria-label="안내 닫기">닫기</button>
    </div>
    <ol class="onboarding-steps">
      <li><b>공모전</b> 탭에서 후보를 <b>수락</b>하거나, 아래 후보에서 이번 주 작업을 당겨오세요.</li>
      <li><b>이번 주 핵심 작업</b>에 뜬 항목을 하나씩 진행하세요.</li>
      <li>끝내면 <b>곡별 진행</b> 탭에서 곡을 골라 체크하고 <b>완료</b> 처리하세요.</li>
    </ol>
  `;
  document.querySelector("#onboarding-dismiss")?.addEventListener("click", () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Ignore storage errors for local previews.
    }
    host.hidden = true;
    host.innerHTML = "";
  });
}

function renderDashboard() {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weeklyFocusItems = getWeeklyFocusItems();
  const acceptedFocus = weeklyFocusItems.map(({ event }) => event);
  renderOnboardingHint();
  const heldEvents = getHeldEvents();
  const dismissedEvents = getDismissedEvents();
  const urgencyEvents = getPullForwardCandidates();
  const activeTracks = getDashboardActiveTracks();
  const demoSpotlight = getDashboardDemoSpotlight();
  document.querySelector("#weekly-period").textContent = `${formatDotDate(weekStart)} - ${formatDotDate(weekEnd)}`;
  // 한눈에 카드: 값이 없는 항목(0건/미설정)은 렌더하지 않아 화면을 짧게 유지한다.
  // '현재 단계'·'유통사 전달'은 헤더에서 내려온 정적 현황 — 여기가 유일한 자리다.
  const currentPhaseInfo = getCurrentPhase(today);
  document.querySelector("#today-overview").innerHTML = [
    {
      value: currentPhaseInfo.label,
      label: "현재 단계",
      detail: `유통사 전달 ${formatDotDate(findEvent("delivery-submit")?.date || "2026-11-13")}`,
    },
    {
      value: acceptedFocus.length,
      label: "지금 잡은 작업",
      detail: acceptedFocus[0] ? acceptedFocus[0].title : "아직 수락한 작업이 없습니다",
    },
    {
      value: heldEvents.length,
      label: "보류 중",
      detail: heldEvents[0] ? heldEvents[0].title : "보류 항목 없음",
    },
    {
      value: dismissedEvents.length,
      label: "이번 주 안 함",
      detail: dismissedEvents[0] ? dismissedEvents[0].title : "제외 항목 없음",
    },
    {
      value: activeTracks.length,
      label: "작업 중",
      detail:
        activeTracks.length > 0
          ? activeTracks.map((track) => track.title).join(", ")
          : "아직 진행 중인 곡 없음",
      wide: true,
    },
    {
      value: demoSpotlight ? demoSpotlight.track.title : "-",
      label: "이번 확인 포인트",
      detail: demoSpotlight ? demoSpotlight.bullets[0] : "설정된 포인트 없음",
      // detail이 이미 bullets[0]을 대표로 보여주므로 목록은 나머지만(중복 렌더 방지).
      detailList: demoSpotlight ? demoSpotlight.bullets.slice(1) : [],
      wide: true,
      trackNumber: demoSpotlight ? demoSpotlight.track.number : null,
    },
  ]
    .filter((item) => item.value !== 0 && item.value !== "-")
    .map((item) => {
      const clickableClass = item.trackNumber ? " overview-card-clickable" : "";
      const clickableAttrs = item.trackNumber
        ? ` role="button" tabindex="0" data-overview-track="${escapeHtml(item.trackNumber)}" aria-label="${escapeHtml(item.value)} 곡 작업 열기"`
        : "";
      return `
        <article class="overview-card${item.wide ? " overview-card-wide" : ""}${clickableClass}"${clickableAttrs}>
          <strong>${escapeHtml(item.value)}</strong>
          <p>${escapeHtml(item.label)}</p>
          <p>${escapeHtml(item.detail)}</p>
          ${
            item.detailList?.length
              ? `<ul class="overview-list">${item.detailList.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`
              : ""
          }
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("#today-overview [data-overview-track]").forEach((card) => {
    const go = () => {
      setActiveView("tracks", { focusPanel: false });
      setActiveTrack(card.dataset.overviewTrack, { scroll: true });
    };
    card.addEventListener("click", go);
    card.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        go();
      }
    });
  });

  // 히어로: '오늘의 다음 액션 1개'를 크게 지목한다. 잡은 작업이 없으면 첫 후보를 제안.
  const heroFocus = weeklyFocusItems[0] || null;
  const heroCandidate = !heroFocus ? urgencyEvents[0] || null : null;
  renderHeroCard(heroFocus ? heroFocus.event : heroCandidate, heroFocus ? "focus" : heroCandidate ? "candidate" : "none");

  const restFocusItems = weeklyFocusItems.slice(1);
  document.querySelector("#weekly-focus-list").innerHTML = restFocusItems.length
    ? restFocusItems.map((item) => renderDashboardTaskCard(item.event, item.source, { reorder: true })).join("")
    : heroFocus
      ? '<p class="empty-copy">위 작업 하나에 집중하면 됩니다.</p>'
      : '<p class="empty-copy">이번 주 핵심 작업이 비었습니다. 위 제안을 수락하거나 아래 후보에서 당겨오세요.</p>';

  document.querySelector("#fallback-list").innerHTML = weeklyFocus.fallback30
    .map((item) => `<li>${item}</li>`)
    .join("");

  // 후보는 3개까지만 노출해 카드가 과도하게 길어지지 않게 한다(더 많은 항목은 '전체에서 가져오기').
  document.querySelector("#urgency-list").innerHTML = urgencyEvents.length
    ? urgencyEvents
        .slice(0, 3)
        .map((event) => renderDashboardTaskCard(event, "candidate"))
        .join("")
    : '<p class="empty-copy">당겨올 만한 작업이 없습니다. 이번 주 수락한 작업을 마친 뒤 새 후보가 나타납니다.</p>';

  document.querySelector("#hold-list").innerHTML = heldEvents.length
    ? heldEvents.map((event) => renderDashboardTaskCard(event, "hold")).join("")
    : '<p class="empty-copy">보류 중인 작업이 없습니다.</p>';

  document.querySelector("#dismissed-list").innerHTML = dismissedEvents.length
    ? dismissedEvents.map((event) => renderDashboardTaskCard(event, "dismissed")).join("")
    : '<p class="empty-copy">이번 주 안 하기로 정한 작업이 없습니다.</p>';

  const recentDone = getRecentCompletedEvents();
  document.querySelector("#recent-done-list").innerHTML = recentDone.length
    ? recentDone
        .map((event) => `<li>${escapeHtml(event.title)} · ${formatShortDate(event.date)}</li>`)
        .join("")
    : '<li>아직 완료한 작업이 없습니다. 오늘 끝낸 작업 하나부터 체크해보세요.</li>';

  // 대시보드엔 공모전 '요약'만(개수 + 가장 임박한 마감) + 공모전 탭 링크. 전체 카드 목록은 탭에
  // 있으니 중복을 없애 부피를 줄이되, 싱어송라이터가 마감을 놓치지 않게 인지성은 유지한다.
  const opportunityCandidates = getOpportunityCandidates().filter((opportunity) => opportunity.status !== "closed");
  // 강조할 공모전 = 가장 임박한 '앞으로의' 마감(지난 마감은 강조하지 않음), 없으면 상시·공고 대기 항목.
  const upcomingOpportunity = opportunityCandidates
    .filter((opportunity) => opportunity.deadline && parseDate(opportunity.deadline) >= today)
    .sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline))[0];
  const watchOpportunity = opportunityCandidates.find((opportunity) => !opportunity.deadline);
  const nearestOpportunity = upcomingOpportunity || watchOpportunity || null;
  const nearestOpportunityMeta = nearestOpportunity
    ? nearestOpportunity.deadline
      ? `마감 D-${Math.ceil((parseDate(nearestOpportunity.deadline) - today) / 86400000)}`
      : "상시·공고 대기"
    : "";
  document.querySelector("#dashboard-opportunity-list").innerHTML = opportunityCandidates.length
    ? `<div class="opportunity-compact-summary">
        <div class="opportunity-compact-text">
          <strong>확인할 공모전 ${opportunityCandidates.length}개</strong>
          ${nearestOpportunity ? `<p>${escapeHtml(nearestOpportunity.title)} · ${escapeHtml(nearestOpportunityMeta)}</p>` : ""}
        </div>
        <button class="sync-button" type="button" data-go-opportunities>공모전 보기 →</button>
      </div>`
    : '<p class="opportunity-empty">지금 검토할 공모전이 없습니다.</p>';
  document
    .querySelector("#dashboard-opportunity-list [data-go-opportunities]")
    ?.addEventListener("click", () => setActiveView("opportunities"));

  const latestCheckedAt = state.opportunities
    .map((opportunity) => opportunity.lastCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  document.querySelector("#opportunity-last-updated").textContent = latestCheckedAt
    ? `${formatSyncTimestamp(new Date(latestCheckedAt))} 확인`
    : "업데이트 전";

  bindDashboardTaskControls();
  populateWeeklyCheckinForm();
  updateCheckinPromptPreview();
}

// 오늘 보드 최상단 히어로: 큰 제목 + 주 행동 1개 + ⋯(상세/다른 처리).
function renderHeroCard(event, mode) {
  const host = document.querySelector("#hero-card");
  if (!host) return;
  host.hidden = false;

  if (!event) {
    host.innerHTML = `
      <p class="hero-kicker">오늘의 다음 액션</p>
      <h3 class="hero-title">이번 주 잡은 작업이 없습니다</h3>
      <p class="hero-meta">달력에서 다음 일정을 확인하거나, 오늘은 쉬어가도 됩니다.</p>
    `;
    return;
  }

  const delayed = parseDate(event.date) < today;
  const metaParts = [`${formatDateRange(event)}${delayed ? " · 지연" : ""}`];
  if (event.duration) metaParts.push(event.duration);
  // 잡은 작업이 2개 이상이면 히어로를 뒤로 미루고 다음 작업을 올릴 수 있다.
  const canDemote = mode === "focus" && getWeeklyFocusItems().length > 1;
  host.innerHTML = `
    <p class="hero-kicker">${mode === "candidate" ? "이걸 이번 주로 수락할까요?" : "오늘의 다음 액션"}</p>
    <h3 class="hero-title">${escapeHtml(event.title)}</h3>
    <p class="hero-meta${delayed ? " is-delayed" : ""}">${escapeHtml(metaParts.join(" · "))}</p>
    <div class="hero-actions">
      ${
        mode === "candidate"
          ? `<button class="hero-primary" type="button" data-dashboard-action="accept" data-event-id="${escapeHtml(event.id)}">이번 주로 수락</button>`
          : `<button class="hero-primary" type="button" data-dashboard-action="complete" data-event-id="${escapeHtml(event.id)}">완료</button>`
      }
      ${
        canDemote
          ? `<button class="hero-more" type="button" data-dashboard-action="move-down" data-event-id="${escapeHtml(event.id)}" aria-label="이 작업을 뒤로 미루고 다음 작업 보기" title="뒤로 미루기">↓</button>`
          : ""
      }
      <button class="hero-more" type="button" data-dashboard-action="menu" data-event-id="${escapeHtml(event.id)}" aria-label="상세와 다른 처리 열기" title="상세·다른 처리">⋯</button>
    </div>
  `;
}

function renderDashboardTaskCard(event, mode, options = {}) {
  const delayed = parseDate(event.date) < today;
  const modeLabel =
    mode === "accepted"
      ? "직접 수락"
      : mode === "current"
        ? "이번 주 자동 표시"
        : mode === "next"
          ? "다음 우선순위"
          : mode === "hold"
            ? "보류 중"
            : mode === "dismissed"
              ? "이번 주 안 함"
            : delayed
              ? "지연 중"
              : "다음 후보";
  // 버튼 다이어트: 문맥상 주 행동 1개 + ⋯(나머지는 상세 다이얼로그에서).
  const primaryButton =
    mode === "accepted" || mode === "current"
      ? `<button class="opportunity-action is-primary" type="button" data-dashboard-action="complete" data-event-id="${escapeHtml(event.id)}">완료</button>`
      : mode === "hold"
        ? `<button class="opportunity-action is-primary" type="button" data-dashboard-action="accept" data-event-id="${escapeHtml(event.id)}">다시 진행</button>`
        : mode === "dismissed"
          ? `<button class="opportunity-action is-primary" type="button" data-dashboard-action="restore" data-event-id="${escapeHtml(event.id)}">다시 후보로</button>`
          : `<button class="opportunity-action is-primary" type="button" data-dashboard-action="accept" data-event-id="${escapeHtml(event.id)}">수락</button>`;

  return `
    <article class="focus-item">
      <strong>${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.detail)}</p>
      <div class="focus-meta">
        <span class="meta-pill">${modeLabel}</span>
        <span class="meta-pill">${formatDateRange(event)}${delayed ? " · 지연" : ""}</span>
      </div>
      <div class="focus-actions">
        ${primaryButton}
        ${
          options.reorder
            ? `<button class="opportunity-action task-reorder" type="button" data-dashboard-action="move-up" data-event-id="${escapeHtml(event.id)}" aria-label="순서 위로" title="위로">↑</button>
              <button class="opportunity-action task-reorder" type="button" data-dashboard-action="move-down" data-event-id="${escapeHtml(event.id)}" aria-label="순서 아래로" title="아래로">↓</button>`
            : ""
        }
        <button class="opportunity-action task-more" type="button" data-dashboard-action="menu" data-event-id="${escapeHtml(event.id)}" aria-label="상세와 다른 처리 열기" title="상세·다른 처리">⋯</button>
      </div>
    </article>
  `;
}

function bindDashboardTaskControls() {
  document.querySelectorAll("[data-dashboard-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventId = button.dataset.eventId;
      const action = button.dataset.dashboardAction;
      if (action === "menu") {
        const target = findEvent(eventId);
        if (target) openTaskDialog(target);
        return;
      }
      if (action === "accept") acceptEventForThisWeek(eventId);
      if (action === "hold") holdEvent(eventId);
      if (action === "dismiss") dismissEvent(eventId);
      if (action === "pull") pullEventIntoThisWeek(eventId);
      if (action === "restore") resetEventPlan(eventId);
      if (action === "complete") toggleCompleted(eventId, true);
      if (action === "move-up") reorderWeeklyFocus(eventId, -1);
      if (action === "move-down") reorderWeeklyFocus(eventId, 1);
    });
  });
}

function renderOpportunityCard(opportunity, options = {}) {
  const review = getOpportunityReview(opportunity.id);
  const classes = ["opportunity-card"];
  if (review.status === "accepted") classes.push("is-accepted");
  if (review.status === "hold") classes.push("is-held");
  if (review.status === "dismissed") classes.push("is-dismissed");
  const statusClasses = ["opportunity-status", getOpportunityStatusClass(opportunity.status)]
    .filter(Boolean)
    .join(" ");
  const acceptedBadge =
    review.status === "accepted" ? '<span class="opportunity-status is-accepted">캘린더 반영됨</span>' : "";
  const checkedAt = opportunity.lastCheckedAt
    ? `${formatSyncTimestamp(new Date(opportunity.lastCheckedAt))} 기준`
    : "최근 확인 기록 없음";
  const reviewLabel = formatOpportunityReview(review.status);
  const compactClass = options.compact ? " compact" : "";

  return `
    <article class="${classes.join(" ")}${compactClass ? compactClass : ""}" data-opportunity-id="${escapeHtml(opportunity.id)}">
      <div class="opportunity-card-top">
        <div>
          <button class="opportunity-title-button" type="button" data-opportunity-open="true">
            ${escapeHtml(opportunity.title)}
          </button>
          <p>${escapeHtml(opportunity.host)}</p>
        </div>
        <div class="opportunity-meta">
          <span class="${statusClasses}">${formatOpportunityStatus(opportunity.status)}</span>
          ${acceptedBadge}
        </div>
      </div>
      <div class="opportunity-body" data-opportunity-open="true" role="button" tabindex="0" aria-label="${escapeHtml(opportunity.title)} 상세 보기">
        <p>${escapeHtml(opportunity.summary)}</p>
      </div>
      <div class="opportunity-meta">
        <span class="meta-pill">${formatOpportunityDateLabel(opportunity)}</span>
        <span class="meta-pill">적합도 ${escapeHtml(opportunity.fitLabel)}</span>
        <span class="meta-pill">현재 판단 ${reviewLabel}</span>
      </div>
      <div class="opportunity-meta">
        <span class="meta-pill">준비: ${escapeHtml(opportunity.preparation)}</span>
      </div>
      <div class="opportunity-actions">
        <button class="opportunity-action is-primary${review.status === "accepted" ? " is-current" : ""}" type="button" data-action="accepted">
          수락 후 캘린더 추가
        </button>
        <button class="opportunity-action is-secondary${review.status === "hold" ? " is-current" : ""}" type="button" data-action="hold">
          보류
        </button>
        <button class="opportunity-action is-danger${review.status === "dismissed" ? " is-current" : ""}" type="button" data-action="dismissed">
          제외
        </button>
        ${
          canUseAdminMode()
            ? '<button class="opportunity-action opportunity-edit-button" type="button" data-opportunity-edit="true">편집</button>'
            : ""
        }
      </div>
      <div class="opportunity-links">
        <a href="${safeUrl(opportunity.officialUrl)}" target="_blank" rel="noreferrer">공식 공고 열기</a>
        <span class="summary-label">${escapeHtml(opportunity.sourceNote)} · ${checkedAt}</span>
      </div>
    </article>
  `;
}

function bindOpportunityControls() {
  document.querySelectorAll("[data-opportunity-id]").forEach((card) => {
    const opportunityId = card.dataset.opportunityId;
    const opportunity = state.opportunities.find((item) => item.id === opportunityId);
    card.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => setOpportunityReview(opportunityId, button.dataset.action));
    });
    card.querySelectorAll("[data-opportunity-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        if (opportunity) fillAdminOpportunityForm(opportunity);
      });
    });
    card.querySelectorAll("[data-opportunity-open]").forEach((button) => {
      const open = () => {
        if (opportunity) openOpportunityDialog(opportunity);
      };
      button.addEventListener("click", open);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  });
}

function renderOpportunities() {
  const accepted = getAcceptedOpportunities();
  const held = getHeldOpportunities();
  const dismissed = getDismissedOpportunities();
  const candidates = getOpportunityCandidates();
  const openCount = candidates.length;

  document.querySelector("#opportunity-open-count").textContent = String(openCount);
  document.querySelector("#opportunity-hold-count").textContent = String(held.length);
  document.querySelector("#opportunity-accepted-count").textContent = String(accepted.length);

  document.querySelector("#accepted-opportunity-list").innerHTML = accepted.length
    ? accepted.map((opportunity) => renderOpportunityCard(opportunity)).join("")
    : '<p class="opportunity-empty">아직 캘린더에 넣은 공모전이 없습니다. 카드에서 수락을 누르면 바로 일정에 합쳐집니다.</p>';

  document.querySelector("#held-opportunity-list").innerHTML = held.length
    ? held.map((opportunity) => renderOpportunityCard(opportunity)).join("")
    : '<p class="opportunity-empty">보류 중인 공모전이 없습니다.</p>';

  document.querySelector("#opportunity-list").innerHTML = candidates.length
    ? candidates.map((opportunity) => renderOpportunityCard(opportunity)).join("")
    : '<p class="opportunity-empty">지금 검토 중인 후보가 없습니다.</p>';

  document.querySelector("#dismissed-opportunity-list").innerHTML = dismissed.length
    ? dismissed.map((opportunity) => renderOpportunityCard(opportunity)).join("")
    : '<p class="opportunity-empty">이번에 넘긴 공모전이 없습니다.</p>';

  bindOpportunityControls();
  updateAdminChrome();
}

// 적합도 라벨 → 점수. 시드 데이터(5단계)와 관리자 편집 저장이 동일 매핑을 쓰게 한다.
const FIT_LABEL_SCORES = {
  "아주 잘 맞음": 5,
  "잘 맞음": 4,
  "보통": 3,
  "낮음": 2,
};

function readAdminOpportunityForm() {
  const fitLabel = document.querySelector("#admin-fit-label").value.trim();
  return {
    id: document.querySelector("#admin-id").value.trim(),
    title: document.querySelector("#admin-title").value.trim(),
    host: document.querySelector("#admin-host").value.trim(),
    status: document.querySelector("#admin-status").value,
    application_open: document.querySelector("#admin-open-date").value || null,
    deadline: document.querySelector("#admin-deadline").value || null,
    fit_label: fitLabel,
    fit_score: FIT_LABEL_SCORES[fitLabel] ?? 3,
    summary: document.querySelector("#admin-summary").value.trim(),
    preparation: document.querySelector("#admin-preparation").value.trim(),
    official_url: document.querySelector("#admin-url").value.trim(),
    source_note: document.querySelector("#admin-source-note").value.trim(),
    sort_order: Number(document.querySelector("#admin-sort-order").value || 999),
    last_checked_at: new Date().toISOString(),
  };
}

function resetAdminOpportunityForm() {
  document.querySelector("#admin-opportunity-form").reset();
  document.querySelector("#admin-status").value = "open";
  document.querySelector("#admin-sort-order").value = "";
}

function fillAdminOpportunityForm(opportunity) {
  document.querySelector("#admin-id").value = opportunity.id;
  document.querySelector("#admin-title").value = opportunity.title;
  document.querySelector("#admin-host").value = opportunity.host;
  document.querySelector("#admin-status").value = opportunity.status;
  document.querySelector("#admin-open-date").value = opportunity.applicationOpen || "";
  document.querySelector("#admin-deadline").value = opportunity.deadline || "";
  document.querySelector("#admin-fit-label").value = opportunity.fitLabel;
  document.querySelector("#admin-sort-order").value = opportunity.sortOrder || "";
  document.querySelector("#admin-summary").value = opportunity.summary;
  document.querySelector("#admin-preparation").value = opportunity.preparation;
  document.querySelector("#admin-url").value = opportunity.officialUrl;
  document.querySelector("#admin-source-note").value = opportunity.sourceNote || "";
  setActiveView("opportunities");
  document.querySelector("#admin-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveAdminOpportunity(event) {
  event.preventDefault();
  if (!canUseAdminMode()) return;

  const payload = readAdminOpportunityForm();
  const { error } = await state.authClient.from("singer_songwriter_opportunities").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "관리자 저장 실패";
    return;
  }

  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${payload.title} 저장 완료`;
}

async function deleteAdminOpportunity() {
  if (!canUseAdminMode()) return;
  const id = document.querySelector("#admin-id").value.trim();
  if (!id) return;

  const { error } = await state.authClient.from("singer_songwriter_opportunities").delete().eq("id", id);
  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "관리자 삭제 실패";
    return;
  }

  resetAdminOpportunityForm();
  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${id} 삭제 완료`;
}

// 관리자 편집 패널로 이동해 스크롤. (일정/곡 편집 버튼에서 호출)
function openAdminPanel() {
  setActiveView("opportunities", { focusPanel: false });
  document.querySelector("#admin-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── 일정(album_events) 편집 ──────────────────────────────────────────────
function readAdminEventForm() {
  const sortRaw = document.querySelector("#admin-event-sort-order").value;
  return {
    id: document.querySelector("#admin-event-id").value.trim(),
    date: document.querySelector("#admin-event-date").value,
    end: document.querySelector("#admin-event-end").value || null,
    title: document.querySelector("#admin-event-title").value.trim(),
    phase: document.querySelector("#admin-event-phase").value,
    duration: document.querySelector("#admin-event-duration").value.trim() || "미정",
    result: document.querySelector("#admin-event-result").value.trim() || "미정",
    detail: document.querySelector("#admin-event-detail").value.trim(),
    track: document.querySelector("#admin-event-track").value.trim() || null,
    document: document.querySelector("#admin-event-document").value.trim() || null,
    lyrics: document.querySelector("#admin-event-lyrics").value.trim() || null,
    milestone: document.querySelector("#admin-event-milestone").checked,
    sort_order: sortRaw === "" ? null : Number(sortRaw),
  };
}

function fillAdminEventForm(event) {
  if (!event) return;
  document.querySelector("#admin-event-id").value = event.id || "";
  document.querySelector("#admin-event-title").value = event.title || "";
  document.querySelector("#admin-event-date").value = event.originalDate || event.date || "";
  document.querySelector("#admin-event-end").value = event.originalEnd || event.end || "";
  document.querySelector("#admin-event-phase").value = event.phase || "demo";
  document.querySelector("#admin-event-duration").value = event.duration || "";
  document.querySelector("#admin-event-result").value = event.result || "";
  document.querySelector("#admin-event-detail").value = event.detail || "";
  document.querySelector("#admin-event-track").value = event.track || "";
  document.querySelector("#admin-event-document").value = event.document || "";
  document.querySelector("#admin-event-lyrics").value = event.lyrics || "";
  document.querySelector("#admin-event-milestone").checked = Boolean(event.milestone);
  document.querySelector("#admin-event-sort-order").value = event.sortOrder ?? "";
  openAdminPanel();
}

function resetAdminEventForm() {
  document.querySelector("#admin-event-form").reset();
}

async function saveAdminEvent(submitEvent) {
  submitEvent.preventDefault();
  if (!canUseAdminMode()) return;
  const payload = readAdminEventForm();
  const { error } = await state.authClient.from("album_events").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "일정 저장 실패";
    return;
  }
  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${payload.title} 일정 저장 완료`;
}

async function deleteAdminEvent() {
  if (!canUseAdminMode()) return;
  const id = document.querySelector("#admin-event-id").value.trim();
  if (!id) return;

  // 연결 곡이 있는 이벤트 삭제는 UI에서 먼저 막아 명확히 안내한다(1차 방어).
  // DB FK는 on delete restrict(마이그레이션 20260703130000)로 곡 동반 삭제를 거부하는 최후 방어선.
  const linkedTracks = state.tracks.filter((track) => track.eventId === id);
  if (linkedTracks.length > 0) {
    const names = linkedTracks.map((track) => `${track.number} ${track.title}`).join(", ");
    document.querySelector("#auth-status-detail").textContent =
      `이 일정에 연결된 곡(${names})이 있어 삭제할 수 없습니다. 곡을 먼저 삭제하거나 다른 일정으로 옮기세요.`;
    return;
  }

  const { error } = await state.authClient.from("album_events").delete().eq("id", id);
  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "일정 삭제 실패";
    return;
  }
  resetAdminEventForm();
  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${id} 일정 삭제 완료`;
}

// ── 곡(album_tracks) 편집 ────────────────────────────────────────────────
function readAdminTrackForm() {
  const sortRaw = document.querySelector("#admin-track-sort-order").value;
  return {
    number: document.querySelector("#admin-track-number").value.trim(),
    title: document.querySelector("#admin-track-title").value.trim(),
    due: document.querySelector("#admin-track-due").value,
    event_id: document.querySelector("#admin-track-event-id").value.trim(),
    document: document.querySelector("#admin-track-document").value.trim(),
    lyrics: document.querySelector("#admin-track-lyrics").value.trim(),
    sort_order: sortRaw === "" ? null : Number(sortRaw),
  };
}

function fillAdminTrackForm(track) {
  if (!track) return;
  document.querySelector("#admin-track-number").value = track.number || "";
  document.querySelector("#admin-track-title").value = track.title || "";
  document.querySelector("#admin-track-due").value = track.due || "";
  document.querySelector("#admin-track-event-id").value = track.eventId || "";
  document.querySelector("#admin-track-document").value = track.document || "";
  document.querySelector("#admin-track-lyrics").value = track.lyrics || "";
  document.querySelector("#admin-track-sort-order").value = track.sortOrder ?? "";
  openAdminPanel();
}

function resetAdminTrackForm() {
  document.querySelector("#admin-track-form").reset();
}

async function saveAdminTrack(submitEvent) {
  submitEvent.preventDefault();
  if (!canUseAdminMode()) return;
  const payload = readAdminTrackForm();
  const { error } = await state.authClient.from("album_tracks").upsert(payload, { onConflict: "number" });
  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "곡 저장 실패 (연결 이벤트 ID가 존재해야 함)";
    return;
  }
  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${payload.title} 곡 저장 완료`;
}

async function deleteAdminTrack() {
  if (!canUseAdminMode()) return;
  const number = document.querySelector("#admin-track-number").value.trim();
  if (!number) return;
  const { error } = await state.authClient.from("album_tracks").delete().eq("number", number);
  if (error) {
    console.error(error);
    document.querySelector("#auth-status-detail").textContent = "곡 삭제 실패";
    return;
  }
  resetAdminTrackForm();
  await refreshSupabaseData();
  document.querySelector("#auth-status-detail").textContent = `${number} 곡 삭제 완료`;
}

function eventOccursOnDate(event, iso) {
  const target = parseDate(iso);
  const start = parseDate(event.date);
  const end = parseDate(event.end || event.date);
  return target >= start && target <= end;
}

function getDemoCalendarSlot(event) {
  if (event.phase !== "demo" || !event.track) return null;
  if (event.id.includes("arrangement-sketch")) {
    return {
      type: "review",
      badge: "리뷰",
      title: event.track,
      summaryTitle: `${event.track} 리뷰`,
      helper: "데모 리뷰 + 악기 아이디어 정리",
      className: "is-demo-review",
    };
  }
  if (event.id.startsWith("demo-")) {
    return {
      type: "recording",
      badge: "녹음",
      title: event.track,
      summaryTitle: `${event.track} 녹음`,
      helper: "기타+보컬 녹음",
      className: "is-demo-recording",
    };
  }
  return null;
}

function getCalendarEventPresentation(event) {
  const demoSlot = getDemoCalendarSlot(event);
  if (demoSlot) {
    return {
      ...demoSlot,
      meta: event.duration,
      submeta: `${formatDayLabel(event.date)}${event.overrideDate ? ` · 원래 ${formatShortDate(event.originalDate)}` : ""}`,
    };
  }

  return {
    type: null,
    badge: null,
    title: event.title,
    summaryTitle: event.title,
    helper: null,
    className: "",
    meta: event.end ? formatDateRange(event) : event.duration,
    submeta: `${formatDayLabel(event.date)}${event.overrideDate ? ` · 원래 ${formatShortDate(event.originalDate)}` : ""}`,
  };
}

function renderCalendar() {
  const monthList = document.querySelector("#month-list");
  const bounds = getCalendarBounds();
  const firstMonth = startOfMonth(bounds.start);
  const lastMonth = startOfMonth(bounds.end);
  const todayIso = toIso(today);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredEvents =
    state.activePhase === "all"
      ? state.events
      : state.events.filter((event) => event.phase === state.activePhase);
  const monthMarkup = [];

  for (let current = new Date(firstMonth); current <= lastMonth; current = startOfMonth(addDays(endOfMonth(current), 1))) {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const firstDayIndex = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const monthEvents = filteredEvents.filter((event) => {
      const eventStart = parseDate(event.date);
      const eventEnd = parseDate(event.end || event.date);
      return eventStart <= monthEnd && eventEnd >= monthStart;
    });
    const overlapEntries = [];
    const cells = [];

    for (let blank = 0; blank < firstDayIndex; blank += 1) {
      cells.push('<div class="month-cell month-cell-empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day, 12, 0, 0, 0);
      const iso = toIso(date);
      const dayEvents = monthEvents.filter((event) => eventOccursOnDate(event, iso));
      const classes = ["month-cell"];
      if (date.getDay() === 0 || date.getDay() === 6) classes.push("is-weekend");
      if (iso === todayIso) classes.push("is-today");
      if (dayEvents.length === 0) classes.push("is-empty");
      if (dayEvents.length > 1) {
        classes.push("is-overlap");
        overlapEntries.push({
          iso,
          day,
          count: dayEvents.length,
          titles: dayEvents.map((event) => getCalendarEventPresentation(event).summaryTitle),
        });
      }

      cells.push(`
        <article class="${classes.join(" ")}" data-date="${iso}">
          <div class="day-heading">
            <div class="day-heading-main">
              <span class="day-number">${day}</span>
              ${iso === todayIso ? '<span class="day-today-chip">오늘</span>' : ""}
              ${dayEvents.length > 1 ? '<span class="day-overlap-chip">겹침</span>' : ""}
            </div>
            ${dayEvents.length ? `<span class="day-count">${dayEvents.length}개</span>` : ""}
          </div>
          <div class="day-events">
            ${dayEvents.map((event) => renderEvent(event, iso)).join("")}
          </div>
        </article>
      `);
    }

    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    const isPastMonth = monthEnd < today;
    const completedCount = monthEvents.filter((event) => state.completed.has(event.id)).length;
    const overlapMarkup = overlapEntries.length
      ? `
          <div class="month-overlap-summary">
            ${overlapEntries
              .map(
                (entry) => `
                  <button class="overlap-summary-item" type="button" data-jump-date="${escapeHtml(entry.iso)}">
                    <strong>${entry.day}일 · ${entry.count}개</strong>
                    <span>${entry.titles.map(escapeHtml).join(" · ")}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        `
      : "";
    const gridMarkup = `
        <div class="month-weekdays">
          ${dayNames.map((dayName) => `<span>${dayName}</span>`).join("")}
        </div>
        <div class="month-grid">${cells.join("")}</div>
    `;

    if (isPastMonth) {
      // 지난 달은 접힘 처리 — 발매가 가까워질수록 커지는 '지난 달 통과 스크롤'을 없앤다.
      monthMarkup.push(`
      <details class="month-section month-collapsed" data-month="${monthKey}">
        <summary class="month-collapsed-summary">
          <h3>${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월</h3>
          <span class="card-chip">일정 ${monthEvents.length}개 · 완료 ${completedCount}개</span>
        </summary>
        ${overlapMarkup}
        ${gridMarkup}
      </details>
    `);
      continue;
    }

    monthMarkup.push(`
      <section class="month-section" data-month="${monthKey}">
        <header class="month-header">
          <div>
            <h3>${monthStart.getFullYear()}년 ${monthStart.getMonth() + 1}월</h3>
          </div>
          <div class="month-summary-chips">
            <span class="card-chip">${monthEvents.length}개 일정</span>
            ${
              overlapEntries.length
                ? `<span class="card-chip is-overlap-chip">겹치는 날짜 ${overlapEntries.length}일</span>`
                : ""
            }
          </div>
        </header>
        ${overlapMarkup}
        ${gridMarkup}
      </section>
    `);
  }

  // '이번 주에 뭐하지'가 탭 진입 0초에 답해지도록, 월 그리드 위에 이번 주 스트립을 얹는다.
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weekEvents = filteredEvents
    .filter((event) => parseDate(event.date) <= weekEnd && parseDate(event.end || event.date) >= weekStart)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const nextUpcoming = filteredEvents
    .filter((event) => parseDate(event.date) > weekEnd && isPlannableEvent(event))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))[0];
  const weekStripMarkup = `
    <section class="week-strip" aria-label="이번 주 일정">
      <div class="week-strip-head">
        <h3>이번 주</h3>
        <span class="card-chip">${formatDotDate(weekStart)} - ${formatDotDate(weekEnd)}</span>
      </div>
      ${
        weekEvents.length
          ? `<div class="week-strip-list">${weekEvents
              .map(
                (event) => `
                  <div class="week-strip-item">
                    <span class="week-strip-day">${dayNames[parseDate(event.date).getDay()]} · ${formatShortDate(event.date)}</span>
                    ${renderEvent(event, toIso(parseDate(event.date) < weekStart ? weekStart : parseDate(event.date)))}
                  </div>
                `
              )
              .join("")}</div>`
          : `<p class="empty-copy">이번 주 일정이 없습니다.${
              nextUpcoming ? ` 다음 일정: ${formatShortDate(nextUpcoming.date)} ${escapeHtml(nextUpcoming.title)}` : ""
            }</p>`
      }
    </section>
  `;

  monthList.innerHTML = monthMarkup.length
    ? weekStripMarkup + monthMarkup.join("")
    : '<div class="empty-week">선택한 단계의 일정이 없습니다.</div>';

  bindEventControls();
  bindCalendarOverlapJumps();
  setupCalendarTodayFab();
}

// 날짜 셀로 스크롤. 접힌 지난 달 안에 있으면 먼저 펼친다.
function revealDateCell(dateIso, block = "start") {
  const cell = document.querySelector(`[data-date="${dateIso}"]`);
  if (!cell) return null;
  const collapsed = cell.closest("details.month-collapsed");
  if (collapsed) collapsed.open = true;
  cell.scrollIntoView({ behavior: "smooth", block });
  return cell;
}

// 우하단 '오늘' 플로팅 버튼: 오늘 셀이 화면에 보이면 숨긴다.
// (IntersectionObserver 대신 스크롤 리스너 — 임베디드 뷰 등 IO가 조용히 죽는 환경 회피)
function updateCalendarFabVisibility() {
  const fab = document.querySelector("#calendar-today-fab");
  if (!fab) return;
  if (state.activeView !== "calendar") {
    fab.hidden = true;
    return;
  }
  const todayCell = document.querySelector(`[data-date="${toIso(today)}"]`);
  if (!todayCell) {
    fab.hidden = true;
    return;
  }
  const rect = todayCell.getBoundingClientRect();
  fab.hidden = rect.top < window.innerHeight && rect.bottom > 0;
}

function setupCalendarTodayFab() {
  const fab = document.querySelector("#calendar-today-fab");
  if (!fab) return;
  if (!fab.dataset.bound) {
    fab.dataset.bound = "true";
    fab.addEventListener("click", () => revealDateCell(toIso(today)));
    // 스크롤당 gBCR 1회 — 스로틀이 필요 없을 만큼 싸다.
    window.addEventListener("scroll", updateCalendarFabVisibility, { passive: true });
  }
  updateCalendarFabVisibility();
}

function bindCalendarOverlapJumps() {
  document.querySelectorAll("[data-jump-date]").forEach((button) => {
    button.addEventListener("click", () => {
      revealDateCell(button.dataset.jumpDate, "center");
    });
  });
}

function renderEvent(event, iso = event.date) {
  const phase = phaseMap.get(event.phase);
  const complete = state.completed.has(event.id);
  const classes = ["calendar-event"];
  const presentation = getCalendarEventPresentation(event);
  if (event.milestone) classes.push("is-milestone");
  // 배치/수용량 레일: 달력엔 남기되 작업 단위가 아님을 시각적으로 구분(점선 좌측 강조).
  if (isRailEvent(event)) classes.push("is-rail");
  if (complete) classes.push("is-complete");
  if (presentation.className) classes.push(presentation.className);
  // 옮길 수 있는 카드만 드래그 대상(데스크톱 DnD + 모바일 long-press).
  const movable = canMoveEventDate(event);
  if (movable) classes.push("is-draggable");
  const plan = getEventPlan(event.id);
  const focusBadge =
    plan.focusStatus === "accepted"
      ? '<span class="event-badge is-focus">이번 주</span>'
      : plan.focusStatus === "hold"
        ? '<span class="event-badge is-hold">보류</span>'
        : plan.focusStatus === "dismissed"
          ? '<span class="event-badge is-dismissed">안 함</span>'
        : "";
  // 셀 카드 다이어트: 단계는 좌측 색 바가, 요일은 그리드 위치가 이미 말해준다.
  // 배지는 슬롯(녹음/리뷰)·계획 상태만, 본문은 [체크+제목]+[메타 1줄].
  const badgesRow =
    presentation.badge || focusBadge
      ? `<div class="event-badges">
        ${presentation.badge ? `<span class="event-badge is-slot">${presentation.badge}</span>` : ""}
        ${focusBadge}
      </div>`
      : "";
  const metaParts = [presentation.meta];
  if (event.overrideDate) metaParts.push(`원래 ${formatShortDate(event.originalDate)}`);

  // 곡의 데모 이벤트 완료는 stage의 투영이라 달력에서 직접 토글하지 않는다(잠금). 완료 여부는
  // 곡의 단계를 따르고, 변경은 '곡별 진행' 단계 칩에서 한다. out-of-band 언체크로 인한 split-brain 방지.
  const isTrackDemoEvent = Boolean(findTrackByEventId(event.id));

  return `
    <div class="${classes.join(" ")}" style="--event-color:${phase.color}" data-event-id="${escapeHtml(event.id)}"${movable ? ' draggable="true"' : ""}>
      ${badgesRow}
      <div class="event-topline">
        <input
          class="event-check"
          type="checkbox"
          aria-label="${escapeHtml(event.title)} 완료"
          ${complete ? "checked" : ""}
          ${isTrackDemoEvent ? 'disabled title="완료 여부는 곡의 단계를 따릅니다 — 곡별 진행에서 단계를 바꾸세요"' : ""}
        />
        <button class="event-title-button" type="button">${escapeHtml(presentation.title)}</button>
      </div>
      <p class="event-meta">${escapeHtml(metaParts.join(" · "))}</p>
    </div>
  `;
}

function bindEventControls() {
  document.querySelectorAll(".calendar-event").forEach((element) => {
    const eventId = element.dataset.eventId;
    const checkbox = element.querySelector(".event-check");
    const titleButton = element.querySelector(".event-title-button");

    checkbox.addEventListener("change", () => toggleCompleted(eventId, checkbox.checked));
    titleButton.addEventListener("click", () => openTaskDialog(findEvent(eventId)));
  });
}

function toggleCompleted(eventId, complete) {
  // 곡의 데모 이벤트 완료는 stage 단일 권위의 투영이다(3a 동기화 + setTrackStage 대칭 미러가
  // state.completed를 stage와 맞춰 둔다). out-of-band 토글이 표시와 stage를 어긋나게 하는 걸 막는다:
  // - 완료 표시(check)는 곡을 done 단계로 올린다(비파괴적, setTrackStage가 저장·동기화·리렌더 수행).
  // - 완료 해제(uncheck)는 무시한다. 데모를 벗어난 곡을 데모로 되돌리는 건 파괴적(편곡·녹음·믹스
  //   진행 소실)이라 완료 해제로는 하지 않고 단계 칩으로만 한다. 달력 체크박스·다이얼로그 버튼은
  //   이 이벤트에 대해 잠금 UI로 노출해 사용자가 헛클릭하지 않게 한다.
  const track = findTrackByEventId(eventId);
  if (track) {
    if (complete) setTrackStage(track.number, "done");
    return;
  }

  const event = findEvent(eventId);
  if (complete) {
    state.completed.add(eventId);
    state.completedMeta.set(eventId, { completedAt: new Date().toISOString() });
  } else {
    state.completed.delete(eventId);
    state.completedMeta.delete(eventId);
  }
  if (event?.kind === "track-followup" && event.trackNumber) {
    addTrackActivity(
      event.trackNumber,
      complete ? "반복 완료" : "반복 재개",
      `${event.title}${complete ? " 완료" : " 완료 해제"}`
    );
  }
  saveCompletedTasks();
  queueEventPlanSync(eventId);
  renderDashboard();
  renderSummary();
  renderCalendar();
  renderRoadmap();
  renderTracks();
}

function renderSummary() {
  const albumEvents = getAlbumPlanningEvents();
  const completedCount = albumEvents.filter((event) => state.completed.has(event.id)).length;
  const progress = albumEvents.length ? Math.round((completedCount / albumEvents.length) * 100) : 0;
  // 진행률은 헤더 하단 2px 라인 하나로 — 완료율만큼 골드 색이 차오른다.
  const progressFill = document.querySelector("#progress-fill");
  const progressLine = document.querySelector(".header-progress");
  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressLine) {
    progressLine.setAttribute("aria-valuenow", String(progress));
    progressLine.title = `전체 진행률 ${progress}%`;
  }

  // 헤더의 "다음 마감"은 실제로 행동할 다음 항목이라 배치/수용량 레일은 제외한다(레일은 달력
  // 컨텍스트일 뿐). 단, 위 진행률(%)은 레일도 앨범 이벤트로 포함해 그대로 둔다.
  const incomplete = albumEvents
    .filter(isPlannableEvent)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const overdue = incomplete.filter((event) => parseDate(event.date) < today);
  // 폴백도 레일을 건너뛴다(현재 데이터에선 레일이 마지막 이벤트가 아니지만 데이터 변경에 안전하게).
  const next =
    overdue[0] ||
    incomplete.find((event) => parseDate(event.date) >= today) ||
    state.events.filter((event) => !isRailEvent(event)).at(-1) ||
    state.events.at(-1);
  document.querySelector("#next-deadline").textContent = next.title;
  document.querySelector("#next-deadline-date").textContent =
    parseDate(next.date) < today ? `${formatShortDate(next.date)} · 지연` : formatShortDate(next.date);

  const release = parseDate(findEvent("release-day")?.date || RELEASE_DATE);
  const distance = Math.ceil((release - today) / 86400000);
  document.querySelector("#countdown").textContent = distance >= 0 ? `D-${distance}` : `D+${Math.abs(distance)}`;
}

function getCurrentPhase(date) {
  const iso = toIso(date);
  for (const boundary of PHASE_BOUNDARIES) {
    const event = findEvent(boundary.eventId);
    const limit = event?.[boundary.field] || event?.end || event?.date;
    if (limit && iso <= limit) return phaseMap.get(boundary.phase);
  }
  return phaseMap.get("release");
}

function renderRoadmap() {
  const container = document.querySelector("#roadmap-list");
  container.innerHTML = roadmap
    .map((item) => {
      const phase = phaseMap.get(item.phase);
      const phaseEvents = state.events.filter((event) => event.phase === item.phase);
      const completed = phaseEvents.filter((event) => state.completed.has(event.id)).length;
      const progress = phaseEvents.length ? Math.round((completed / phaseEvents.length) * 100) : 0;
      const firstDate = phaseEvents[0]?.date || "";
      return `
        <article class="roadmap-row" style="--phase-color:${phase.color}" role="button" tabindex="0"
          data-roadmap-date="${escapeHtml(firstDate)}" aria-label="${phase.label} 구간을 달력에서 보기">
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

  // 로드맵 행 클릭 → 달력의 해당 구간으로 점프 (왕복 3단계 → 1클릭).
  container.querySelectorAll("[data-roadmap-date]").forEach((row) => {
    const go = () => {
      const date = row.dataset.roadmapDate;
      if (!date) return;
      setActiveView("calendar", { focusPanel: false });
      revealDateCell(date);
    };
    row.addEventListener("click", go);
    row.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        go();
      }
    });
  });
}

function renderTrackSummaryBoard() {
  const container = document.querySelector("#track-summary-board");
  if (!container) return;

  const statuses = state.tracks.map((track) => ({ track, status: getTrackStatus(track.number, track.eventId) }));
  const currentFocus =
    statuses.find(({ status }) => status.kind === "active" || status.kind === "review")?.track ||
    statuses.find(({ status }) => status.kind !== "complete")?.track ||
    state.tracks[0];
  const currentEvent = currentFocus ? findEvent(currentFocus.eventId) : null;
  const currentStatus = currentFocus ? getTrackStatus(currentFocus.number, currentFocus.eventId) : null;

  // 단계별로 라벨이 달라지므로 문자열이 아니라 kind로 집계한다.
  const summaryItems = [
    { label: "대기", count: statuses.filter(({ status }) => status.kind === "waiting").length },
    { label: "세션/정리 중", count: statuses.filter(({ status }) => status.kind === "active" || status.kind === "review").length },
    { label: "완료 체크 필요", count: statuses.filter(({ status }) => status.kind === "ready").length },
    { label: "완료", count: statuses.filter(({ status }) => status.kind === "complete").length },
  ];

  container.innerHTML = `
    <section class="track-hero-card">
      <div>
        <h3>${currentFocus ? `${escapeHtml(currentFocus.number)}. ${escapeHtml(currentFocus.title)}` : "진행 중인 곡 없음"}</h3>
        <p>${escapeHtml(currentEvent?.detail) || "아직 곡이 선택되지 않았습니다."}</p>
      </div>
      <div class="track-hero-meta">
        ${currentStatus ? `<span class="status-pill ${currentStatus.className}">${currentStatus.label}</span>` : ""}
        ${currentFocus ? `<span class="card-chip">다음: ${getTrackNextStep(currentFocus.number)}</span>` : ""}
      </div>
    </section>
    <section class="track-summary-grid">
      ${summaryItems
        .map(
          (item) => `
            <article class="summary-mini-card">
              <span class="summary-label">${item.label}</span>
              <strong>${item.count}</strong>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

// 활성(포커스) 곡 결정: 명시 선택 > 진행 중 곡 > 첫 미완료 곡 > 첫 곡.
function getActiveTrack() {
  const explicit = state.tracks.find((track) => track.number === state.activeTrackNumber);
  if (explicit) return explicit;
  const statuses = state.tracks.map((track) => ({ track, status: getTrackStatus(track.number, track.eventId) }));
  const inProgress = statuses.find(
    ({ status }) => status.kind === "active" || status.kind === "review"
  );
  if (inProgress) return inProgress.track;
  // 완료(kind complete)가 아닌 첫 곡. 단계 칩으로 done 처리한 곡(state.completed에
  // 없어도 kind complete)이 "미완료"로 잡혀 계속 포커스되는 것을 막는다.
  const incomplete = statuses.find(({ status }) => status.kind !== "complete");
  return incomplete?.track || state.tracks[0] || null;
}

function getFilteredTracks() {
  const query = state.trackSearch.trim().toLowerCase();
  if (!query) return state.tracks;
  return state.tracks.filter(
    (track) => track.title.toLowerCase().includes(query) || track.number.includes(query)
  );
}

function setActiveTrack(trackNumber, { scroll = false, updateHash = true } = {}) {
  const track = state.tracks.find((item) => item.number === trackNumber);
  if (!track) return;
  state.activeTrackNumber = track.number;
  if (updateHash) {
    const nextHash = `#track-${track.number}`;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash);
    }
  }
  renderTracks();
  if (scroll) {
    const card = document.querySelector(`#track-card-${track.number}`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 대시보드/달력 등에서 곡으로 딥링크. eventId 또는 곡 이름으로 포커스 이동.
function focusTrackByEventId(eventId) {
  const track = state.tracks.find((item) => item.eventId === eventId);
  if (!track) return false;
  setActiveView("tracks", { focusPanel: false });
  setActiveTrack(track.number, { scroll: true });
  return true;
}

function focusTrackByName(name) {
  if (!name) return false;
  const track = state.tracks.find((item) => item.title === name);
  if (!track) return false;
  setActiveView("tracks", { focusPanel: false });
  setActiveTrack(track.number, { scroll: true });
  return true;
}

function renderTrackDetailCard(track) {
  const checklist = getTrackChecklist(track.number);
  const stageId = getTrackStage(track.number);
  const progress = getTrackChecklistProgress(track.number, stageId);
  const groupProgress = getTrackGroupProgress(track.number, stageId);
  const event = findEvent(track.eventId);
  const notes = getTrackNotes(track.number);
  const status = getTrackStatus(track.number, track.eventId);
  const stageSteps = getStageSteps(stageId);
  const groupedSteps = getStageGroups(stageId)
    .map((group) => ({
      ...group,
      steps: stageSteps.filter((step) => step.group === group.id),
    }))
    .filter((group) => group.steps.length > 0);

  const stageNav = trackStages
    .map((stage) => {
      const isCurrent = stage.id === stageId;
      return `<button class="track-stage-chip${isCurrent ? " is-active" : ""}" type="button" aria-pressed="${isCurrent}"${isCurrent ? ' aria-current="step"' : ""} data-track-stage="${stage.id}" data-track-number="${escapeHtml(track.number)}">${stage.label}</button>`;
    })
    .join("");

  return `
        <article class="track-detail-card" id="track-card-${escapeHtml(track.number)}">
          <div class="track-detail-top">
            <div>
              <h3>${escapeHtml(track.number)}. ${escapeHtml(track.title)}</h3>
              <p>${escapeHtml(event?.detail) || "이번 곡의 데모 준비를 진행합니다."}</p>
              <div class="focus-meta">
                <span class="meta-pill">데모 마감 ${formatShortDate(track.due)}</span>
                ${groupProgress
                  .map((group) => `<span class="meta-pill">${escapeHtml(group.id)} ${group.completed}/${group.total}</span>`)
                  .join("")}
                <span class="meta-pill">다음 단계 ${getTrackNextStep(track.number)}</span>
              </div>
            </div>
            <div class="track-card-meta">
              <span class="status-pill${status.className ? ` ${status.className}` : ""}">${status.label}</span>
              ${progress.total > 0 ? `<span class="card-chip">${progress.completed}/${progress.total} 체크</span>` : ""}
            </div>
          </div>
          <div class="track-stage-nav" role="group" aria-label="${escapeHtml(track.title)} 제작 단계">
            ${stageNav}
          </div>
          ${
            stageId === "demo"
              ? `<div class="track-action-row">
            <button class="opportunity-action is-primary" type="button" data-track-action="focus" data-track-event-id="${escapeHtml(track.eventId)}">
              오늘 보드에 올리기
            </button>
            ${
              state.completed.has(track.eventId)
                ? '<button class="opportunity-action" type="button" disabled title="완료 여부는 곡의 단계를 따릅니다">완료됨 · 곡별 진행에서 단계 변경</button>'
                : `<button class="opportunity-action" type="button" data-track-action="complete" data-track-event-id="${escapeHtml(track.eventId)}">곡 완료</button>`
            }
            <button class="opportunity-action is-secondary" type="button" data-track-action="hold" data-track-event-id="${escapeHtml(track.eventId)}">
              보류
            </button>
            ${
              canUseAdminMode()
                ? `<button class="opportunity-action opportunity-edit-button" type="button" data-track-edit="${escapeHtml(track.number)}">관리자: 곡 편집</button>`
                : ""
            }
          </div>`
              : canUseAdminMode()
                ? `<div class="track-action-row"><button class="opportunity-action opportunity-edit-button" type="button" data-track-edit="${escapeHtml(track.number)}">관리자: 곡 편집</button></div>`
                : ""
          }
          ${
            stageId === "done"
              ? `<p class="empty-copy">이 곡의 제작 단계가 모두 끝났습니다. 되돌리려면 위 단계 칩을 누르세요.</p>`
              : `<div class="track-checklist" data-track-number="${escapeHtml(track.number)}">
            ${groupedSteps
              .map(
                (group) => `
                  <section class="track-step-group">
                    <h4>${group.label}</h4>
                    ${group.steps
                      .map(
                        (step) => `
                          <div class="track-step-row">
                            <label>
                              <input type="checkbox" data-step-id="${step.id}" ${checklist[step.id] ? "checked" : ""} />
                              <span>${step.label}</span>
                            </label>
                            ${
                              step.repeatable
                                ? `<button class="track-repeat-inline" type="button" data-track-repeat-add="${step.id}" data-track-number="${escapeHtml(track.number)}">다시 일정</button>`
                                : ""
                            }
                          </div>
                        `
                      )
                      .join("")}
                  </section>
                `
              )
              .join("")}
          </div>`
          }
          <div class="track-note-grid">
            ${renderTrackChoiceGroup(track.number, "completedThisWeek", "이번 주에 한 것", notes.completedThisWeek)}
            ${renderTrackChoiceGroup(track.number, "arrangementIdeas", "얹어볼 악기 / 편곡 방향", notes.arrangementIdeas)}
            ${renderTrackChoiceGroup(track.number, "nextUp", "다음에 할 것", notes.nextUp, true)}
          </div>
          <div class="track-log-grid">
            <section class="track-log-card">
              <div class="track-log-header">
                <div>
                  <h4>최근 작업</h4>
                </div>
              </div>
              ${renderTrackActivityList(track.number)}
            </section>
            ${renderTrackFollowupSection(track)}
          </div>
          <div class="track-links">
            <a href="${safeUrl(track.document)}" target="_blank">곡 문서 열기</a>
            <a href="${safeUrl(track.lyrics)}" target="_blank">가사 열기</a>
          </div>
        </article>
      `;
}

// 곡의 현재 단계가 파이프라인(trackStages)에서 몇 번째인지. 알 수 없으면 0(demo).
function getTrackStageIndex(trackNumber) {
  const index = trackStages.findIndex((stage) => stage.id === getTrackStage(trackNumber));
  return index < 0 ? 0 : index;
}

// 곡 × 단계 격자 보드 — 앨범 전체가 파이프라인 어디까지 왔는지 한눈에.
// 각 셀은 곡의 현재 단계 기준으로 지난 단계(done)/현재(강조)/이후(대기)를 점으로 표시한다.
function renderPipelineBoard(activeNumber) {
  const container = document.querySelector("#track-pipeline-board");
  if (!container) return;

  // 헤더·범례는 시각 보조일 뿐(정보는 각 행 버튼의 aria-label이 담는다) → aria-hidden.
  const headCells = trackStages
    .map((stage) => `<div class="pipeline-cell pipeline-stage-head">${escapeHtml(stage.label)}</div>`)
    .join("");

  const rows = state.tracks
    .map((track) => {
      // 완료 판정·라벨은 표·칩·요약·상세와 같은 단일 소스(getTrackStatus)를 쓴다. 데모 단계에서
      // 데모 이벤트만 완료해도(단계는 그대로) kind가 complete가 되므로 보드도 완료로 그려야
      // 다른 뷰와 어긋나지 않는다. 아니면 지난 단계=끝남/현재=진행 중/이후=아직.
      const status = getTrackStatus(track.number, track.eventId);
      const isComplete = status.kind === "complete";
      const currentIndex = getTrackStageIndex(track.number);
      const isActiveRow = track.number === activeNumber;

      const cells = trackStages
        .map((stage, index) => {
          let cellClass = "";
          let dotState = "is-pending";
          if (isComplete || index < currentIndex) {
            dotState = "is-done";
          } else if (index === currentIndex) {
            cellClass = " is-current-cell";
            dotState = "is-current";
          }
          return `<div class="pipeline-cell pipeline-dot-cell${cellClass}" aria-hidden="true"><span class="pipeline-dot ${dotState}"></span></div>`;
        })
        .join("");

      // 완료 문구는 단일 소스(status.label), 미완료는 보드 목적에 맞게 현재 단계명을 노출.
      const rowLabel = isComplete
        ? `${track.number} ${track.title} — ${status.label}, 열기`
        : `${track.number} ${track.title} — ${trackStages[currentIndex].label} 단계, 열기`;

      return `
        <div class="pipeline-row${isActiveRow ? " is-active" : ""}" role="button" tabindex="0" data-pipeline-track="${escapeHtml(track.number)}" aria-label="${escapeHtml(rowLabel)}">
          <div class="pipeline-cell pipeline-song-label" aria-hidden="true">
            <span class="pipeline-song-num">${escapeHtml(track.number)}</span>
            <span class="pipeline-song-title">${escapeHtml(track.title)}</span>
          </div>
          ${cells}
        </div>`;
    })
    .join("");

  container.innerHTML = `
    <div class="pipeline-legend" aria-hidden="true">
      <span><i class="pipeline-dot is-done"></i>끝남</span>
      <span><i class="pipeline-dot is-current"></i>진행 중</span>
      <span><i class="pipeline-dot is-pending"></i>아직</span>
    </div>
    <div class="pipeline-grid-scroll">
      <div class="pipeline-grid">
        <div class="pipeline-row pipeline-head" aria-hidden="true">
          <div class="pipeline-cell pipeline-song-label">곡</div>
          ${headCells}
        </div>
        ${rows}
      </div>
    </div>`;
}

function renderTracks() {
  // 활성 곡을 한 번만 계산해 보드·표가 같은 값을 공유한다(중복 전수 스캔/불일치 방지).
  const activeTrack = getActiveTrack();
  const activeNumber = activeTrack ? activeTrack.number : null;

  renderPipelineBoard(activeNumber);
  renderTrackSummaryBoard();

  const kicker = document.querySelector("#tracks-kicker");
  if (kicker) kicker.textContent = `후보곡 ${state.tracks.length}곡`;

  const filtered = getFilteredTracks();

  // 브라우즈용 표 — 행을 클릭하면 해당 곡 워크플로로 포커스 이동.
  const body = document.querySelector("#track-table-body");
  body.innerHTML =
    filtered
      .map((track) => {
        const status = getTrackStatus(track.number, track.eventId);
        const progress = getTrackChecklistProgress(track.number);
        const isActive = track.number === activeNumber;
        return `
        <tr class="track-row${isActive ? " is-active" : ""}" data-track-number="${escapeHtml(track.number)}" tabindex="0" role="button" aria-label="${escapeHtml(track.title)} 작업 열기">
          <td class="track-number" data-label="번호">${escapeHtml(track.number)}</td>
          <td class="track-name" data-label="곡">${escapeHtml(track.title)}</td>
          <td data-label="데모 마감">${formatShortDate(track.due)}</td>
          <td data-label="상태">
            <span class="status-pill${status.className ? ` ${status.className}` : ""}">${status.label}</span>
            ${progress.total > 0 ? `<span class="table-progress-copy">${progress.completed}/${progress.total}</span>` : ""}
          </td>
          <td data-label="문서">
            <div class="document-links">
              <a href="${safeUrl(track.document)}" target="_blank" rel="noreferrer">작업</a>
              <a href="${safeUrl(track.lyrics)}" target="_blank" rel="noreferrer">가사</a>
            </div>
          </td>
        </tr>
      `;
      })
      .join("") || `<tr><td colspan="5" class="empty-copy">검색과 일치하는 곡이 없습니다.</td></tr>`;

  // 곡 선택 칩 — 빠른 곡 전환.
  const chipNav = document.querySelector("#track-chip-nav");
  if (chipNav) {
    chipNav.innerHTML = state.tracks
      .map((track) => {
        const isActive = track.number === activeNumber;
        const isDone = getTrackStatus(track.number, track.eventId).kind === "complete";
        return `<button class="track-chip${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}" type="button" aria-pressed="${isActive}" data-track-chip="${escapeHtml(track.number)}">${escapeHtml(track.number)} · ${escapeHtml(track.title)}</button>`;
      })
      .join("");
  }

  // 선택된 곡 1개만 상세(포커스)로 렌더 — 11곡 전체 스택 제거.
  document.querySelector("#track-detail-list").innerHTML = activeTrack
    ? renderTrackDetailCard(activeTrack)
    : `<p class="empty-copy">표시할 곡이 없습니다.</p>`;

  bindTrackBrowseControls();
  bindTrackDetailControls();
}

function bindTrackBrowseControls() {
  document.querySelectorAll("#track-table-body .track-row").forEach((row) => {
    const go = () => setActiveTrack(row.dataset.trackNumber, { scroll: true });
    row.addEventListener("click", (clickEvent) => {
      if (clickEvent.target.closest("a")) return; // 문서/가사 링크는 링크대로.
      go();
    });
    row.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        go();
      }
    });
  });

  document.querySelectorAll("[data-track-chip]").forEach((chip) => {
    chip.addEventListener("click", () => setActiveTrack(chip.dataset.trackChip, { scroll: true }));
  });

  // 파이프라인 보드 행 — 클릭/엔터로 해당 곡 상세로 포커스(단계 변경은 상세의 단계 칩에서만).
  document.querySelectorAll("[data-pipeline-track]").forEach((row) => {
    const go = () => setActiveTrack(row.dataset.pipelineTrack, { scroll: true });
    row.addEventListener("click", go);
    row.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        go();
      }
    });
  });
}

function bindTrackDetailControls() {
  document.querySelectorAll(".track-checklist").forEach((container) => {
    const trackNumber = container.dataset.trackNumber;
    container.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        if (!state.trackChecklist[trackNumber]) {
          state.trackChecklist[trackNumber] = Object.fromEntries(allTrackSteps.map((step) => [step.id, false]));
        }
        state.trackChecklist[trackNumber][input.dataset.stepId] = input.checked;
        const step = findTrackStep(input.dataset.stepId);
        addTrackActivity(
          trackNumber,
          input.checked ? "체크" : "체크 해제",
          `${step?.label || "작업"}${input.checked ? " 완료" : " 체크 해제"}`
        );
        saveTrackChecklistState();
        renderTracks();
        renderDashboard();
      });
    });
  });

  document.querySelectorAll("[data-track-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const eventId = button.dataset.trackEventId;
      const action = button.dataset.trackAction;
      if (action === "focus") acceptEventForThisWeek(eventId);
      if (action === "hold") holdEvent(eventId);
      if (action === "complete") toggleCompleted(eventId, !state.completed.has(eventId));
    });
  });

  document.querySelectorAll("[data-track-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      setTrackStage(button.dataset.trackNumber, button.dataset.trackStage);
    });
  });

  document.querySelectorAll("[data-track-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const track = state.tracks.find((item) => item.number === button.dataset.trackEdit);
      if (track) fillAdminTrackForm(track);
    });
  });

  document.querySelectorAll("[data-track-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleTrackNoteChoice(button.dataset.trackNumber, button.dataset.noteKey, button.dataset.trackChoice);
      renderDashboard();
    });
  });

  document.querySelectorAll("[data-track-repeat-add]").forEach((button) => {
    button.addEventListener("click", () => {
      createTrackFollowup(button.dataset.trackNumber, button.dataset.trackRepeatAdd);
    });
  });

  document.querySelectorAll("[data-track-followup-date]").forEach((input) => {
    input.addEventListener("change", () => {
      updateTrackFollowupDate(input.dataset.trackFollowupDate, input.value);
    });
  });

  document.querySelectorAll("[data-track-followup-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const followupId = button.dataset.trackFollowupId;
      const action = button.dataset.trackFollowupAction;
      if (action === "complete") toggleCompleted(followupId, true);
      if (action === "remove") removeTrackFollowup(followupId);
    });
  });
}

function openTaskDialog(event) {
  if (!event) return;
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
    .map(([term, value]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");

  const links = [];
  if (event.document) links.push(`<a href="${safeUrl(event.document)}" target="_blank">관련 문서 열기</a>`);
  if (event.lyrics) links.push(`<a href="${safeUrl(event.lyrics)}" target="_blank">가사 열기</a>`);

  // 일정 ↔ 곡 딥링크: 이 일정이 특정 곡과 연결되면 곡 워크플로로 바로 이동.
  const linkedTrack = event.trackNumber
    ? state.tracks.find((track) => track.number === event.trackNumber)
    : event.track
      ? state.tracks.find((track) => track.title === event.track)
      : null;
  if (linkedTrack) {
    links.push(
      `<button class="opportunity-action is-secondary" type="button" data-dialog-track="${escapeHtml(linkedTrack.number)}">이 곡 작업으로 이동</button>`
    );
  }

  // 관리자: 이 일정이 편집 가능한 기본 일정이면 편집 버튼 노출.
  const editableBaseEvent = canUseAdminMode() && state.baseEvents.find((base) => base.id === event.id);
  if (editableBaseEvent) {
    links.push(
      '<button class="opportunity-action opportunity-edit-button" type="button" data-dialog-edit-event="true">관리자: 일정 편집</button>'
    );
  }

  const linksHost = document.querySelector("#dialog-links");
  linksHost.innerHTML = links.join("");
  const trackButton = linksHost.querySelector("[data-dialog-track]");
  if (trackButton) {
    trackButton.addEventListener("click", () => {
      dialog.close();
      setActiveView("tracks", { focusPanel: false });
      setActiveTrack(trackButton.dataset.dialogTrack, { scroll: true });
    });
  }
  const editEventButton = linksHost.querySelector("[data-dialog-edit-event]");
  if (editEventButton && editableBaseEvent) {
    editEventButton.addEventListener("click", () => {
      dialog.close();
      fillAdminEventForm(editableBaseEvent);
    });
  }

  // ⋯ 의 목적지: 카드에서 뺀 보조 처리(보류/안 함/당겨오기/원래 일정/완료 해제)를 여기서.
  const actionsHost = document.querySelector("#dialog-actions");
  if (actionsHost) {
    const plan = getEventPlan(event.id);
    const completed = state.completed.has(event.id);
    // 곡의 데모 이벤트는 완료가 stage의 투영이다: 데모면 '곡 완료'(→done, 비파괴적)만 노출하고,
    // 이미 데모를 벗어났으면 완료 해제를 막고(파괴적) 잠금 안내로 대체한다. 곡이 아닌 이벤트는 그대로.
    const trackForEvent = findTrackByEventId(event.id);
    const completeButton = trackForEvent
      ? completed
        ? '<button class="opportunity-action" type="button" disabled title="완료 여부는 곡의 단계를 따릅니다">완료됨 · 곡별 진행에서 단계 변경</button>'
        : '<button class="opportunity-action is-primary" type="button" data-dialog-action="complete">곡 완료</button>'
      : `<button class="opportunity-action is-primary" type="button" data-dialog-action="complete">${completed ? "완료 해제" : "완료"}</button>`;
    const actionButtons = [completeButton];
    if (plan.focusStatus !== "accepted") {
      actionButtons.push('<button class="opportunity-action" type="button" data-dialog-action="accept">이번 주로 수락</button>');
    }
    if (!event.overrideDate && plan.focusStatus !== "accepted") {
      actionButtons.push('<button class="opportunity-action" type="button" data-dialog-action="pull">이번 주로 당겨오기</button>');
    }
    if (plan.focusStatus !== "hold") {
      actionButtons.push('<button class="opportunity-action is-secondary" type="button" data-dialog-action="hold">보류</button>');
    }
    if (plan.focusStatus !== "dismissed") {
      actionButtons.push('<button class="opportunity-action is-danger" type="button" data-dialog-action="dismiss">이번 주 안 함</button>');
    }
    if (event.overrideDate || plan.focusStatus !== "none") {
      actionButtons.push('<button class="opportunity-action" type="button" data-dialog-action="restore">원래 상태로</button>');
    }
    actionsHost.innerHTML = actionButtons.join("");
    actionsHost.querySelectorAll("[data-dialog-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.dialogAction;
        if (action === "complete") toggleCompleted(event.id, !completed);
        if (action === "accept") acceptEventForThisWeek(event.id);
        if (action === "pull") pullEventIntoThisWeek(event.id);
        if (action === "hold") holdEvent(event.id);
        if (action === "dismiss") dismissEvent(event.id);
        if (action === "restore") resetEventPlan(event.id);
        dialog.close();
      });
    });
  }
  renderDialogSchedule(event, dialog);
  dialog.showModal();
}

// 날짜 옮기기: 퀵 칩(오늘/내일/이번 주말/다음 주) + 날짜 직접 선택.
// 개인 오버레이라 원본 일정은 그대로고, '원래 날짜로'로 언제든 복원된다.
function renderDialogSchedule(event, dialog) {
  const host = document.querySelector("#dialog-schedule");
  if (!host) return;

  if (!canMoveEventDate(event)) {
    host.innerHTML = event?.milestone
      ? '<p class="dialog-schedule-note">고정 마감이라 날짜를 옮길 수 없습니다.</p>'
      : "";
    host.hidden = !host.innerHTML;
    return;
  }

  const chips = getQuickMoveTargets()
    .filter((target) => target.iso !== event.date)
    .map(
      (target) =>
        `<button class="schedule-chip" type="button" data-dialog-move="${escapeHtml(target.iso)}">${escapeHtml(target.label)}</button>`
    )
    .join("");
  host.innerHTML = `
    <p class="dialog-schedule-label">날짜 옮기기</p>
    <div class="dialog-schedule-chips">${chips}</div>
    <div class="dialog-schedule-custom">
      <input
        id="dialog-move-date"
        class="schedule-date-input"
        type="date"
        value="${escapeHtml(event.date)}"
        min="${CALENDAR_START}"
        max="${CALENDAR_END}"
        aria-label="옮길 날짜 선택"
      />
      <button class="schedule-chip is-confirm" type="button" data-dialog-move-custom="true">이 날짜로</button>
    </div>
    ${
      event.overrideDate
        ? `<p class="dialog-schedule-note">원래 일정 ${escapeHtml(formatShortDate(event.originalDate))} ·
            <button class="text-button" type="button" data-dialog-move="${escapeHtml(event.originalDate)}">원래 날짜로 되돌리기</button></p>`
        : ""
    }
  `;
  host.hidden = false;
  host.querySelectorAll("[data-dialog-move]").forEach((button) => {
    button.addEventListener("click", () => {
      moveEventToDate(event.id, button.dataset.dialogMove);
      dialog.close();
    });
  });
  host.querySelector("[data-dialog-move-custom]")?.addEventListener("click", () => {
    const value = host.querySelector("#dialog-move-date")?.value;
    if (!value) return;
    moveEventToDate(event.id, value);
    dialog.close();
  });
}

// 작업 가져오기 시트: 남은 작업 전체(잘림 없음)를 검색·단계 필터와 함께 보여주고,
// [오늘 하기]로 바로 당겨오거나 제목을 눌러 상세에서 원하는 날짜로 옮긴다.
const pickerState = { search: "", phase: "all" };

function openTaskPicker() {
  const dialog = document.querySelector("#picker-dialog");
  if (!dialog) return;
  renderTaskPicker();
  if (!dialog.open) dialog.showModal();
}

function getPickerEvents() {
  return getIncompleteEvents().filter((event) => canMoveEventDate(event));
}

function renderTaskPicker() {
  const host = document.querySelector("#picker-list");
  if (!host) return;

  const allEvents = getPickerEvents();
  if (pickerState.phase !== "all" && !allEvents.some((event) => event.phase === pickerState.phase)) {
    pickerState.phase = "all";
  }
  const search = pickerState.search.trim().toLowerCase();
  const filtered = allEvents.filter((event) => {
    if (pickerState.phase !== "all" && event.phase !== pickerState.phase) return false;
    if (!search) return true;
    return [event.title, event.track, event.detail]
      .filter(Boolean)
      .some((text) => String(text).toLowerCase().includes(search));
  });

  renderPickerPhaseFilters(allEvents);

  host.innerHTML = filtered.length
    ? filtered.map((event) => renderPickerRow(event)).join("")
    : '<p class="empty-copy">조건에 맞는 작업이 없습니다.</p>';

  host.querySelectorAll("[data-picker-today]").forEach((button) => {
    button.addEventListener("click", () => pullEventIntoThisWeek(button.dataset.pickerToday));
  });
  host.querySelectorAll("[data-picker-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = findEvent(button.dataset.pickerDetail);
      if (target) openTaskDialog(target);
    });
  });
}

function renderPickerPhaseFilters(events) {
  const host = document.querySelector("#picker-phase-filters");
  if (!host) return;
  const availablePhases = phases.filter((phase) => events.some((event) => event.phase === phase.id));
  const chips = [{ id: "all", label: "전체" }, ...availablePhases];
  host.innerHTML = chips
    .map(
      (phase) =>
        `<button class="schedule-chip${pickerState.phase === phase.id ? " is-current" : ""}" type="button" data-picker-phase="${escapeHtml(phase.id)}">${escapeHtml(phase.label)}</button>`
    )
    .join("");
  host.querySelectorAll("[data-picker-phase]").forEach((button) => {
    button.addEventListener("click", () => {
      pickerState.phase = button.dataset.pickerPhase;
      renderTaskPicker();
    });
  });
}

function renderPickerRow(event) {
  const phase = phaseMap.get(event.phase);
  const delayed = parseDate(event.date) < today;
  const plan = getEventPlan(event.id);
  const planChip =
    plan.focusStatus === "accepted"
      ? ' <span class="picker-chip is-focus">이번 주</span>'
      : plan.focusStatus === "hold"
        ? ' <span class="picker-chip is-hold">보류</span>'
        : plan.focusStatus === "dismissed"
          ? ' <span class="picker-chip is-dismissed">안 함</span>'
          : "";
  const alreadyToday = event.date === toIso(today) && plan.focusStatus === "accepted";
  return `
    <article class="picker-item" style="--event-color:${phase.color}">
      <div class="picker-item-main">
        <button class="picker-item-title" type="button" data-picker-detail="${escapeHtml(event.id)}">${escapeHtml(event.title)}</button>
        <p class="picker-item-meta">${escapeHtml(phase.label)} · ${formatDateRange(event)}${delayed ? " · 지연" : ""}${planChip}</p>
      </div>
      <button class="opportunity-action is-primary picker-pull" type="button" data-picker-today="${escapeHtml(event.id)}"${alreadyToday ? " disabled" : ""}>
        ${alreadyToday ? "오늘 잡음" : "오늘 하기"}
      </button>
    </article>
  `;
}

function openOpportunityDialog(opportunity) {
  if (!opportunity) return;
  const dialog = document.querySelector("#task-dialog");
  const phase = phaseMap.get("opportunity");
  const review = getOpportunityReview(opportunity.id);
  dialog.style.setProperty("--dialog-color", phase.color);
  document.querySelector("#dialog-phase").textContent = "싱어송라이터 공모전";
  document.querySelector("#dialog-title").textContent = opportunity.title;
  document.querySelector("#dialog-date").textContent = formatOpportunityDateLabel(opportunity);
  document.querySelector("#dialog-detail").textContent = opportunity.summary;

  const meta = [
    ["주최", opportunity.host],
    ["상태", formatOpportunityStatus(opportunity.status)],
    ["내 판단", formatOpportunityReview(review.status)],
    ["적합도", opportunity.fitLabel],
    ["준비", opportunity.preparation],
    ["갱신", opportunity.lastCheckedAt ? formatSyncTimestamp(new Date(opportunity.lastCheckedAt)) : "최근 확인 기록 없음"],
  ];
  document.querySelector("#dialog-meta").innerHTML = meta
    .map(([term, value]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");

  document.querySelector("#dialog-links").innerHTML = `
    <a href="${safeUrl(opportunity.officialUrl)}" target="_blank" rel="noreferrer">공식 공고 열기</a>
    <span class="summary-label">${escapeHtml(opportunity.sourceNote || "출처 메모 없음")}</span>
  `;
  const opportunityActionsHost = document.querySelector("#dialog-actions");
  if (opportunityActionsHost) opportunityActionsHost.innerHTML = "";
  const opportunityScheduleHost = document.querySelector("#dialog-schedule");
  if (opportunityScheduleHost) {
    opportunityScheduleHost.innerHTML = "";
    opportunityScheduleHost.hidden = true;
  }
  dialog.showModal();
}

// 탭별 스크롤 위치 기억: 달력 10월을 보다가 다른 탭에 다녀와도 그 자리로 돌아온다.
const viewScrollPositions = {};

function setActiveView(view, { focusPanel = true } = {}) {
  const changed = state.activeView !== view;
  if (changed) viewScrollPositions[state.activeView] = window.scrollY;
  state.activeView = view;
  document.querySelectorAll(".tab-button").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  let activePanel = null;
  document.querySelectorAll(".view-panel").forEach((panel) => {
    const active = panel.id === `${view}-view`;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
    if (active) activePanel = panel;
  });
  // 탭을 실제로 바꿀 때만 포커스를 옮기고, 저장된 위치가 있으면 복원한다.
  // 복원/착지는 애니메이션 없이(instant) — 위치 회복은 눈에 띄지 않아야 한다.
  if (changed && focusPanel && activePanel) {
    activePanel.focus({ preventScroll: true });
    const saved = viewScrollPositions[view];
    if (saved !== undefined) {
      window.scrollTo({ top: saved, behavior: "instant" });
    } else if (view === "calendar") {
      // 달력 첫 진입은 6월 1일이 아니라 '오늘'에 착지한다.
      const todayCell = document.querySelector(`[data-date="${toIso(today)}"]`);
      (todayCell || document.querySelector("#main-content"))?.scrollIntoView({ block: "start", behavior: "instant" });
    } else {
      const main = document.querySelector("#main-content");
      (main || activePanel).scrollIntoView({ block: "start", behavior: "instant" });
    }
  }
  updateCalendarFabVisibility();
}

function jumpToCurrentWeek() {
  setActiveView("calendar");
  state.activePhase = "all";
  renderPhaseFilters();
  renderCalendar();
  const todayCell = document.querySelector(`[data-date="${toIso(today)}"]`);
  (todayCell || document.querySelector(".month-section"))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAll() {
  updateAppModeChrome();
  updateChrome();
  updateAuthChrome();
  renderDashboard();
  renderOpportunities();
  renderPhaseFilters();
  renderCalendar();
  renderRoadmap();
  renderTracks();
  renderSummary();
  // 가져오기 시트가 열려 있으면 목록도 같은 상태로 갱신한다.
  if (document.querySelector("#picker-dialog")?.open) renderTaskPicker();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

// 곡 검색은 정적 입력이라 한 번만 바인딩(재렌더로 포커스를 잃지 않게).
document.querySelector("#track-search")?.addEventListener("input", (searchEvent) => {
  state.trackSearch = searchEvent.target.value || "";
  renderTracks();
});

// #track-NN 딥링크 지원: 공유/재방문 시 해당 곡 포커스를 복원한다.
function applyTrackHash() {
  const match = /^#track-(.+)$/.exec(window.location.hash || "");
  if (!match) return;
  const number = decodeURIComponent(match[1]);
  const track = state.tracks.find((item) => item.number === number);
  if (!track) return;
  setActiveView("tracks", { focusPanel: false });
  setActiveTrack(track.number, { scroll: true, updateHash: false });
}
window.addEventListener("hashchange", applyTrackHash);

document.querySelector("#jump-today").addEventListener("click", jumpToCurrentWeek);
document.querySelector("#refresh-data").addEventListener("click", refreshSupabaseData);
document.querySelectorAll("[data-app-refresh]").forEach((element) => {
  element.addEventListener("click", refreshAppShell);
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    refreshAppShell();
  });
});
document.querySelector("#save-checkin")?.addEventListener("click", saveWeeklyCheckin);
document.querySelector("#copy-checkin-prompt")?.addEventListener("click", copyCheckinPrompt);
document.querySelector("#auth-form").addEventListener("submit", handleAuthSubmit);
document.querySelector("#auth-signout").addEventListener("click", handleSignout);
document.querySelector("#install-app").addEventListener("click", promptInstallApp);
document.querySelector("#mobile-focus-toggle").addEventListener("click", toggleMobileCompactMode);

// 헤더 동기화 점 → 팝오버(상태·새로고침·로그인). 바깥 클릭/Esc로 닫힘.
const syncDotButton = document.querySelector("#sync-dot");
const syncPopover = document.querySelector("#sync-popover");
function setSyncPopoverOpen(open) {
  if (!syncDotButton || !syncPopover) return;
  syncPopover.hidden = !open;
  syncDotButton.setAttribute("aria-expanded", String(open));
}
syncDotButton?.addEventListener("click", (clickEvent) => {
  clickEvent.stopPropagation();
  setSyncPopoverOpen(syncPopover.hidden);
});
document.addEventListener("click", (clickEvent) => {
  if (!syncPopover || syncPopover.hidden) return;
  if (!syncPopover.contains(clickEvent.target) && clickEvent.target !== syncDotButton) {
    setSyncPopoverOpen(false);
  }
});
document.addEventListener("keydown", (keyEvent) => {
  if (keyEvent.key === "Escape") setSyncPopoverOpen(false);
});
document.querySelector("#admin-opportunity-form")?.addEventListener("submit", saveAdminOpportunity);
document.querySelector("#admin-reset")?.addEventListener("click", resetAdminOpportunityForm);
document.querySelector("#admin-delete")?.addEventListener("click", deleteAdminOpportunity);
document.querySelector("#admin-event-form")?.addEventListener("submit", saveAdminEvent);
document.querySelector("#admin-event-reset")?.addEventListener("click", resetAdminEventForm);
document.querySelector("#admin-event-delete")?.addEventListener("click", deleteAdminEvent);
document.querySelector("#admin-track-form")?.addEventListener("submit", saveAdminTrack);
document.querySelector("#admin-track-reset")?.addEventListener("click", resetAdminTrackForm);
document.querySelector("#admin-track-delete")?.addEventListener("click", deleteAdminTrack);
["#checkin-available", "#checkin-completed", "#checkin-mustdo", "#checkin-blockers"].forEach((selector) => {
  document.querySelector(selector)?.addEventListener("input", () => {
    readWeeklyCheckinForm();
    updateCheckinPromptPreview();
  });
});
document.querySelector("#close-dialog").addEventListener("click", () => document.querySelector("#task-dialog").close());
document.querySelector("#task-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

// 작업 가져오기 시트: 검색은 정적 입력이라 한 번만 바인딩(재렌더로 포커스를 잃지 않게).
document.querySelector("#picker-search")?.addEventListener("input", (searchEvent) => {
  pickerState.search = searchEvent.target.value || "";
  renderTaskPicker();
});
document.querySelector("#close-picker")?.addEventListener("click", () => document.querySelector("#picker-dialog").close());
document.querySelector("#picker-dialog")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
document.querySelector("#open-picker-dashboard")?.addEventListener("click", openTaskPicker);
document.querySelector("#open-picker-calendar")?.addEventListener("click", openTaskPicker);

// 달력 드래그 앤 드롭. 문서 레벨 위임이라 달력 재렌더에 영향받지 않는다.
// 데스크톱: HTML5 DnD. 모바일: 카드를 길게 눌러(0.5초) 들어올린 뒤 셀에 놓는다.
// 드롭 결과는 moveEventToDate — 개인 오버레이라 원본 일정은 그대로다.
function initCalendarDragAndDrop() {
  let draggingEventId = null;

  const clearDropTargets = () => {
    document.querySelectorAll(".month-cell.is-drop-target").forEach((cell) => cell.classList.remove("is-drop-target"));
  };
  const findCell = (target) =>
    target instanceof Element ? target.closest(".month-cell[data-date]") : null;

  document.addEventListener("dragstart", (dragEvent) => {
    const card = dragEvent.target instanceof Element ? dragEvent.target.closest('.calendar-event[draggable="true"]') : null;
    if (!card) return;
    draggingEventId = card.dataset.eventId;
    dragEvent.dataTransfer.setData("text/plain", draggingEventId);
    dragEvent.dataTransfer.effectAllowed = "move";
    card.classList.add("is-dragging");
  });
  document.addEventListener("dragend", (dragEvent) => {
    if (dragEvent.target instanceof Element) {
      dragEvent.target.closest(".calendar-event")?.classList.remove("is-dragging");
    }
    draggingEventId = null;
    clearDropTargets();
  });
  document.addEventListener("dragover", (dragEvent) => {
    if (!draggingEventId) return;
    const cell = findCell(dragEvent.target);
    if (!cell) return;
    dragEvent.preventDefault();
    dragEvent.dataTransfer.dropEffect = "move";
    if (!cell.classList.contains("is-drop-target")) {
      clearDropTargets();
      cell.classList.add("is-drop-target");
    }
  });
  document.addEventListener("drop", (dragEvent) => {
    if (!draggingEventId) return;
    const cell = findCell(dragEvent.target);
    clearDropTargets();
    if (!cell) return;
    dragEvent.preventDefault();
    const eventId = draggingEventId;
    draggingEventId = null;
    moveEventToDate(eventId, cell.dataset.date);
  });

  // ---- 모바일 long-press 드래그 ----
  const LONG_PRESS_MS = 500;
  const MOVE_TOLERANCE = 8;
  const EDGE_SCROLL_ZONE = 90;
  let pressTimer = null;
  let pressCard = null;
  let pressPoint = null;
  let touchDragging = false;
  let ghost = null;

  const cancelPress = () => {
    if (pressTimer) window.clearTimeout(pressTimer);
    pressTimer = null;
    pressCard = null;
    pressPoint = null;
  };

  // 드래그 중에만 스크롤을 막는다(리프트 전 스크롤은 그대로 동작).
  const blockScroll = (touchEvent) => {
    if (touchDragging) touchEvent.preventDefault();
  };

  const endTouchDrag = (dropPoint) => {
    if (!touchDragging) return;
    touchDragging = false;
    ghost?.remove();
    ghost = null;
    document.removeEventListener("touchmove", blockScroll);
    const cell = dropPoint
      ? findCell(document.elementFromPoint(dropPoint.x, dropPoint.y))
      : null;
    clearDropTargets();
    document.querySelectorAll(".calendar-event.is-dragging").forEach((card) => card.classList.remove("is-dragging"));
    const eventId = draggingEventId;
    draggingEventId = null;
    if (cell && eventId) moveEventToDate(eventId, cell.dataset.date);
    // 드롭 직후 발생하는 잔여 click이 다이얼로그를 열지 않게 한 번 삼킨다.
    const swallowClick = (clickEvent) => {
      clickEvent.stopPropagation();
      clickEvent.preventDefault();
    };
    document.addEventListener("click", swallowClick, { capture: true, once: true });
    window.setTimeout(() => document.removeEventListener("click", swallowClick, { capture: true }), 350);
  };

  const beginTouchDrag = (card, point) => {
    touchDragging = true;
    draggingEventId = card.dataset.eventId;
    card.classList.add("is-dragging");
    navigator.vibrate?.(15);
    ghost = document.createElement("div");
    ghost.className = "calendar-drag-ghost";
    ghost.textContent = card.querySelector(".event-title-button")?.textContent || "일정";
    document.body.appendChild(ghost);
    positionGhost(point);
    document.addEventListener("touchmove", blockScroll, { passive: false });
  };

  const positionGhost = (point) => {
    if (!ghost) return;
    ghost.style.left = `${point.x}px`;
    ghost.style.top = `${point.y}px`;
    const cell = findCell(document.elementFromPoint(point.x, point.y));
    clearDropTargets();
    cell?.classList.add("is-drop-target");
    // 화면 가장자리 근처에서는 달력을 이어서 스크롤한다.
    if (point.y < EDGE_SCROLL_ZONE) window.scrollBy(0, -14);
    else if (point.y > window.innerHeight - EDGE_SCROLL_ZONE) window.scrollBy(0, 14);
  };

  document.addEventListener("pointerdown", (pointerEvent) => {
    if (pointerEvent.pointerType !== "touch") return;
    const card =
      pointerEvent.target instanceof Element ? pointerEvent.target.closest(".calendar-event.is-draggable") : null;
    if (!card) return;
    pressCard = card;
    pressPoint = { x: pointerEvent.clientX, y: pointerEvent.clientY };
    pressTimer = window.setTimeout(() => {
      const target = pressCard;
      const point = pressPoint;
      cancelPress();
      if (target && point) beginTouchDrag(target, point);
    }, LONG_PRESS_MS);
  });
  document.addEventListener("pointermove", (pointerEvent) => {
    if (pointerEvent.pointerType !== "touch") return;
    const point = { x: pointerEvent.clientX, y: pointerEvent.clientY };
    if (touchDragging) {
      positionGhost(point);
      return;
    }
    // 리프트 전 손가락이 흐르면(=스크롤 의도) long-press를 취소한다.
    if (pressPoint && Math.hypot(point.x - pressPoint.x, point.y - pressPoint.y) > MOVE_TOLERANCE) {
      cancelPress();
    }
  });
  document.addEventListener("pointerup", (pointerEvent) => {
    if (pointerEvent.pointerType !== "touch") return;
    cancelPress();
    endTouchDrag({ x: pointerEvent.clientX, y: pointerEvent.clientY });
  });
  document.addEventListener("pointercancel", () => {
    cancelPress();
    endTouchDrag(null);
  });
}
initCalendarDragAndDrop();

renderAll();
applyTrackHash();
refreshSupabaseData();
initAuth();
bindPwaInstall();
registerServiceWorker();
window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateAppModeChrome);
window.addEventListener("resize", updateAppModeChrome);
