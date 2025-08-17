<script lang="ts">
import { onDestroy, onMount, setContext } from "svelte";
import clickOutside from "../utils/clickOutside.js";
import SearchMenu from "./SearchMenu.svelte";
import CommandsList from "./CommandsList.svelte";
import type { commandEntry } from "../interfaces/Interfaces";
import type KeyboardAnalyzerPlugin from "../main";
import { VisualKeyboardManager } from "../managers";
import { ActiveKeysStore } from "../stores/activeKeysStore.svelte.ts";
import { convertModifiers } from "../utils/modifierUtils";

interface Props {
	plugin: KeyboardAnalyzerPlugin;
	anchorEl?: HTMLElement | null;
	onClose?: () => void;
	listenToggle?: number;
}

function handleGlobalKeyup(e: KeyboardEvent) {
  if (!rootEl || !keyboardListenerIsActive) return;
  const target = e.target as Node | null;
  const isInside = target ? rootEl.contains(target) : false;
  if (!isInside) return;
  e.preventDefault();
  e.stopPropagation();
  try {
    activeKeysStore.handlePhysicalKeyUp(e);
  } catch {}
}

let {
	plugin,
	anchorEl = $bindable(null),
	onClose = $bindable(() => {}),
	listenToggle = $bindable(0),
}: Props = $props();

const commandsManager = plugin.commandsManager;
const settingsManager = plugin.settingsManager;

// Search/listen state delegated to SearchMenu-compatible API
let search = $state("");
let keyboardListenerIsActive = $state(false);
let selectedGroupID = $state(
	(settingsManager.getSetting("lastOpenedGroupId") as string) || "all",
);

// Active key state (baked/consistent via ActiveKeysStore in SearchMenu)
let activeKey = $state("");
let activeModifiers: string[] = $state([]);

// Results
let filteredCommands: commandEntry[] = $state([]);
let resultLimit = $state(100);

function refilter() {
	const base = commandsManager.filterCommands(
		search,
		convertModifiers(activeModifiers),
		activeKey,
		selectedGroupID,
	);
	filteredCommands = base.slice(0, resultLimit);
	// Reset selection to first item after refilter
	selectedIndex = 0;
	queueUpdateSelection(true);
}

// Wire double-run signal
$effect(() => {
	listenToggle;
	if (listenToggle) {
		keyboardListenerIsActive = true;
	}
});

let rootEl: HTMLDivElement | null = null;
let placeAbove = $state(false);
// Persisted size (defaults tuned for ~320–360px width and 60vh max height)
let coords = $state({
	top: 0,
	left: 0,
	maxHeight: Math.min(
		Math.floor((window.innerHeight || 600) * 0.6),
		Math.max(240, Number(settingsManager.settings.quickViewHeight || 360)),
	),
	width: Math.max(
		320,
		Math.min(480, Number(settingsManager.settings.quickViewWidth || 360)),
	),
});

function recomputePosition() {
	try {
		const el = rootEl;
		if (!el || !anchorEl) return;
		if (isResizing) return;
		const rect = anchorEl.getBoundingClientRect();
		const viewportH =
			window.innerHeight || document.documentElement.clientHeight;
		const viewportW = window.innerWidth || document.documentElement.clientWidth;

		const offset = 6;
		const desiredTop = rect.bottom + offset;
		const estimatedHeight = Math.min(
			Math.floor(viewportH * 0.6),
			Math.max(240, coords.maxHeight),
		);
		const fitsBelow = desiredTop + estimatedHeight <= viewportH;
		placeAbove = !fitsBelow;

		const top = placeAbove
			? Math.max(8, rect.top - offset - estimatedHeight)
			: Math.min(viewportH - estimatedHeight - 8, desiredTop);

		// prefer align left with anchor; clamp
		let left = rect.left;
		const width = coords.width || el.offsetWidth || 360;
		if (left + width > viewportW - 8) left = Math.max(8, viewportW - width - 8);
		if (left < 8) left = 8;

		coords = { ...coords, top, left, maxHeight: estimatedHeight };
	} catch {}
}

// Left-edge resize
let resizingLeft = false;
let startX = 0;
let startLeft = 0;
let startWidth = 0;
let suppressOutsideCloseUntil = 0;

