# Project Coding Rules (Non-Obvious Only)

- Always use the generated API client (`src/api/client.ts`) for network requests; it includes authentication middleware.
- Array index accesses may return `undefined` because `noUncheckedIndexedAccess` is enabled; handle with optional chaining or checks.
- Configuration storage uses VSCode workspace settings (`nsuts.active_task`, `nsuts.tasks_context`); use `ActiveTaskRepository` and `TasksContextRepository` for access.
- Command handlers are factory functions returning async functions (see `src/commands/*.ts`). Follow the same pattern when adding new commands.
- The API types are auto-generated from `../NSUTS_fresh_API.yaml`. Do not edit `src/api/api.ts` manually; run `npm run codegen` after spec changes.
- Use `jszip` for handling ZIP archives (e.g., downloading statements). The `downloadStatement` command expects a ZIP file.
- Credentials are stored in VSCode secret storage (`context.secrets`). Use `context.secrets.store/get` with keys `nsuts.email`, `nsuts.password`, `nsuts.cookie`.
- The tree view provider (`TaskTreeDataProvider`) expects specific data shapes; refer to `src/views/taskTreeView.ts` for implementation details.
- Status bar items are updated via `src/statusBar/activeTask.ts` and `src/statusBar/solutionResult.ts`. Use `renderActiveTaskStatus()` and `renderSolutionResult()`.
- The extension targets VSCode `^1.105.0`; avoid using APIs from newer versions without checking engine compatibility.