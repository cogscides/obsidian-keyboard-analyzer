---
title: Preserve editor focus after Quick View interaction
status: in_progress
owner: "@agent"
updated: 2025-08-20 13:55 UTC
related:
  - [[better-command-palette]]
---

## Context

Users reported losing caret/focus in their current workflow after using the Quick View popover (opening, running a command, or closing). The desired behavior is to return focus to whatever element had it before opening Quick View (usually the editor), similar to Obsidian’s SuggestModal-based palettes.

Definition of done: Quick View closes and focus reliably returns to the prior focused element, except when explicitly opening the full view (where focus should move to that view).

## Decisions

- [2025-08-20] Implement focus capture/restore in plugin:
  - Capture `document.activeElement` before opening Quick View (status bar click, context menu, command invocation, and as a fallback inside `openQuickView`).
  - On close, restore focus to the captured element if still connected, using `focus({ preventScroll: true })`.
- [2025-08-20] Add close reason/option from the popover:
  - Pass `{ restoreFocus: false }` when opening the full view, to avoid stealing focus from the newly opened leaf.
  - Default to `{ restoreFocus: true }` on Esc, outside click, and after executing a command.
- [2025-08-20] Listener-mode robustness and pinned Esc behavior:
  - If the previously focused element cannot be focused (e.g., CM view re-rendered), fall back to focusing the active Markdown editor via `MarkdownView.editor.focus()`.
  - Make `Esc` close the popover even when pinned (previously Esc did nothing if pinned). The first Esc exits listener-mode if active; a subsequent Esc closes the popover.

## Next Steps

- [ ] Manual test on macOS and Windows editors (CM6): open via status bar, via command; run a command; Esc/Outside-click; verify focus returns.
- [ ] Verify full view open keeps focus on the new view (split/new tab modifiers respected).
- [ ] QA: ensure no regressions with listener mode and global key handlers.

## Links

- [[better-command-palette]]
