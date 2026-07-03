// Supabase CLI 실행 공용 헬퍼 (크로스플랫폼).
// bash `.sh` 대신 Node로 실행해 Windows PowerShell에서도 npm 스크립트가 동작하게 한다.
// 비밀값(액세스 토큰·DB 비번)은 명령 인자가 아니라 child 프로세스 env로만 전달한다
// (Supabase CLI가 SUPABASE_ACCESS_TOKEN / SUPABASE_DB_PASSWORD 를 자동 사용 → 셸 인용 문제 회피).
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

// .env.local 을 파싱한다(bash `source`와 동등한 최소 구현). KEY=VALUE, # 주석/빈 줄 무시.
export function loadEnvLocal(rootDir) {
  const envPath = path.join(rootDir, ".env.local");
  const values = {};
  if (!existsSync(envPath)) return values;
  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

// 필요한 3개 값을 확보하고, child 프로세스에 넘길 env를 만든다. 없으면 명확히 안내 후 종료.
export function requireSupabaseEnv(rootDir) {
  const fromFile = loadEnvLocal(rootDir);
  const pick = (key) => process.env[key] || fromFile[key];
  const accessToken = pick("SUPABASE_ACCESS_TOKEN");
  const dbPassword = pick("SUPABASE_DB_PASSWORD");
  const projectRef = pick("SUPABASE_PROJECT_REF");

  const missing = [];
  if (!accessToken) missing.push("SUPABASE_ACCESS_TOKEN");
  if (!dbPassword) missing.push("SUPABASE_DB_PASSWORD");
  if (!projectRef) missing.push("SUPABASE_PROJECT_REF");
  if (missing.length > 0) {
    console.error(`[supabase] 필요한 값이 없습니다: ${missing.join(", ")}`);
    console.error("  .env.local 을 만들고 값을 채우세요:  cp .env.example .env.local");
    process.exit(1);
  }

  const childEnv = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_DB_PASSWORD: dbPassword,
    SUPABASE_PROJECT_REF: projectRef,
  };
  return { accessToken, dbPassword, projectRef, childEnv };
}

// supabase CLI 실행. shell:true 로 Windows 셔임(.exe/.cmd)·POSIX 바이너리를 모두 처리한다.
// 명령 문자열에는 비밀값을 넣지 않는다(projectRef는 영숫자, 파일 경로는 따옴표로 감쌈).
export function supabaseCmd(commandString, childEnv) {
  const result = spawnSync(commandString, {
    stdio: "inherit",
    env: childEnv,
    shell: true,
  });
  if (result.error) {
    console.error(`[supabase] 실행 실패: ${result.error.message}`);
    console.error("  Supabase CLI가 설치돼 PATH에 있는지 확인하세요. (scoop install supabase 등)");
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

// 생성기 스크립트(stdout=SQL)를 실행해 임시 파일로 저장하고 `db query`로 원격에 적용한다.
export function applyGeneratedSql(rootDir, generatorRelPath, label) {
  const { projectRef, childEnv } = requireSupabaseEnv(rootDir);

  const gen = spawnSync(process.execPath, [path.join(rootDir, generatorRelPath)], {
    cwd: rootDir,
    encoding: "utf8",
    env: process.env,
  });
  if (gen.status !== 0 || !gen.stdout) {
    console.error(`[${label}] SQL 생성 실패 (${generatorRelPath})`);
    if (gen.stderr) console.error(gen.stderr);
    process.exit(gen.status || 1);
  }

  const tmpPath = path.join(os.tmpdir(), `album-${label}-${process.pid}.sql`);
  writeFileSync(tmpPath, gen.stdout, "utf8");
  try {
    supabaseCmd(`supabase link --project-ref ${projectRef}`, childEnv);
    supabaseCmd(`supabase db query --linked --file "${tmpPath}"`, childEnv);
    console.log(`[${label}] 적용 완료`);
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // 임시 파일 정리 실패는 무시.
    }
  }
}
