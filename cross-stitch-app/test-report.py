#!/usr/bin/env python3
"""
Cross-Stitch Studio Test Reporter
Reads saved test results and posts a summary to Discord.

Usage:
  python3 test-report.py [--channel <channel_id>] [--webhook <url>]
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RESULTS_FILE = Path(__file__).parent / "test-results-engine.json"
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL", "")


def log(msg: str):
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def read_results() -> dict | None:
    """Read saved test results from JSON file."""
    if not RESULTS_FILE.exists():
        log(f"No results file found at {RESULTS_FILE}")
        return None
    try:
        with open(RESULTS_FILE) as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        log(f"Failed to parse results: {e}")
        return None


def format_discord_message(results: dict) -> str:
    """Format results as a Discord-compatible message."""
    s = results.get("summary", {})
    total = s.get("total", 0)
    passed = s.get("passed", 0)
    failed = s.get("failed", 0)
    skipped = s.get("skipped", 0)
    elapsed = s.get("elapsed", 0)

    pass_rate = (passed / total * 100) if total > 0 else 0
    run_id = results.get("runId", "unknown")
    timestamp = results.get("timestamp", "unknown")

    # Color code based on pass rate
    if pass_rate >= 95:
        emoji_pass = "🟢"
    elif pass_rate >= 80:
        emoji_pass = "🟡"
    else:
        emoji_pass = "🔴"

    lines = [
        f"🦞 **Cross-Stitch Studio — Test Results**",
        f"",
        f"`{run_id}`",
        f"Updated: {timestamp}",
        f"",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total | {total} |",
        f"| ✅ Passed | {passed} |",
        f"| ❌ Failed | {failed} |",
        f"| ⏭ Skipped | {skipped} |",
        f"| 📊 Pass Rate | {pass_rate:.1f}% |",
        f"| ⏱ Elapsed | {elapsed:.0f}s |",
    ]

    if failed > 0:
        lines.append(f"\n**Failing Tests:**")
        failures = [t for t in results.get("tests", []) if t.get("status") == "failed"]
        for t in failures[:8]:
            title = t.get("title", "unknown")[:60]
            file = t.get("file", "?")
            lines.append(f"- `{file}`:{t.get('line', '?')} {title}")
        if len(failures) > 8:
            lines.append(f"- ... and {len(failures) - 8} more")

    # Add a status indicator
    lines.append(f"\n{emoji_pass} Pass Rate: {pass_rate:.1f}%")

    return "\n".join(lines)


def format_plain_message(results: dict) -> str:
    """Format results as a plain text summary."""
    s = results.get("summary", {})
    total = s.get("total", 0)
    passed = s.get("passed", 0)
    failed = s.get("failed", 0)
    elapsed = s.get("elapsed", 0)
    pass_rate = (passed / total * 100) if total > 0 else 0

    return (
        f"🦞 Test Results: {passed}/{total} passed ({pass_rate:.1f}%), "
        f"{failed} failed, {elapsed:.0f}s elapsed"
    )


def send_to_discord(webhook_url: str, message: str):
    """Send message to Discord via webhook."""
    try:
        import urllib.request
        data = json.dumps({"content": message}).encode()
        req = urllib.request.Request(
            webhook_url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
        log("Message sent to Discord")
    except Exception as e:
        log(f"Failed to send to Discord: {e}")


def main():
    log("=" * 50)
    log("Cross-Stitch Studio Test Reporter")
    log("=" * 50)

    results = read_results()
    if results is None:
        log("No results to report. Exiting.")
        return

    # Format messages
    discord_msg = format_discord_message(results)
    plain_msg = format_plain_message(results)

    # Output to stdout for OpenClaw to capture
    print(plain_msg)

    # Send to Discord if webhook is configured
    webhook = sys.argv[1] if len(sys.argv) > 1 else DISCORD_WEBHOOK
    if webhook:
        send_to_discord(webhook, discord_msg)
    else:
        print(f"\nDiscord message:\n{discord_msg}")


if __name__ == "__main__":
    main()
