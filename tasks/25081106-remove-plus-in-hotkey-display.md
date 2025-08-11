---
title: Remove '+' separator in hotkey display
status: todo
owner: '@agent'
updated: 2025-08-11 12:00 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

Hotkeys are rendered with `+` separators (e.g., `Ctrl + Shift + K`). Switch to space-separated for compactness and readability.

## Acceptance Criteria

- Commands list displays hotkeys separated by single spaces (e.g., `Ctrl Shift K`).
- Applies to baked display and fallback rendering paths.

## Files

- `src/utils/normalizeKeyDisplay.ts` — change `formatHotkeyBaked` joiner from `' + '` to a single space.
- `src/managers/hotkeyManager/hotkeyManager.svelte.ts` — update `renderHotkey` similarly.

## Next Steps

- [ ] Update joiners and verify no double spaces in edge cases.
- [ ] Manual check in list and popovers where hotkeys appear.

## Links

- `src/utils/normalizeKeyDisplay.ts`
- `src/managers/hotkeyManager/hotkeyManager.svelte.ts`
