---
title: Clarify filter tooltips and sync search with toggles
status: done
owner: "@you"
updated: 2025-08-08 11:45 UTC
related:
  - SESSION-2025-08-08
---

## Context
Improve clarity of filter controls by adding info icons with tooltips, and fix search/filter synchronization issues (text input + modifiers/toggles). Ensure internal modules are recognizable, and commands list shows human-friendly titles.

## Decisions
- [2025-08-08] Tooltips live on the info icon only; reverted to native title-based tooltip (default Obsidian delay), no tooltip on item text.
- [2025-08-08] Kept icon vertically centered, small left spacing, and reserved width to avoid dropdown width jumps; icon appears on row hover to reduce clutter.
- [2025-08-08] Renamed "Strict Search" to "Strict modifiers filtration" for clarity.
- [2025-08-08] Search reactivity fixed: re-applies on modifier/key changes, group changes, and filter toggles; bound search text between SearchMenu and parent.
- [2025-08-08] Commands list shows command title; filtering matches plugin name + command title (+ ID when "Display IDs" is on).
- [2025-08-08] Modules dropdown shows friendly names for internal modules; ID is exposed via tooltip.
- [2025-08-08] Attempted instant CSS tooltips (pseudo-element and element-based); reverted to native title due to hover/click suppression issues.

## Next Steps
- [ ] Optional: make info icon always visible (not only on row hover).
- [ ] Optional: refine tooltip timing/look to better match Obsidian if needed.
- [ ] Optional: add keyboard focus outlines around info icons for accessibility polish.

## Links
- [[SESSION-2025-08-08]]

