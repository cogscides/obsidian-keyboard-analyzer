<!-- svelte-ignore a11y_click_events_have_key_events -->
<script lang="ts">
import type { Modifier } from "obsidian";
import { getContext } from "svelte";
import type KeyboardAnalyzerPlugin from "../main";
import type { CGroupFilterSettings } from "../managers/settingsManager";
import type { ActiveKeysStore } from "../stores/activeKeysStore.svelte.ts";
import logger from "../utils/logger";
import { convertModifiers, unconvertModifier } from "../utils/modifierUtils";

interface Props {
	plugin: KeyboardAnalyzerPlugin;
	inputHTML?: HTMLInputElement;
	search?: string;
	searchCommandsCount?: number;
	searchHotkeysCount?: number;
	keyboardListenerIsActive?: boolean;
	selectedGroup: string;
	onSearch?: (
		search: string,
		activeModifiers: string[],
		activeKey: string,
		selectedGroup: string,
	) => void;
}

let {
	plugin = $bindable(),
	inputHTML = $bindable(),
	searchCommandsCount = $bindable(0),
	searchHotkeysCount = $bindable(0),
	keyboardListenerIsActive = $bindable(false),
	selectedGroup = $bindable(""),
	onSearch = $bindable(() => {}),
	search = $bindable(""),
}: Props = $props();

const settingsManager = plugin.settingsManager;
const commandsManager = plugin.commandsManager;
const groupManager = plugin.groupManager;

// Friendly labels and tooltips for filter settings
const settingTitles: Record<string, string> = {
	StrictModifierMatch: "Strict modifiers filtration",
	ViewWOhotkeys: "Only with hotkeys",
	OnlyCustom: "Only custom hotkeys",
	OnlyDuplicates: "Only duplicates",
	FeaturedFirst: "Featured first",
	HighlightCustom: "Highlight custom keys",
	HighlightDuplicates: "Highlight duplicates",
	HighlightBuiltIns: "Highlight built-in modules",
	DisplayIDs: "Display command IDs",
	ShowPluginBadges: "Show plugin badges",
	GroupByPlugin: "Group by plugin",
	DisplayGroupAssignment: "Show group assignment",
	DisplayInternalModules: "Display internal modules",
	DisplaySystemShortcuts: "Include system shortcuts",
};

const settingTooltips: Record<string, string> = {
	StrictModifierMatch:
		"Match modifiers exactly. Example: Ctrl+K won't match Ctrl+Shift+K.",
	ViewWOhotkeys: "Show only commands that have at least one hotkey assigned.",
	OnlyCustom: "Show only commands that have at least one user-set hotkey.",
	OnlyDuplicates: "Show only commands where at least one hotkey is duplicated.",
	FeaturedFirst: "Pin featured commands to the top of results.",
	HighlightCustom: "Visually mark hotkeys customized by you.",
	HighlightDuplicates:
		"Highlight when the same hotkey is used by multiple commands.",
	HighlightBuiltIns:
		"Subtly mark built-in (internal) plugin groups in commands list.",
	DisplayIDs: "Show internal command IDs and allow searching by ID.",
	ShowPluginBadges:
		"Show a compact plugin label before each command (flat list).",
	GroupByPlugin: "Group commands by their plugin.",
	DisplayGroupAssignment: "Display which group a command belongs to.",
	DisplayInternalModules:
		"Include commands from Obsidian’s built-in modules (e.g., File Explorer).",
	DisplaySystemShortcuts:
		"List common OS/editor defaults like Copy/Paste, Undo/Redo, Zoom.",
};

const filterSettings: CGroupFilterSettings = $derived.by(() => {
	// Track group and default settings changes so this recomputes when settings update
	groupManager.groups;
	settingsManager.settings.defaultFilterSettings;
	return groupManager.getGroupSettings(selectedGroup);
});

// Quiet derived re-computations to avoid noisy consoles
$effect(() => {
	filterSettings;
	selectedGroup;
});