function onLeftResizeDown(e: PointerEvent) {
	e.preventDefault();
	e.stopPropagation();
	try {
		(e.target as Element).setPointerCapture?.(e.pointerId);
	} catch {}
	resizingLeft = true;
	isResizing = true;
	startX = e.clientX;
	startLeft = coords.left;
	startWidth = coords.width;
	suppressOutsideCloseUntil = Date.now() + 300;
	window.addEventListener("pointermove", onLeftResizeMove, true);
	window.addEventListener("pointerup", onLeftResizeUp, true);
}
function onLeftResizeMove(e: PointerEvent) {
	if (!resizingLeft) return;
	const dx = e.clientX - startX;
	let newLeft = startLeft + dx;
	let newWidth = startWidth - dx;

	// clamp
	const minW = 320;
	const viewportW = window.innerWidth || document.documentElement.clientWidth;
	if (newWidth < minW) {
		newWidth = minW;
		newLeft = startLeft + (startWidth - minW);
	}
	if (newLeft < 8) {
		const delta = 8 - newLeft;
		newLeft = 8;
		newWidth = Math.min(startWidth - (startLeft - 8), viewportW - 16);
		if (newWidth < minW) newWidth = minW;
	}
	// Ensure right edge fits viewport
	if (newLeft + newWidth > viewportW - 8) {
		newWidth = Math.max(minW, viewportW - 8 - newLeft);
	}

	coords = { ...coords, left: newLeft, width: newWidth };
	settingsManager.updateSettings({ quickViewWidth: newWidth });
}
function onLeftResizeUp() {
	if (!resizingLeft) return;
	resizingLeft = false;
	isResizing = false;
	suppressOutsideCloseUntil = Date.now() + 150;
	window.removeEventListener("pointermove", onLeftResizeMove, true);
	window.removeEventListener("pointerup", onLeftResizeUp, true);
}

// Reference to SearchMenu's input for focusing via Mod+F from anywhere in the popover
let searchInputEl: HTMLInputElement | undefined = $state(undefined);

// Bottom-edge resize (height)
let resizingBottom = false;
let startY = 0;
let startHeight = 0;

function onBottomResizeDown(e: PointerEvent) {
	e.preventDefault();
	e.stopPropagation();
	try {
		(e.target as Element).setPointerCapture?.(e.pointerId);
	} catch {}
	resizingBottom = true;
	isResizing = true;
	startY = e.clientY;
	startHeight = coords.maxHeight;
	suppressOutsideCloseUntil = Date.now() + 300;
	window.addEventListener("pointermove", onBottomResizeMove, true);
	window.addEventListener("pointerup", onBottomResizeUp, true);
}
function onBottomResizeMove(e: PointerEvent) {
	if (!resizingBottom) return;
	const dy = e.clientY - startY;
	const viewportH = window.innerHeight || document.documentElement.clientHeight;
	let newHeight = startHeight + dy;

	// Clamp height to viewport and minimum; prefer <= 60vh
	const minH = 240;
	const maxH = Math.floor(viewportH * 0.6);
	if (newHeight < minH) newHeight = minH;
	if (newHeight > maxH) newHeight = maxH;

	coords = { ...coords, maxHeight: newHeight };
	// Persist last height
	settingsManager.updateSettings({ quickViewHeight: newHeight });
}
function onBottomResizeUp() {
	if (!resizingBottom) return;
	resizingBottom = false;
	isResizing = false;
	suppressOutsideCloseUntil = Date.now() + 150;
	window.removeEventListener("pointermove", onBottomResizeMove, true);
	window.removeEventListener("pointerup", onBottomResizeUp, true);
}

// Keyboard selection management (roving tabindex without mutating CommandsList)
let selectedIndex = $state(0);
let pendingSelectionFocus = false;
let listContainer: HTMLDivElement | null = null;
function getRowNodes(): HTMLDivElement[] {
	if (!listContainer) return [];
	return Array.from(
		listContainer.querySelectorAll<HTMLDivElement>(
			".kbanalizer-setting-item.setting-item",
		),
	);
}

function clampIndex(n: number): number {
	const rows = getRowNodes();
	if (rows.length === 0) return 0;
	if (n < 0) return rows.length - 1;
	if (n >= rows.length) return 0;
	return n;
}

function applyRovingTabindex(focus: boolean) {
	const rows = getRowNodes();
	rows.forEach((el, i) => {
		el.setAttribute("tabindex", i === selectedIndex ? "0" : "-1");
		el.classList.toggle("keyboard-selected", i === selectedIndex);
	});
	if (focus && rows[selectedIndex]) {
		// Focus visible ring
		rows[selectedIndex].focus();
	}
}

