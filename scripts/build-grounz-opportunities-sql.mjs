const API_BASE = "https://api.grounz.net";
const GROUNZ_LIST_URL = "https://grounz.net/announcement?category=0";
const PAGE_SIZE = 40;
const MAX_PAGES = 4;
const TODAY = new Date();

const PRIORITY_KEYWORDS = [
  "싱어송라이터",
  "자작곡",
  "작사",
  "작곡",
  "유재하",
  "헬로루키",
  "창작곡",
  "가요제",
  "경연",
  "경연대회",
  "음악제",
  "콘테스트",
];

const CREATOR_KEYWORDS = ["싱어송라이터", "자작곡", "창작곡", "작사", "작곡"];
const CONTEST_KEYWORDS = ["공모전", "가요제", "경연", "경연대회", "음악제", "콘테스트"];

const NEGATIVE_KEYWORDS = [
  "공간대관",
  "대관",
  "국악",
  "초등",
  "어린이",
  "청소년",
  "노랫말",
  "작사 공모",
  "아티스트 모집",
  "공연 신청",
  "오디션",
  "게임음악",
  "마을축제",
  "캠핑",
  "전시",
  "미술",
  "연극",
  "무용",
  "영화",
  "사진",
  "웹툰",
];

const ID_OVERRIDES = [
  { match: /유재하음악경연대회/, id: "yjh-2026" },
  { match: /헬로루키/i, id: "ebs-hellorookie-watch" },
];

function parseArgs(argv) {
  return {
    format: argv.includes("--json") ? "json" : "sql",
  };
}

function isoDate(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toSqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSqlNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "null";
  return String(Number(value));
}

function toSqlDate(value) {
  if (!value) return "null";
  return toSqlString(value);
}

function statusFromDeadline(deadline) {
  if (!deadline) return "watch";
  return deadline < TODAY.toISOString().slice(0, 10) ? "closed" : "open";
}