// Removed noisy $inspect to avoid dev console spam
// logger.debug('GroupManager try to find', selectedGroup, groupManager.getGroup(selectedGroup))

const activeKeysStore: ActiveKeysStore = getContext("activeKeysStore");

let viewDropdownOpen = $state(false);
// let modulesDropdownOpen = $state(false) // removed
let inputIsFocused = $state(false);
let filterIsOpen = $state(false);
let refreshIsActive = $state(false);
let PressedKeysStore = $derived(activeKeysStore);

// Debounce for text input
let inputDebounce: ReturnType<typeof setTimeout> | null = null;

// No local UI snapshot to avoid reactive loops; use derived filterSettings directly
// Idempotent guard to avoid re-entrant onSearch loops (stabilizes UI)
let lastSearchPayload: {
	search: string;
	activeKey: string;
	selectedGroup: string;
	modifiersSig: string;
} = $state({ search: "", activeKey: "", selectedGroup: "", modifiersSig: "" });

// Groups
let excludedModules = $derived.by(() => {
	// Track group changes to recompute excluded modules
	groupManager.groups;
	return groupManager.getExcludedModulesForGroup(selectedGroup);
});

function ClearSearch() {
	if (search === "") {
		PressedKeysStore.reset();
	} else {
		search = "";
	}
	inputHTML?.focus();
}

function ToggleViewDropdown() {
	const next = !viewDropdownOpen;
	viewDropdownOpen = next;
	if (next) {
		filterIsOpen = false;
	}
}

// function ToggleModulesDropdown() {} // removed

// TODO Unify this with the settingsManager
function setFilterSetting(setting: keyof CGroupFilterSettings, value: boolean) {
	logger.debug("SearchMenu setFilterSetting called", {
		selectedGroup,
		setting,
		value,
	});
	groupManager.updateGroupFilterSettings(selectedGroup, { [setting]: value });
	logger.debug("SearchMenu after updateGroupFilterSettings", {
		selectedGroup,
		persisted: groupManager.getGroupSettings(selectedGroup),
	});
	handleSearchInput();
}

function ActivateKeyboardListener() {
	const next = !keyboardListenerIsActive;
	logger.debug("[keys] toggle listener", {
		from: keyboardListenerIsActive,
		to: next,
	});
	keyboardListenerIsActive = next;
	inputHTML?.focus();
}

function RefreshCommands() {
	refreshIsActive = true;
	commandsManager.refreshCommands();
	setTimeout(() => {
		refreshIsActive = false;
	}, 1000);
}

function handleKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		// Close any open menus and deactivate keyboard listener
		if (viewDropdownOpen || filterIsOpen) {
			viewDropdownOpen = false;
			filterIsOpen = false;
			e.stopPropagation();
			return;
		}
		if (keyboardListenerIsActive) {
			keyboardListenerIsActive = false;
			// fall through to allow clearing keys below if any are active
		}
		// Clear active key/modifiers if present
		if (PressedKeysStore.activeKey || PressedKeysStore.activeModifiers.length) {
			PressedKeysStore.reset();
			handleSearchInput();
			e.stopPropagation();
			e.preventDefault();
			return;
		}
	}
	if (keyboardListenerIsActive) {
		// Let the global listener handle physical keys; avoid double-processing
		e.stopPropagation();
		e.preventDefault();
		return;
	}
	// Fallback: when listener is off, local handler can still process keys if needed
	// Re-apply search when hotkey listeners mutate active keys
	handleSearchInput();
}

function handleSearchInput() {
	try {
		// Normalize payload and short-circuit identical requests to avoid reactive loops
		const mods = convertModifiers(PressedKeysStore.activeModifiers);
		const next = {
			search: String(search ?? ""),
			activeKey: String(PressedKeysStore.activeKey ?? ""),
			selectedGroup: String(selectedGroup ?? ""),
			modifiersSig: mods.join("+"),
		};
		if (
			next.search === lastSearchPayload.search &&
			next.activeKey === lastSearchPayload.activeKey &&
			next.selectedGroup === lastSearchPayload.selectedGroup &&
			next.modifiersSig === lastSearchPayload.modifiersSig
		) {
			return;
		}
		lastSearchPayload = next;
		onSearch(next.search, mods, next.activeKey, next.selectedGroup);
	} catch {
		// Defensive: never throw from UI handler
	}
}