function queueUpdateSelection(focus: boolean) {
	pendingSelectionFocus = focus;
	// Wait for DOM to update after list changes
	queueMicrotask(() => {
		applyRovingTabindex(pendingSelectionFocus);
		pendingSelectionFocus = false;
	});
}

function moveSelection(delta: number) {
	selectedIndex = clampIndex(selectedIndex + delta);
	queueUpdateSelection(true);
}

function runSelectedCommand() {
	const list = filteredCommands;
	if (!list || list.length === 0) return;
	const cmd = list[Math.min(selectedIndex, list.length - 1)];
	if (!cmd) return;
	try {
		// Reuse Obsidian's command execution path
		plugin.app.commands.executeCommandById(cmd.id);
		commandsManager.addRecentCommand(cmd.id);
	} catch {}
	// Close after execute
	onClose?.();
}

// Capture key handling inside the popover to prevent leakage to underlying views
function handleGlobalKeydown(e: KeyboardEvent) {
	if (!rootEl) return;
	const target = e.target as Node | null;
	const isInside = target ? rootEl.contains(target) : false;
	if (!isInside) return;

	const isModF =
		(e.key === "f" || e.key === "F") &&
		(e.metaKey === true || e.ctrlKey === true);
	if (isModF) {
		e.preventDefault();
		e.stopPropagation();
		if (document.activeElement !== searchInputEl) {
			searchInputEl?.focus();
			return;
		}
		keyboardListenerIsActive = !keyboardListenerIsActive;
		return;
	}

	// If typing in the search input, use arrows to move selection
	if (target === searchInputEl && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
		e.preventDefault();
		e.stopPropagation();
		moveSelection(e.key === "ArrowDown" ? 1 : -1);
		return;
	}

	// Keyboard navigation and close behavior
	if (e.key === "Escape") {
		e.preventDefault();
		e.stopPropagation();
		onClose?.();
		return;
	}

	if (e.key === "ArrowDown") {
		e.preventDefault();
		e.stopPropagation();
		moveSelection(1);
		return;
	}
	if (e.key === "ArrowUp") {
		e.preventDefault();
		e.stopPropagation();
		moveSelection(-1);
		return;
	}
	if (e.key === "Tab") {
		e.preventDefault();
		e.stopPropagation();
		moveSelection(e.shiftKey ? -1 : 1);
		return;
	}
	if (e.key === "Enter") {
		e.preventDefault();
		e.stopPropagation();
		runSelectedCommand();
		return;
	}

	// Local physical listening: capture when toggled on
	if (keyboardListenerIsActive) {
		e.preventDefault();
		e.stopPropagation();
		try {
			activeKeysStore.handlePhysicalKeyDown(e);
			refilter();
		} catch {}
		return;
	}
}

function handleListClick(e: MouseEvent) {
	const t = e.target as HTMLElement | null;
	if (!t) return;
	// Ignore clicks on action icons or hotkey chips
	if (t.closest(".action-icons") || t.closest(".kbanalizer-setting-hotkey")) {
		return;
	}
	const row = t.closest(
		".kbanalizer-setting-item.setting-item",
	) as HTMLDivElement | null;
	if (!row) return;
	const rows = getRowNodes();
	const idx = rows.indexOf(row);
	if (idx >= 0) {
		selectedIndex = idx;
		queueUpdateSelection(false);
		runSelectedCommand();
	}
}

const onScroll = () => recomputePosition();
let ro: ResizeObserver | null = null;
let isResizing = false;

onMount(() => {
	refilter();
	recomputePosition();
	window.addEventListener("resize", recomputePosition);
	document.addEventListener("scroll", onScroll, true);
	if ("ResizeObserver" in window && rootEl) {
		ro = new ResizeObserver(() => recomputePosition());
		ro.observe(rootEl);
	}
	// Capture keyboard at capture phase while popover is open
	window.addEventListener("keydown", handleGlobalKeydown, true);
	window.addEventListener("keyup", handleGlobalKeyup, true);
	// Focus search input on open; keep list selection navigable via arrows
	queueMicrotask(() => searchInputEl?.focus());
	queueUpdateSelection(false);
});

