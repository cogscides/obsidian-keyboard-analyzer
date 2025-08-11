---
title: Fix TypeScript and Svelte checks
status: in_progress
owner: '@agent'
updated: 2025-08-10 21:36 UTC
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
- [ ] Optional: Convert clickable non-interactive elements to buttons/links or add key handlers and appropriate ARIA roles (see [[25080912-a11y-warnings]]).
- [ ] Optional: Revisit barrels to avoid explicit `.ts` imports and remove `allowImportingTsExtensions` later.

## Plan

Phase 1 — Fast hygiene (imports and shims)

- [x] Normalize import paths casing:
  - Replace `../Components/...` with `../components/...` in:
    - `src/components/KeyboardLayoutComponent.svelte`
    - `src/components/KeyboardComponent.svelte`
    - `src/views/ShortcutsView.ts`
    - Any other references discovered by grep
- [x] Add a shim for `clickOutside.js`:
  - Create `src/types/shims.d.ts` with a minimal module declaration for `../utils/clickOutside`.
- [x] Remove the unused `@ts-expect-error` in `visualKeyboardsManager.svelte.ts` and prefer a runtime-safe guard for Platform checks.

Phase 2 — Typings migration to `obsidian`

- [x] If needed, update `src/interfaces/Interfaces.ts` imports to use `from 'obsidian'` instead of `from 'obsidian-typings'`.
- [x] Adapt to current Obsidian types:
  - Fix imports: `Command`, `Hotkey`, `Modifier`, `App`, `InternalPlugins`, `KeymapInfo`, `InternalPlugin`, `InternalPluginInstance` (verify each export exists in `node_modules/obsidian/obsidian.d.ts`).
  - Update `UnsafeInternalPlugin` / `UnsafeInternalPluginInstance` to satisfy required generics (use concrete or generic params based on definitions; fallback to `<unknown>` or minimal local interfaces if necessary).
- [x] Introduce module augmentation:
  - Add `src/types/obsidian-augmentations.d.ts` to extend `App` with the internal members we access:
    - `commands: UnsafeCommands`
    - `hotkeyManager` (note lowercase, aligning to runtime)
    - `plugins.plugins: Record<string, { manifest: { name: string } }>`
    - `internalPlugins.getEnabledPlugins(): Array<...>` minimal shape used
  - Remove usages of `HotKeyManager` (capital-K) or alias it to `hotkeyManager` via typing.

Phase 3 — Hotkey data model alignment

- [x] Update `hotkeyEntry` to extend `Hotkey` and add fields:
  - `interface hotkeyEntry extends Hotkey { isCustom: boolean; backedModifiers?: string }`
- [x] Ensure `convertKeymapInfoToHotkey` returns a valid `Hotkey`:
  - Normalize `modifiers` to proper `Modifier[]`
  - Guarantee `key` is a string (empty if null)
- [x] Adjust call sites expecting `Hotkey` to accept `hotkeyEntry` (now a subtype).

Phase 4 — Store API and component usages

- [x] Inspect `src/stores/activeKeysStore.svelte.ts` and reconcile methods used by components:
  - Add or export `handlePhysicalKeyDown` / `handlePhysicalKeyUp` if missing, or
  - Update component calls to the existing methods in the store.
- [x] Fix `KeyboardKey.svelte` types:
  - Ensure `key` prop includes `type` and that `key.code || key.label` is non-undefined where required (narrow or default).

Phase 5 — Internal plugin typing

- [ ] Replace brittle `InternalPlugin`/`InternalPluginInstance` usages with narrowed shapes used by code:
  - Use minimal interfaces for `.instance.id`, `.instance.name`, optional `.instance.commands`.
  - Or provide correct generic parameters if available (verify in `obsidian.d.ts`).

Phase 6 — Re-run checks and refine

- [ ] Run `npx tsc -p tsconfig.json --noEmit` — target: 0 errors
- [ ] Run `npx svelte-check --tsconfig ./tsconfig.json` — target: 0 errors or only a11y warnings covered by [[25080912-a11y-warnings]]
- [ ] If residual typing errors remain, add targeted module augmentations or narrow casts with comments.

Phase 7 — Cleanup and docs

- [ ] If `obsidian-typings` becomes unused, remove it from `devDependencies` in a separate PR/commit.
- [ ] Document the typing approach in `AGENTS.md` and/or code comments.
- [ ] Add screenshots only if UI changes were needed.

## Acceptance Criteria

- TypeScript: `npx tsc -p tsconfig.json --noEmit` returns 0 errors.
- Svelte: `npx svelte-check` returns 0 errors; a11y warnings moved/left to [[25080912-a11y-warnings]] unless trivially fixed.
- No case-sensitivity import errors remain.
- Hotkey-related code compiles and runtime behavior unchanged for listing and duplicate detection.

## Notes / Follow-ups

- Evaluate removing `obsidian-typings` after migration.
- Consider adding CI job for `tsc` and `svelte-check` to prevent regressions.
