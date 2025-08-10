---
title: Fix TypeScript and Svelte checks
status: todo
owner: '@agent'
updated: 2025-08-10 12:00 UTC
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

- Source of truth for Obsidian types: standardize on `obsidian` package imports; eliminate or wrap `obsidian-typings` usage via a small compatibility layer if needed.
- Handle internal APIs via module augmentation: prefer augmenting `App` instead of broad `as` casts; tolerate narrow `unknown as` casts where necessary.
- Unify hotkey model: make our `hotkeyEntry` extend `Hotkey` and add custom fields; provide a conversion helper for `KeymapInfo`→`Hotkey`.
- Normalize import casing across the project to `components/` (lowercase) to avoid case conflicts.
- Keep a11y fixes tracked separately; only adjust the most egregious cases if easy while focusing on typing/build green.

## Plan

Phase 1 — Fast hygiene (imports and shims)

- [ ] Normalize import paths casing:
  - Replace `../Components/...` with `../components/...` in:
    - `src/components/KeyboardLayoutComponent.svelte`
    - `src/components/KeyboardComponent.svelte`
    - `src/views/ShortcutsView.ts`
    - Any other references discovered by grep
- [ ] Add a shim for `clickOutside.js`:
  - Create `src/types/shims.d.ts` with a minimal module declaration for `../utils/clickOutside`.
- [ ] Remove the unused `@ts-expect-error` in `visualKeyboardsManager.svelte.ts` and prefer a runtime-safe guard for Platform checks.

Phase 2 — Typings migration to `obsidian`

- [ ] If needed, update `src/interfaces/Interfaces.ts` imports to use `from 'obsidian'` instead of `from 'obsidian-typings'`.
- [ ] Adapt to current Obsidian types:
  - Fix imports: `Command`, `Hotkey`, `Modifier`, `App`, `InternalPlugins`, `KeymapInfo`, `InternalPlugin`, `InternalPluginInstance` (verify each export exists in `node_modules/obsidian/obsidian.d.ts`).
  - Update `UnsafeInternalPlugin` / `UnsafeInternalPluginInstance` to satisfy required generics (use concrete or generic params based on definitions; fallback to `<unknown>` or minimal local interfaces if necessary).
- [ ] Introduce module augmentation:
  - Add `src/types/obsidian-augmentations.d.ts` to extend `App` with the internal members we access:
    - `commands: UnsafeCommands`
    - `hotkeyManager` (note lowercase, aligning to runtime)
    - `plugins.plugins: Record<string, { manifest: { name: string } }>`
    - `internalPlugins.getEnabledPlugins(): Array<...>` minimal shape used
  - Remove usages of `HotKeyManager` (capital-K) or alias it to `hotkeyManager` via typing.

Phase 3 — Hotkey data model alignment

- [ ] Update `hotkeyEntry` to extend `Hotkey` and add fields:
  - `interface hotkeyEntry extends Hotkey { isCustom: boolean; backedModifiers?: string }`
- [ ] Ensure `convertKeymapInfoToHotkey` returns a valid `Hotkey`:
  - Normalize `modifiers` to proper `Modifier[]`
  - Guarantee `key` is a string (empty if null)
- [ ] Adjust call sites expecting `Hotkey` to accept `hotkeyEntry` (now a subtype).

Phase 4 — Store API and component usages

- [ ] Inspect `src/stores/activeKeysStore.svelte.ts` and reconcile methods used by components:
  - Add or export `handlePhysicalKeyDown` / `handlePhysicalKeyUp` if missing, or
  - Update component calls to the existing methods in the store.
- [ ] Fix `KeyboardKey.svelte` types:
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