onDestroy(() => {
	window.removeEventListener("resize", recomputePosition);
	document.removeEventListener("scroll", onScroll, true);
	ro?.disconnect();
	ro = null;
	window.removeEventListener("keydown", handleGlobalKeydown, true);
	window.removeEventListener("keyup", handleGlobalKeyup, true);
	window.removeEventListener("pointermove", onLeftResizeMove, true);
	window.removeEventListener("pointerup", onLeftResizeUp, true);
	window.removeEventListener("pointermove", onBottomResizeMove, true);
	window.removeEventListener("pointerup", onBottomResizeUp, true);
});

// Provide contexts expected by reused components (GroupSelector, SearchMenu, CommandsList)
const visualKeyboardManager = new VisualKeyboardManager();
const activeKeysStore = new ActiveKeysStore(plugin.app, visualKeyboardManager);
setContext("keyboard-analyzer-plugin", plugin);
setContext("visualKeyboardManager", visualKeyboardManager);
setContext("activeKeysStore", activeKeysStore);
</script>

<div
  class="qv-popover"
  class:is-above={placeAbove}
  style="position: fixed; top: {coords.top}px; left: {coords.left}px; max-height:{coords.maxHeight}px; width:{coords.width}px;"
  use:clickOutside
  onclick_outside={() => {
    if (resizingLeft) return
    if (Date.now() < suppressOutsideCloseUntil) return
    onClose?.()
  }}
  role="dialog"
  aria-label="Quick View — Commands"
  bind:this={rootEl}
>
  <!-- Left resize handle -->
  <div
    class="qv-resize-handle-left"
    role="separator"
    aria-orientation="vertical"
    title="Resize width"
    onpointerdown={onLeftResizeDown}
  ></div>

  <!-- Reused SearchMenu in compact mode -->
  <div class="qv-header-compact">
    <SearchMenu
      {plugin}
      bind:inputHTML={searchInputEl}
      selectedGroup={selectedGroupID}
      {search}
      bind:keyboardListenerIsActive
      onSearch={(q, mods, key, group) => {
        search = q
        activeModifiers = mods
        activeKey = key
        selectedGroupID = group
        refilter()
      }}
    />
  </div>

  <!-- Results (rendered via CommandsList for reuse) -->
  <div
    class="qv-content"
    role="listbox"
    aria-label="Command results"
    tabindex="0"
    onclick={handleListClick}
    bind:this={listContainer}
  >
    <CommandsList {filteredCommands} selectedGroup={selectedGroupID} />
  </div>

  <!-- Bottom resize handle -->
  <div
    class="qv-resize-handle-bottom"
    role="separator"
    aria-orientation="horizontal"
    title="Resize height"
    onpointerdown={onBottomResizeDown}
  ></div>
</div>

<style>
  .qv-popover {
    min-width: 320px;
    max-width: 90vw;
    min-height: 240px;
    max-height: 60vh;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
    z-index: 180000;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* prevent horizontal scroll */
  }
  .qv-popover.is-above::after {
    content: '';
  }
  .qv-header-compact {
    padding: 8px;
    border-bottom: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
  }
  .qv-content {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 6px;
  }

  /* Left resize handle */
  .qv-resize-handle-left {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 8px;
    cursor: ew-resize;
    border-right: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 70%),
      transparent
    );
  }
  .qv-resize-handle-left:hover {
    background: linear-gradient(
      to right,
      color-mix(in oklab, var(--background-modifier-border), transparent 50%),
      transparent
    );
  }

  /* Bottom resize handle */
  .qv-resize-handle-bottom {
    height: 10px;
    cursor: ns-resize;
    border-top: 1px solid var(--background-modifier-border);
    background: linear-gradient(
      to bottom,
      color-mix(in oklab, var(--background-modifier-border), transparent 70%),
      transparent
    );
  }

  /* Visual focus ring / selection when navigating with keyboard (global to target nested list rows) */
  :global(.qv-popover .setting-item.keyboard-selected) {
    outline: 2px solid var(--interactive-accent);
    outline-offset: -2px;
    border-radius: 6px;
  }

  /* Compact list styles inside popover */
  :global(.qv-popover .kbanalizer-setting-item.setting-item) {
    padding: 4px 6px;
    min-height: unset;
  }
  :global(.qv-popover .kbanalizer-setting-item .setting-item-name) {
    font-size: 12.5px;
    line-height: 1.25;
  }
  :global(.qv-popover .kbanalizer-setting-item .setting-command-hotkeys .setting-hotkey) {
    transform: scale(0.95);
  }

  /* Ensure titles truncate instead of forcing horizontal scroll (global for nested component content) */
  :global(.qv-popover .setting-item-name .command-name) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
</style>
