// 일정/곡 단일 소스(schedule-data.js)에서 Supabase 반영용 SQL을 생성해 stdout으로 출력한다.
// 공모전(build-grounz-opportunities-sql.mjs)과 동일한 "JS 원본 → SQL 생성 → db query 적용" 패턴.
// 사용: node scripts/build-schedule-sql.mjs > out.sql  (또는 npm run schedule:sync)
import { defaultEvents, defaultTracks } from "../schedule-data.js";

function sqlValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

const EVENT_COLUMNS = [
  "id",
  "sort_order",
  "date",
  '"end"',
  "title",
  "phase",
  "duration",
  "result",
  "detail",
  "track",
  "document",
  "lyrics",
  "milestone",
];

const TRACK_COLUMNS = ["number", "sort_order", "title", "due", "event_id", "document", "lyrics"];

function eventValues(event) {
  return `  (${[
    sqlValue(event.id),
    sqlValue(event.sortOrder ?? null),
    sqlValue(event.date),
    sqlValue(event.end ?? null),
    sqlValue(event.title),
    sqlValue(event.phase),
    sqlValue(event.duration),
    sqlValue(event.result),
    sqlValue(event.detail),
    sqlValue(event.track ?? null),
    sqlValue(event.document ?? null),
    sqlValue(event.lyrics ?? null),
    sqlValue(Boolean(event.milestone)),
  ].join(", ")})`;
}

function trackValues(track) {
  return `  (${[
    sqlValue(track.number),
    sqlValue(track.sortOrder ?? null),
    sqlValue(track.title),
    sqlValue(track.due),
    sqlValue(track.eventId),
    sqlValue(track.document),
    sqlValue(track.lyrics),
  ].join(", ")})`;
}

const eventIdList = defaultEvents.map((event) => sqlValue(event.id)).join(", ");
const trackNumberList = defaultTracks.map((track) => sqlValue(track.number)).join(", ");

const output = `-- AUTO-GENERATED from schedule-data.js by scripts/build-schedule-sql.mjs.
-- 직접 편집하지 말 것. 일정/곡을 바꾸려면 schedule-data.js를 고치고 npm run schedule:sync 를 실행한다.
-- 안정적인 id/number를 upsert로 유지하고(개인 체크 상태 보존), 원본에서 사라진 항목만 정리한다.

begin;

insert into public.album_events (${EVENT_COLUMNS.join(", ")})
values
${defaultEvents.map(eventValues).join(",\n")}
on conflict (id) do update set
  sort_order = excluded.sort_order,
  date = excluded.date,
  "end" = excluded."end",
  title = excluded.title,
  phase = excluded.phase,
  duration = excluded.duration,
  result = excluded.result,
  detail = excluded.detail,
  track = excluded.track,
  document = excluded.document,
  lyrics = excluded.lyrics,
  milestone = excluded.milestone;

insert into public.album_tracks (${TRACK_COLUMNS.join(", ")})
values
${defaultTracks.map(trackValues).join(",\n")}
on conflict (number) do update set
  sort_order = excluded.sort_order,
  title = excluded.title,
  due = excluded.due,
  event_id = excluded.event_id,
  document = excluded.document,
  lyrics = excluded.lyrics;

-- 원본에서 제거된 항목 정리(트랙 먼저: album_tracks.event_id 가 album_events(id) 를 FK 참조).
delete from public.album_tracks where number not in (${trackNumberList});
delete from public.album_events where id not in (${eventIdList});

commit;
`;

process.stdout.write(output);
