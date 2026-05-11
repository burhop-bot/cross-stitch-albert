#!/bin/bash
# Fixed test runner - heredoc variable expansion patched

set -euo pipefail

PROJECT_DIR="/sandbox/.openclaw/workspace/cross-stitch-app"
STATUS_FILE="${PROJECT_DIR}/test-status.json"
GROUPS_FILE="${PROJECT_DIR}/test-groups.json"
LOG_DIR="${PROJECT_DIR}/test-logs"

mkdir -p "${LOG_DIR}"

kill_stale_processes() {
    fuser -k 5556/tcp 2>/dev/null || true
    pkill -f "vite preview" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
    pkill -f "node.*playwright" 2>/dev/null || true
    sleep 1
}

run_group() {
    local group="$1"
    echo "🦞 Running group: ${group}"
    echo "========================================"
    kill_stale_processes

    local pattern
    pattern=$(python3 -c "import json; data=json.load(open('${GROUPS_FILE}')); g=[x for x in data['groups'] if x['id']=='${group}'][0]; print(g['pattern'])" 2>/dev/null)
    if [ -z "${pattern}" ]; then
        echo "❌ Group '${group}' not found"
        exit 1
    fi

    local test_files=""
    IFS=',' read -ra PATTERNS <<< "${pattern}"
    for p in "${PATTERNS[@]}"; do
        p=$(echo "${p}" | xargs)
        [ -n "${p}" ] && test_files="${test_files}$(cd "${PROJECT_DIR}" && find tests/e2e -name "${p}" -type f 2>/dev/null | sed "s|${PROJECT_DIR}/||" | tr '\n' ' ')"
    done

    if [ -z "${test_files}" ]; then
        echo "❌ No test files for: ${pattern}"
        exit 1
    fi

    echo "🦞 Running: ${test_files}"
    local log_file="${LOG_DIR}/${group}-$(date +%Y%m%d-%H%M%S).log"
    cd "${PROJECT_DIR}"
    npx playwright test ${test_files} --timeout=30000 > "${log_file}" 2>&1 || true
    kill_stale_processes

    local passed=$(grep -oP '\d+(?= passed)' "${log_file}" | tail -1 || echo "0")
    local failed=$(grep -oP '\d+(?= failed)' "${log_file}" | tail -1 || echo "0")
    local total=$((passed + failed))

    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H%M:%SZ)
    python3 << PYEOF
import json
with open('${STATUS_FILE}', 'r') as f:
    status = json.load(f)
status['results']['${group}'] = {
    'status': 'complete', 'total': ${total}, 'passed': ${passed}, 'failed': ${failed}, 'timestamp': '${timestamp}'
}
if '${group}' not in status['completedGroups']:
    status['completedGroups'].append('${group}')
tp = sum(r.get('passed', 0) for r in status['results'].values())
tf = sum(r.get('failed', 0) for r in status['results'].values())
status['overall'] = {'total': tp+tf, 'passed': tp, 'failed': tf, 'notRun': sum(1 for g in status['allGroups'] if g not in status['completedGroups'])}
with open('${STATUS_FILE}', 'w') as f:
    json.dump(status, f, indent=2)
PYEOF
    echo "✅ Group '${group}': ${passed} passed, ${failed} failed"
}

run_all() {
    echo "🦞 Starting full test run"
    echo "========================================"

    RUN_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    START_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    python3 -c "
import json
status = {
    'runId': 'run-${RUN_TIMESTAMP}',
    'startTime': '${START_ISO}',
    'currentGroup': '',
    'completedGroups': [],
    'allGroups': [],
    'results': {},
    'fixBugsRun': False,
    'maxFixIterations': 3,
    'currentFixIteration': 0,
    'overall': {'total': 0, 'passed': 0, 'failed': 0, 'notRun': 0}
}
with open('${STATUS_FILE}', 'w') as f:
    json.dump(status, f, indent=2)
"

    local groups
    groups=($(python3 -c "import json; data=json.load(open('${GROUPS_FILE}')); print(' '.join([g['id'] for g in data['groups']]))" 2>/dev/null))

    local group_arr="["
    for i in "${!groups[@]}"; do
        [ "$i" -gt 0 ] && group_arr+=","
        group_arr+="\"${groups[$i]}\""
    done
    group_arr+="]"
    python3 -c "
import json
with open('${STATUS_FILE}', 'r') as f:
    s = json.load(f)
s['allGroups'] = ${group_arr}
with open('${STATUS_FILE}', 'w') as f:
    json.dump(s, f, indent=2)
"

    for group in "${groups[@]}"; do
        echo ""
        run_group "${group}"
        echo "========================================"
    done
    echo "🦞 All groups complete!"
}

summary() {
    if [ ! -f "${STATUS_FILE}" ]; then
        echo "No status file. Run 'test-runner.sh run-all' first."
        exit 1
    fi
    cat "${STATUS_FILE}" | python3 -m json.tool
}

case "${1:-}" in
    run-all) run_all ;;
    run-group) [ -n "${2:-}" ] && run_group "${2}" || { echo "❌ Need group name"; exit 1; } ;;
    summary) summary ;;
    *) echo "Usage: $0 {run-all|run-group <group>|summary}"; exit 1 ;;
esac
