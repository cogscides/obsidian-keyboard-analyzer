---
title: Baked key display names in search and commands list
status: in_progress
owner: "@agent"
updated: 2025-08-10 14:45 UTC
related:
  - [[25081001-visual-keyboard-keys-and-hover-highlights]]
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context
Search menu and commands list show inconsistent labels for special keys and modifiers. Introduce a "baked" display-name mapping so both surfaces render human-friendly, platform-appropriate names. Examples noted: Backspace currently shows as the glyph "⌫" in search (should say "Backspace"); arrow keys appear as baked "arrows" in search but as `Arrow{direction}` in the commands list.

Definition of done:
- A single mapping/utility provides canonical display names for keys/modifiers across platforms.
- Search menu and commands list both use the mapping (no divergent formats).
- Dev setting toggle can enable/disable baked names for debugging.

## Decisions
- [2025-08-10] Track as a dedicated UI polish task before the next release; keep platform naming conventional (Cmd/Option on macOS; Win/Alt on Windows).
- [2025-08-10] Adopt glyphs for arrows/backspace/space and words for Esc/Home/Delete/End/Page Up/Page Down; Enter is always "Enter".
- [2025-08-10] Windows emulation: display Meta as Win on the visual keyboard, and do not treat Win as an Obsidian modifier for search matching.
- [2025-08-10] Move OS-specific key behavior to Key-level config in a single JSON: each Key may define per-OS label/code/unicode/modifier; manager picks OS variant at init. Avoid separate per-OS layout copies.

## Next Steps
- [x] Explore and learn the current implementation of this functionality
- [x] Define key display map (Backspace, Enter/Return, Tab, Escape/Esc, Arrow Up/Down/Left/Right, Meta/Win/Cmd, Alt/Option, Control/Ctrl, Shift, Page Up/Down, Home/End, Delete/Del, Insert, Caps Lock, Context Menu).
- [x] Add normalization utility (`src/utils/normalizeKeyDisplay.ts`) with platform-aware aliases.
- [x] Apply display names in search menu rendering.
- [x] Apply display names in commands list rendering.
- [x] Add dev setting toggle to enable/disable baked names; default on in production builds.
- [x] Ensure arrows label consistently in both views (choose text-first: e.g., "Up Arrow").
- [x] Ensure Backspace label shows "Backspace" (no glyph) when baked names are enabled.
- [ ] Verify macOS/Windows/Linux naming conventions and modifier labels.
- [ ] Implement OS-specific layout transformation to assign per-OS modifier roles (Cmd vs Win) and labels at model level; use it in ActiveKeysStore modifier handling and VisualKeyboard heatmap.
- [ ] Remove remaining ad-hoc platform branches after model-level mapping is in place.
- [ ] After the task is done: Update README dev settings and add screenshots in `test-vault/` validation notes.

## Work Log
- [2025-08-10 15:10 UTC] Added canonical baked display utility `src/utils/normalizeKeyDisplay.ts` with Obsidian-aligned labels and numpad glyphs.
- [2025-08-10 15:15 UTC] Wired baked labels into `SearchMenu` chips and `CommandsList` hotkey rendering; default toggle `useBakedKeyNames` enabled.
- [2025-08-10 15:30 UTC] Added toggle to keyboard panel dev dropdown for quick on/off during validation.
- [2025-08-10 16:00 UTC] Fixed weight counting for symbol keys by aliasing symbols↔codes (e.g., `-`↔`minus`, `=`↔`equal`) in `visualKeyboardsManager` so minus/equal heatmaps increment.
- [2025-08-10 16:10 UTC] Normalized modifier matching to platform-aware forms (so `Mod` matches `Ctrl` on Windows) in `HotkeyManager`.
- [2025-08-10 16:20 UTC] Windows emulation improvements: visual keyboard shows "Win" for Meta; heatmap buckets no longer inflate Win; search no longer treats Win as a modifier by mapping `MetaLeft/Right` to `Win` in `ActiveKeysStore` when emulating Windows.
- [2025-08-10 16:25 UTC] Plan next: explore OS-specific layout transformation at model level to formalize per-OS key identities beyond unicode (consider per-OS key roles in `UNIFIED_KEYBOARD_LAYOUT` or a transform during initialization).
- [2025-08-10 16:50 UTC] Added per-OS modifier roles to processed layout (`logicalModifier` on Key) and centralized role lookup via VisualKeyboardManager. ActiveKeysStore now toggles only OS-valid modifiers (e.g., Win is not a modifier on Windows emulation).
- [2025-08-10 17:15 UTC] Introduced platformized modifiers: transform command hotkeys and active modifiers to OS-appropriate forms (Meta→Ctrl on Windows) for rendering and matching. Commands list no longer clusters Meta on Windows emulation; Ctrl shows expected commands.
- [2025-08-10 17:35 UTC] Reverted per-OS layout copies and override structures. Introduced Key-level `os` config (single JSON) and apply per-OS label/code/unicode/modifier at init. Kept minimal logic and removed ad-hoc swaps.

## Decisions
- [2025-08-10] Implemented `normalizeKeyDisplay` utility to provide platform-aware, text-first labels for keys and modifiers.
- [2025-08-10] Added `useBakedKeyNames` plugin setting (default: true) exposed in Settings; can be toggled under developer options.
- [2025-08-10] Integrated baked names in `SearchMenu` modifier chips and active key chip, and in `CommandsList` rendered hotkeys. Kept HotkeyManager unchanged for raw rendering when toggle is off.

## Implementation Notes
- Files added/changed:
  - Added: `src/utils/normalizeKeyDisplay.ts`
  - Updated: `src/components/SearchMenu.svelte` (chips + active key use baked names)
  - Updated: `src/components/CommandsList.svelte` (uses baked formatter when enabled)
  - Updated: `src/managers/settingsManager/settingsManager.d.ts` (new boolean `useBakedKeyNames`)
  - Updated: `src/managers/settingsManager/settingsManager.svelte.ts` (default `useBakedKeyNames: true`)
  - Updated: `src/settingsTab.ts` (settings toggle UI)


## Links
- [[25081001-visual-keyboard-keys-and-hover-highlights]]
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
