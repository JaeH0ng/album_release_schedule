// 원격 Supabase에 스키마/마이그레이션을 반영한다(= supabase db push).
// 크로스플랫폼: Windows PowerShell에서도 `npm run supabase:sync` 로 동작한다.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireSupabaseEnv, supabaseCmd } from "./lib/supabase-run.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { projectRef, childEnv } = requireSupabaseEnv(rootDir);

supabaseCmd(`supabase link --project-ref ${projectRef}`, childEnv);
supabaseCmd(`supabase db push`, childEnv);
console.log("[supabase] db push 완료");
