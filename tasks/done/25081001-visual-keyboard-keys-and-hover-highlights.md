---
title: Fix visual keyboard keys mapping and hover highlight contrast
status: done
owner: "@agent"
updated: 2025-08-11 12:19 UTC
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
- [2025-08-10] Simplified modifier-hover preview to rely on held modifiers during hover.
- [2025-08-10] Hover previews add only the hovered key; physically held modifiers are ignored in search.
- [2025-08-10] Hover preview is limited to the Alt modifier and clears on Alt release.
- [2025-08-10] Command list hover now highlights modifiers even if they are active.
- [2025-08-10] Alt preview also triggers when Alt is pressed while already hovering a key.
- [2025-08-10] Alt-only hover preview clears the active key on Alt release without restoring previous selection.

## Next Steps
- [x] Differentiate hover highlight vs search-active highlight
- [x] Restore highlighting for letter and digit keys when hovering command hotkeys.
- [x] Preview hotkeys by holding modifiers and hovering visual keys.
- [x] Correct Windows bottom-row mapping via layout’s per‑OS roles.
- [ ] Sanity-check macOS/Linux layouts unaffected by change — follow-up
- [ ] Verify with keyboard listener on/off and with heatmap scope toggles — follow-up
- [ ] Update screenshots/notes after validation in test-vault — follow-up

## Links
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
