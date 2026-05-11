#!/usr/bin/env bash
# Cross-Stitch E2E Test Runner — deterministic cron execution
#
# SPECIFIC FILES:
#   Script:    scripts/run-tests.sh
#   Engine:    test-engine.py (Python test-fix loop)
#   Config:    playwright.config.ts (projects: smoke, full)
#   Results:   test-results-engine.json (summary)
#   Logs:      test-logs/engine-YYYYMMDD-HHMMSS.log
#   Tracker:   .test-batch-tracker.json (batch state)
#   Server:    port 5556 (vite dev)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
LOG_FILE="${SCRIPT_DIR}/test-logs/engine-${TIMESTAMP}.log"

mkdir -p "${SCRIPT_DIR}/test-logs"

exec > "${LOG_FILE}" 2>&1

echo "[$TIMESTAMP] === CROSS-STITCH E2E TEST RUN START ==="
echo "Working dir: ${SCRIPT_DIR}"
echo "Log file: ${LOG_FILE}"
echo "Results file: ${SCRIPT_DIR}/test-results-engine.json"
echo ""

# Step 1: Kill stale vite on port 5556
echo "[$(date -u +%H:%M:%S)] Killing stale vite server on port 5556..."
if ss -tlnp 2>/dev/null | grep -q ':5556 '; then
    fuser -k 5556/tcp 2>/dev/null || true
    echo "  Killed stale server"
else
    echo "  No stale server found"
fi
sleep 1

# Step 2: Run test engine (batch mode — fixes 2 failing test files per run)
echo ""
echo "[$(date -u +%H:%M:%S)] Starting test-engine.py (batch-size=2, max-seconds=900)..."
cd "${SCRIPT_DIR}"
timeout 960 python3 test-engine.py --iterations 2 --max-seconds 900 --batch-size 2

EXIT_CODE=$?

echo ""
echo "[$(date -u +%H:%M:%S)] === TEST RUN END (exit=$EXIT_CODE) ==="

# Step 3: Print summary from results file
if [ -f "${SCRIPT_DIR}/test-results-engine.json" ]; then
    echo ""
    echo "--- RESULTS SUMMARY ---"
    python3 -c "
import json
with open('${SCRIPT_DIR}/test-results-engine.json') as f:
    d = json.load(f)
s = d.get('summary', {})
print(f\"Total tests: {s.get('total', 0)}\")
print(f\"Passed:      {s.get('passed', 0)}\")
print(f\"Failed:      {s.get('failed', 0)}\")
print(f\"Skipped:     {s.get('skipped', 0)}\")
print(f\"Status:      {d.get('finalStatus', 'unknown')}\")
print(f\"Timestamp:   {d.get('timestamp', 'N/A')}\")
"
    echo "--- END SUMMARY ---"
fi

exit $EXIT_CODE
