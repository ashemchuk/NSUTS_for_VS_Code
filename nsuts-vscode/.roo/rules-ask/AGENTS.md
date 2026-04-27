# Project Documentation Rules (Non-Obvious Only)

- The `src/` directory contains VSCode extension code, not web app code (counterintuitive).
- The API specification is located outside the project at `../NSUTS_fresh_API.yaml`. Changes to the API must be reflected there.
- The generated API types (`src/api/api.ts`) are the canonical reference; the OpenAPI spec may be outdated.
- UI runs in VSCode webviews with restrictions: no `localStorage`, limited browser APIs.
- Configuration is split: workspace settings for active task/task context, secret storage for credentials.
- The tree view uses a custom data provider that fetches data from the API; the structure is hierarchical (olympiad → tour → task).
- The `downloadStatement` command downloads a ZIP archive containing PDF statements; extraction is handled by `jszip`.
- The extension uses two status bar items: one for active task, one for solution result (updated after submission).
- The `postinstall` script automatically regenerates API types; if generation fails, check the YAML file path.
- The project is part of a larger monorepo (nsuts-ide-plugins) but operates independently.