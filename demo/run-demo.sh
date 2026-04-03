#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo
echo "== agent-guard demo =="
echo

npm run build >/dev/null 2>&1
npm run demo:prepare >/dev/null

echo "1. Claude Code hook payload -> normalized event -> policy decision"
node adapters/claude-code/normalize-event.mjs \
  examples/adapters/claude-code-hook.json \
  demo/generated/events/claude-code-dangerous.json >/dev/null
node dist/src/cli/main.js eval \
  --rules presets/baseline.yml \
  --input demo/generated/events/claude-code-dangerous.json \
  --format pretty || true

echo
echo "2. Codex wrapper payload -> normalized event -> policy decision"
node adapters/codex/normalize-event.mjs \
  examples/adapters/codex-wrapper-event.json \
  demo/generated/events/codex-dangerous.json >/dev/null
node dist/src/cli/main.js eval \
  --rules presets/baseline.yml \
  --input demo/generated/events/codex-dangerous.json \
  --format pretty || true

echo
echo "3. Safe local command -> allow"
node dist/src/cli/main.js eval \
  --rules presets/baseline.yml \
  --input test/fixtures/allow-event.json \
  --format pretty

echo
echo "4. Release-grade Action bundle -> same decision contract"
INPUT_RULES=presets/baseline.yml \
INPUT_INPUT=test/fixtures/allow-event.json \
INPUT_FAIL_ON_WARN=false \
node dist/action/index.cjs
