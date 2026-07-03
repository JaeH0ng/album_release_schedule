// GROUNZ 공고 기반 싱어송라이터 공모전 후보 SQL을 생성해 원격에 반영한다.
// 크로스플랫폼: Windows PowerShell에서도 `npm run opportunities:grounz` 로 동작한다.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyGeneratedSql } from "./lib/supabase-run.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
applyGeneratedSql(rootDir, "scripts/build-grounz-opportunities-sql.mjs", "grounz");
