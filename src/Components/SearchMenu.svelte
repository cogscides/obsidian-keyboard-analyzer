<!-- svelte-ignore a11y_click_events_have_key_events -->
<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import {
    CircleDotIcon,
    FilterIcon,
    CrossIcon,
    RefreshCw,
    ChevronDown,
    Info as InfoIcon,
  } from 'lucide-svelte'
  import { slide, fade } from 'svelte/transition'
  import {
    FilterSettingsKeys,
    type CGroup,
    type CGroupFilterSettings,
    type CGroupSettingTitles,
  } from '../managers/settingsManager'
  import type { FilterSettings } from '../managers/settingsManager'
  import { convertModifiers, unconvertModifier } from '../utils/modifierUtils'
  import type { Modifier } from 'obsidian'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    inputHTML?: HTMLInputElement | undefined
    searchCommandsCount?: number
    searchHotkeysCount?: number
    keyboardListenerIsActive?: boolean
    selectedGroup: string
    onSearch?: (
      search: string,
      activeModifiers: string[],
      activeKey: string,
      selectedGroup: string,
    ) => void
  }

  let {
    plugin = $bindable(),
    inputHTML = $bindable(),
    searchCommandsCount = $bindable(0),
    searchHotkeysCount = $bindable(0),
    keyboardListenerIsActive = $bindable(false),
    selectedGroup = $bindable(''),
    onSearch = $bindable(() => {}),
    search = $bindable(''),
  }: Props = $props()

  const settingsManager = plugin.settingsManager
  const commandsManager = plugin.commandsManager
  const groupManager = plugin.groupManager

  // Friendly labels and tooltips for filter settings
  const settingTitles: Record<string, string> = {
    StrictModifierMatch: 'Strict modifiers filtration',
    ViewWOhotkeys: 'Only with hotkeys',
    FeaturedFirst: 'Featured first',
    HighlightCustom: 'Highlight custom keys',
    HighlightDuplicates: 'Highlight duplicates',
    DisplayIDs: 'Display command IDs',
    GroupByPlugin: 'Group by plugin',
    DisplayGroupAssignment: 'Show group assignment',
    DisplayInternalModules: 'Display internal modules',
  }

  const settingTooltips: Record<string, string> = {
    StrictModifierMatch:
      "Match modifiers exactly. Example: Ctrl+K won't match Ctrl+Shift+K.",
    ViewWOhotkeys:
      'Show only commands that have at least one hotkey assigned.',
    FeaturedFirst: 'Pin featured commands to the top of results.',
    HighlightCustom: 'Visually mark hotkeys customized by you.',
    HighlightDuplicates:
      'Highlight when the same hotkey is used by multiple commands.',
    DisplayIDs:
      'Show internal command IDs and allow searching by ID.',
    GroupByPlugin: 'Group commands by their plugin.',
    DisplayGroupAssignment: 'Display which group a command belongs to.',
    DisplayInternalModules:
      'Include commands from Obsidian’s built-in modules (e.g., File Explorer).',
  }

  const filterSettings: CGroupFilterSettings = $derived.by(() => {
    // Track group and default settings changes so this recomputes when settings update
    groupManager.groups
    settingsManager.settings.defaultFilterSettings
    return groupManager.getGroupSettings(selectedGroup)
  })

  $effect(() => {
    const fs = filterSettings
    console.log('[KB] SearchMenu filterSettings derived changed', {
      selectedGroup,
      filterSettings: fs,
    })
  })

  $inspect(plugin.settingsManager)
  console.log(
    'GroupManager try to find',
    selectedGroup,
    groupManager.getGroup(selectedGroup),
  )

  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')

  let viewDropdownOpen = $state(false)
  let modulesDropdownOpen = $state(false)
  let inputIsFocused = $state(false)
  let filterIsOpen = $state(false)
  let refreshIsActive = $state(false)
  let PressedKeysStore = $derived(activeKeysStore)

  // No local UI snapshot to avoid reactive loops; use derived filterSettings directly

  // Groups
  let excludedModules = $derived.by(() => {
    // Track group changes to recompute excluded modules
    groupManager.groups
    return groupManager.getExcludedModulesForGroup(selectedGroup)
  })

  function ClearSearch() {
    if (search === '') {
      PressedKeysStore.reset()
    } else {
      search = ''
    }
    inputHTML?.focus()
  }

  function ToggleViewDropdown() {
    viewDropdownOpen = !viewDropdownOpen
  }

  function ToggleModulesDropdown() {
    modulesDropdownOpen = !modulesDropdownOpen
  }

  // TODO Unify this with the settingsManager
  function setFilterSetting(
    setting: keyof CGroupFilterSettings,
    value: boolean,
  ) {
    console.log('[KB] SearchMenu setFilterSetting called', {
      selectedGroup,
      setting,
      value,
    })
    groupManager.updateGroupFilterSettings(selectedGroup, { [setting]: value })
    console.log('[KB] SearchMenu after updateGroupFilterSettings', {
      selectedGroup,
      persisted: groupManager.getGroupSettings(selectedGroup),
    })
    handleSearchInput()
  }

  function ActivateKeyboardListener() {
    keyboardListenerIsActive = !keyboardListenerIsActive
    inputHTML?.focus()
  }

  function RefreshCommands() {
    refreshIsActive = true
    commandsManager.refreshCommands()
    setTimeout(() => {
      refreshIsActive = false
    }, 1000)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (keyboardListenerIsActive) {
      PressedKeysStore.handleKeyDown(e)
    }
    PressedKeysStore.handlePhysicalKeyDown(e)
    // Re-apply search when hotkey listeners mutate active keys
    handleSearchInput()
  }

  function handleSearchInput() {
    console.log('[KB] SearchMenu handleSearchInput', {
      search,
      activeModifiers: PressedKeysStore.activeModifiers,
      activeKey: PressedKeysStore.activeKey,
      selectedGroup,
      filterSettings,
    })
    onSearch(
      search,
      convertModifiers(PressedKeysStore.activeModifiers),
      PressedKeysStore.activeKey,
      selectedGroup,
    )
  }

  function handleModifierChipClick(modifier: string) {
    // Convert displayed modifier (e.g., 'Ctrl') back to abstract ('Control') so it's recognized as a modifier
    const abstractModifier = unconvertModifier(modifier as Modifier)
    PressedKeysStore.handleKeyClick(abstractModifier)
    // Ensure current text query is applied alongside modifier changes
    handleSearchInput()
  }

  // $effect(() => {
  //   handleSearchInput()
  // })

  // Re-filter when the selected group changes so existing search text applies
  $effect(() => {
    selectedGroup
    handleSearchInput()
  })
