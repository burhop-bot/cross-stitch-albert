#!/bin/bash
# Cross-Stitch Studio Test Runner - with process cleanup
# Runs Playwright tests in groups, tracks status, manages process lifecycle

set -euo pipefail

PROJECT_DIR="/sandbox/.openclaw/workspace/cross-stitch-app"
STATUS_FILE="${PROJECT_DIR}/test-status.json"
GROUPS_FILE="${PROJECT_DIR}/test-groups.json"
LOG_DIR="${PROJECT_DIR}/test-logs"

mkdir -p "${LOG_DIR}"

# ─── Process Cleanup ────────────────────────────────────────────

# Kill stale processes to prevent accumulation
kill_stale_processes() {
    echo "🧹 Killing stale processes..."
    # Kill vite server on port 5556
    fuser -k 5556/tcp 2>/dev/null || true
    # Kill playwright/node processes we spawned
    pkill -f "vite preview" 2>/dev/null || true
    pkill -f "playwright.*test" 2>/dev/null || true
    pkill -f "node.*playwright" 2>/dev/null || true
    sleep 1
    echo "✅ Cleanup done"
}

# ─── Utility Functions ─────────────────────────────────────────

usage() {
    echo "Usage: $0 {run-all|run-group <group>|status|fix|summary}"
    exit 1
}

# ─── Main Commands ──────────────────────────────────────────────

run_group() {
    local group="$1"
    
    echo "🦞 Running group: ${group}"
    echo "========================================"
    
    # Kill stale processes BEFORE running tests
    kill_stale_processes
    
    # Read group pattern from test-groups.json
    local pattern=$(python3 -c "import json; data=json.load(open('${GROUPS_FILE}')); g=[x for x in data['groups'] if x['id']=='${group}'][0]; print(g['pattern'])" 2>/dev/null)
    
    if [ -z "${pattern}" ]; then
        echo "❌ Group '${group}' not found in test-groups.json"
        exit 1
    fi
    
    # Find matching files
    local test_files=""
    IFS=',' read -ra PATTERNS <<< "${pattern}"
    for p in "${PATTERNS[@]}"; do
        p=$(echo "${p}" | xargs)
        if [ -n "${p}" ]; then
            local files=$(cd "${PROJECT_DIR}" && find tests/e2e -name "${p}" -type f 2>/dev/null | sed "s|${PROJECT_DIR}/||" | tr '\n' ' ')
            test_files="${test_files}${files} "
        fi
    done
    
    if [ -z "${test_files}" ]; then
        echo "❌ No test files found for pattern: ${pattern}"
        exit 1
    fi
    
    echo "🦞 Running tests: ${test_files}"
    
    # Run tests and capture output
    local log_file="${LOG_DIR}/${group}-$(date +%Y%m%d-%H%M%S).log"
    cd "${PROJECT_DIR}"
    npx playwright test ${test_files} --timeout=30000 > "${log_file}" 2>&1 || true
    
    # Kill stale processes AFTER running tests
    kill_stale_processes
    
    # Parse results
    local passed=$(grep -oP '\d+(?= passed)' "${log_file}" | tail -1 || echo "0")
    local failed=$(grep -oP '\d+(?= failed)' "${log_file}" | tail -1 || echo "0")
    local total=$((passed + failed))
    
    # Update status file
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if [ -f "${STATUS_FILE}" ]; then
        python3 << PYEOF
import json
with open('${STATUS_FILE}', 'r') as f:
    status = json.load(f)

status['results']['${group}'] = {
    'status': 'complete',
    'total': ${total},
    'passed': ${passed},
    'failed': ${failed},
    'timestamp': '${timestamp}'
}

if '${group}' not in status['completedGroups']:
    status['completedGroups'].append('${group}')

total_pass = sum(r.get('passed', 0) for r in status['results'].values())
total_fail = sum(r.get('failed', 0) for r in status['results'].values())
status['overall'] = {
    'total': total_pass + total_fail,
    'passed': total_pass,
    'failed': total_fail,
    'notRun': sum(1 for g in status['allGroups'] if g not in status['completedGroups'])
}

with open('${STATUS_FILE}', 'w') as f:
    json.dump(status, f, indent=2)
PYEOF
    fi
    
    # Write update file for cron to send to Discord
    cat > "${LOG_DIR}/discord-update.md" << EOF
🦞 **Test Group: ${group}**

| Metric | Count |
|--------|-------|
| Total Tests | ${total} |
| Passed | ${passed} |
| Failed | ${failed} |
| Pass Rate | $(( (passed * 100) / (passed + failed) > 0 ? (passed * 100) / (passed + failed) : 0 ))% |

Updated: ${timestamp}
EOF
    
    echo ""
    echo "✅ Group '${group}' complete: ${passed} passed, ${failed} failed"
    echo "Log: ${log_file}"
}

run_all() {
    echo "🦞 Starting full test run"
    echo "========================================"
    
    # Initialize status
    python3 << 'PYEOF'
import json
status = {
    "runId": f"run-$(date +%Y%m%d-%H%M%S)",
    "startTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "currentGroup": "",
    "completedGroups": [],
    "allGroups": [],
    "results": {},
    "fixBugsRun": False,
    "maxFixIterations": 3,
    "currentFixIteration": 0,
    "overall": {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "notRun": 0
    }
}
with open('/sandbox/.openclaw/workspace/cross-stitch-app/test-status.json', 'w') as f:
    json.dump(status, f, indent=2)
PYEOF
    
    # Read all groups
    local groups=($(python3 -c "import json; data=json.load(open('${GROUPS_FILE}')); print(' '.join([g['id'] for g in data['groups']]))" 2>/dev/null))
    
    # Update status with all groups
    python3 -c "
import json
with open('${STATUS_FILE}', 'r') as f:
    status = json.load(f)
status['allGroups'] = ${groups[@]// /,}
with open('${STATUS_FILE}', 'w') as f:
    json.dump(status, f, indent=2)
"
    
    # Run each group sequentially
    for group in "${groups[@]}"; do
        echo ""
        run_group "${group}"
        echo "========================================"
    done
    
    echo ""
    echo "🦞 All groups complete!"
}

status() {
    if [ ! -f "${STATUS_FILE}" ]; then
        echo "No status file found. Run 'test-runner.sh run-all' first."
        exit 1
    fi
    
    cat "${STATUS_FILE}" | python3 -m json.tool
}

fix() {
    echo "🦞 Running bug fixer"
    echo "========================================"
    
    if [ ! -f "${STATUS_FILE}" ]; then
        echo "❌ No status file found. Run 'test-runner.sh run-all' first."
        exit 1
    fi
    
    # Run fix-bugs script
    if [ -f "${PROJECT_DIR}/fix-bugs.sh" ]; then
        bash "${PROJECT_DIR}/fix-bugs.sh"
    else
        echo "❌ fix-bugs.sh not found"
        exit 1
    fi
}

summary() {
    echo "🦞 Test Summary"
    echo "========================================"
    
    if [ ! -f "${STATUS_FILE}" ]; then
        echo "No status file found. Run 'test-runner.sh run-all' first."
        exit 1
    fi
    
    cat "${STATUS_FILE}" | python3 -m json.tool
}

# ─── Entry Point ─────────────────────────────────────────────────

case "${1:-}" in
    run-all)
        run_all
        ;;
    run-group)
        if [ -z "${2:-}" ]; then
            echo "❌ Please specify a group name"
            usage
        fi
        run_group "${2}"
        ;;
    status)
        status
        ;;
    fix)
        fix
        ;;
    summary)
        summary
        ;;
    *)
        usage
        ;;
esac
