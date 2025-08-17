---
title: Fix search Backspace pop order; add key listener scope + chord preview
status: in_progress
owner: "@agent"
updated: 2025-08-17 15:00 UTC
related: []
---

## Context

Improve UX of the Search menu and the active key listener:
- Make Backspace pop modifiers in the expected sorted order (Cmd, Ctrl, Alt, Shift), and not by historical click order.
- Ensure Backspace contributes to the active key store when the global listener is active (input shouldn't eat it).
- Add user-configurable behavior for the key listener (scope and chord preview).
- Add configurable debounce for search input.

Definition of done (for this task):
- Backspace pop order consistent in both Search input and store.
- Search input does not interfere with active listener’s Backspace.
- Settings available for key listener scope, chord preview, and search debounce.
- Chord preview blocks hotkey triggering inside Analyzer view, and allows triggering globally when scope is set to global.

## Decisions

- [2025-08-17] Pop modifiers from the end of the sorted list for Backspace in both the SearchMenu and ActiveKeysStore.
- [2025-08-17] When listener is active, Search input short-circuits keydown to avoid altering active keys (Backspace included).
- [2025-08-17] Added settings: key listener scope (activeView|global), chord preview toggle, search debounce (ms).
- [2025-08-17] Chord preview inside Analyzer view consumes events to prevent commands; in global scope it does not consume events so commands can trigger.
- [2025-08-17] Known gap: Obsidian still triggers some commands even in preview-inside-view mode; needs deeper event handling refinement.

## Next Steps

- [ ] Ensure Obsidian commands do not trigger inside Analyzer view when chord preview is ON (investigate capture timing, event target checks, and Obsidian’s keymap handling).
- [ ] Verify chord preview release semantics (clear only when all keys released vs any keyup) and make adjustable if needed.
- [ ] Build and type-check; test across macOS/Windows/Linux with emulation toggles.
- [ ] Update README to document new settings and behaviors.

## Links

- Source changes:
  - `src/components/SearchMenu.svelte` – Backspace handling, listener-guard, configurable debounce.
  - `src/stores/activeKeysStore.svelte.ts` – Sorted Backspace pop; chord preview on keydown/keyup.
  - `src/components/KeyboardComponent.svelte` – Respect listener scope; block hotkeys inside Analyzer view when chord preview enabled.
  - `src/managers/settingsManager/settingsManager.d.ts` – New settings fields.
  - `src/managers/settingsManager/settingsManager.svelte.ts` – Defaults and runtime application of new settings.
  - `src/settingsTab.ts` – UI for key listener scope, chord preview, search debounce.
  - `src/utils/runtimeConfig.ts` – Runtime flags + getters/setters for new options.

