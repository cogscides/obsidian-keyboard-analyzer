---
title: Fix ESLint findings and tune Svelte/TS rules
status: in_progress
owner: "@agent"
updated: 2025-08-25 02:05 UTC
related:
  - [[25080812-eslint-prettier-migration]]
---

## Context

After migrating to ESLint flat config + Prettier, the repo has several linter errors in Svelte + TS files. This task captures fixing code issues and tuning rules for Svelte ergonomics without weakening important safety rules.

## Decisions

- [2025-08-24] Prefer minimal rule relaxations (e.g., allow Svelte patterns) over disabling safety rules project-wide.
- [2025-08-25] Added Svelte-only relaxations in ESLint: allow reactive unused expressions, underscore-args, and soften unsafe-any rules inside Svelte to warnings; kept TS/JS strict.
- [2025-08-25] Remove unused svelte-ignore comments and add proper a11y handlers/roles where applicable rather than suppressing.

## Next Steps

- [x] Review current ESLint errors and group by type (owner)
- [x] Propose small rule tweaks where needed (owner)
- [x] Implement code fixes across core components (owner)
- [x] Re-run lint and ensure zero errors; warnings remain acceptable (owner)
- [ ] Address remaining QuickViewPopover warnings (optional polish)
- [x] Tackle TS-only findings in src/main.ts

## Links

- [[25080812-eslint-prettier-migration]]

## Progress Log

- [2025-08-25 01:45 UTC] Rules: tuned Svelte block in `eslint.config.js` for Svelte 5 ergonomics (`no-unused-expressions` off, underscore-args, allowEmptyCatch, unsafe-any to warn). Code fixes: removed unused svelte-ignore comments; added a11y role/keydown to clickable divs; fixed empty catches with comments; removed unnecessary casts; replaced unsafe `any` usages in `QuickViewPopover` with typed calls and helpers; added `void` on promise calls; cleaned unused vars. Lint: component errors resolved; remaining issues are warnings, plus TS errors centered in `src/main.ts`.
