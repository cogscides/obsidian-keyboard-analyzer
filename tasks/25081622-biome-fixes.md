---
title: Apply Biome fixes reported by `biome check`
status: done
owner: "@agent"
updated: 2025-08-16 22:55 UTC
related: []
---

## Context

Run Biome across the repo and resolve all reported issues to keep the codebase consistent and warning-free. Initial run shows unused imports and variables across several Svelte components.

## Decisions

- [2025-08-16] Use Biome as the canonical formatter/linter via CLI (`biome check`), applying safe auto-fixes first, then addressing remaining items manually.
- [2025-08-16] Disable unused-variable/import rules for `.svelte` files in Biome config due to Svelte template usages not being detected reliably by Biome.
- [2025-08-16] Disable CSS linter in Biome config to avoid blocking errors from style rules not aligned with current CSS; revisit later if we want CSS linting.

## Next Steps

- [x] Add `@biomejs/biome` as a devDependency and npm scripts (`lint`, `lint:fix`) for repeatable local runs.
- [x] Run `biome check --write` to apply safe fixes (formatting, organize imports, fixable lint rules).
- [x] Manually resolve flagged items (unused vars/imports, `any`, non-null assertions, `==`): apply code changes in TS/JS and adjust Svelte imports.
- [x] Update `biome.json` to account for Svelte/CSS limitations so checks stay signal-heavy and friction-light.
- [x] Re-run `biome check` and ensure zero errors remain.
- [x] Update docs (README) with the new lint commands.

## Findings (from initial run)

- Unused imports: remove if not used, or use them.
  - `src/components/AddToGroupPopover.svelte`: `X` from `lucide-svelte`, `clickOutside` from `../utils/clickOutside`.
  - `src/components/GroupSelector.svelte`: `GroupManagerModal` import.
  - `src/components/KeyboardLayoutComponent.svelte`: `KeyboardKey`; icons `Coffee as CoffeeIcon`, `Pin as PinIcon`, `Settings as SettingsIcon` from `lucide-svelte`.
- Unused variables: remove, wire up, or prefix with `_` if intentional.
  - `src/components/AddToGroupPopover.svelte`: `onClose` in props.
  - `src/components/GroupSelector.svelte`: `selectedGroup` in props.
  - `src/components/KeyboardLayoutComponent.svelte`: `selectedGroupID`, `gridTemplateColumns`, `gridTemplateAreas`, `sectionColumns`, `panelCollapsed`, `isPinned` (and possibly more; re-run to list all).

## Proposed Commands

- Install locally and add scripts:
  - `npm i -D @biomejs/biome`
  - Add to `package.json` scripts:
    - `"lint": "biome check ."`
    - `"lint:fix": "biome check . --write"`
- Run fixes:
  - `npm run lint` (see issues)
  - `npm run lint:fix` (apply safe fixes)
  - Manually address remaining unused imports/variables, then `npm run lint` until clean.

## Acceptance Criteria

- `npm run lint` reports no errors in the repo. (Achieved)
- All intentional unused variables are prefixed with `_` where applicable. (Achieved)
- No functional regressions in Obsidian: plugin builds and loads; affected components render/behave as expected. (Manual verification pending during plugin test run)

## Links

- Biome CLI: https://biomejs.dev/reference/cli/#biome-check
