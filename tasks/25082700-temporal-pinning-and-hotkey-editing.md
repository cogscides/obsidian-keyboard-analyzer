---
title: Temporal pinning and hotkey editing in Commands list
status: in_progress
owner: "@agent"
updated: 2025-08-28 19:10 UTC
related: []
---

## Context

Add two related UX features to the Commands list: (1) temporal pinning of selected commands so they appear at the top for easy comparison/analysis, and (2) inline controls to add a new hotkey or restore a command’s hotkeys to default, mirroring Obsidian’s built‑in Hotkeys UX for capture/confirmation.

## Decisions

- [2025-08-27] Pinning scope — Session‑only. Clear pinned commands when the plugin view is closed/detached. No persistence across restarts. A later opt‑in per‑vault persistence can be considered if requested.
- [2025-08-27] UI — Show a distinct "Pinned" section above the main list when at least one command is pinned. Provide pin/unpin affordance per row; keep pinned rows fully interactive for comparison.
- [2025-08-27] Icons — Place a refresh icon to the left of the hotkeys to restore defaults (with confirmation), and a plus icon to the right of the hotkeys to add a new binding. Use Obsidian’s built‑in icon set if available for visual consistency.
- [2025-08-27] Hotkey capture — Reuse a compact inline capture element styled like Settings → Hotkeys (e.g., `<div class="setting-command-hotkeys"><span class="setting-hotkey mod-active">Press hotkey...</span></div>`). Capture modifier + key chords, support escape/cancel, and validate conflicts.
- [2025-08-27] Conflicts — Detect collisions with existing hotkeys and present a clear warning with options: proceed (and override), or cancel. If overriding, display which commands will be affected.
- [2025-08-27] Restore default — Show a confirmation dialog summarizing exactly what will change (list of custom bindings to remove/replace) before applying defaults.
- [2025-08-28] Applying hotkey changes — Use internal APIs (preferred, confirmed available):
  - Available methods: `getHotkeys(id)`, `getDefaultHotkeys(id)`, `setHotkeys(id, keys)`, `removeHotkeys(id)`, `save()`, `load()`, `bake()`.
  - Assign: call `setHotkeys(id, keys)` → `save()` → `bake()`; refresh our `commandsManager` index.
  - Restore defaults: call `removeHotkeys(id)` (clears custom entry so defaults apply) → `save()` → `bake()`; refresh index.
  - Always show confirmation with an explicit diff and conflict list before applying.
  - Undo: keep a one-level undo stack (per change) in memory; expose an "Undo last hotkey change" action in the UI.
  - Fallback assist: if any call fails, open Settings → Hotkeys pre‑filtered and copy captured chord to clipboard.
- [2025-08-28] Live refresh — Hotkey reads now use app.hotkeyManager live data to avoid stale cache; added a subscription to Commands index changes to recompute filters.
- [2025-08-28] UI parity — Edit mode via toolbar; restore before chips; add after chips; pin aligns with other actions and pinned box appears on top.
- [2025-08-28] System/Default guards — Hide edit/restore for system shortcuts; hide restore when custom equals default or no custom.
- [2025-08-28] Capture correctness — Use KeyboardEvent.code (layout‑independent) and explicit modifiers (Meta, Ctrl, Alt, Shift) for accurate Hyper chords on macOS.
- [2025-08-28] Persistence normalization — Canonicalize modifiers for storage:
  - Expand `Mod` to platform primary first (macOS: Meta, Win/Linux: Ctrl).
  - If both primaries present, collapse the platform primary to `Mod` and keep the other explicit (macOS: `Mod+Ctrl+…`; Win/Linux: `Mod+Meta+…`).
  - Else collapse the single primary to `Mod`. Uppercase single-letter keys for persistence.
- [2025-08-28] Default-equivalent assignment — Match Obsidian: if user assigns the same chord as default, still write a Custom entry (not a no‑op).
- [2025-08-28] Logging format — Emit single‑line logs for hotkey actions to simplify sharing and triage.

## Investigation Plan (Hotkeys)

