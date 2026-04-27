# Project Debug Rules (Non-Obvious Only)

- Webview dev tools are accessed via Command Palette > "Developer: Open Webview Developer Tools" (not F12).
- Extension logs appear in the "Extension Host" output channel, not Debug Console.
- The authentication middleware in `src/api/client.ts` logs 4xx errors but does not automatically retry (TODO). Check network requests in browser dev tools.
- E2E tests require a `.env` file with `NSUTS_EMAIL` and `NSUTS_PASSWORD`. If tests fail, verify these credentials.
- The `wdio` configuration compiles the extension before running tests (`onPrepare` hook). If tests fail due to missing compilation, run `npm run compile` manually.
- The tree view may not refresh automatically after certain actions; use `nsuts.refresh_task_tree` command to force refresh.
- Status bar items may not update immediately; they are updated via `renderActiveTaskStatus()` and `renderSolutionResult()`.
- The `noUncheckedIndexedAccess` setting can cause runtime `undefined` errors when accessing array indices; add explicit checks.
- The API client uses a base URL of `https://fresh.nsuts.ru/nsuts-new/api/`. If API calls fail, verify network connectivity and cookie validity.
- The `doAuthenticate` utility (`test/utils.ts`) uses WebdriverIO to simulate user input; if authentication fails, check the `.env` file and VSCode UI state.