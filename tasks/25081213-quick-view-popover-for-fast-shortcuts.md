---
title: Quick View — Popover for fast shortcuts and command access
status: todo
owner: '@agent'
updated: 2025-08-12 11:51 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
  - [[25080914-hotkey-groups]]
---

## Context

Provide a lightweight, fast-access popover to quickly view and filter keyboard shortcuts and commands without opening the full Keyboard Analyzer view. The UX is similar to compact popups (e.g., MySnippets-style), with an Obsidian command to open it. On double-run (invoke command twice quickly), optionally enter a key-listen mode that filters results by the pressed modifiers/keys.

## Acceptance Criteria

- A new command “Keyboard Analyzer: Open Quick View” opens a compact popover anchored to the current pane.
- Popover shows:
  - Search input with debounce and clear (x).
  - List of commands with their primary shortcut and plugin badge (respects existing badge visibility setting).
  - Optional filter chip(s) for current group or plugin; toggling updates list.
- Key listener mode:
  - If invoked twice within a short window (e.g., 500 ms), enable a key-listen mode that filters results by active modifiers/keys.
  - While listening, display active modifiers visually; pressing Esc exits listening.
- Performance:
  - Shows results instantly for large command sets (virtualized list or capped results with “more”).
  - No layout jank; max-height is configurable in settings; list scrolls within the popover.
- Accessibility:
  - Focus traps inside the popover; Tab order logical; close with Esc; aria-expanded/controls on trigger.
- Persistence:
  - Remembers last size (if resizable) and last-used filters optionally; no heavy state persisted.
- The popover never renders off-screen; it flips/shifts as needed.

## Decisions

- [2025-08-12] Pending — Determine activation model:
  - A) Two quick invocations of the same command to enable listen mode.
  - B) Single command to open popover, press L to toggle listen mode.
- [2025-08-12] Pending — Use `@floating-ui/dom` for positioning vs small custom utility (align with [[25081103-fix-popover-overflow]]).
- [2025-08-12] Pending — Result cap (e.g., 100) and debounce (120–200 ms).

## Files

- `src/components/QuickViewPopover.svelte` — popover shell, focus trap, keyboard handling, list rendering.
- `src/components/CommandsList.svelte` — reuse row rendering if feasible; otherwise add a compact row variant.
- `src/managers/commandsManager/commandsManager.svelte.ts` — search API for commands by name/plugin; optional limit param.
- `src/managers/hotkeyManager/hotkeyManager.svelte.ts` — provide key-listen signals for modifiers/keys.
- `src/main.ts` — register “Open Quick View” command and optional double-run detection.
- `src/utils/clickOutside.js` — verify behavior with popover portal/positioning.

## Next Steps

- [ ] Create `QuickViewPopover.svelte` with max-height style and internal scroll.
- [ ] Add command in [`src/main.ts`](src/main.ts) to open/close the popover; implement double-run listen toggle.
- [ ] Wire debounced search using Commands Manager API; show command + primary hotkey + plugin badge.
- [ ] Add optional filters: by active group and by plugin; ensure they interact with search predictably.
- [ ] Implement listen mode UI: show active modifiers/keys; Esc to exit; integrate with `hotkeyManager`.
- [ ] Positioning: adopt shared solution from [[25081103-fix-popover-overflow]] (flip/shift/clamp).
- [ ] A11y pass (focus trap, roles, labels) and manual QA with large command sets.

## Links

- [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
- [`src/managers/hotkeyManager/hotkeyManager.svelte.ts`](src/managers/hotkeyManager/hotkeyManager.svelte.ts)
- [[25081103-fix-popover-overflow]]
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
