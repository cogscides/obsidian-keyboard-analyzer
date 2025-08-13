---
title: Quick View — Refactor to reuse existing logic and components
status: in_progress
owner: '@agent'
updated: 2025-08-13 02:05 UTC
related:
  - [[25081213-quick-view-popover-for-fast-shortcuts]]
  - [[25081301-quick-view-ui-fixes]]
---

## Context

Current Quick View implementation duplicates portions of filtering, key-listen behavior, and command row rendering that already exist in the main plugin view. To improve DX, maintainability, and consistency, we should extract shared primitives (stores, helpers, compact row renderer) and have Quick View compose these instead of re-implementing.

## Goals

- Centralize search/filter state and keyboard-listen state so both full view and Quick View share consistent behavior.
- Reuse the existing commands list row rendering and styling (with a compact variant) to avoid UI drift.
- Keep Quick View as a thin shell (popover, positioning, focus trap) that wires into shared primitives.

## Decisions

- [2025-08-13] Proposed shared primitives:
  - Search/listen store (text query, active modifiers/key, debounce, handlers).
  - Selector utilities that wrap [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts) filtering and group settings access.
  - Compact CommandsList row renderer extracted from [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte) or parameterized via props/slots to reduce duplication.
- [2025-08-13] Avoid tight coupling:
  - Keep shared primitives framework-agnostic (plain TS with minimal Svelte reactivity), so both views can adopt without circular dependencies.
- [2025-08-13] Gradual migration:
  - Start by adopting shared filter/search functions, then move hotkey display helpers, and finally the compact row renderer.

## Proposed Plan

- [ ] Inventory duplicated logic across:
  - [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
  - [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
  - [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [ ] Extract a shared search/listen module:
  - [ ] Plain TS utilities to manage query, debounce, and listen mode toggling rules (including Mod+F parity).
  - [ ] Functions exposed to compute filtered commands via [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts).
- [ ] Create a compact row renderer strategy:
  - [ ] Either: a prop-driven variant inside [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
  - [ ] Or: a separate `CommandsListCompact.svelte` that reuses shared helpers for badges, hotkey chips, and duplicate/custom highlighting.
- [ ] Replace Quick View internal logic with shared primitives:
  - [ ] Remove duplicate filtering/hotkey formatting and rely on shared helpers.
  - [ ] Keep Quick View focused on popover shell: positioning, focus trap, anchors, and resize.

## Risks

- Refactor scope creep; mitigate with staged rollouts and test in both views after each step.
- Subtle behavioral differences between views (e.g., group-mode specifics). Address via opt-in flags on shared helpers.

## Links

- [`src/components/SearchMenu.svelte`](src/components/SearchMenu.svelte)
- [`src/components/CommandsList.svelte`](src/components/CommandsList.svelte)
- [`src/components/QuickViewPopover.svelte`](src/components/QuickViewPopover.svelte)
- [`src/managers/commandsManager/commandsManager.svelte.ts`](src/managers/commandsManager/commandsManager.svelte.ts)

## Notes (2025-08-13)

Quick View now implements Mod+F/Esc parity, multiple hotkeys chips, and resizable height with persistence. Filtering/listen logic is still internal to the component; next step is to extract:

- A small search/listen store (query, debounce, listen toggle rules) consumable by both Quick View and full view.
- Shared hotkey formatting helpers already exist; ensure duplicate/custom checks come from one place.
- Evaluate parameterizing `CommandsList.svelte` with a compact prop or creating `CommandsListCompact.svelte` that reuses helpers.
