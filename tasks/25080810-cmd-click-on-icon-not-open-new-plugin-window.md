---
title: Status bar Cmd/Ctrl+Click should open new pane
status: todo
owner: '@unassigned'
updated: 2025-08-08 10:48 UTC
related: []
---

# Task: Status bar Cmd/Ctrl+Click should open new pane

- Status: todo
- Owner: @unassigned
- Updated: 2025-08-08 10:43 UTC
- Related: <add issue/PR links>

## Context

Clicking the keyboard icon in the status bar does not open a new plugin pane. It focuses the existing view instead. Expected: `Ctrl/Cmd + Click` opens a new pane (split).

## Decisions

- 2025-08-08: Treat `Ctrl/Cmd + Click` as a split open; reserve plain click to focus/reveal existing view.
- 2025-08-08: Keep `Alt` unassigned (or for future behavior) to avoid confusion.

## Next Steps

- [x] Reproduce on macOS and Windows; confirm current modifiers in `onStatusBarClick`.
- [x] Update logic so meta-only click -> `split`; document behavior in README.
- [ ] Add a small note in tooltip: “Cmd/Ctrl+Click to open in new pane”.

## Progress Log

- 2025-08-08 10:43 UTC: Backfilled task with template; identified mismatch (code currently requires `Alt` to split).

## Links

- [[AGENTS.md]]
