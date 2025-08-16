# Overlay: obsidian-keyboard-analyzer

# scope_condition

Apply ONLY if inputs.repo.name == "obsidian-keyboard-analyzer" OR the project matches:

- Svelte 5 + TS strict in `src/`
- Vite outDir `../obsidian-keyboard-analyzer-dev/` in `vite.config.mts`

# merge_policy

- AUGMENTS: builder, qa. Designer/orchestrator read repo_facts.
- Precedence: bundle.supersede_note > overlay > mode defaults.
- Default gate: inputs.allow_external=false
- Default io_policy: no_diff_emission

# repo_facts (read-only)

- Source: `src/`; Dirs: components/, managers/, views/, utils/, stores/, interfaces/, types/
- Build: Vite → `../obsidian-keyboard-analyzer-dev/`
- Styling: UnoCSS + `src/styles.css`; Lint/format: Biome
- Externals: Obsidian API external (do not vendor)
- Manual verification vault: `test-vault/`

# task_contract

- tasks/YYYYMMDD-<kebab-slug>.md (UTC); frontmatter keys as specified
- On any action: dated bullet to **Decisions**; update **Next Steps** & `status`; refresh `updated`; split follow-ups if needed

# designer.overlay

- Deliver explicit interfaces and file paths (e.g., `src/utils/commandMeta.ts`) to enable low-IO building.

# builder.overlay

- io_policy: no_diff_emission (override=true)
- Evidence set required in attempt_completion:
  - commits[], diffstat, patch_manifest[], interfaces_delta[], checks, snippets? (≤20 lines total if io_mode="manifest")
- Manual tests checklist (suggested):
  - [ ] open plugin view in test vault
  - [ ] status bar icon click behavior
  - [ ] command palette entries present & functional
  - [ ] hotkey detection (incl. modifiers, long press)
  - [ ] layout across themes (dark/light) & OS (Win/macOS/Linux)
  - [ ] no console errors
- Safety rails:
  - Don’t change Vite `outDir` or externals unless explicitly allowed (override=true).
  - Don’t alter unrelated `public/manifest.json` keys.
  - For risky edits, gate behind a flag or propose a safer alternative.
- Push gating:
  - Push only if: build succeeds AND Biome passes AND working tree clean between chunks.
- Docs/Tasks:
  - Prefer updating `tasks/` per contract; keep doc content deltas minimal (anchors or short fenced blocks).

# qa.overlay

- Test scope: smoke + functional for keyboard detection & UI entry points.
- Matrix: cover at least one OS (Win/macOS/Linux) and theme (dark/light) or note gaps.
- Review rails:
  - Enforce Biome, Svelte a11y basics, TS strict (no `any`), Obsidian API external.
  - No Vite `outDir` changes; UnoCSS classes valid; store usage keeps reactivity minimal.
- Low-IO stance:
  - Use Builder receipts; request at most one focused snippet if necessary (≤20 lines total).
- attempt_completion: {results_summary, key_issues, verdict}
