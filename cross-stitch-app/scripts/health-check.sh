#!/usr/bin/env bash
# Cross-Stitch E2E Health Check — deterministic cron execution
#
# SPECIFIC FILES:
#   Script:    scripts/health-check.sh
#   Results:   test-results-engine.json (read for freshness + status)
#   Logs:      test-logs/engine-*.log (most recent log)
#   Tracker:   .test-batch-tracker.json (optional — batch state)
#   Server:    port 5556 (vite dev — should be running)
#   Log:       test-logs/health-check.log

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RESULTS_FILE="${SCRIPT_DIR}/test-results-engine.json"
HEARTBEAT_LOG="${SCRIPT_DIR}/test-logs/health-check.log"
LOG_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p "${SCRIPT_DIR}/test-logs"

{
echo "[${LOG_TIMESTAMP}] === HEALTH CHECK START ==="
echo "Results file: ${RESULTS_FILE}"

# Check 1: Vite server on port 5556
echo ""
echo "--- CHECK 1: Vite server (port 5556) ---"
if ss -tlnp 2>/dev/null | grep -q ':5556 '; then
    echo "OK: Vite running on port 5556"
else
    echo "FAIL: Vite NOT running on port 5556"
    echo "ACTION: Test engine cannot run without server"
fi

# Check 2: Results file exists and is fresh
echo ""
echo "--- CHECK 2: Results file freshness ---"
if [ -f "${RESULTS_FILE}" ]; then
    echo "OK: File exists: ${RESULTS_FILE}"
    
    python3 -c "
import json, sys
from datetime import datetime, timezone

with open(sys.argv[1]) as f:
    d = json.load(f)

ts_str = d.get('timestamp', '')
try:
    ts = datetime.fromisoformat(ts_str)
    age_hours = (datetime.now(timezone.utc) - ts).total_seconds() / 3600
    print('  Last run: ' + ts_str)
    print('  Age: %.1f hours' % age_hours)
    
    s = d.get('summary', {})
    total = s.get('total', '?')
    passed = s.get('passed', '?')
    failed = s.get('failed', '?')
    print('  Total: %s  Passed: %s  Failed: %s' % (total, passed, failed))
    print('  Status: %s' % d.get('finalStatus', '?'))
    
    if age_hours > 3:
        print('  DECISION: STALE — restart needed (>3h)')
        sys.exit(1)
    elif failed > 0 and failed != '?':
        print('  DECISION: FAILING — verify engine is still running')
        sys.exit(2)
    else:
        print('  DECISION: OK — results fresh')
        sys.exit(0)
except Exception as e:
    print('  ERROR parsing: %s' % e)
    print('  DECISION: STALE — restart needed (parse error)')
    sys.exit(1)
" "${RESULTS_FILE}" 2>&1
    CHECK=$?
    
    if [ $CHECK -eq 1 ]; then
        echo ""
        echo "ACTION: Restart test engine (stale results)"
        echo "  Command: bash scripts/run-tests.sh"
        exit 1
    elif [ $CHECK -eq 2 ]; then
        echo ""
        echo "ACTION: Tests failing — verify engine is still running"
        echo "  Check logs: test-logs/engine-*.log"
        exit 2
    else
        echo ""
        echo "No action needed"
        exit 0
    fi
else
    echo "FAIL: File missing: ${RESULTS_FILE}"
    echo "ACTION: Restart test engine (no results)"
    exit 1
fi

} 2>&1 | tee -a "${HEARTBEAT_LOG}"