function countKeywordHits(text, keywords) {
  return keywords.reduce((count, keyword) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function scoreOpportunity(detail) {
  const haystack = [
    detail.article?.title,
    detail.description,
    detail.article?.body,
    detail.organization,
    ...flattenTagNames(detail.tagFieldGroups),
  ]
    .join(" ")
    .toLowerCase();

  let score = countKeywordHits(haystack, PRIORITY_KEYWORDS) * 2;
  score -= countKeywordHits(haystack, NEGATIVE_KEYWORDS) * 3;
  if (haystack.includes("공모전")) score += 2;
  if (haystack.includes("지원사업")) score += 1;
  if (haystack.includes("창작")) score += 1;
  return score;
}

function flattenTagNames(tagFieldGroups = []) {
  return tagFieldGroups.flatMap((group) => (group.tagFields || []).map((field) => field.name));
}

function isSingerSongwriterFit(detail) {
  const deadline = isoDate(detail.endDate);
  if (!deadline || deadline.startsWith("9999-")) return false;

  const tags = flattenTagNames(detail.tagFieldGroups);
  const typeTags = tags.filter((name) => ["공모전", "지원사업", "가요제"].includes(name));
  const fieldTags = tags.filter((name) => ["🎼작곡", "🎵작사/작곡"].includes(name));
  const titleAndBody = [detail.article?.title, detail.description, detail.article?.body].join(" ").toLowerCase();
  const positiveHits = countKeywordHits(titleAndBody, PRIORITY_KEYWORDS);
  const negativeHits = countKeywordHits(titleAndBody, NEGATIVE_KEYWORDS);
  const creatorSignal = countKeywordHits(titleAndBody, CREATOR_KEYWORDS) > 0;
  const competitionSignal = countKeywordHits(titleAndBody, CONTEST_KEYWORDS) > 0;
  const score = scoreOpportunity(detail);
  return (
    negativeHits === 0 &&
    creatorSignal &&
    competitionSignal &&
    (typeTags.length > 0 || fieldTags.length > 0) &&
    positiveHits >= 2 &&
    score >= 5
  );
}

function pickId(detail) {
  for (const rule of ID_OVERRIDES) {
    if (rule.match.test(detail.article?.title || "")) return rule.id;
  }
  return `grounz-${detail.id}`;
}

function summarize(detail) {
  const base = normalizeText(detail.description || detail.article?.body || "");
  if (!base) return "GROUNZ 공고 상세 확인 필요";
  return base.slice(0, 180);
}

function buildPreparation(detail) {
  const body = normalizeText(detail.article?.body || detail.description || "").toLowerCase();
  const tasks = [];

  if (body.includes("mp3") || body.includes("음원")) tasks.push("대표 자작곡 음원 정리");
  if (body.includes("유튜브") || body.includes("영상") || body.includes("실연")) tasks.push("라이브/실연 영상 링크 준비");
  if (body.includes("구글폼") || body.includes("홈페이지") || body.includes("온라인 접수")) {
    tasks.push("지원 폼과 제출 링크 다시 확인");
  }
  if (body.includes("포트폴리오") || body.includes("소개")) tasks.push("아티스트 소개 문장 점검");

  if (tasks.length === 0) return "지원 자격, 제출물, 마감일 다시 확인";
  return tasks.slice(0, 3).join(", ");
}

function buildFit(detail) {
  const score = scoreOpportunity(detail);
  if (score >= 8) return { label: "아주 잘 맞음", score: 5 };
  if (score >= 5) return { label: "잘 맞음", score: 4 };
  if (score >= 3) return { label: "확인 필요", score: 3 };
  return { label: "낮음", score: 2 };
}

async function fetchJson(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

async function collectCandidates() {
  const rows = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await fetchJson("/announcement", {
      where: "ANNOUNCEMENT_IN_PROGRESS",
      order: "LATEST",
      amount: PAGE_SIZE,
      page,
      type: 0,
    });

    rows.push(...(payload.rows || []));
    if (!payload.rows?.length || page >= (payload.lastPage || page)) break;
  }
  return rows;
}

async function buildOpportunities() {
  const candidates = await collectCandidates();
  const detailed = [];

  for (const candidate of candidates) {
    const detail = await fetchJson(`/announcement/${candidate.id}`);
    if (!isSingerSongwriterFit(detail)) continue;

    const deadline = isoDate(detail.endDate);
    const fit = buildFit(detail);
    detailed.push({
      id: pickId(detail),
      sort_order: 100 + detailed.length * 10,
      title: detail.article?.title || `GROUNZ ${detail.id}`,
      host: detail.organization || "GROUNZ",
      application_open: isoDate(detail.startDate),
      deadline,
      status: statusFromDeadline(deadline),
      fit_label: fit.label,
      fit_score: fit.score,
      summary: summarize(detail),
      preparation: buildPreparation(detail),
      official_url: detail.link || `${GROUNZ_LIST_URL}`,
      source_note: `GROUNZ API 자동 수집 · 공고 ${detail.id}`,
      last_checked_at: new Date().toISOString(),
    });
  }

  return detailed
    .sort((left, right) => {
    if (right.fit_score !== left.fit_score) return right.fit_score - left.fit_score;
    if ((left.deadline || "") !== (right.deadline || "")) return (left.deadline || "").localeCompare(right.deadline || "");
    return left.title.localeCompare(right.title, "ko");
    })
    .map((item, index) => ({
      ...item,
      sort_order: 100 + index * 10,
      official_url: item.official_url.startsWith("http") ? item.official_url : `https://${item.official_url}`,
    }));
}

function buildSql(opportunities) {
  const ids = opportunities.map((item) => item.id);
  const values = opportunities
    .map(
      (item) => `(
  ${toSqlString(item.id)},
  ${toSqlNumber(item.sort_order)},
  ${toSqlString(item.title)},
  ${toSqlString(item.host)},
  ${toSqlDate(item.application_open)},
  ${toSqlDate(item.deadline)},
  ${toSqlString(item.status)},
  ${toSqlString(item.fit_label)},
  ${toSqlNumber(item.fit_score)},
  ${toSqlString(item.summary)},
  ${toSqlString(item.preparation)},
  ${toSqlString(item.official_url)},
  ${toSqlString(item.source_note)},
  ${toSqlString(item.last_checked_at)}
)`
    )
    .join(",\n");

  const idList = ids.length ? ids.map((id) => toSqlString(id)).join(", ") : "null";

  return `begin;

insert into public.singer_songwriter_opportunities (
  id,
  sort_order,
  title,
  host,
  application_open,
  deadline,
  status,
  fit_label,
  fit_score,
  summary,
  preparation,
  official_url,
  source_note,
  last_checked_at
)
values
${values}
on conflict (id) do update
set
  sort_order = excluded.sort_order,
  title = excluded.title,
  host = excluded.host,
  application_open = excluded.application_open,
  deadline = excluded.deadline,
  status = excluded.status,
  fit_label = excluded.fit_label,
  fit_score = excluded.fit_score,
  summary = excluded.summary,
  preparation = excluded.preparation,
  official_url = excluded.official_url,
  source_note = excluded.source_note,
  last_checked_at = excluded.last_checked_at;

update public.singer_songwriter_opportunities
set
  status = 'closed',
  source_note = 'GROUNZ API 자동 수집 · 이번 점검 목록에서 제외됨',
  last_checked_at = timezone('utc'::text, now())
where id like 'grounz-%'
  and id not in (${idList});

commit;
`;
}

const options = parseArgs(process.argv.slice(2));
const opportunities = await buildOpportunities();

if (options.format === "json") {
  process.stdout.write(`${JSON.stringify(opportunities, null, 2)}\n`);
} else {
  process.stdout.write(buildSql(opportunities));
}
