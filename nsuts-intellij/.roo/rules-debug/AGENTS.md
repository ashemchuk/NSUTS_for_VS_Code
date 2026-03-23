# Project Debug Rules (Non-Obvious Only)

- Plugin logs are written to `build/idea-sandbox/system/log/idea.log` when running with `./gradlew runIde`.
- The sandbox IDE runs in a separate process; debugging requires attaching to the process (use the "Debug" button in the run configuration).
- The `.run/Run IDE with Plugin.run.xml` configuration includes a log file alias for `idea.log`.
- No breakpoints in `AuthDialog.handleAuth` will hit because the method is stubbed (no real authentication).
- The tool window content is created via `NsutsToolWindowFactory.MyToolWindow`; UI changes may require restarting the sandbox.
- The plugin uses IntelliJ Platform's test framework; debugging tests requires running `./gradlew test` with debugger attached.
- Configuration cache is enabled (`org.gradle.configuration-cache=true`); may cause issues with incremental builds; disable if debugging build scripts.