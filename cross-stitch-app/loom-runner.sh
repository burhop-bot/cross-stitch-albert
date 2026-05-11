#!/bin/bash
# Loom Agent Runner - Cron-friendly execution

set -e

PROJECT_DIR="/sandbox/.openclaw-data/workspace/cross-stitch-app"
LOOM_MONITOR="/sandbox/.openclaw-data/workspace/loom/monitoring/health_check.py"
LOOM_AGENT="$PROJECT_DIR/loom-agent.js"

echo "Starting Loom Agent run at $(date -u)"

# Run health check
echo "Running health checks..."
python3 "$LOOM_MONITOR" > /tmp/loom-health-report.json 2>&1

# Run the Loom agent
echo "Running Loom agent..."
node "$LOOM_AGENT" > /tmp/loom-agent-output.log 2>&1 || true

# Save final status
echo "Run completed at $(date -u)"
