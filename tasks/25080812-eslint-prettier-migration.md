---
title: Migrate to ESLint flat config + Prettier
status: in_progress
owner: "@agent"
updated: 2025-08-24 22:40 UTC
related:
  - [[design-note]]
---

## Context

Replace Biome with ESLint (flat) + Prettier, remove ad‑hoc VS Code/task workarounds, and standardize tooling for Svelte 5 + TypeScript.

## Decisions

- [2025-08-24] Use ESLint flat config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`, and `eslint-config-prettier`.
- [2025-08-24] Keep Prettier standalone (`prettier` + `prettier-plugin-svelte`) and disable conflicting ESLint rules via `eslint-config-prettier`.
- [2025-08-24] Remove legacy `.eslintrc.cjs`, VS Code tasks/workarounds, watcher script, and troubleshooting doc.
- [2025-08-24] Simplified `.vscode/settings.json` to flat config mode (`eslint.useFlatConfig: true`).
- [2025-08-24] Added browser globals for Svelte files; ignore build artifacts and config files in ESLint.

## Next Steps

- [x] npm install to refresh lockfile and node_modules (owner)
- [x] Run `npm run lint` to validate config; capture findings (owner)
- [ ] Try `npm run build` and verify success (owner)
- [ ] Confirm VS Code ESLint diagnostics show with flat config (owner)
- [ ] Close task after commit/push; follow-up task for fixes: [[25080812-fix-eslint-findings]]

## Links

- [[design-note]]
