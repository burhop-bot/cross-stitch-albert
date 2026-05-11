# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/image-conversion-undo-redo.spec.ts >> Undo after image conversion >> undo after two rapid conversions restores intermediate state
- Location: tests/e2e/image-conversion-undo-redo.spec.ts:403:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('header') to be visible

```

```
Error: apiRequestContext._wrapApiCall: Cannot find module '../zipBundle'
Require stack:
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/server/localUtils.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/server/dispatchers/localUtilsDispatcher.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/server/dispatchers/playwrightDispatcher.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/server/index.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/remote/playwrightConnection.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/remote/playwrightServer.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/androidServerImpl.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/inProcessFactory.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/lib/inprocess.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright-core/index.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright/lib/common/testType.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright/lib/common/test.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright/lib/common/testLoader.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright/lib/worker/workerMain.js
- /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/playwright/lib/common/process.js
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: Cannot find module '/sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/vite/dist/node/chunks/dist.js' imported from /sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/vite/dist/node/chunks/node.js
  - generic [ref=e5]: at finalizeResolution (node:internal/modules/esm/resolve:275:11) at moduleResolve (node:internal/modules/esm/resolve:861:10) at defaultResolve (node:internal/modules/esm/resolve:985:11) at nextResolve (node:internal/modules/esm/hooks:748:28) at o (file:///sandbox/.openclaw-data/workspace/cross-stitch-app/node_modules/@tailwindcss/node/dist/esm-cache.loader.mjs:1:69) at nextResolve (node:internal/modules/esm/hooks:748:28) at Hooks.resolve (node:internal/modules/esm/hooks:240:30) at MessagePort.handleMessage (node:internal/modules/esm/worker:199:24) at [nodejs.internal.kHybridDispatch] (node:internal/event_target:843:20) at MessagePort.<anonymous> (node:internal/per_context/messageport:23:28)
  - generic [ref=e6]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e7]: server.hmr.overlay
    - text: to
    - code [ref=e8]: "false"
    - text: in
    - code [ref=e9]: vite.config.ts
    - text: .
```