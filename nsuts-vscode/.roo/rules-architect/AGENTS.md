# Project Architecture Rules (Non-Obvious Only)

- The extension follows a clear separation: commands, API client, repositories, views, status bar.
- The API client (`src/api/client.ts`) uses a middleware that injects cookies and attempts re-authentication on 4xx errors (but retry is incomplete).
- Configuration is stored in VSCode workspace settings (`nsuts.active_task`, `nsuts.tasks_context`), not in a custom file.
- Credentials are stored in VSCode secret storage, which is secure but extension-specific.
- The tree view provider (`TaskTreeDataProvider`) is stateless; data is fetched on each refresh.
- The extension uses `openapi-fetch` for type-safe API calls; the generated types ensure compatibility with the backend.
- The `jszip` dependency is used only for downloading and extracting statement archives; no other compression utilities are needed.
- The extension targets VSCode `^1.105.0`; avoid using newer VSCode APIs without updating the engine.
- The project is a VSCode extension, not a web app; UI is limited to webviews and VSCode's native UI components.
- The build process compiles TypeScript to `out/` directory; the `vsce` package command includes only necessary files (see `.vscodeignore`).
- E2E tests use WebdriverIO with a custom VSCode service; they require a running VSCode instance.
- The `postinstall` script ensures API types are always up-to-date; if the YAML spec changes, the types are regenerated automatically.