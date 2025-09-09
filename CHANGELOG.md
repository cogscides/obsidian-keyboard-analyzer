# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.1](https://github.com/cogscides/obsidian-keyboard-analyzer/compare/0.3.0...0.4.1) (2025-09-09)

Highlights

- Experimental/unstable: Edit command hotkeys within the plugin.
- New commands to open the plugin in a new tab or split.
- Latest changes history with Keep changes and Undo all.
- Visual polish and reliability fixes across hotkey handling and UI.

Unstable feature — Hotkey Editing (experimental)

- Assign, remove, and restore hotkeys for commands directly from the list.
- Accurately distinguishes defaults vs custom overrides; default-equivalent customs are saved explicitly to appear as custom.
- Supports removing default-only hotkeys using explicit empty overrides when needed by core.
- Reliable pipeline: derive effective hotkeys via `app.hotkeyManager`, then save → load → bake to ensure consistency.
- Latest changes panel with revert buffer, Keep changes, and Undo all to restore original sets across multiple edits.
- Safety: recommend backing up `.obsidian/hotkeys.json` before extensive edits. Behavior may change in subsequent patches.

New

- Plugin: commands to open the keyboard shortcuts view in a new tab and as a split.
- UI/UX: subtle row hover highlight, stabilized row height, reserved space for action icons, improved refresh control with animation.
- Hover previews: visual keyboard preview when hovering hotkeys (incl. pinned sections).
- Command list hygiene: dedupe System Shortcuts vs real commands by chord signature.

Fixes & internal

- Ensure defaults reappear after restore; do not merge defaults when a custom override exists.
- Double-refresh commands index after edits to capture async core updates.
- Close edit-mode banner on Keep changes; fix hover/animation jitter; small-screen layout tweaks.
- Migrate to ESLint + Prettier for Svelte 5; floating-ui adoption and related style updates.

Compatibility

- Obsidian minAppVersion: 0.12.10. Desktop and mobile supported.

### [0.4.0](https://github.com/cogscides/obsidian-keyboard-analyzer/compare/0.3.1...0.4.0) (2025-09-05)

### Features

* **plugin:** add commands to open analyzer in new tab and split ([08e901e](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/08e901eaa9b376a93e9b48961c9f3d24c14ecdc3))

### [0.3.1](https://github.com/cogscides/obsidian-keyboard-analyzer/compare/0.3.0...0.3.1) (2025-09-05)


### Features

* add developer-only keyboard tooltips setting ([29a3fb6](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/29a3fb627b1aa01a3efa8f4a695c2c9199300dc7))
* add group settings save/reset functionality ([936c9f2](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/936c9f23ac47dc35448bc7757720c4ed0e73890a))
* **edit:** add revertable 'Latest changes', keep-changes action, and safer hotkey capture; pinned section parity with view settings ([dbcb1ce](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/dbcb1ce81180c33217f5f20063bb3c959de3a3a3))
* **hotkeys:** canonicalize persisted modifiers + letter case; match Obsidian default-equal custom behavior; string logs for assign/remove/restore; update task notes ([11cf2bd](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/11cf2bd9c482713f6a6f4615f812db2d23a19db9))
* implement conditional dev tooltips for keyboard keys ([132e5b8](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/132e5b8de42c5efa76824459ba97f564430f4de2))
* implement floating-ui-svelte components and utilities ([db8a1c8](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/db8a1c8d34fa8ce24f16a15ca7815b82fe04d6f3))
* migrate components to floating-ui with enhanced UX ([d1a9f1f](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/d1a9f1f8a82b87bd1800b08b05f6c06bf779514a))
* **plugin:** add commands to open analyzer in new tab and split\n\n- Adds 'Open keyboard shortcuts view (new tab)'\n- Adds 'Open keyboard shortcuts view (split)'\n- Updates docs to mention new commands ([08e901e](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/08e901eaa9b376a93e9b48961c9f3d24c14ecdc3))
* **reorg:** move manifest and versions jsons to the root ([48e9960](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/48e9960ae750b39f37a8a85fec87955d35669d32))
* **ui:** add subtle row hover highlight using background-modifier-hover; match latest-changes flash tone ([e1ddcd3](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/e1ddcd35fa81f9db7bd808cc1957a43ae5c6d6ee))
* **ui:** stabilize row height and adjust hover timing (0.05s in, 0.1s out); keep action icons reserved to avoid jump ([987e96c](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/987e96c6b479432ec2b600584024893435f3a5ec))
* **undo:** add Undo all (reverts all changes in Latest changes via revert buffer); update banner actions accordingly ([d7e610e](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/d7e610e5ac4f99f362444a010b2619fddfca42de))


### Bug Fixes

