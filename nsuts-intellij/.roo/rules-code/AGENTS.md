# Project Coding Rules (Non-Obvious Only)

- Always use `DynamicBundle` for internationalization with bundle path `messages.MyMessageBundle` (not arbitrary).
- Tool window UI must use `JBPanel` with `VerticalLayout` and `JBUI` scaling (10px gap, 20px border) as seen in `NsutsToolWindowFactory`.
- Authentication dialogs should use `FormBuilder` for layout (as in `AuthDialog`).
- Logging must use `Logger.getInstance` from IntelliJ Platform, not other logging frameworks.
- Plugin icon must be `AllIcons.Toolwindows.ToolWindowPalette` (defined in plugin.xml).
- The plugin ID (`ru.ashemchuk.nsuts-intellij`) must match the package structure.
- The `since-build` version in `plugin.xml` is `252.25557` (IntelliJ 2025.2.4); do not change unless upgrading.
- Use Kotlin compiler version 2.1.20 (as defined in build.gradle.kts).
- No custom linting or formatting tools are configured; follow IntelliJ's default code style.