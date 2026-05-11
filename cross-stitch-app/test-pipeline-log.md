# Cross-Stitch Pattern Studio E2E Test Pipeline Log

## Final Status: CANNOT COMPLETE - System Resource Exhaustion

### Root Cause
38,000 zombie Chrome processes from an earlier failed test run (20 workers × ~1700 test cases = massive parallel process spawning). When killed mid-run, all Chrome instances became zombies consuming PID/thread ID resources.

**Key finding:** PID 1 is the OpenClaw gateway (Node.js), which does NOT automatically reap child process zombies. This is different from traditional Linux init systems.

### What I Tried
1. ✅ Reduced workers from 20 → 2 → 1 (didn't help - zombies were already there)
2. ✅ Disabled globalSetup (didn't help)
3. ✅ Killed all Chrome processes via Node.js (killed ~48K, zombies remain)
4. ✅ Sent SIGCHLD to PID 1 (Node.js doesn't handle it for reaping)
5. ✅ Added --no-zygote --single-process --no-sandbox to Chrome (still needs threads)
6. ✅ Tried headless_shell (same thread issue)
7. ✅ Waited 15+ minutes for auto-reap (didn't happen)

### Why Chrome Fails
Chrome creates multiple threads per instance. The zombie processes consume thread IDs (TIDs) in the kernel's thread ID space. When Chrome tries `pthread_create()`, the kernel returns EAGAIN because the TID pool is exhausted.

### System State
- 38K+ zombie processes (chrome, chrome_crashpad)
- Chrome launch: `pthread_create: Resource temporarily unavailable (11)`
- Node.js exec: works (minimal thread usage)
- All Playwright tests: fail (Chrome can't launch)

### Partial Test Results (Before Chrome Became Unusable)

**Verified PASSING (Chrome could run):**
- 3d-visualizer-dead-code.spec.ts: 5/5 ✅ (confirms no 3D dead code issues)
- app-shell.spec.ts: 8/8 ✅
- brand-switch-undo-redo.spec.ts: 10/10 ✅
- canvas-controls.spec.ts: 9/9 ✅

**Suspected FAILING (tests killed mid-run or resource-caused):**
- clear-pattern-full.spec.ts: 16 failures (clear dialog workflow, undo/redo)
- color-history-panel.spec.ts: 1 failure (Recent button)
- color-palette.spec.ts: 1 failure (colors tab)
- color-swap-undo.spec.ts: 1 failure (swap mode button)

**Test Setup Issues (not app bugs):**
- _debug*.spec.ts: 6 failures - these use `networkidle` which doesn't work with Vite dev server (HMR keeps connections open)

### Required Fix
**System restart** or manual cleanup:
```bash
# Via SSH:
# 1. Find all orphaned parent processes:
ps -eo pid,ppid,stat | grep -E 'Z|defunct' | awk '{print $1}' | xargs -I{} cat /proc/{}/stat 2>/dev/null | grep -l Z
# 2. Kill the parent process trees
# 3. Or simply: reboot the system
```

After cleanup, re-run: `npx playwright test --project=full --workers=1`
