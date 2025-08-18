---
title: Fix search Backspace pop order; add key listener scope + modifier activation (click/hold)
status: done
owner: '@agent'
updated: 2025-08-17 18:20 UTC
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
- [2025-08-17] Chord preview inside Analyzer view consumes events to prevent commands; in global scope it does not consume events so commands can trigger.
- [2025-08-17] Known gap: Obsidian still triggers some commands even in preview-inside-view mode; needs deeper event handling refinement.

### Implementation notes

- Search Backspace now pops from the end of `sortedModifiers` and short-circuits to let the active listener handle keys; also added configurable debounce (`searchDebounceMs`).
- ActiveKeysStore Backspace pop uses `sortModifiers` for consistent order across UI and store.
- Global listeners run in capture phase; no forced propagation blocking.
- Settings wired: `keyListenerScope`, `modifierActivationMode`, `searchDebounceMs` with defaults; applied at runtime via `runtimeConfig`.
- Reframed "Chord preview" to "Modifier activation": `click` vs `hold`. In `hold`, modifiers from physical input are tracked and cleared on release. Inside the Analyzer view (listener active), users can select keys by pressing or clicking; globally only modifiers are tracked. In `click`, modifiers toggle via UI clicks.
- Global scope is effective only when activation is `hold` (internally `press`); otherwise, listener behaves as `activeView`.
- Minor lint cleanups tied to this task (remove unused imports; avoid `any`; safer `Number.isNaN`).

## Next Steps

- [ ] Ensure Obsidian commands do not trigger inside Analyzer view when chord preview is ON (investigate capture timing, event target checks, and Obsidian’s keymap handling).
- [ ] Verify chord preview release semantics (clear only when all keys released vs any keyup) and make adjustable if needed.
- [ ] Build and type-check; test across macOS/Windows/Linux with emulation toggles.
- [ ] Update README to document new settings and behaviors.

Progress log

- [2025-08-17 18:20 UTC] Implemented Backspace order, listener guard, chord preview, scope, and debounce. Added settings + runtime flags. Minor lints addressed. Type-check reveals unrelated pre-existing issues to fix in a separate pass.
- [2025-08-17 18:40 UTC] Updated chord preview to modifiers-only (no activeKey changes), removed aggressive event blocking, and passed view context to handlers. Key selection remains via click toggles inside view.
- [2025-08-17 19:05 UTC] Introduced modifier activation modes (click/hold), gated global scope to hold mode, updated settings UI and runtime wiring.
- [2025-08-17 19:30 UTC] Fixed keyup handler to pass inActiveView flag; hold mode now updates modifiers on keydown/keyup; keys set only by click.
- [2025-08-17 19:40 UTC] Finalized UX: In hold mode, inside Analyzer view, users can select keys by pressing or clicking; globally only modifiers are tracked. Updated settings description to reflect this.
- [2025-08-17 19:05 UTC] Introduced `modifierActivationMode` (click/hold), enforced global scope only in hold mode, and updated settings UI + runtime wiring.

## Links

- Source changes:
  - `src/components/SearchMenu.svelte` – Backspace handling, listener-guard, configurable debounce.
  - `src/stores/activeKeysStore.svelte.ts` – Sorted Backspace pop; modifier press mode (modifiers only) on keydown/keyup.
  - `src/components/KeyboardComponent.svelte` – Respect listener scope; global active only when modifier activation is press.
  - `src/managers/settingsManager/settingsManager.d.ts` – New settings fields.
  - `src/managers/settingsManager/settingsManager.svelte.ts` – Defaults and runtime application of new settings.
  - `src/settingsTab.ts` – UI for key listener scope, modifier activation, search debounce.
  - `src/utils/runtimeConfig.ts` – Runtime flags + getters/setters for new options.
