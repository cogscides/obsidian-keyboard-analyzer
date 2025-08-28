---
title: Fix TypeScript and Svelte checks
status: done
owner: '@agent'
updated: 2025-08-11 12:13 UTC
related:
  - [[AGENTS]]
  - [[25080912-a11y-warnings]]
---

## Context

Running `tsc --noEmit` and `svelte-check` surfaces a cluster of issues:

- Typings mismatch: imports from `obsidian-typings` don’t match installed exports; Obsidian’s official `obsidian` package has the expected types (e.g., `Command`, `Hotkey`, `App`).
  - explore `obsidian-typings` in details to see if any types are missing in `obsidian` package and if we need to keep it for some reason. Later we'll need to work with assigning hotkeys to commands, so we need to be sure that types are compatible.
- Generics drift: `InternalPlugin`/`InternalPluginInstance` now require type parameters.
- Unsafe app casting: direct casts to `UnsafeAppInterface` cause overlap errors; some property names differ (`HotKeyManager` vs `hotkeyManager`).
- Hotkey shape mismatch: `hotkeyEntry` doesn’t satisfy `Hotkey` usage.
- Case-sensitive imports: mixed `../Components/...` vs `../components/...` cause duplicate file errors.
- Missing declarations: `../utils/clickOutside.js` lacks a `.d.ts` shim.
- Store API mismatch: `ActiveKeysStore` methods used by components aren’t present in the store type.
- Minor: an unused `@ts-expect-error`, and several a11y warnings (tracked in [[25080912-a11y-warnings]]).

## Decisions

- Source of truth for Obsidian types: standardize on `obsidian` package imports with module augmentation for internal APIs.
- Handle internal APIs via module augmentation: prefer augmenting `App` instead of broad `as` casts; tolerate narrow `unknown as` casts where necessary.
- Unify hotkey model: make our `hotkeyEntry` extend `Hotkey` and add custom fields; provide a conversion helper for `KeymapInfo`→`Hotkey`.
- Normalize import casing across the project to `components/` (lowercase) to avoid case conflicts.
- Keep a11y fixes tracked separately; only adjust the most egregious cases if easy while focusing on typing/build green.
- [2025-08-10] Added typed shim for `clickOutside` action and removed stale `@ts-ignore`.
- [2025-08-10] Standardized custom event to `on:click_outside` and updated action to dispatch `click_outside`; added JSX augmentation. Removed legacy `onclick_outside` shim.
- [2025-08-10] Fixed import specifiers for runes modules: point to `.svelte.ts` explicitly in barrels and consumers (stores/managers/components) to resolve “is not a module” errors.
- [2025-08-10] Enabled `tsconfig.json` `allowImportingTsExtensions` to support explicit `.ts` import specifiers used for runes modules.
- [2025-08-10] Ran `svelte-check` — result: 0 errors, 15 warnings (CSS unused selectors and a11y advisories). We will track a11y cleanups in [[25080912-a11y-warnings]].
- [2025-08-10] Fix VS Code Svelte diagnostics: renamed `src/managers/hotkeyManager/hotkeyManager.svelte.ts` to `hotkeyManager.ts` and updated `index.ts` barrel to prevent the Svelte plugin from parsing it as a Svelte file.

## Updates
- [2025-08-10 20:24 UTC] TypeScript check: `tsc --noEmit` passes with 0 errors after import path corrections and tsconfig tweak.
- [2025-08-10 20:24 UTC] Svelte diagnostics: `svelte-check --tsconfig ./tsconfig.json` shows 0 errors, 15 warnings.
- [2025-08-10 21:36 UTC] VS Code: Svelte language server errors in `hotkeyManager.svelte.ts` resolved by renaming to `.ts`; file is a plain TS module, not a Svelte component.
- [2025-08-10 21:55 UTC] Click-outside regression fixed: action now dispatches both `click_outside` and legacy `onclick_outside`, listens on `pointerdown` + `click`, and `SearchMenu.svelte` updated to use `onclick_outside` (no `on:` prefix). Build succeeds.
- [2025-08-10 21:55 UTC] Dynamic hovering: ensured it only triggers on `Alt` (or `AltGraph`) with no other modifiers; added immediate activation if Alt is pressed while already hovering; restores previous active key on Alt release and on mouseleave.
  - Unused CSS selectors in `src/components/KeyboardLayoutComponent.svelte` for responsive toolbar/content selectors.
  - A11y warnings in `src/components/GroupManagerModal.svelte` (backdrop div click handler) and `src/components/CommandsList.svelte` (non-interactive elements with click/mouse handlers). These are pre-existing and tracked separately.

## Next Steps
- [x] Normalize imports, shims, and tsconfig
- [x] Migrate to Obsidian types, add augmentations
- [x] Align store/component APIs
- [x] Run checks: tsc and svelte-check
- [ ] Optional: narrow InternalPlugin generics and simplify barrels — follow-up
- [ ] Optional: CI for checks — follow-up
