# Overlay: obsidian-keyboard-analyzer

# scope_condition

Apply ONLY if inputs.repo.name == "obsidian-keyboard-analyzer"
OR the project matches:

- Svelte 5 + TypeScript strict in `src/`
- Vite config (`vite.config.mts`) with outDir `../obsidian-keyboard-analyzer-dev/`

# merge_policy

- This overlay AUGMENTS mode defaults for: developer, reviewer, tester, docs.
- It does NOT affect planner/architect/quick-fix (except read-only facts).
- Delegation Bundle's `supersede_note` > overlay > mode defaults.
- If a field in overlay says `override=true`, it may supersede mode defaults.

# repo_facts (read-only, for all modes)

- Source: `src/` (Svelte 5 + TS(strict))
- Key dirs: `components/`, `managers/`, `views/`, `utils/`, `stores/`, `interfaces/`, `types/`
- Build: Vite (`vite.config.mts`) → `../obsidian-keyboard-analyzer-dev/`
- Styling: UnoCSS + `src/styles.css`; Lint/format: Biome (`biome.json`)
- Externals: Obsidian API remains external (do not vendor)
- Manual verification vault: `test-vault/`

# task_contract (docs + tasks files)

- Task files in `tasks/`, one per task.
- Naming: `tasks/YYYYMMDD-<kebab-slug>.md` (UTC date).
- Frontmatter:
  title: string
  status: todo|in_progress|blocked|done
  owner: "@you" | "@agent"
  updated: "YYYY-MM-DD HH:MM UTC"
  related: [ [ [ISSUE-123] ], [ [PR-456] ] ]
- On any action: append dated bullet to **Decisions**; update **Next Steps** & `status`; refresh `updated`; create follow-ups if scope splits.

# developer.overlay

- defaults: reasoning_effort=medium; verbosity prose=low, code=high
- preamble (compatible): restate goal (1 sentence) → short numbered plan → edits → "What changed" summary
- context budget: max 2 passes (identify → refine)
- action rule: once you can NAME exact files/functions, ACT
- io formats: unified diffs per changed file; new files with full content (path included)
- manual tests (suggested checklist):
  - [ ] open plugin view in test vault
  - [ ] status bar icon click behavior
  - [ ] command palette entries present & functional
  - [ ] hotkey detection (incl. modifiers, long press)
  - [ ] layout across themes (dark/light) & OS (Win/macOS/Linux)
  - [ ] no console errors
- safety rails:
  - Do NOT modify Vite `outDir` or externals unless explicitly requested.
  - Do NOT change unrelated keys in `public/manifest.json`.
  - For risky edits, propose safer alt or gate behind a flag.
- stop conditions (align to mode): edits done and + manual tests passed + task file updated; else emit **blocker** with next step.

# reviewer.overlay

- Enforce: Biome style, Svelte a11y basics, TypeScript strict (no `any`), check Obsidian API usage stays external.
- Add checks: no changes to Vite `outDir`; UnoCSS classes valid; stores usage keeps reactivity minimal.
- verdict format: unchanged (approve/request_changes/comment_only).

# tester.overlay

- Scope: smoke + functional for keyboard detection & UI entry points.
- Include matrix note: OS (Win/macOS/Linux) and theme (dark/light) at least once.
- Failures must include minimal repro using `test-vault/`.

# docs.overlay

- Prefer task-file updates in `tasks/` (per contract); otherwise emit structured JSON.
- Versioning: bump = patch unless API/contracts changed; record Biome and build notes if relevant.

# persistence (optional)

- If platform supports it, include `previous_response_id` to persist plans and cut re-planning; otherwise ignore silently.
