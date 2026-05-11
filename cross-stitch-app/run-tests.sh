#!/bin/bash
# Comprehensive test runner: counts ALL tests (unit + e2e), runs them, logs results.
# Designed to be run hourly via cron.

set -euo pipefail

PROJECT_DIR="/sandbox/.openclaw/workspace/cross-stitch-app"
LOG_DIR="/sandbox/.openclaw/workspace/cross-stitch-app/test-logs"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DATE_DIR="${LOG_DIR}/$(date -u +%Y-%m-%d)"
LOG_FILE="${DATE_DIR}/$(date -u +%Y%m%d-%H%M%S).log"
SUMMARY_FILE="${DATE_DIR}/summary.md"

mkdir -p "${LOG_DIR}" "${DATE_DIR}"

echo "========================================" | tee "${LOG_FILE}"
echo " Test Run: ${TIMESTAMP}" | tee -a "${LOG_FILE}"
echo "========================================" | tee -a "${LOG_FILE}"

# ─── COUNT ALL TESTS ─────────────────────────────────────────────

# Unit tests (Vitest)
UNIT_COUNT=$(grep -rhP '^\s*(it|test)\s*\(' "${PROJECT_DIR}/src/utils/__tests__"/*.test.ts 2>/dev/null | wc -l || echo 0)

# E2E tests (Playwright) — count all it()/test() calls across all spec files
E2E_COUNT=$(grep -rhP '^\s*(it|test)\s*\(' "${PROJECT_DIR}/tests/e2e"/*.spec.ts 2>/dev/null | wc -l || echo 0)

TOTAL_COUNT=$((UNIT_COUNT + E2E_COUNT))

echo "" | tee -a "${LOG_FILE}"
echo "TEST COUNTS (from source analysis):" | tee -a "${LOG_FILE}"
echo "  Unit tests (Vitest):    ${UNIT_COUNT}" | tee -a "${LOG_FILE}"
echo "  E2E tests (Playwright): ${E2E_COUNT}" | tee -a "${LOG_FILE}"
echo "  TOTAL:                  ${TOTAL_COUNT}" | tee -a "${LOG_FILE}"

# ─── RUN UNIT TESTS ──────────────────────────────────────────────
echo "" | tee -a "${LOG_FILE}"
echo "────────────────────────────────────────" | tee -a "${LOG_FILE}"
echo "RUNNING UNIT TESTS..." | tee -a "${LOG_FILE}"
echo "────────────────────────────────────────" | tee -a "${LOG_FILE}"

cd "${PROJECT_DIR}"
UNIT_RESULT=$(npx vitest run 2>&1) || true
UNIT_EXIT=${PIPESTATUS[0]:-$?}

# Strip ANSI codes for parsing
UNIT_CLEAN=$(echo "${UNIT_RESULT}" | sed 's/\x1b\[[0-9;]*m//g')
UNIT_PASSED=$(echo "${UNIT_CLEAN}" | grep -oP 'Tests\s+(\d+)\s+passed' | grep -oP '\d+' | tail -1 || echo "0")
UNIT_FAIL_COUNT=$(echo "${UNIT_CLEAN}" | grep -oP 'failed' || echo "0")
UNIT_FAIL_COUNT=$(echo "${UNIT_FAIL_COUNT}" | wc -l)
if echo "${UNIT_CLEAN}" | grep -qP 'Tests\s+\d+\s+failed'; then
    UNIT_FAIL_COUNT=$(echo "${UNIT_CLEAN}" | grep -oP 'Tests\s+(\d+)\s+failed' | grep -oP '\d+' | tail -1)
else
    UNIT_FAIL_COUNT=0
fi
if [ -z "${UNIT_PASSED}" ]; then UNIT_PASSED=0; fi

echo "${UNIT_RESULT}" >> "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
echo "Unit results: ${UNIT_PASSED} passed, ${UNIT_FAIL_COUNT} failed" | tee -a "${LOG_FILE}"

# ─── RUN E2E TESTS (smoke subset for speed, or full) ────────────
echo "" | tee -a "${LOG_FILE}"
echo "────────────────────────────────────────" | tee -a "${LOG_FILE}"
echo "RUNNING E2E TESTS (smoke subset)..." | tee -a "${LOG_FILE}"
echo "────────────────────────────────────────" | tee -a "${LOG_FILE}"

# Check if server is running on expected port
SERVER_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5556 2>/dev/null || echo "000")
if [ "${SERVER_OK}" != "200" ]; then
    echo "⚠️  Preview server not responding on :5556 — starting..." | tee -a "${LOG_FILE}"
    # Kill any existing preview
    lsof -ti:5556 | xargs kill -9 2>/dev/null || true
    npx vite preview --port 5556 --host 0.0.0.0 > /dev/null 2>&1 &
    sleep 3
fi

cd "${PROJECT_DIR}"
E2E_RESULT=$(npx playwright test --grep "@smoke" --timeout=30000 2>&1) || true

E2E_PASSED=$(echo "${E2E_RESULT}" | grep -oP '\d+(?=\s+passed)' | tail -1 || echo "0")
E2E_FAILED=$(echo "${E2E_RESULT}" | grep -oP '\d+(?=\s+failed)' | tail -1 || echo "0")

echo "${E2E_RESULT}" >> "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
echo "E2E results: ${E2E_PASSED} passed, ${E2E_FAILED} failed" | tee -a "${LOG_FILE}"

# ─── OVERALL SUMMARY ────────────────────────────────────────────
echo "" | tee -a "${LOG_FILE}"
echo "========================================" | tee -a "${LOG_FILE}"
echo " OVERALL SUMMARY" | tee -a "${LOG_FILE}"
echo "========================================" | tee -a "${LOG_FILE}"

TOTAL_PASSED=$((UNIT_PASSED + E2E_PASSED))
TOTAL_FAILED=$((UNIT_FAIL_COUNT + E2E_FAILED))
TOTAL_NOT_RUN=$((TOTAL_COUNT - TOTAL_PASSED - TOTAL_FAILED))

echo "  Total tests in codebase: ${TOTAL_COUNT}" | tee -a "${LOG_FILE}"
echo "  Passed:                  ${TOTAL_PASSED}" | tee -a "${LOG_FILE}"
echo "  Failed:                  ${TOTAL_FAILED}" | tee -a "${LOG_FILE}"
echo "  Not run (smoke subset):  ${TOTAL_NOT_RUN}" | tee -a "${LOG_FILE}"
echo "  Pass rate:               $(( TOTAL_PASSED * 100 / (TOTAL_PASSED + TOTAL_FAILED > 0 ? TOTAL_PASSED + TOTAL_FAILED : 1) ))%" | tee -a "${LOG_FILE}"

# ─── UPDATE LATEST SUMMARY ──────────────────────────────────────
cat > "${SUMMARY_FILE}" << EOF
# Test Status — Updated ${TIMESTAMP}

| Metric | Count |
|--------|-------|
| Total tests (codebase) | ${TOTAL_COUNT} |
| Passed | ${TOTAL_PASSED} |
| Failed | ${TOTAL_FAILED} |
| Not run (smoke subset) | ${TOTAL_NOT_RUN} |
| Pass rate | $(( TOTAL_PASSED * 100 / (TOTAL_PASSED + TOTAL_FAILED > 0 ? TOTAL_PASSED + TOTAL_FAILED : 1) ))% |

**Run time:** ${TIMESTAMP}
**Unit tests:** ${UNIT_COUNT} | **E2E tests:** ${E2E_COUNT}
**Unit passed:** ${UNIT_PASSED} | **Unit failed:** ${UNIT_FAIL_COUNT}
**E2E passed:** ${E2E_PASSED} | **E2E failed:** ${E2E_FAILED}

---
Full log: [${LOG_FILE}](${LOG_FILE})
EOF

echo "" | tee -a "${LOG_FILE}"
echo "Summary saved to: ${SUMMARY_FILE}" | tee -a "${LOG_FILE}"
echo "Log saved to: ${LOG_FILE}" | tee -a "${LOG_FILE}"
echo "Done." | tee -a "${LOG_FILE}"
