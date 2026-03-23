# Project Architecture Rules (Non-Obvious Only)

- The plugin is a simple tool window plugin with no backend; all UI logic is contained within the tool window factory and dialog.
- The tool window (`NsutsToolWindowFactory`) creates a panel with a button that opens an authentication dialog (`AuthDialog`).
- Authentication is stubbed; any real implementation would need to integrate with external NSUTS API (not defined).
- The plugin uses IntelliJ Platform's extension point `com.intellij.toolWindow` for the tool window.
- There is no persistence or state management; the plugin is stateless across IDE restarts.
- The plugin uses the IntelliJ Platform's resource bundle system for internationalization, but only one string is currently localized.
- The plugin icon is defined in `plugin.xml` using a built-in IntelliJ icon; custom icons would need to be added to `src/main/resources`.
- The plugin depends only on `com.intellij.modules.platform`; no additional plugin dependencies.
- The build system uses Gradle with the IntelliJ Platform Gradle Plugin; configuration cache is enabled.
- The plugin is compatible with IntelliJ IDEA 2025.2.4 and later; changing the `since-build` may affect compatibility.