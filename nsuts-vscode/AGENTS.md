# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Project-Specific Information

### API Generation
- The API client is auto-generated from `../NSUTS_fresh_API.yaml` using `npm run codegen`.
- Generated file: `src/api/api.ts`. Do not edit manually; regenerate after API spec changes.
- `postinstall` script runs codegen automatically after `npm install`.

### Authentication & Middleware
- The OpenAPI client (`src/api/client.ts`) includes a custom middleware that:
  - Injects stored cookie into requests.
  - On 4xx errors, attempts to re-authenticate using stored credentials (but retry logic is incomplete – see TODO).
- Credentials are stored in VSCode's secret storage (`context.secrets`), not in configuration.

### Configuration Storage
- Active task is stored in workspace configuration under `nsuts.active_task`.
- Per-task context (files, compiler) is stored under `nsuts.tasks_context`.
- Use `ActiveTaskRepository` and `TasksContextRepository` for access.

### Testing
- E2E tests use WebdriverIO with the `wdio-vscode-service` to drive VSCode.
- Tests require `.env` file with `NSUTS_EMAIL` and `NSUTS_PASSWORD` (not committed).
- The `doAuthenticate` utility (`test/utils.ts`) automates login using these env vars.
- Run tests with `npm run wdio` (compiles first) or `npm test` for unit tests.

### TypeScript Strictness
- `tsconfig.json` enables `strict: true` and `noUncheckedIndexedAccess: true`.
- Array index accesses may return `undefined`; handle accordingly.

### Build & Development Commands
- `npm run compile` – compile TypeScript to `out/`.
- `npm run watch` – watch and compile.
- `npm run lint` – ESLint on `src/`.
- `npm run wdio` – run all E2E specs (compiles first).
- `npm run pack` – create VSIX package.
- `npm run publish` – publish to marketplace (requires `vsce` token).

### Extension Structure
- Commands are registered in `src/extension.ts` using handler factories from `src/commands/`.
- Tree view provider: `TaskTreeDataProvider` in `src/views/taskTreeView.ts`.
- Status bar items: active task and solution result (see `src/statusBar/`).

### Hidden Dependencies
- Uses `openapi-fetch` for type-safe API calls.
- Uses `jszip` for handling ZIP archives (e.g., downloading statements).
- The project is a VSCode extension, not a web app; UI runs in webviews.

### Important Notes
- The extension targets VSCode `^1.105.0`.
- Activation event is `onStartupFinished`.
- The tree view is collapsible and appears in the activity bar under NSUTS icon.