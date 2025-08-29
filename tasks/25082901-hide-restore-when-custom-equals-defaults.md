---
title: View polish — Hide Restore when Custom equals Defaults
status: todo
owner: "@agent"
updated: 2025-08-29 02:58 UTC
related:
  - [[25082700-temporal-pinning-and-hotkey-editing]]
---

## Context

In the Commands list edit mode, the per-row Restore action should be hidden when a command’s Custom hotkeys are effectively equal to its Default hotkeys. This avoids visual noise and accidental clicks when there’s nothing to restore.

## Decisions

- Compare custom vs default using canonicalization to avoid false differences (e.g., Mod collapse/expansion, key casing).
- Reuse existing normalization helpers (sortModifiers, normalizeKey, canonicalizeModifiersForPersist) to compute equivalence.
- Keep behavior purely visual; no changes to persistence or hotkey semantics.

## Next Steps

- [ ] Implement `isCustomEqualToDefault(entry)` helper.
- [ ] Use helper in `CommandsList.svelte` `shouldShowRestore()` to conditionally hide Restore.
- [ ] Verify across grouped/flat/pinned sections.
- [ ] Add unit coverage in place if project has tests; else manual verification.

## Links

- [[25082700-temporal-pinning-and-hotkey-editing]]

