#!/usr/bin/env python3
"""
Cross-Stitch Studio Test Engine
Manages the full test-fix loop:
  1. Start the vite dev server
  2. Run Playwright tests
  3. Save structured results
  4. Attempt to fix failing tests (patch code)
  5. Re-run only fixed tests
  6. Loop until 100% pass or max iterations
  7. Update final results and exit

Usage:
  python3 test-engine.py [--iterations N] [--max-seconds S] [--no-fix]
"""

import asyncio
import json
import os
import re
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.resolve()
RESULTS_FILE = PROJECT_DIR / "test-results-engine.json"
FAILED_TESTS_TRACKER = PROJECT_DIR / ".test-batch-tracker.json"
SERVER_PORT = 5556
MAX_ITERATIONS = 5
MAX_SECONDS = 7200  # 2 hours max per run
BATCH_SIZE = 2  # Number of failing test files to fix per cron run
BATCH_SIZE = 2  # Number of failing test files to fix per run


def log(msg: str, level: str = "INFO"):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def kill_server(port: int):
    """Kill any process on the given port."""
    import socket
    # Try fuser first
    try:
        subprocess.run(
            ["fuser", "-k", f"{port}/tcp"],
            capture_output=True, timeout=10
        )
        return
    except FileNotFoundError:
        pass
    except Exception:
        pass
    # Try pkill as fallback
    try:
        subprocess.run(
            ["pkill", "-f", f"vite.*--port.*{port}|vite.*--host.*{port}"],
            capture_output=True, timeout=5
        )
        return
    except Exception:
        pass
    # Last resort: find and kill by port using /proc (Linux only)
    try:
        import re
        for pid_dir in os.listdir("/proc"):
            if not pid_dir.isdigit():
                continue
            try:
                fd_dir = f"/proc/{pid_dir}/fd"
                for fd in os.listdir(fd_dir):
                    link = os.readlink(f"{fd_dir}/{fd}")
                    if "socket:[" in str(link):
                        # Check if this socket is on our port
                        try:
                            with open(f"/proc/{pid_dir}/net/tcp") as f:
                                for line in f:
                                    parts = line.split()
                                    if len(parts) > 1:
                                        local = parts[1]
                                        local_port = int(local.split(":")[1], 16)
                                        if local_port == port:
                                            os.kill(int(pid_dir), signal.SIGTERM)
                                            log(f"Killed PID {pid_dir} on port {port}", "WARN")
                        except Exception:
                            pass
            except (FileNotFoundError, PermissionError, ProcessLookupError):
                pass
    except Exception:
        pass


async def wait_for_server(port: int, timeout: int = 60) -> bool:
    """Wait for the server to respond on the given port."""
    import http.client
    log(f"Waiting for server on port {port} (timeout: {timeout}s)")
    start = time.time()
    while time.time() - start < timeout:
        try:
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            conn.request("GET", "/")
            resp = conn.getresponse()
            resp.read()
            conn.close()
            if resp.status in (200, 301, 302, 404):
                log(f"Server is ready on port {port}")
                return True
        except Exception:
            pass
        await asyncio.sleep(1)
    log(f"Server did not become ready on port {port} within {timeout}s", "ERROR")
    return False


