---
title: View setting — Toggle plugin name badge in commands list
status: done
owner: "@agent"
updated: 2025-08-09 20:25 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
  - [[250808-ux-filter-view-cleanup]]
---

## Context
Plugin name badges improve scanability but can consume horizontal space. Provide a View setting to show/hide the plugin name badge for compact lists while preserving clarity in grouped view.

## Decisions
- Place setting under View (presentation), default On to match current behavior.
- When Group by plugin is active and badges are Off, rely on plugin headers; do not duplicate plugin names in rows.
- Ensure compatibility with Highlight Built‑ins, Featured sorting, and Display IDs.

## Acceptance Criteria
- Toggle Off hides badges in both flat and grouped views; grouped headers still show plugin names.
- No duplicate plugin name text in command title when badges are hidden.
- Works with Highlight Built‑ins and Featured First consistently.

## Next Steps
- [x] Add `ShowPluginBadges` to view settings/store with persistence (owner)
- [x] Update `CommandsList.svelte` row rendering to conditionally show badge (owner)
- [x] Adjust title formatting to avoid duplicate plugin text when badges are off (owner)
- [x] Expose toggle in `SearchMenu.svelte` View menu with tooltip (owner)
- [x] Manual verification in flat and grouped modes; screenshots (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]
- [[250808-ux-filter-view-cleanup]]