- Map internal APIs exposed by `app.hotkeyManager` in current Obsidian versions (done; see above).
- Define a minimal schema adapter for `.obsidian/hotkeys.json` (Record<string, { modifiers: string; key: string }[]>) with tolerant parsing and preservation of unrelated keys and formatting.
- Define conflict detection rules shared across strategies; show clear summaries before applying.
- Design refresh sequence after changes: prefer internal reload if available; else guide user to reopen the plugin view or restart Obsidian.

## Next Steps

- [x] Confirm pinning model — session‑only; clear on view close (owner)
- [x] Implement runtime capability detection for internal hotkey APIs (owner)
- [x] Add store state for pinnedCommandIds and helpers (toggle, clear) (owner)
- [x] Update Commands list UI to render a Pinned section + pin/unpin control (owner)
- [x] Add inline HotkeyCapture component and wire to plus icon (owner)
- [x] Implement conflict detection and messaging for new bindings (owner)
- [x] Implement restore‑to‑default with confirmation dialog and clear diff summary (owner)
- [x] Live refresh hook + use live hotkeys (owner)
- [x] Ensure grouped-by-plugin view also shows edit controls consistently (owner)
- [x] Add per-chip delete UI (optional, parity with core) (owner)
- [x] Canonicalize persistence — collapse primary to 'Mod' for storage to match core and avoid dupes (owner)
- [x] Add debug logging in hotkey actions (owner)
- [ ] Verify on macOS/Windows/Linux layouts and common modifiers (Cmd/Ctrl/Alt/Opt) (owner)
- [x] Update README with feature usage notes and any settings (owner)
- [ ] Collect user feedback on inline editing UX, Hyper behavior, and log readability (owner)

## Recent Issues/Findings

- [2025-08-28] Refresh did not reflect new hotkeys without app restart. Root cause: HotkeyManager queried cached Commands index; fix: use app.hotkeyManager live reads and subscribe to index updates in the view.
- [2025-08-28] Duplicated display when custom equals default. Fix: de‑dup all hotkeys and hide restore when custom equals default; hide edit for System Shortcuts.
- [2025-08-28] Wrong key when using Hyper on macOS (e.g., ⌘ ⌥ ⇧ Ô). Cause: using KeyboardEvent.key and collapsing modifiers to Mod. Fix: use KeyboardEvent.code and capture Meta+Ctrl separately.
- [2025-08-28] Duplicate `Cmd+S` showing as three chips (`[Meta S] [Meta s] [Meta s]`). Plan: canonicalize key lower-case for comparison and storage; uppercase single letters only for display; de‑dup on `(sorted modifiers, normalized key)`.
- [2025-08-28] Hyper chord not triggering when assigned via plugin (but works via core). Plan: sort modifiers canonically before setHotkeys; ensure key from `KeyboardEvent.code`; if needed, call `save()→load()→bake()`; verify `app.hotkeyManager.customKeys[id]` shape matches core (string[] modifiers, normalized key).
- [2025-08-28] Modifier order inconsistencies in lists. Plan: enforce canonical sort order (mac: Meta, Ctrl, Alt, Shift; Win/Linux: Ctrl, Alt, Shift, Meta) before write; ensure renderer and comparer use same order.
- [2025-08-28] Edit Mode polish. Plan: hide star/add‑to‑group during edit; disable pin when not editing; make pinned rows not filterable; clear pins when edit mode exits; align Undo overlay icon/text horizontally; add per‑chip delete (“x”) in edit mode.
- [2025-08-28] Persistence normalization. Done: added canonicalizeModifiersForPersist() to collapse Meta/Ctrl to 'Mod' when appropriate; keeps both when both primaries are present.
- [2025-08-28] Align with Obsidian behavior — Default-equivalent assignment now writes a Custom entry (previous no‑op removed).
- [2025-08-28] Logging. Done: hotkeyActions now logs before/after states for assign, remove, and restore when dev logging is enabled.
- [2025-08-28] Grouped view parity. Done: restore icon now appears before hotkey chips; add icon after chips; system/default guards applied same as flat view.
- [2025-08-28] Per‑chip delete. Done: added “×” control on chips in Edit mode; removes a single binding using internal APIs; Undo banner supports quick revert.

## Links

- Obsidian Hotkeys docs: https://docs.obsidian.md/Files+and+folders/Customize+keyboard+shortcuts
- [[design-note]] (add details/visuals as decided)
---