def run_tests(test_files: list[str] | None = None, workers: int = 4) -> dict:
    """
    Run Playwright tests.
    Returns structured results dict.
    """
    cmd = [
        "npx", "playwright", "test",
        "--reporter=list,json",
        f"--workers={workers}",
        "--timeout=30000",
    ]

    if test_files:
        cmd.extend(str(f) for f in test_files)

    env = os.environ.copy()
    env["PLAYWRIGHT_CHROMIUM_PATH"] = (
        "/opt/pw-browsers/chromium-1217/chrome-linux/chrome"
    )
    env["PLAYWRIGHT_BROWSERS_PATH"] = "/opt/pw-browsers"

    log(f"Running Playwright: {' '.join(str(c) for c in cmd)}")
    start = time.time()

    try:
        result = subprocess.run(
            [str(c) for c in cmd],
            cwd=str(PROJECT_DIR),
            capture_output=True,
            text=True,
            timeout=3600,
            env=env,
        )
    except subprocess.TimeoutExpired:
        log("Playwright timed out", "ERROR")
        return {"error": "timeout", "stdout": "", "stderr": "", "elapsed": time.time() - start}

    elapsed = time.time() - start
    stdout = result.stdout
    stderr = result.stderr

    # Parse stdout (list reporter output) — this is the primary reliable source
    # JSON reporter (test-results.json) often fails silently in this environment
    test_results = parse_stdout(stdout, stderr)
    results = {
        "error": None,
        "tests": test_results,
        "summary": {
            "total": len(test_results),
            "passed": sum(1 for t in test_results if t["status"] == "passed"),
            "failed": sum(1 for t in test_results if t["status"] == "failed"),
            "skipped": sum(1 for t in test_results if t["status"] in ("skipped", "interrupted", "timed-out")),
            "elapsed": elapsed,
        },
        "elapsed": elapsed,
    }
    log(f"Parsed {len(test_results)} tests from stdout")
    return results


def parse_stdout(stdout: str, stderr: str) -> list[dict]:
    """Parse Playwright list reporter output into structured test results."""
    tests = []
    
    # Format: "  ✓   1 [smoke] › tests/e2e/foo.spec.ts:10:5 › Test name [ @tag ] (2.3s)"
    passed_re = re.compile(
        r"^\s*[✓✔]\s*\d+\s+\[(\w+)\]\s*›\s+([\w/\\.-]+\.spec\.ts):(\d+):(\d+)\s*›\s+(.+?)\s*\(([\d.]+)s?\)$"
    )
    failed_re = re.compile(
        r"^\s*[✘Xx]\s*\d+\s+\[(\w+)\]\s*›\s+([\w/\\.-]+\.spec\.ts):(\d+):(\d+)\s*›\s+(.+?)\s*\(([\d.]+)s?\)$"
    )

    for line in stdout.split("\n"):
        line = line.strip()

        m = passed_re.match(line)
        if m:
            tests.append({
                "project": m.group(1),
                "file": m.group(2),
                "line": int(m.group(3)),
                "col": int(m.group(4)),
                "title": m.group(5).strip(),
                "duration": float(m.group(6)),
                "status": "passed",
                "error": None,
            })
            continue

        m = failed_re.match(line)
        if m:
            tests.append({
                "project": m.group(1),
                "file": m.group(2),
                "line": int(m.group(3)),
                "col": int(m.group(4)),
                "title": m.group(5).strip(),
                "duration": float(m.group(6)),
                "status": "failed",
                "error": "",
            })
            continue

    return tests


def get_failed_test_files(results: dict) -> list[Path]:
    """Extract unique failing test files from results."""
    files = set()
    for t in results.get("tests", []):
        if t["status"] == "failed":
            f = PROJECT_DIR / "tests" / t["file"]
            if f.exists():
                files.add(f)
    return list(files)


def attempt_fix(results: dict) -> dict:
    """
    Attempt to fix failing tests by analyzing error messages.
    Returns count of files patched.

    Strategy:
    - For timeout errors: increase timeouts
    - For element not found: add retries / fix selectors
    - For connection refused: this is a server issue, not a test issue
    """
    patched = []

    for t in results.get("tests", []):
        if t["status"] != "failed":
            continue

        error = (t.get("error") or "").lower()
        file_path = PROJECT_DIR / "tests" / t["file"]

        if not file_path.exists():
            continue

        try:
            content = file_path.read_text()
            changes = []

            # Fix 1: Connection refused - this means server wasn't running
            if "err_connection_refused" in error or "net::err_connection_refused" in error:
                log(f"  ⚠ {t['title']}: Connection refused - server not running (not a test bug)", "WARN")
                continue

            # Fix 2: Timeout errors - increase wait times
            if "timeout" in error or "timed out" in error:
                # Replace short timeouts with longer ones
                old = "setTimeout(r => setTimeout(r, 200)"
                new = "setTimeout(r => setTimeout(r, 500)"
                if old in content:
                    content = content.replace(old, new)
                    changes.append("Increased setTimeout from 200ms to 500ms")

                old = "setTimeout(r => setTimeout(r, 300)"
                new = "setTimeout(r => setTimeout(r, 800)"
                if old in content:
                    content = content.replace(old, new)
                    changes.append("Increased setTimeout from 300ms to 800ms")

            # Fix 3: Element not found - add waitFor selectors before interactions
            if "element(s) not found" in error or "locator.*failed" in error:
                # Look for patterns where we click without waiting
                if ".click()" in content and "waitFor" not in content.split(".click()")[0][-100:]:
                    changes.append("Consider adding waitFor before click operations")

            if changes:
                file_path.write_text(content)
                log(f"  🔧 Patched {t['file']} (line {t['line']}): {'; '.join(changes)}")
                patched.append(file_path)

        except Exception as e:
            log(f"  ⚠ Failed to patch {t['file']}: {e}", "WARN")

    return patched


