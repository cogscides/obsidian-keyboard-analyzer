---
title: Fix ESLint findings and tune Svelte/TS rules
status: todo
owner: "@agent"
updated: 2025-08-24 22:38 UTC
related:
  - [[25080812-eslint-prettier-migration]]
---

## Context

After migrating to ESLint flat config + Prettier, the repo has several linter errors in Svelte + TS files. This task captures fixing code issues and tuning rules for Svelte ergonomics without weakening important safety rules.

## Decisions

- [2025-08-24] Prefer minimal rule relaxations (e.g., allow Svelte patterns) over disabling safety rules project-wide.

## Next Steps

- [ ] Review current ESLint errors and group by type (owner)
- [ ] Propose small rule tweaks where needed (owner)
- [ ] Implement code fixes across components (owner)
- [ ] Re-run lint and ensure zero errors (owner)

## Links

- [[25080812-eslint-prettier-migration]]

