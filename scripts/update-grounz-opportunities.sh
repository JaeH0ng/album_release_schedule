#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
TMP_SQL="$(mktemp)"
trap 'rm -f "${TMP_SQL}"' EXIT

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"

cd "${ROOT_DIR}"

node scripts/build-grounz-opportunities-sql.mjs > "${TMP_SQL}"

supabase login --token "${SUPABASE_ACCESS_TOKEN}" >/dev/null
supabase link --project-ref "${SUPABASE_PROJECT_REF}" --password "${SUPABASE_DB_PASSWORD}" >/dev/null
supabase db query --linked --file "${TMP_SQL}"
