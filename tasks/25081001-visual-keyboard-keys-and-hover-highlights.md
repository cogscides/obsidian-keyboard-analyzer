---
title: Fix visual keyboard keys mapping and hover highlight contrast
status: in_progress
owner: "@agent"
updated: 2025-08-10 12:00 UTC
related:
  - [[25080914-hotkey-groups]]
---

## Context
Two UX issues affect the visual keyboard and discovery flow:
- On Windows, bottom-row modifier positions are swapped: `Win` and `Alt` appear in each other’s positions. macOS bottom-row modifiers look and behave correctly.
- Hovering a hotkey in the commands list highlights the visual keyboard using the same color as active keys from the search bar, making it hard to distinguish hover-induced highlights from search-active highlights.

Definition of done:
- Windows bottom-row modifiers (`Win`, `Alt`) render in correct positions and respond properly for highlights/weights.
- Hover highlights use a distinct visual style from search-active keys so both can be understood at a glance.

## Decisions
- [2025-08-09] Track this as a focused visual/UX fix before next build.
- [2025-08-10] Restored command-hover highlighting for literal keys.
- [2025-08-10] Added modifier-hover hotkey preview.

## Next Steps
- [ ] Correct Windows bottom-row mapping for `Win` and `Alt` in keyboard layout/config.
  - User note: they are placed correctly, but on Windows emulation `Meta` still be produced by clicking on Windows key. `Ctrl` modifier has just few shorcuts.
- [x] Differentiate hover highlight vs search-active highlight (color or border style), ensure accessible contrast in light/dark.
- Visual keyboard's - Other keys:
  - the backspace key `⌫` produces the `⌫` symbol in search, but I think it should be Backspace. Please create new task for correctly displaying (some sort of baked) keys and modifiers in search menu and in the commands list. Please also add a dev log feature toggle to turn this on/off for ease of debugging.
  - Clicking on `Arrows` visual keys producing correct baked `arrows` in search menu, but in command list they displayed as `Arrow{direction}`
- [x] Restore highlighting for letter and digit keys when hovering command hotkeys.
- [x] Preview hotkeys by holding modifiers and hovering visual keys.
- [ ] Sanity-check macOS/Linux layouts unaffected by change.
- [ ] Verify with keyboard listener on/off and with heatmap scope toggles.
- [ ] Update screenshots/notes after validation in test-vault.

## Links
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
