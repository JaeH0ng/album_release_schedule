import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY = "album-release-completed-tasks-v1";
const TRACK_CHECKLIST_KEY = "album-release-track-checklist-v1";
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

const defaultTrackSteps = [
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
];

const trackStepGroups = [
  { id: "세션", label: "세션 (60분, 악기 앞에서)" },
  { id: "마감", label: "마감 (세션 직후, 책상에서)" },
];

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
  activeTrackNumbers: ["02", "06", "11"],
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
  trackChecklist: loadTrackChecklistState(),
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

function findTrackStep(stepId) {
  return defaultTrackSteps.find((step) => step.id === stepId);
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
      state.trackChecklist[number] = Object.fromEntries(defaultTrackSteps.map((step) => [step.id, false]));
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
        phase: "demo",
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
      Object.fromEntries(defaultTrackSteps.map((step) => [step.id, false])),
    ])
  );
}

function loadTrackChecklistState() {
  const base = buildDefaultTrackChecklist();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_CHECKLIST_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    return Object.fromEntries(
      Object.entries(base).map(([trackNumber, defaults]) => [
        trackNumber,
        {
          ...defaults,
          ...(stored[trackNumber] || {}),
        },
      ])
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

function loadTrackNotesState() {
  const base = buildDefaultTrackNotes();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_NOTES_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    return Object.fromEntries(
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

function loadTrackActivityState() {
  const base = buildDefaultTrackActivity();
  try {
    const stored = JSON.parse(localStorage.getItem(TRACK_ACTIVITY_KEY) || "{}");
    if (!stored || typeof stored !== "object") return base;

    return Object.fromEntries(
      Object.entries(base).map(([trackNumber, defaults]) => [
        trackNumber,
        Array.isArray(stored[trackNumber])
          ? stored[trackNumber]
              .filter(
                (entry) =>
                  entry &&
                  typeof entry === "object" &&
                  typeof entry.id === "string" &&
                  typeof entry.text === "string" &&
                  typeof entry.createdAt === "string"
              )
              .slice(0, 20)
          : defaults,
      ])
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

  if (user) {
    authStatusText.textContent = user.email || "로그인됨";
    authStatusDetail.textContent = state.isAdmin
      ? "공모전 판단 상태와 개인 동기화가 활성화됨"
      : "공모전 판단 상태가 Supabase로 동기화됨";
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
  state.reviewSyncTimer = window.setInterval(() => {
    loadRemoteOpportunityReviews();
  }, 45000);
}

async function setAuthSession(session) {
  state.session = session;
  state.authReady = true;
  state.adminLoaded = false;
  state.isAdmin = false;
  updateAuthChrome();
  updateAdminChrome();

  if (getAuthUser()) {
    await loadAdminAccess();
    startRemoteReviewPolling();
    await loadRemoteOpportunityReviews();
    return;
  }

  stopRemoteReviewPolling();
  state.opportunityReview = loadOpportunityReviewState();
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

function getTrackChecklistProgress(trackNumber) {
  const checklist = getTrackChecklist(trackNumber);
  const completed = defaultTrackSteps.filter((step) => checklist[step.id]).length;
  return { completed, total: defaultTrackSteps.length };
}

function getTrackStageProgress(trackNumber) {
  const checklist = getTrackChecklist(trackNumber);
  const sessionSteps = defaultTrackSteps.filter((step) => step.group === "세션");
  const closingSteps = defaultTrackSteps.filter((step) => step.group === "마감");
  const sessionCompleted = sessionSteps.filter((step) => checklist[step.id]).length;
  const closingCompleted = closingSteps.filter((step) => checklist[step.id]).length;
  return {
    sessionCompleted,
    sessionTotal: sessionSteps.length,
    closingCompleted,
    closingTotal: closingSteps.length,
  };
}

function getTrackNextStep(trackNumber) {
  const checklist = getTrackChecklist(trackNumber);
  return defaultTrackSteps.find((step) => !checklist[step.id])?.label || "데모 완료 처리";
}

function getTrackStatus(trackNumber, eventId) {
  if (state.completed.has(eventId)) return { label: "완료", className: "is-complete" };
  const { completed, total } = getTrackChecklistProgress(trackNumber);
  const { sessionCompleted, sessionTotal, closingCompleted } = getTrackStageProgress(trackNumber);
  if (completed === 0) return { label: "대기", className: "" };
  if (completed === total) return { label: "데모 완료 체크", className: "is-ready" };
  if (sessionCompleted > 0 && sessionCompleted < sessionTotal) return { label: "세션 중", className: "is-active" };
  if (sessionCompleted === sessionTotal && closingCompleted < total - sessionTotal) {
    return { label: "정리 중", className: "is-review" };
  }
  return { label: "진행", className: "is-active" };
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
  return state.eventPlan[eventId] || { focusStatus: "none", overrideDate: null };
}

function updateEventPlan(eventId, patch) {
  const current = getEventPlan(eventId);
  state.eventPlan[eventId] = {
    ...current,
    ...patch,
  };

  if (state.eventPlan[eventId].focusStatus === "none" && !state.eventPlan[eventId].overrideDate) {
    delete state.eventPlan[eventId];
  }

  saveEventPlanState();
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
  updateEventPlan(eventId, { focusStatus: "none", overrideDate: null });
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
  const patch = { overrideDate: nextIso === event.originalDate ? null : nextIso };
  // 날짜를 옮기는 행동 자체가 "하겠다"는 뜻 — 보류/안 함은 해제한다.
  if (plan.focusStatus === "hold" || plan.focusStatus === "dismissed") patch.focusStatus = "none";
  // 이번 주 밖으로 보내면 '직접 수락' 고정도 풀어 이번 주 목록에서 내린다.
  if (plan.focusStatus === "accepted" && !isIsoInCurrentWeek(nextIso)) patch.focusStatus = "none";
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
    .sort((left, right) => parseDate(left.event.date) - parseDate(right.event.date))
    .slice(0, 5);
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

function getIncompleteEvents() {
  return state.events
    .filter((event) => !state.completed.has(event.id))
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

function getDashboardActiveDemoTracks() {
  return dashboardDemoMonitor.activeTrackNumbers
    .map((trackNumber) => findTrack(trackNumber))
    .filter(Boolean);
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
  const activeDemoTracks = getDashboardActiveDemoTracks();
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
      value: activeDemoTracks.length,
      label: "데모 작업 중",
      detail:
        activeDemoTracks.length > 0
          ? activeDemoTracks.map((track) => track.title).join(", ")
          : "아직 표시된 진행 곡 없음",
      wide: true,
    },
    {
      value: demoSpotlight ? demoSpotlight.track.title : "-",
      label: "이번 확인 포인트",
      detail: demoSpotlight ? demoSpotlight.bullets[0] : "설정된 포인트 없음",
      detailList: demoSpotlight?.bullets || [],
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
    ? restFocusItems.map((item) => renderDashboardTaskCard(item.event, item.source)).join("")
    : heroFocus
      ? '<p class="empty-copy">위 작업 하나에 집중하면 됩니다.</p>'
      : '<p class="empty-copy">이번 주 핵심 작업이 비었습니다. 위 제안을 수락하거나 아래 후보에서 당겨오세요.</p>';

  document.querySelector("#fallback-list").innerHTML = weeklyFocus.fallback30
    .map((item) => `<li>${item}</li>`)
    .join("");

  document.querySelector("#urgency-list").innerHTML = urgencyEvents.length
    ? urgencyEvents
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

  const spotlight = getOpportunityCandidates()
    .filter((opportunity) => opportunity.status !== "closed")
    .slice(0, 3);
  document.querySelector("#dashboard-opportunity-list").innerHTML = spotlight.length
    ? spotlight.map((opportunity) => renderOpportunityCard(opportunity, { compact: true })).join("")
    : '<p class="opportunity-empty">이번 주 표시할 공모전이 아직 없습니다.</p>';

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
      <button class="hero-more" type="button" data-dashboard-action="menu" data-event-id="${escapeHtml(event.id)}" aria-label="상세와 다른 처리 열기">⋯</button>
    </div>
  `;
}

function renderDashboardTaskCard(event, mode) {
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
        <button class="opportunity-action task-more" type="button" data-dashboard-action="menu" data-event-id="${escapeHtml(event.id)}" aria-label="상세와 다른 처리 열기">⋯</button>
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
    .filter((event) => parseDate(event.date) > weekEnd && !state.completed.has(event.id))
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
  if (complete) classes.push("is-complete");
  if (presentation.className) classes.push(presentation.className);
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

  return `
    <div class="${classes.join(" ")}" style="--event-color:${phase.color}" data-event-id="${escapeHtml(event.id)}">
      ${badgesRow}
      <div class="event-topline">
        <input
          class="event-check"
          type="checkbox"
          aria-label="${escapeHtml(event.title)} 완료"
          ${complete ? "checked" : ""}
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

  const incomplete = albumEvents
    .filter((event) => !state.completed.has(event.id))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const overdue = incomplete.filter((event) => parseDate(event.date) < today);
  const next =
    overdue[0] || incomplete.find((event) => parseDate(event.date) >= today) || state.events.at(-1);
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
    statuses.find(({ status }) => status.className === "is-active" || status.className === "is-review")?.track ||
    state.tracks.find((track) => !state.completed.has(track.eventId)) ||
    state.tracks[0];
  const currentEvent = currentFocus ? findEvent(currentFocus.eventId) : null;
  const currentStatus = currentFocus ? getTrackStatus(currentFocus.number, currentFocus.eventId) : null;

  const summaryItems = [
    { label: "대기", count: statuses.filter(({ status }) => status.label === "대기").length },
    { label: "세션/정리 중", count: statuses.filter(({ status }) => ["세션 중", "정리 중", "진행"].includes(status.label)).length },
    { label: "완료 체크 필요", count: statuses.filter(({ status }) => status.label === "데모 완료 체크").length },
    { label: "완료", count: statuses.filter(({ status }) => status.label === "완료").length },
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
    ({ status }) => status.className === "is-active" || status.className === "is-review"
  );
  if (inProgress) return inProgress.track;
  const incomplete = state.tracks.find((track) => !state.completed.has(track.eventId));
  return incomplete || state.tracks[0] || null;
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
  const progress = getTrackChecklistProgress(track.number);
  const stage = getTrackStageProgress(track.number);
  const event = findEvent(track.eventId);
  const notes = getTrackNotes(track.number);
  const status = getTrackStatus(track.number, track.eventId);
  const groupedSteps = trackStepGroups
    .map((group) => ({
      ...group,
      steps: defaultTrackSteps.filter((step) => step.group === group.id),
    }))
    .filter((group) => group.steps.length > 0);

  return `
        <article class="track-detail-card" id="track-card-${escapeHtml(track.number)}">
          <div class="track-detail-top">
            <div>
              <h3>${escapeHtml(track.number)}. ${escapeHtml(track.title)}</h3>
              <p>${escapeHtml(event?.detail) || "이번 곡의 데모 준비를 진행합니다."}</p>
              <div class="focus-meta">
                <span class="meta-pill">데모 마감 ${formatShortDate(track.due)}</span>
                <span class="meta-pill">세션 ${stage.sessionCompleted}/${stage.sessionTotal}</span>
                <span class="meta-pill">마감 ${stage.closingCompleted}/${stage.closingTotal}</span>
                <span class="meta-pill">다음 단계 ${getTrackNextStep(track.number)}</span>
              </div>
            </div>
            <div class="track-card-meta">
              <span class="status-pill${status.className ? ` ${status.className}` : ""}">${status.label}</span>
              <span class="card-chip">${progress.completed}/${progress.total} 체크</span>
            </div>
          </div>
          <div class="track-action-row">
            <button class="opportunity-action is-primary" type="button" data-track-action="focus" data-track-event-id="${escapeHtml(track.eventId)}">
              오늘 보드에 올리기
            </button>
            <button class="opportunity-action" type="button" data-track-action="complete" data-track-event-id="${escapeHtml(track.eventId)}">
              ${state.completed.has(track.eventId) ? "완료 해제" : "데모 완료"}
            </button>
            <button class="opportunity-action is-secondary" type="button" data-track-action="hold" data-track-event-id="${escapeHtml(track.eventId)}">
              보류
            </button>
            ${
              canUseAdminMode()
                ? `<button class="opportunity-action opportunity-edit-button" type="button" data-track-edit="${escapeHtml(track.number)}">관리자: 곡 편집</button>`
                : ""
            }
          </div>
          <div class="track-checklist" data-track-number="${escapeHtml(track.number)}">
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
          </div>
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

function renderTracks() {
  renderTrackSummaryBoard();

  const kicker = document.querySelector("#tracks-kicker");
  if (kicker) kicker.textContent = `후보곡 ${state.tracks.length}곡`;

  const activeTrack = getActiveTrack();
  const activeNumber = activeTrack ? activeTrack.number : null;
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
            <span class="table-progress-copy">${progress.completed}/${progress.total}</span>
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
        const isDone = state.completed.has(track.eventId);
        return `<button class="track-chip${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}" type="button" role="tab" aria-selected="${isActive}" data-track-chip="${escapeHtml(track.number)}">${escapeHtml(track.number)} · ${escapeHtml(track.title)}</button>`;
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
}

function bindTrackDetailControls() {
  document.querySelectorAll(".track-checklist").forEach((container) => {
    const trackNumber = container.dataset.trackNumber;
    container.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        if (!state.trackChecklist[trackNumber]) {
          state.trackChecklist[trackNumber] = Object.fromEntries(defaultTrackSteps.map((step) => [step.id, false]));
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
    const actionButtons = [
      `<button class="opportunity-action is-primary" type="button" data-dialog-action="complete">${completed ? "완료 해제" : "완료"}</button>`,
    ];
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

renderAll();
applyTrackHash();
refreshSupabaseData();
initAuth();
bindPwaInstall();
registerServiceWorker();
window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateAppModeChrome);
window.addEventListener("resize", updateAppModeChrome);
