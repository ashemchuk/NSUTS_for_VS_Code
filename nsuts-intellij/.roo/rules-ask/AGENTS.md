# Project Documentation Rules (Non-Obvious Only)

- The plugin is a simple IntelliJ Platform plugin with a single tool window and authentication dialog.
- The `src/main/resources/messages/` directory contains only one property file (`MyMessageBundle.properties`) with a single key for tool window stripe text.
- The plugin manifest (`plugin.xml`) defines a tool window with icon `AllIcons.Toolwindows.ToolWindowPalette`.
- The authentication logic is stubbed in `AuthDialog.handleAuth`; real implementation is pending.
- The plugin uses Kotlin but there are no advanced Kotlin features (coroutines, DSLs, etc.).
- The project uses Gradle with configuration cache enabled; this may affect build reproducibility.
- There is no test directory (`src/test`); tests need to be created following IntelliJ Platform testing guidelines.
- The plugin targets IntelliJ IDEA 2025.2.4 (since-build 252.25557).