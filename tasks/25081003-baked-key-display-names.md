---
title: Baked key display names in search and commands list
status: todo
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

## Next Steps
- [ ] Explore and learn the current implementation of this functionality
- [ ] Define key display map (Backspace, Enter/Return, Tab, Escape/Esc, Arrow Up/Down/Left/Right, Meta/Win/Cmd, Alt/Option, Control/Ctrl, Shift, Page Up/Down, Home/End, Delete/Del, Insert, Caps Lock, Context Menu).
- [ ] Add normalization utility (e.g., `utils/normalizeKeyDisplay.ts`) with platform-aware aliases.
- [ ] Apply display names in search menu rendering.
- [ ] Apply display names in commands list rendering.
- [ ] Add dev setting toggle to enable/disable baked names; default on in production builds.
- [ ] Ensure arrows label consistently in both views (choose text-first: e.g., "Up Arrow").
- [ ] Ensure Backspace label shows "Backspace" (no glyph) when baked names are enabled.
- [ ] Verify macOS/Windows/Linux naming conventions and modifier labels.
- [ ] After the task is done: Update README dev settings and add screenshots in `test-vault/` validation notes.

## Links
- [[25081001-visual-keyboard-keys-and-hover-highlights]]
- [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
