---
title: Include system/editor default shortcuts in results
status: done
owner: "@you"
updated: 2025-08-11 12:05 UTC
related:
  - design-note
---

## Context
Some keys show as unassigned, but they invoke built-in OS/editor actions (e.g., Copy/Paste, Undo/Redo, Zoom). These should be listed so users don’t assume they’re free. The list is platform-dependent and should be toggleable.

## Decisions
- [2025-08-09] Add a platform-specific defaults map and surface them as virtual commands under a new toggle.
- [2025-08-09] Initial toggle added under View. Default: off.
- [2025-08-09] Moved toggle to Filter dropdown per feedback; wired to `DisplaySystemShortcuts` setting.
- [2025-08-09] Documented included shortcuts in `public/system-shortcuts.md`.
- [2025-08-09] Added filter info icons + tooltips; adjusted commands list spacing and stripped duplicate plugin prefix.

## Next Steps
- [ ] Expand default shortcuts coverage and verify per platform
- [ ] Consider badges/labels for system entries in UI
- [ ] Validate in macOS and Windows vaults
- [x] Add platform-aware defaults as virtual commands
- [x] Add “Include system shortcuts” toggle and move to Filter
- [x] Add tooltips for filter items; adjust command row styling

## Links
- [[design-note]]
 - public/system-shortcuts.md
