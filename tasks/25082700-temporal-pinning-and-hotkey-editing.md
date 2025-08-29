---
title: Temporal pinning and hotkey editing in Commands list
status: in_progress
owner: "@agent"
updated: 2025-08-29 02:25 UTC
related:
  - [[25082901-hide-restore-when-custom-equals-defaults]]
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
- [2025-08-28] Edit/Refresh UI — Place Edit first, then Refresh, both styled like input action icons (`clear-icon icon`) for visual consistency.
- [2025-08-28] Temporal pinning — Pin icon aligned with action icons, visible only in Edit mode and on row hover; pinned commands render in a dedicated “Pinned” section above the list, excluded from the main list and unaffected by filters; pins are cleared when Edit mode exits (non-persistent).
- [2025-08-28] Live reads & auto-refresh — Rebuild uses Obsidian’s `app.hotkeyManager.getDefaultHotkeys(id)` and `customKeys[id]` to construct hotkeys live; after write actions call `save()→load()→bake()`; the view subscribes to CommandsManager updates and re-filters to reflect changes immediately.
- [2025-08-28] Hotkey conversion fix — `convertKeymapInfoToHotkey` now supports both array and string modifiers; prevents empty hotkeys caused by wrong conversion.

- [2025-08-29] UI polish and pinning fixes — Edit and Refresh buttons now use the same compact icon style as the Search header actions; Restore/Add per-row controls match that style. Restore is shown only when a command has a Custom entry (hidden for System Shortcuts and when already at defaults). Pinned section now live-updates by subscribing to CommandsManager index changes. The “Hotkeys updated” banner spans the list width, includes a beta warning, and provides quick actions: Undo and Open Vault Folder.

- [2025-08-29] Vault folder opener — Implemented robust folder open with logging and Electron fallback: try `app.openWithDefaultApp` on `…/.obsidian`, then `hotkeys.json`, then vault root; additionally call `electron.shell.showItemInFolder(hotkeys.json)` or `shell.openPath` to guarantee Finder/Explorer opens.

## Progress (2025-08-29)

- Pinned section now reliably updates after add/remove/restore via `commandsManager.subscribe` invalidation.
- Restore/Add icons restyled to match search input action buttons; per-row icon hover/active states normalized.
- “Hotkeys updated” banner made full-width, sticky, and more prominent; includes Undo and Open vault folder actions with robust open logic and detailed logs.
- Search group-change effect made microtask-based to avoid re-entrant onSearch during mount/init.

## New Items / Follow-ups

- Refresh button styling: refresh still sometimes renders visually like a bare icon (not a button) depending on theme/selector precedence. Investigate specificity and ensure `#hotkey-refresh-button` picks up the same styles as `#hotkey-edit-button` and `.meta-search-wrapper .icon`.
- Beta banner timing: show the banner as soon as Edit mode is activated (not only after a change). Update the copy to clearly warn that hotkey editing is in beta and may cause issues; keep Undo hidden until there is a change. Provide an “Open vault folder” button. Consider an expandable details panel listing recent hotkey changes.
- Restore/Removal semantics:
  - Hide “Restore defaults” when a command is in default-only state (no custom entry) — implemented.
  - Allow removing default-assigned hotkeys by writing a Custom set that equals Defaults minus the removed chord — supported by current `removeHotkeySingle` behavior; add explicit UX hint and verify edge cases.

## Next Steps

- [ ] Refresh button: ensure button styling applies consistently across themes; raise selector specificity if needed; add snapshot in styles for `#hotkey-refresh-button`. At the moment it looks like a bare icon in all themes (might be an issue in our css file or in component styles).
- [ ] Beta banner: render as soon as Edit mode toggles on; update copy; suppress Undo until a change occurs; add a disclosure to expand and list recent changes (command name + hotkey diff).
- [ ] Hotkey changes list: maintain an in-memory list of applied changes during the session to populate the expandable details.
- [ ] Restore visibility QA: verify no restore button appears for default-only commands and system shortcuts; confirm tooltip shows defaults (baked names) when present.
- [ ] Default removal QA: validate that removing a default hotkey results in a Custom set persisting and surviving reload; add an inline hint when removing from a default-only command.
- [ ] Docs: update README with beta notice and the location of `hotkeys.json`; note the “Open vault folder” helper.

## Next Steps