function handleDebouncedInput() {
	if (inputDebounce) clearTimeout(inputDebounce);
	inputDebounce = setTimeout(() => {
		handleSearchInput();
	}, 200);
}

function handleModifierChipClick(modifier: string) {
	// Convert displayed modifier (e.g., 'Ctrl') back to abstract ('Control') so it's recognized as a modifier
	const abstractModifier = unconvertModifier(modifier as Modifier);
	PressedKeysStore.handleKeyClick(abstractModifier);
	// Ensure current text query is applied alongside modifier changes
	handleSearchInput();
}

// $effect(() => {
//   handleSearchInput()
// })

// Re-filter when the selected group changes so existing search text applies
$effect(() => {
	selectedGroup;
	handleSearchInput();
});
</script>

<GroupSelector bind:selectedGroup />

<!-- Developer logger removed in favor of toolbar inspector -->

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hotkey-settings-container" onkeydown={handleKeyDown}>
  <!-- COMPONENT: Search Input -->

  <div class="search-wrapper" class:is-focused={inputIsFocused}>
    <div class="modifiers-wrapper">
      {#each PressedKeysStore.sortedModifiers as modifier}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd
          class="modifier setting-hotkey"
          onclick={() => handleModifierChipClick(modifier)}
        >
          {settingsManager.settings.useBakedKeyNames
            ? getBakedModifierLabel(modifier)
            : modifier}
        </kbd>
      {/each}
      {#if PressedKeysStore.activeKey}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd
          class="modifier setting-hotkey"
          onclick={() =>
            PressedKeysStore.handleKeyClick(PressedKeysStore.activeKey)}
        >
          {settingsManager.settings.useBakedKeyNames
            ? getBakedKeyLabel(PressedKeysStore.activeKey)
            : PressedKeysStore.getDisplayKey()}
        </kbd>
      {/if}
    </div>
    <div class="hotkey-search-container">
      <input
        type="text"
        placeholder="Filter..."
        bind:value={search}
        bind:this={inputHTML}
        onfocus={() => (inputIsFocused = true)}
        onblur={() => (inputIsFocused = false)}
        oninput={handleDebouncedInput}
      />
      <div class="meta-search-wrapper">
        <button
          class="keyboard-icon icon {keyboardListenerIsActive ? 'pulse' : ''}"
          aria-label={keyboardListenerIsActive
            ? 'Press Esc to deactivate key listener'
            : `Press ${convertModifiers(['Mod'])[0]}+F or long press to activate key listener`}
          aria-pressed={keyboardListenerIsActive}
          title={keyboardListenerIsActive
            ? 'Deactivate key listener (Esc)'
            : 'Activate key listener'}
          onclick={ActivateKeyboardListener}
        >
          <CircleDotIcon size={16} />
        </button>
        <button
          class="clear-icon icon"
          aria-label="Clear text or reset keys"
          title="Clear text or reset keys"
          onclick={ClearSearch}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  </div>
  <div
    class="menu-anchor"
    use:clickOutside
    onclick_outside={() => (filterIsOpen = false)}
  >
    <button
      id="hotkey-filter-button"
      class={filterIsOpen ? 'is-active' : ''}
      aria-label="Filter Commands"
      aria-pressed={filterIsOpen}
      onclick={() => (filterIsOpen = !filterIsOpen)}
    >
      <FilterIcon size={16} />
    </button>

    {#if filterIsOpen}
      <div class="popup-filter-menu-container is-open" transition:slide>
        <div class="popup-filter-menu" transition:fade>
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.StrictModifierMatch}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeyValues.StrictModifierMatch as keyof CGroupFilterSettings,
                  !filterSettings.StrictModifierMatch
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-StrictModifierMatch"
                checked={filterSettings.StrictModifierMatch}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.StrictModifierMatch}
              <span
                class="info-icon"
                title={settingTooltips.StrictModifierMatch}
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.ViewWOhotkeys}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeyValues.ViewWOhotkeys as keyof CGroupFilterSettings,
                  !filterSettings.ViewWOhotkeys
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-ViewWOhotkeys"
                checked={filterSettings.ViewWOhotkeys}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.ViewWOhotkeys}
              <span class="info-icon" title={settingTooltips.ViewWOhotkeys}>
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.OnlyCustom}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeyValues.OnlyCustom as keyof CGroupFilterSettings,
                  !filterSettings.OnlyCustom
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-OnlyCustom"
                checked={filterSettings.OnlyCustom}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.OnlyCustom}
              <span class="info-icon" title={settingTooltips.OnlyCustom}>
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.OnlyDuplicates}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeyValues.OnlyDuplicates as keyof CGroupFilterSettings,
                  !filterSettings.OnlyDuplicates
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-OnlyDuplicates"
                checked={filterSettings.OnlyDuplicates}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.OnlyDuplicates}
              <span class="info-icon" title={settingTooltips.OnlyDuplicates}>
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.DisplaySystemShortcuts}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeyValues.DisplaySystemShortcuts as keyof CGroupFilterSettings,
                  !filterSettings.DisplaySystemShortcuts
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-DisplaySystemShortcuts"
                checked={filterSettings.DisplaySystemShortcuts}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.DisplaySystemShortcuts}
              <span
                class="info-icon"
                title={settingTooltips.DisplaySystemShortcuts}
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
        </div>
        <div class="popup-filter-menu-background"></div>
      </div>
    {/if}
  </div>

  <!-- COMPONENT: View Dropdown -->

  <div
    class="menu-anchor"
    use:clickOutside
    onclick_outside={() => (viewDropdownOpen = false)}
  >
    <button
      id="hotkey-view-button"
      aria-label="View Options"
      class={viewDropdownOpen ? 'is-active' : ''}
      aria-pressed={viewDropdownOpen}
      onclick={ToggleViewDropdown}
      >View
    </button>
    {#if viewDropdownOpen}
      <div class="popup-filter-menu-container is-open" transition:slide>
        <div class="popup-filter-menu">
          {#each Object.values(ViewSettingsKeyValues) as setting}
            <div class="setting-item mod-toggle">
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                class="checkbox-container"
                class:is-enabled={filterSettings[
                  setting as unknown as keyof FilterSettings
                ]}
                onclick={() =>
                  setFilterSetting(
                    setting as unknown as keyof CGroupFilterSettings,
                    !(filterSettings[
                      setting as unknown as keyof FilterSettings
                    ] as boolean)
                  )}
              >
                <input
                  type="checkbox"
                  tabindex="0"
                  checked={filterSettings[
                    setting as unknown as keyof FilterSettings
                  ]}
                  id={`view-${setting}`}
                />
              </div>
              <div class="setting-item-name">
                {settingTitles[setting] || setting}
                <span
                  class="info-icon"
                  title={settingTooltips[setting] || setting}
                >
                  <InfoIcon size={14} />
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Modules dropdown removed intentionally -->

  <!-- COMPONENT: Community Plugin Search Summary -->

  <div class="community-plugin-search-summary u-muted">
    {#if searchCommandsCount !== 0}
      <span class="counts-line">
        <span class="n">{searchHotkeysCount}</span>
        <span class="label"> keys</span>
        <span> | </span>
        <span class="n">{searchCommandsCount}</span>
        <span class="label"> cmds</span>
      </span>
    {:else}
      <span>Hotkeys not found</span>
    {/if}
  </div>

  <!-- COMPONENT: Refresh Button -->

  <button
    id="hotkey-refresh-button"
    aria-label="Refresh Commands"
    title="Refresh commands"
    class={refreshIsActive ? 'animation-is-active' : ''}
    onclick={RefreshCommands}
  >
    <RefreshCw size={16} />
  </button>
</div>