</script>

<select class="dropdown mt-4" bind:value={selectedGroup}>
  {#each groupManager.getGroups() as group}
    <option value={group.id}>{group.name}</option>
  {/each}
</select>

<div class="logger py-4 rounded-lg bg-base-100 border border-base-300">
  <div class="logger-header flex flex-col">
    <div class="logger-title">ActiveKeysStore:</div>
    <div class="logger-data">
      {activeKeysStore.ActiveModifiers}
      {activeKeysStore.ActiveKey}
    </div>
    <div class="logger-close absolute right-0"></div>
  </div>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hotkey-settings-container" onkeydown={handleKeyDown}>
  <!-- COMPONENT: Search Input -->

  <div class="search-wrapper" class:is-focused={inputIsFocused}>
    <div class="modifiers-wrapper">
      {#each PressedKeysStore.sortedModifiers as modifier}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd class="modifier" onclick={() => handleModifierChipClick(modifier)}>
          {modifier}
        </kbd>
      {/each}
      {#if PressedKeysStore.activeKey}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd
          class="modifier"
          onclick={() =>
            PressedKeysStore.handleKeyClick(PressedKeysStore.activeKey)}
        >
          {PressedKeysStore.getDisplayKey()}
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
        oninput={handleSearchInput}
      />
      <div class="meta-search-wrapper">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="keyboard-icon icon {keyboardListenerIsActive ? 'pulse' : ''}"
          aria-label={keyboardListenerIsActive
            ? 'Press Esc to deactivate key listener'
            : `Press ${convertModifiers(['Mod'])[0]}+F or long press to activate key listener`}
          onclick={ActivateKeyboardListener}
        >
          <CircleDotIcon size={20} />
        </div>
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div class="clear-icon icon" onclick={ClearSearch}>
          <CrossIcon size={20} />
        </div>
      </div>
    </div>
  </div>
  <div class="menu-anchor">
    <button
      id="hotkey-filter-button"
      class={filterIsOpen ? 'is-active' : ''}
      aria-label="Filter Commands"
      onclick={() => (filterIsOpen = !filterIsOpen)}
    >
      <FilterIcon size={16} />
    </button>

    {#if filterIsOpen}
      <div
        transition:slide
        class="popup-filter-menu-container {filterIsOpen ? 'is-open' : ''}"
      >
        <div transition:fade>
          <div class="setting-item mod-toggle popup-filter-menu">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.StrictModifierMatch}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeys.StrictModifierMatch,
                  !filterSettings.StrictModifierMatch,
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
                tabindex="0"
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle popup-filter-menu">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.ViewWOhotkeys}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeys.ViewWOhotkeys,
                  !filterSettings.ViewWOhotkeys,
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
              <span
                class="info-icon"
                title={settingTooltips.ViewWOhotkeys}
                tabindex="0"
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle popup-filter-menu">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.HighlightDuplicates}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeys.HighlightDuplicates,
                  !filterSettings.HighlightDuplicates,
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-HighlightDuplicates"
                checked={filterSettings.HighlightDuplicates}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.HighlightDuplicates}
              <span
                class="info-icon"
                title={settingTooltips.HighlightDuplicates}
                tabindex="0"
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="setting-item mod-toggle popup-filter-menu">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.DisplayIDs}
              onclick={() =>
                setFilterSetting(
                  FilterSettingsKeys.DisplayIDs,
                  !filterSettings.DisplayIDs,
                )}
            >
              <input
                type="checkbox"
                tabindex="0"
                id="filter-DisplayIDs"
                checked={filterSettings.DisplayIDs}
              />
            </div>
            <div class="setting-item-name popup-filter-title">
              {settingTitles.DisplayIDs}
              <span
                class="info-icon"
                title={settingTooltips.DisplayIDs}
                tabindex="0"
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

  <div class="menu-anchor">
    <button
      id="hotkey-view-button"
      aria-label="View Options"
      class={viewDropdownOpen ? 'is-active' : ''}
      onclick={ToggleViewDropdown}
      >View <ChevronDown size={16} />
    </button>
    {#if viewDropdownOpen}
      <div class="popup-filter-menu-container is-open" transition:slide>
        <div class="popup-filter-menu">
          {#each Object.values(FilterSettingsKeys) as setting}
            <div class="setting-item mod-toggle">
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                aria-label="Toggle {setting}"
                class="checkbox-container"
                class:is-enabled={filterSettings[
                  setting as keyof FilterSettings
                ]}
                onclick={() =>
                  setFilterSetting(
                    setting as keyof CGroupFilterSettings,
                    !(filterSettings[
                      setting as keyof FilterSettings
                    ] as boolean),
                  )}
              >
                <input
                  type="checkbox"
                  tabindex="0"
                  checked={filterSettings[setting as keyof FilterSettings]}
                  id={`filter-${setting}`}
                />
              </div>
              <div class="setting-item-name">
                {settingTitles[setting] || setting}
                <span
                  class="info-icon"
                  title={settingTooltips[setting] || setting}
                  tabindex="0"
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

  <!-- COMPONENT: Modules Dropdown -->

  <div class="menu-anchor">
    <button
      id="hotkey-modules-button"
      class={modulesDropdownOpen ? 'is-active' : ''}
      aria-label="Modules Options"
      onclick={ToggleModulesDropdown}
    >
      Modules <ChevronDown size={16} />
    </button>

    {#if modulesDropdownOpen}
      <div class="popup-filter-menu-container is-open" transition:slide>
        <div class="popup-filter-menu">
          <div class="setting-item mod-toggle">
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings.DisplayInternalModules}
            >
              <input
                type="checkbox"
                tabindex="0"
                checked={filterSettings.DisplayInternalModules}
                onchange={(e) =>
                  setFilterSetting(
                    'DisplayInternalModules' as keyof CGroupFilterSettings,
                    (e.currentTarget as HTMLInputElement).checked,
                  )}
              />
            </div>
            <div class="setting-item-name">
              {settingTitles.DisplayInternalModules}
              <span
                class="info-icon"
                title={settingTooltips.DisplayInternalModules}
                tabindex="0"
              >
                <InfoIcon size={14} />
              </span>
            </div>
          </div>
          <div class="installed-plugins-container">
            {#each commandsManager.getInstalledPluginIDs() as pluginID}
              {#if commandsManager.isInternalModule(pluginID)}
                <div class="setting-item mod-toggle">
                  <div
                    class="installed-plugin-name"
                    title={`Built-in module ID: ${pluginID}`}
                  >
                    {commandsManager.getPluginName(pluginID)}
                  </div>
                  <div class="installed-plugin-icon">
                    <div class="checkbox-container">
                      <input
                        type="checkbox"
                        tabindex="0"
                        checked={!excludedModules.includes(pluginID)}
                        onchange={() => {
                          groupManager.toggleExcludedModuleForGroup(
                            selectedGroup,
                            pluginID,
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- COMPONENT: Community Plugin Search Summary -->

  <div class="community-plugin-search-summary u-muted">
    {#if searchCommandsCount !== 0}
      <span>
        {searchHotkeysCount} keys | {searchCommandsCount} cmds
      </span>
    {:else}
      <span>Hotkeys not found</span>
    {/if}
  </div>

  <!-- COMPONENT: Refresh Button -->

  <button
    id="hotkey-refresh-button"
    aria-label="Refresh Commands"
    class={refreshIsActive ? 'animation-is-active' : ''}
    onclick={RefreshCommands}
  >
    <RefreshCw size={16} />
  </button>
</div>
