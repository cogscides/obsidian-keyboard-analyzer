---
title: Fix key-only filter, hover preview, and dev inspector
status: done
owner: "@agent"
updated: 2025-08-16 12:00 UTC
related:
  - [[20250816-hotkey-normalization-cleanup]]
---

## Context

Commands list showed empty results when filtering by a single key without modifiers; hover highlights on the visual keyboard stopped after VK interactions; and the dev inspector lacked raw input visibility. Definition of done: key-only searches show commands using that key regardless of modifiers, hover preview remains stable after VK use, and the dev inspector displays raw VK/physical inputs and last-clicked command hotkeys for debugging.

## Decisions

- [2025-08-16] Treat key-only queries as matching any modifiers; require only the key match.
- [2025-08-16] Expand `normalizeKey` for numpad/operator aliases to align VK clicks with hotkey keys.
- [2025-08-16] Map `MetaLeft/Right` to abstract `Meta` in store; retain platform baking at render/match time.
- [2025-08-16] Always record physical `keydown` in the store for dev inspector, regardless of listen mode.
- [2025-08-16] Record last-clicked command hotkeys (raw + normalized) for quick inspection.

## Next Steps

- [x] Implement key-only match in matcher (agent)
- [x] Expand normalization for numpad and symbols (agent)
- [x] Keep hover preview stable post-VK interactions (agent)
- [x] Add dev inspector data for raw VK/physical and last clicked command (agent)

## Progress Log

- [2025-08-16 11:20 UTC] Investigated mismatch: key-only queries returned none due to strict modifier equality; normalization gaps for numpad/symbols.
- [2025-08-16 11:35 UTC] Implemented key-only behavior in `matchHotkey` (accept any modifiers when none selected); added numpad/operator aliases in `normalizeKey`.
- [2025-08-16 11:45 UTC] Ensured `MetaLeft/Right` normalize to `Meta` in `ActiveKeysStore` to keep modifiers consistent.
- [2025-08-16 11:55 UTC] Added dev capture: `recordPhysicalRaw`, `lastVKClickRaw`, and last command hotkeys (raw + normalized). Wired inspector UI to show values.
- [2025-08-16 12:00 UTC] Verified in UI: key-only searches return commands; VK hover remains; dev inspector shows raw inputs and last command hotkeys. Task closed and moved to done.

## Links

- Code: `src/utils/modifierUtils.ts`, `src/stores/activeKeysStore.svelte.ts`, `src/components/KeyboardComponent.svelte`, `src/components/CommandsList.svelte`, `src/components/KeyboardLayoutComponent.svelte`
---