- [ ] Verify no redundant refreshes are triggered during chip remove/add and restore across grouped and flat views.
- [ ] Cross-check System Shortcuts rows: no edit/remove/add/restore controls shown.
- [ ] QA on macOS/Windows/Linux: tooltip shows default chords correctly with baked names.

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
- [ ] Convert remaining clickable spans (restore/add/undo) to real buttons for a11y and consistent styling (owner)

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
- [2025-08-28] Hotkeys missing after rebuild. Root cause: KeymapInfo → Hotkey conversion assumed string modifiers causing empty results; Fix: support array/string forms; use live `app.hotkeyManager` reads in builder and de‑dup by normalized signature.
- [2025-08-28] Auto-refresh not updating. Fix: after `set/remove`, call `save()→load()→bake()` then `commandsManager.refreshIndex()`; view subscribes to CommandsManager to recompute filters on updates.
- [2025-08-28] Edit/Refresh style mismatch. Fix: both are icon-only using `clear-icon icon`; Edit placed before Refresh with small spacing.
- [2025-08-28] Pin icon visibility & behavior. Fix: pin shows only in Edit mode, aligned with star/folder icons on hover; pinned section rendered above list; pins cleared on Edit off.

## Implementation Notes (for next developer)

- Hotkey writes pipeline (internal APIs):
  - `setHotkeys(id, next)` / `removeHotkeys(id)` → `save()` → `load()` (if available) → `bake()` → `commandsManager.refreshIndex()`.
  - Rationale: ensures Obsidian’s in-memory state is updated before we rebuild the index.

- Rebuild source of truth:
  - Builder reads defaults via `app.hotkeyManager.getDefaultHotkeys(id)` and custom via `app.hotkeyManager.customKeys[id]`.
  - Convert via `convertKeymapInfoToHotkey` (array or string modifiers supported).
  - De‑dup “all” hotkeys by normalized signature: platformized + sorted modifiers with normalized key.

- Normalization & persistence:
  - Use `canonicalizeModifiersForPersist()` when saving (collapse primary→Mod, keep both primaries explicit as `Mod+Ctrl` on macOS / `Mod+Meta` on Win/Linux).
  - Uppercase single-letter keys for persistence to align with core.

- UI states:
  - Edit mode uses `editModeStore` (src/stores/uiState.svelte.ts).
  - Edit has restore-before-chips and add/capture after chips; chip-level delete “×” available only in Edit.
  - Pinning: session-only Set of ids; dedicated “Pinned” container; clear pins when Edit toggles off.

- [2025-08-29] Pinning implementation — Pinned section now appears above both grouped and flat lists; pinned commands are excluded from the main lists and are unaffected by filters. Pin icon added to grouped rows (Edit mode + hover) alongside Star/Folder actions. Per-row Restore/Add icons standardized to match toolbar button styling.

## Next Steps

- [ ] Conflicts check on assign — detect existing commands using the same chord and prompt to proceed/cancel; optionally auto-remove conflicting custom chords from other commands when overriding.
- [ ] Confirmation on restore — show explicit diff (custom → defaults) and confirm before applying.
- [ ] Optional: hide Restore when custom equals defaults (needs equivalence check against defaults with canonicalization).
- [ ] Verify grouped view pin UX across platforms (hover + keyboard accessibility).
- [ ] Consider persistence of revert buffer across view close or edit-off. Current behavior: changes apply immediately; revert buffer clears if user presses Keep/clears list (future), or after undo/revert. Add note reminding users to verify hotkeys after editing.

- Logging:
  - All hotkey actions produce single-line logs:
    - `assign:start id=... new=... defaults=[...] custom=[...]`
    - `assign:apply id=... add=... next=[...] persisted=[...]`
    - `remove:start id=... target=... base=[...] next=[...] equalsDefaults=...`
    - `restore:start id=... prevCustom=[...]` and `restore:done id=...`.
  - Enable via Dev logging in settings; level controlled by runtimeConfig.

## Acceptance

- Commands list shows hotkey chips for commands with bindings (beyond system shortcuts).
- Add/remove/restore updates chips immediately; Refresh button updates immediately.
- Edit/Refresh buttons visually match input action icons; Edit appears first.
- Pin icon only in Edit, aligned and hover-triggered; Pinned section above list; pins clear on Edit off.

## Links

- Obsidian Hotkeys docs: https://docs.obsidian.md/Files+and+folders/Customize+keyboard+shortcuts
- [[design-note]] (add details/visuals as decided)
- [2025-08-29] Banner UX — Show an Edit-mode banner (fixed bottom):
  - Copy: “Edit mode is ON — This editor is beta/unstable. For safety, prefer the built‑in Hotkeys settings for assignments.”
  - Layout: Row 1 notice; Row 2 latest changes toggle + Open vault folder + Undo (only when applicable); Row 3 list of revertable recent changes (expanded).
  - “Latest changes” shows only commands with revertable changes (excludes “undo” lines). Each item: italic command title (click to scroll to row), bold current hotkeys, and a Revert button.
  - Modified commands in list are italicized inline until reverted.

- [2025-08-29] Duplicate modal — Add “Pin and confirm” as the primary CTA, which assigns the hotkey and pins both the target and conflicting commands.

- [2025-08-29] Capture safety — While assigning a hotkey, intercept keydown/keypress/keyup with capture, stopPropagation + preventDefault to avoid triggering Obsidian shortcuts during capture.

---
