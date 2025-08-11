# Repository Guidelines

## Project Structure & Module Organization

- Source: `src/` (Svelte + TypeScript). Notable folders: `components/`, `managers/`, `views/`, `utils/`, `stores/`, `interfaces/`.
- Build output: configured in `vite.config.mts` to `../obsidian-keyboard-analyzer-dev/`.
- Config: `tsconfig.json`, `uno.config.ts`, `biome.json`.
- Assets: `public/`, styles in `src/styles.css` and UnoCSS utilities.
- Local vault for manual testing: `test-vault/`.

## Build, Test, and Development Commands

- `npm ci`: install dependencies exactly from `package-lock.json`.
- `npm run build`: build plugin with Vite; outputs `main.js` and `styles.css` to the configured outDir.
- Development tip: build in watch is not wired; use repeated `npm run build` during local changes, or run `vite build --mode development --watch` if desired.
- Manual load in Obsidian: copy/symlink the build output plus `manifest.json` into `[Vault]/.obsidian/plugins/obsidian-keyboard-analyzer/` and reload plugins.

## Coding Style & Naming Conventions

- Language: TypeScript (strict) + Svelte 5.
- Obsidian API typings: import from the official `obsidian` package; internal members are declared via `src/types/obsidian-augmentations.d.ts`.
- Components: PascalCase (e.g., `KeyboardLayoutComponent.svelte`). Utilities/managers: camelCase filenames (e.g., `hotkeyManager`).
- Indentation: 2 spaces; prefer explicit types and `const` where possible.
- Formatting/Linting: Biome config present (`biome.json`). Example: `npx @biomejs/biome check .` and `npx @biomejs/biome format .`.

## Testing Guidelines

- No automated tests yet. Validate in Obsidian using `test-vault/` or your own vault.
- Verify: opening the view, status bar icon behavior, command palette entries, hotkey detection, and layout rendering across OS themes.
- Include screenshots or short clips for UI changes.

## Commit & Pull Request Guidelines

- Commits: Conventional Commits (project uses `standard-version`). Examples: `feat(view): add search menu`, `fix(hotkeys): normalize Mac modifiers`.
- PRs: clear description, linked issues, reproduction steps, before/after screenshots, and notes on platform testing (Windows/macOS/Linux).
- Keep changes focused; update `README.md` when user-facing behavior or setup changes.

## Security & Configuration Tips

- Do not commit vault contents or personal data. Keep changes within `src/` and configuration files.
- Be careful modifying `vite.config.mts` `outDir` and externals; Obsidian APIs should remain external.

## Active Tasks Documentation

- Purpose: Track ongoing work in `tasks//` so engineers and the AI agent keep a shared, searchable history of progress and decisions.
- Location & naming: `tasks/25080812-<id>.md` (one file per task).
- Frontmatter: Use YAML props at the top of each task file.

```markdown
---
title: Status bar Cmd/Ctrl+Click should open new pane
status: in_progress # todo|in_progress|blocked|done
owner: "@you" | "@agent"
updated: 2025-08-08 12:00 UTC
related:
  - [[ISSUE-123]]
  - [[PR-456]]
  - [[design-note]]
---

## Context

1–3 lines describing the why, scope, and definition of done.

## Decisions

- [2025-08-08] Decision made — brief rationale.

## Next Steps

- [ ] Action 1 (owner)

## Links

- [[ISSUE-123]] [[PR-456]] [[design-note]]
```

- Linking: Prefer Obsidian wiki links `[[...]]` for cross-references to tasks, notes, and PR/issue stubs; use full URLs for external sites.
- Workflow:
  - Create/append updates during development and after notable changes.
  - Commit with messages like: `chore(tasks): update ISSUE-123 decisions`.
  - The AI coding agent may append progress, decisions, and timestamps after each implementation step to keep everyone in the loop.

## Task Hygiene Rules for Agents

- Keep Next Steps strictly scoped to the task’s Context and Decisions. Do not propose unrelated enhancements.
- Prefer creating a new focused task for ideas not essential to the current task’s DoD.
- When closing a task, mark incomplete items as either:
  - done — implemented and verified, or
  - skipped — with a brief rationale and a link to a follow-up task if needed.
- When closing a task, move it to the `done` folder and update the status in the frontmatter.
- If a task is split into multiple follow-ups, link them in the `related` section and in relavant parts of the task.
- Update the `related` list when splitting or linking follow-ups to keep navigation clear.
