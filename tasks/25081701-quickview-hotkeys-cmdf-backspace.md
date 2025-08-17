---
title: Quick View polish, privacy-safe hotkeys, Cmd/Ctrl+F and Backspace behavior
status: done
owner: "@agent"
updated: 2025-08-17 02:58 UTC
related: []
---

## Context

Polish Quick View popover and fix keyboard behaviors: preserve privacy (no key detail logs while listener off), add GitHub link near Donate, improve popover layout/resize, make Cmd/Ctrl+F focus/toggle reliably without hijacking other panes, and ensure Backspace pops active key/modifiers when the search is focused and empty.

## Decisions

- [2025-08-17] Privacy: do not record/log key details when listener is off; keep global listeners attached but no-op. Kept minimal “ignored” log and suppressed for Backspace to reduce noise.
- [2025-08-17] Quick View: capture keys only while popover is open; scope to events within popover; focus search on open; arrow navigation from input; Enter runs command; local listener toggled with Mod+F when input focused.
- [2025-08-17] Resize: support vertical and horizontal; clamp to viewport; suspend reflow while resizing to avoid drift.
- [2025-08-17] UI: compact list styling for popover; added GitHub button left of Donate in main toolbar using lucide `Github`.
- [2025-08-17] Main view Mod+F: handle only when the Keyboard Analyzer pane is the active leaf (view type check); avoids hijacking when editing notes.
- [2025-08-17] Backspace pop: when search is focused and empty, Backspace clears `activeKey` first, then pops last modifier, with immediate refilter.

## Next Steps

- [ ] a11y: Review and address Svelte a11y warnings (some preexisting) or add scoped `svelte-ignore` where appropriate. (owner)
- [ ] Settings: Optional — add Quick View size reset in plugin settings. (owner)

## Links

- Files touched:
  - `src/components/KeyboardComponent.svelte` — privacy logging guard; active-view Mod+F/Esc gating.
  - `src/components/SearchMenu.svelte` — input `onkeydown`; Backspace pops key/modifiers when empty search.
  - `src/components/QuickViewPopover.svelte` — local key handling, resize, compact styling, focus on open.
  - `src/components/KeyboardLayoutComponent.svelte` — GitHub button near Donate.

