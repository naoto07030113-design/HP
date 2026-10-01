#!/bin/sh
# Headless checks for the Deskmate runner core (Foundation-only files), runnable on Linux or macOS.
#   ./run.sh unit                      → SafetyGuard / markers / verification plan tests
#   ./run.sh e2e <scenario> [claude]   → real claude CLI end to end
#        scenarios: build-fix | finish-loop | guard | needs-human   (Claude Code, CLAUDE_BIN)
#                   codex   (Codex: CODEX_BIN, CODEX_HOME whose config.toml points at a model —
#                            a logged-in Codex, or a local Responses-API mock)
# Needs a Swift 6 toolchain (`swift:6.0-noble` Docker image works) and, for e2e, a logged-in claude + python3.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HERE/../../NotchBuddy/Sources/App"
OUT="${OUT:-$HERE/.build}"; mkdir -p "$OUT"
CORE="$APP/TaskSession.swift $APP/TaskStore.swift $APP/SafetyGuard.swift $APP/ClaudeProcess.swift $APP/TaskVerifier.swift $APP/LocalTaskRunner.swift $APP/CodexSetup.swift $APP/CodexChat.swift"
case "$1" in
  unit)
    swiftc -swift-version 6 -strict-concurrency=complete -o "$OUT/unit" $CORE "$HERE/unit/main.swift"
    "$OUT/unit" ;;
  e2e)
    python3 "$HERE/extract_hook.py" "$APP/HookServer.swift" "$OUT/nb-hook.py"
    swiftc -swift-version 6 -strict-concurrency=complete -o "$OUT/e2e" $CORE "$HERE/e2e/main.swift"
    CLAUDE_BIN="${3:-$(command -v claude)}" "$OUT/e2e" "${2:-build-fix}" "$OUT" ;;
  *) echo "usage: $0 unit | e2e <scenario> [claude-path]"; exit 2 ;;
esac
