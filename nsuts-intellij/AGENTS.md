# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview
- IntelliJ Platform Plugin written in Kotlin targeting JVM 21.
- Uses IntelliJ Platform Gradle Plugin (version 2.10.2) with IntelliJ IDEA 2025.2.4.
- Plugin ID: `ru.ashemchuk.nsuts-intellij`.

## Non-Obvious Commands
- Run plugin in sandbox: `./gradlew runIde` (preconfigured in `.run/Run IDE with Plugin.run.xml`).
- Build plugin distribution: `./gradlew buildPlugin`.
- Verify plugin compatibility: `./gradlew verifyPlugin`.
- Publish to JetBrains Marketplace: `./gradlew publishPlugin`.
- Tests: `./gradlew test` (no tests currently).

## Key Patterns
- Internationalization uses `DynamicBundle` with bundle path `messages.MyMessageBundle`. Property files are in `src/main/resources/messages/`.
- Tool window UI uses `JBPanel` with `VerticalLayout` and `JBUI` scaling (10px gap, 20px border).
- Authentication dialog uses `FormBuilder` for layout.
- Logging uses `Logger.getInstance` from IntelliJ Platform.
- Plugin icon is `AllIcons.Toolwindows.ToolWindowPalette`.
- Since-build version is `252.25557` (IntelliJ 2025.2.4).

## Configuration
- Gradle configuration cache and build cache are enabled (`gradle.properties`).
- Kotlin compiler version 2.1.20.

## Testing
- Uses IntelliJ Platform test framework (no tests yet).
- Test source directory `src/test` is missing; create Kotlin tests there.

## Important Notes
- Plugin manifest is at `src/main/resources/META-INF/plugin.xml`.
- The tool window factory is `NsutsToolWindowFactory`.
- Authentication logic is stubbed in `AuthDialog.handleAuth`.