---
title: Validate UI across themes and attach screenshots
status: todo
owner: "@you"
updated: 2025-08-09 13:08 UTC
related:
  - [[250809-list-of-bugs-and-new-feature-requests]]
  - [[250809-fix-key-listener-button-shape]]
  - [[250809-plugin-name-badge-toggle]]
  - [[250809-keyboard-heatmap-scope-toggle]]
  - [[250809-keyboard-panel-collapse-toggle]]
  - [[250809-fix-donate-button-placement]]
---

## Context
Validate the new UI changes (button shape, plugin badge toggle, heatmap scope, keyboard collapse, Donate placement) across the default theme and at least two popular third‑party themes. Collect screenshots or short clips.

## Decisions
- Use the default theme plus two commonly used themes (e.g., Minimal, Things) for breadth of coverage.
- Capture both light and dark variants where available.
- Prefer consistent pane width setups to make comparisons clearer.

## Acceptance Criteria
- One before/after set for each change area across selected themes.
- No regressions in layout or accessibility discovered; note any follow‑ups as separate tasks.

## Next Steps
- [ ] Build plugin (`npm run build`) and load in test vault (owner)
- [ ] Capture screenshots for each change area in default theme (owner)
- [ ] Repeat in two third‑party themes; include light/dark if applicable (owner)
- [ ] Link screenshots in related task files and summarize findings (owner)

## Links
- [[250809-list-of-bugs-and-new-feature-requests]]
- [[250809-fix-key-listener-button-shape]] [[250809-plugin-name-badge-toggle]] [[250809-keyboard-heatmap-scope-toggle]] [[250809-keyboard-panel-collapse-toggle]] [[250809-fix-donate-button-placement]]