* **builder:** effective hotkeys derive from custom override rule (custom vs defaults), not getHotkeys(); restores defaults visibility across the list ([c34eaa8](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/c34eaa8f07056ae81ed7f68cde53bcd01692d27b))
* **builder:** prefer effective hotkeys from app.hotkeyManager; compute isCustom via custom set; ensure defaults reappear after restore ([40d469e](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/40d469e956219eaa9dee957583eedbea5a1576ee))
* **builder:** respect empty effective hotkeys; do not fall back to default+custom when all=[] (shows default-only removal correctly) ([47184a1](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/47184a1a01674d61cea0cd259e2689594b6b6a01))
* **eslint): resolve remaining warnings with typed  refs; remove undefined usage in dropdown\n\nchore(svelte): migrate deprecated <slot> to render blocks; add snippet props to FloatingDropdown; update usages in KeyboardLayoutComponent and SearchMenu\n\nchore(tasks:** update 25082501 validation and decisions; mark done ([9799d5d](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/9799d5d17e15236af428e8f9517821e8bf54d080))
* **eslint:** resolve findings across Svelte/TS; tune Svelte-focused rules for ergonomics ([f07ff7b](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/f07ff7b09302871e1a983240cb5dbe25c751e3cb))
* **hotkeys:** additional fallbacks to disable default-only hotkeys (try explicit empty override, null override via setHotkeys/customKeys) ([af492fd](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/af492fd8787e149e01414cc3a616c6ce5691a832))
* **hotkeys:** allow removing default-only hotkeys by deriving 'all' from effective getHotkeys() when no custom override is present; robust override detection ('in' operator) ([fb5a484](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/fb5a4842e279a7be7d6a0a938afb4b21c52585ce))
* **hotkeys:** restore reliable hotkey rebuild via app.hotkeyManager + robust KeymapInfo conversion; save→load→bake on writes; subscribe view for live refresh; polish Edit/Refresh buttons and temporal pinning; update task log ([1c72a74](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/1c72a749f49febc968203f1449e3be3885adc4f5))
* **hotkeys:** robust removal of default-only hotkeys by forcing explicit empty custom override if core ignores setHotkeys([]) before save/load/bake ([09f53ba](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/09f53ba12d8d6f8ac737f2b834e4079cddf56c2e))
* **hotkeys:** treat explicit custom override as authoritative; don't merge defaults when custom exists; refine custom highlight for default-equivalent chords; make banner responsive to narrow panes ([15a9c90](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/15a9c90dfba8c8343b04a1615d953ed870e14f92))
* **hotkeys:** when assigning a chord equal to defaults, force explicit custom override (writes customKeys[id]) so it appears as custom in the list ([ff52207](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/ff522079f555ebe06c8d7a7a5593bb252fbaa744))
* **hover:** enable visual keyboard preview on hotkey hover inside pinned sections (grouped and flat) ([0d5a0b9](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/0d5a0b9aae9361e59546d6abd06b13ccb9cb77b8))
* **lint:** resolve ESLint warnings across codebase ([be36ba5](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/be36ba541c0520bf8791535d5af3f5e879e3d085))
* **list:** dedupe System Shortcuts vs real commands by chord signature; correct signature computation ([206291b](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/206291b0c819bbed93c8a6b3027ebf28f12b976b))
* modernize linting and formatting for Svelte 5 compatibility ([cde1be6](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/cde1be6c32bce32ce8e34fd1e9dba97c946ac119))
* **refresh:** double-refresh commands index after assign/remove/restore to capture async core updates (getHotkeys reflects defaults immediately) ([98dadac](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/98dadacac70ed4ad074ccac9c242159cd57dec6a))
* resolve dropdown animation jitter and styling issues ([1eb7d1e](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/1eb7d1e75c1b4712349b5c7ceec58174013c5310))
* **styles:** adjust padding for hotkey list items and improve layout for XS devices ([19ec8f9](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/19ec8f951bedf4e1e736c0db26d993ac73047c22))
* **ui:** align edit/refresh buttons; improve refresh styling\n\n- Normalize edit/refresh buttons to match search input icons\n- Add spin animation and hover/active states for refresh ([66bb02d](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/66bb02ddf77e5e481d8fcb5d413839cc7eb6dc44))
* **ui:** close edit-mode banner on Keep changes by clearing revert buffer and lastHotkeyChange ([6b632af](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/6b632afe57aea22654748908e77aec0b43695754))
* **ui:** show custom highlight even when chord equals default (custom override should be visible) ([83ef09c](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/83ef09c65f4a3b1a8c0b054a8159b4c6fcfd520b))
* **undo:** preserve earliest prevCustom in revert buffer across multiple edits per command; undo all restores full original set ([f13c5e7](https://github.com/cogscides/obsidian-keyboard-analyzer/commit/f13c5e77f908a854868b7ca0e5f246d694ba2749))

## [0.3.0] - 2025-08-20

Changes

- Complete plugin rewrite
- Groups management [NOT PERSISTENT YET]
- Quick View Popup
- Modifier activation mode
- Hover hotkeys in command list to highlight on the visual keyboard
- Rehaul active key listener

Notes

- Build outputs to `../obsidian-keyboard-analyzer-dev` (see `vite.config.mts`)
- Plugin available in Community Plugins

## [0.2.0] - 2024-XX-XX

Changes

- Improved keyboard view and duplicate highlighting
- Added scope filtering and better search

## [0.1.1] - 2023-XX-XX

Initial beta release

[0.3.0]: https://github.com/cogscides/obsidian-keyboard-analyzer/releases/tag/v0.3.0
[0.2.0]: https://github.com/cogscides/obsidian-keyboard-analyzer/releases/tag/v0.2.0
[0.1.1]: https://github.com/cogscides/obsidian-keyboard-analyzer/releases/tag/v0.1.1