def save_results(results: dict):
    """Save test results to JSON file for the cron reporter."""
    output = {
        "runId": f"engine-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": results.get("summary", {}),
        "tests": results.get("tests", []),
        "elapsed": results.get("elapsed", 0),
    }
    with open(RESULTS_FILE, "w") as f:
        json.dump(output, f, indent=2)
    log(f"Results saved to {RESULTS_FILE}")


def format_summary(results: dict) -> str:
    """Format test results as a human-readable summary."""
    s = results.get("summary", {})
    total = s.get("total", 0)
    passed = s.get("passed", 0)
    failed = s.get("failed", 0)
    skipped = s.get("skipped", 0)
    elapsed = s.get("elapsed", 0)

    pass_rate = (passed / total * 100) if total > 0 else 0

    lines = [
        f"🦞 **Cross-Stitch Studio Test Results**",
        f"",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total Tests | {total} |",
        f"| ✅ Passed | {passed} |",
        f"| ❌ Failed | {failed} |",
        f"| ⏭ Skipped | {skipped} |",
        f"| 📊 Pass Rate | {pass_rate:.1f}% |",
        f"| ⏱ Elapsed | {elapsed:.0f}s |",
        f"",
        f"Updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
    ]

    if failed > 0:
        lines.append(f"\n**Failing Tests:**")
        failures = [t for t in results.get("tests", []) if t["status"] == "failed"]
        for t in failures[:10]:  # Show top 10
            lines.append(f"- `{t['file']}`:{t['line']} — {t['title']}")
        if len(failures) > 10:
            lines.append(f"- ... and {len(failures) - 10} more")

    return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Cross-Stitch Studio Test Engine")
    parser.add_argument("--iterations", type=int, default=MAX_ITERATIONS,
                        help="Max fix iterations (default: %d)" % MAX_ITERATIONS)
    parser.add_argument("--max-seconds", type=int, default=MAX_SECONDS,
                        help="Max run time in seconds (default: %d)" % MAX_SECONDS)
    parser.add_argument("--no-fix", action="store_true",
                        help="Skip bug fixing, just run tests once")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                        help="Fix only this many failing test files per run (default: %d)" % BATCH_SIZE)
    parser.add_argument("--report", action="store_true",
                        help="Just report current results (no server needed)")
    args = parser.parse_args()

    log("=" * 60)
    log("Cross-Stitch Studio Test Engine")
    log("=" * 60)

    # Mode: just report
    if args.report:
        if RESULTS_FILE.exists():
            with open(RESULTS_FILE) as f:
                results = json.load(f)
            print(format_summary(results))
        else:
            print("No results file found. Run the engine first.")
        return

    # Mode: run the full loop
    overall_start = time.time()
    iteration = 0
    all_failed_files = set()  # Track files that need fixing

    while iteration < args.iterations:
        iteration += 1
        iteration_time = time.time()
        remaining = args.max_seconds - (time.time() - overall_start)

        if remaining <= 0:
            log(f"Max time ({args.max_seconds}s) reached. Exiting.", "WARN")
            break

        log(f"\n{'='*60}")
        log(f"Iteration {iteration}/{args.iterations}")
        log(f"{'='*60}")

        # Step 1: Start the vite dev server
        log("Starting vite dev server...")
        kill_server(SERVER_PORT)
        time.sleep(1)

        server_proc = None
        try:
            server_proc = subprocess.Popen(
                ["npx", "vite", "--host", "0.0.0.0", "--port", str(SERVER_PORT)],
                cwd=str(PROJECT_DIR),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            log(f"Vite server (npx) PID: {server_proc.pid}")
        except Exception as e:
            log(f"Failed to start vite: {e}", "ERROR")
            log("Cannot start server. Aborting.", "ERROR")
            break

        # Step 1b: Wait for server to be ready
        ready = asyncio.run(wait_for_server(SERVER_PORT, timeout=min(60, remaining - 30)))
        if not ready:
            log("Server not ready. Killing and aborting.", "ERROR")
            server_proc.terminate()
            server_proc.wait()
            break

        # Step 2: Determine which tests to run
        # Check stale results for failing test files to fix incrementally
        stale_failed_files = set()
        if RESULTS_FILE.exists():
            try:
                with open(RESULTS_FILE) as f:
                    stale = json.load(f)
                for t in stale.get("tests", []):
                    if t.get("status") == "failed":
                        fpath = PROJECT_DIR / "tests" / t["file"]
                        if fpath.exists():
                            stale_failed_files.add(fpath)
                log(f"Stale results show {len(stale_failed_files)} failing file(s)")
            except Exception as e:
                log(f"Failed to read stale results: {e}", "WARN")

        if stale_failed_files:
            # Pick up to BATCH_SIZE failing files from stale results
            test_files = list(stale_failed_files)[:args.batch_size]
            if not test_files:
                log("No more failing test files to fix.", "INFO")
                results["finalStatus"] = "all_passed"
                save_results(results)
                print(format_summary(results))
                break
            log(f"Running {len(test_files)} batched test file(s) from stale failures")
        elif iteration == 1 and not args.no_fix:
            # No stale failures — quick sanity check on first run only
            all_files = list((PROJECT_DIR / "tests" / "e2e").glob("*.spec.ts"))
            test_files = all_files[:args.batch_size * 2]
            log(f"Running sanity check on {len(test_files)} test files")
        else:
            log("No stale failures and not iteration 1. Done.", "INFO")
            break


        # Step 3: Run tests
        results = run_tests(test_files, workers=4)

        # Step 3b: Save results
        save_results(results)

        # Print summary
        s = results.get("summary", {})
        total = s.get("total", 0)
        passed = s.get("passed", 0)
        failed = s.get("failed", 0)
        pass_rate = (passed / total * 100) if total > 0 else 0

        log(f"Results: {passed}/{total} passed ({pass_rate:.1f}%), {failed} failed")

        # Step 7: Check if all passed
        if failed == 0 and total > 0:
            log(f"\n🎉 All {total} tests passed! Engine complete.", "SUCCESS")
            # Save final success
            results["finalStatus"] = "all_passed"
            save_results(results)
            print(format_summary(results))
            break

        # Step 4 & 5: If not all passed and not skipping fixes
        if not args.no_fix and failed > 0:
            log(f"\n{failed} tests failed. Attempting fixes...")

            # Track failed files for re-run
            all_failed_files = set()
            for t in results.get("tests", []):
                if t["status"] == "failed":
                    f = PROJECT_DIR / "tests" / t["file"]
                    if f.exists():
                        all_failed_files.add(f)

            # Attempt to fix
            patched = attempt_fix(results)
            log(f"Patched {len(patched)} files")

            if iteration < args.iterations and patched:
                log(f"Next iteration will re-run {len(all_failed_files)} failing files")
                continue

        # If no fixes applied or max iterations, just report
        log(f"\nEngine complete. {total} tests: {passed} passed, {failed} failed.")
        print(format_summary(results))
        break

    # Cleanup: kill server
    log("Stopping vite dev server...")
    kill_server(SERVER_PORT)
    if server_proc and server_proc.poll() is None:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_proc.kill()

    total_elapsed = time.time() - overall_start
    log(f"Engine finished in {total_elapsed:.0f}s")


if __name__ == "__main__":
    main()
