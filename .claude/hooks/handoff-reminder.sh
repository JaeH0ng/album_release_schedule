#!/usr/bin/env bash
# Stop 훅: 이번 세션에서 코드/문서를 바꿨는데 docs/HANDOFF_FOR_CODEX.md를
# 아직 갱신하지 않았다면, 마치기 전에 핸드오프 로그를 추가하도록 한 번 알린다.
#
# 자가-해제 조건: HANDOFF_FOR_CODEX.md를 건드리는 순간(작업 트리에 변경이 생기면)
# 조건이 거짓이 되어 더 이상 막지 않는다. 변경이 없는 대화형 turn에서는 발동하지 않는다.
set -uo pipefail

input=$(cat 2>/dev/null || true)

# 무한 루프 방지: 이미 이 Stop 체인에서 한 번 막았다면 그대로 종료를 허용한다.
if printf '%s' "$input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  exit 0
fi

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0

status=$(git status --porcelain 2>/dev/null)
[ -z "$status" ] && exit 0

# 핸드오프 문서 자체의 변경 여부
handoff=$(printf '%s\n' "$status" | grep -E 'docs/HANDOFF_FOR_CODEX\.md' || true)
# 핸드오프 문서, .claude/ 설정, 빌드 산출물(node_modules·dist)을 제외한
# 나머지(=문서화 대상) 변경 여부
other=$(printf '%s\n' "$status" \
  | grep -vE 'docs/HANDOFF_FOR_CODEX\.md' \
  | grep -vE '(^|/)\.claude/' \
  | grep -vE '(^|/)(node_modules|dist)/' || true)

if [ -n "$other" ] && [ -z "$handoff" ]; then
  reason='이번 세션에서 코드/문서를 변경했지만 docs/HANDOFF_FOR_CODEX.md를 아직 갱신하지 않았습니다. 마치기 전에 이 세션의 변경(무엇을/왜, 바꾼 파일, 커밋·배포 여부, 코덱스가 알아야 할 점)을 담은 새 항목을 docs/HANDOFF_FOR_CODEX.md 변경 로그 맨 위에 추가하세요. 변경이 사소해 기록이 불필요하면 그대로 종료해도 됩니다.'
  jq -nc --arg r "$reason" '{decision:"block", reason:$r}'
fi
exit 0
