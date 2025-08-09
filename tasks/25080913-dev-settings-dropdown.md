---
title: Add Developer Settings dropdown in toolbar
status: todo
owner: "@you"
updated: 2025-08-09 13:55 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
  - [[250809-keyboard-panel-collapse-toggle]]
---

## Context
Add a compact settings dropdown in the keyboard toolbar (left of Donate) for developer options. The dropdown itself is only visible when a new "Enable developer options" toggle is turned on in the plugin settings. This helps keep the main UI clean while enabling quick diagnostics.

## Requirements
- Visibility: Dropdown is hidden by default; appears only when enabled from plugin settings.
- Placement: To the left of the Donate button in the keyboard toolbar.
- Items:
  - Dev logging mode: Centralize logging (enable/disable, and level if applicable) across the project.
  - Inspect Active Keys Store: Show a compact inspector panel with improved readability (vs. current raw logger box).
  - Emulate OS: Temporarily emulate target OS (Windows/macOS/Linux) to test how modifiers and display mapping behave.

## Decisions
- Logging: Introduce a `logger` utility with levels and sinks; replace scattered `console.log` with `logger.debug/info/warn` gated by settings.
- Active Keys inspector: Add a small panel that mirrors formatted values from `activeKeysStore` (key, modifiers, physical key), collapsible and theme-consistent.
- OS emulation: Provide a temporary override in settings; scope it to the plugin (no global side-effects). Update modifier conversion/display utils to read from this override.

## Acceptance Criteria
- Plugin settings includes an "Enable developer options" toggle; when on, a gear/dropdown appears in the keyboard toolbar.
- Dropdown entries: toggle Dev logging mode; open/close Active Keys inspector; pick Emulated OS (None/Windows/macOS/Linux).
- Dev logging toggle immediately affects logging throughout the plugin.
- Emulated OS affects modifier rendering and filtering behavior consistently; easy to revert to None.

## Next Steps
- [ ] Add `enableDeveloperOptions` to plugin settings; default false (owner)
- [ ] Add `devLoggingEnabled` and `emulatedOS` settings (owner)
- [ ] Implement `logger` utility and replace scattered `console.log` calls where feasible (owner)
- [ ] Add toolbar gear button and dropdown; conditionally render when `enableDeveloperOptions` is true (owner)
- [ ] Implement Active Keys inspector panel with improved layout (owner)
- [ ] Verify behavior across themes and small panes; attach notes (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]
- [[250809-keyboard-panel-collapse-toggle]]

