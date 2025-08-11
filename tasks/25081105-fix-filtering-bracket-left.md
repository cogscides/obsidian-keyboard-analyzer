---
title: Investigate and fix filtering for '[' (BracketLeft)
status: todo
owner: '@agent'
updated: 2025-08-11 12:00 UTC
related:
  - [[25080913-SPRINT-list-of-bugs-and-new-feature-requests]]
---

## Context

Commands using the `[` key are incorrectly filtered out when `[` is selected on the visual keyboard. Likely regression tied to key normalization/matching.

## Investigation Notes

- Suspect `hotkeyMatches` in Commands Manager.
- Verify `event.code` mapping for `BracketLeft` throughout normalization.
- In `normalizeKey` map, ensure `bracketleft: '['` (not `bracket`).
- Confirm `activeKeysStore` stores and compares the normalized key consistently.

## Files

- `src/managers/commandsManager/commandsManager.svelte.ts` — review `hotkeyMatches`.
- `src/utils/modifierUtils.ts` — fix key map in `normalizeKey` if needed.
- `src/stores/activeKeysStore.svelte.ts` — verify how active key is stored/used.

## Acceptance Criteria

- Selecting `[` on the keyboard correctly includes commands bound to `[`.
- No regressions for nearby keys (']', '{', '}', etc.).
- Normalization logic covered for both `code` and `key` paths.

## Next Steps

- [ ] Add/adjust normalization for `BracketLeft` and ensure consistent casing.
- [ ] Fix `hotkeyMatches` predicate to use normalized forms.
- [ ] Manual test across layouts and with combos (e.g., Cmd+[).

## Links

- `src/managers/commandsManager/commandsManager.svelte.ts`
- `src/utils/modifierUtils.ts`
- `src/stores/activeKeysStore.svelte.ts`
