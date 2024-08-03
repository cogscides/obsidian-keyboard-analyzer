<!-- svelte-ignore a11y_click_events_have_key_events -->
<script lang="ts">
  import type { getIconIds, Modifier } from 'obsidian'
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import {
    CircleDotIcon,
    FilterIcon,
    CrossIcon,
    RefreshCw,
    ChevronDown,
  } from 'lucide-svelte'
  import getActiveKeysStore from '../stores/activeKeysStore.svelte'
  import { convertModifiers, sortModifiers } from '../utils/modifierUtils'
  import { slide, fade } from 'svelte/transition'
  import type { FilterSettings } from '../managers/settingsManager.svelte'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    inputHTML?: HTMLInputElement
    searchCommandsCount?: number
    searchHotkeysCount?: number
    keyboardListenerIsActive?: boolean
    selectedGroup?: string
    onSearch?: (
      search: string,
      activeModifiers: string[],
      activeKey: string,
      selectedGroup?: string
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
  }: Props = $props()

  let search = $state('')
  const settingsManager = plugin.settingsManager
  const commandsManager = plugin.commandsManager
  const filterSettings: FilterSettings = $derived(
    settingsManager.getSetting('filterSettings')
  )

  const activeKeysStore = getContext<ActiveKeysStore>('activeKeysStore')

  let viewDropdownOpen = $state(false)
  let modulesDropdownOpen = $state(false)
  let inputIsFocused = $state(false)
  let filterIsOpen = $state(false)
  let refreshIsActive = $state(false)
  let PressedKeysStore = $derived(activeKeysStore)

  // Groups
  let excludedModules = $derived(commandsManager.getExcludedModulesForGroup(selectedGroup))
  $inspect(excludedModules)

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

  function toggleFilterSetting(setting: keyof typeof filterSettings) {
    settingsManager.updateFilterSettings({
      [setting]: !filterSettings[setting],
    })
  }

  function handleGroupSelection(group: string) {
    selectedGroup = group
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
  }

  function handleSearchInput() {
    onSearch(
      search,
      convertModifiers(PressedKeysStore.activeModifiers),
      PressedKeysStore.activeKey,
      selectedGroup
    )
  }

  // $effect(() => {
  //   handleSearchInput()
  // })
</script>

<select
  class="dropdown mt-4"
  bind:value={selectedGroup}
  onchange={() => handleGroupSelection(selectedGroup)}
>
  <option value="">All Commands</option>
  <option value="featured">Featured</option>
  <option value="recent">Recent</option>
  {#each Array.from(commandsManager.getCommandGroups().keys()) as group}
    <option value={group}>{group}</option>
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
  <div class="search-wrapper" class:is-focused={inputIsFocused}>
    <div class="modifiers-wrapper">
      {#each PressedKeysStore.sortedModifiers as modifier}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <kbd
          class="modifier"
          onclick={() => PressedKeysStore.handleKeyClick(modifier)}
        >
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
  <button
    id="hotkey-filter-button"
    class={filterIsOpen ? 'is-active' : ''}
    aria-label="Filter Commands"
    onclick={() => (filterIsOpen = !filterIsOpen)}
  >
    <FilterIcon size={16} />
  </button>
  {#if filterIsOpen}
    <!-- use:clickOutside={() =>
        // await timeout 40ms
        setTimeout(() => {
          if (filterIsOpen) {
            filterIsOpen = false
          }
        }, 40)} -->
    <div
      transition:slide
      class="popup-filter-menu-container {filterIsOpen ? 'is-open' : ''}"
    >
      <div transition:fade>
        <div class="setting-item mod-toggle popup-filter-menu">
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings?.FeaturedFirst}
          >
            <!-- onclick={onFeaturedFirstOptionTriggered} -->
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.FeaturedFirst}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display featured first
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.StrictModifierMatch}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  StrictModifierMatch: !filterSettings.StrictModifierMatch,
                },
              })
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.StrictModifierMatch}
            />
          </div>
          <div class="setting-item-name popup-filter-title">Strict Search</div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.HighlightCustom}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  HighlightCustom: !filterSettings.HighlightCustom,
                },
              })
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.HighlightCustom}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight custom hotkeys
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.HighlightDuplicates}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  HighlightDuplicates: !filterSettings.HighlightDuplicates,
                },
              })
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.HighlightDuplicates}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Highlight hotkey duplicates
          </div>
        </div>
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.DisplayIDs}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  DisplayIDs: !filterSettings.DisplayIDs,
                },
              })
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.DisplayIDs}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Display command ID's
          </div>
        </div>
      </div>
      <!-- popup darker background -->
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="popup-filter-menu-background" />
    </div>
  {/if}
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
        <!-- Move FeaturedFirst, HighlightCustom, HighlightDuplicates here -->
        <!-- Add GroupByPlugin, DisplayGroupAssignment options -->
        {#each ['FeaturedFirst', 'HighlightCustom', 'HighlightDuplicates', 'GroupByPlugin', 'DisplayGroupAssignment'] as setting}
        <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              aria-label="Toggle {setting}"
              class="checkbox-container"
              class:is-enabled={filterSettings[setting as keyof FilterSettings]}
              onclick={() => toggleFilterSetting(setting as keyof FilterSettings)}
            >
              <input
                type="checkbox"
                tabindex="0"
                bind:checked={filterSettings[setting as keyof FilterSettings]}
              />
            </div>
            <div class="setting-item-name">{setting}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}


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
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="checkbox-container"
          class:is-enabled={filterSettings.DisplayInternalModules}
          onclick={() => toggleFilterSetting('DisplayInternalModules' as keyof FilterSettings)}
        >
          <input
            type="checkbox"
            tabindex="0"
            bind:checked={filterSettings.DisplayInternalModules}
          />
        </div>
        <div class="setting-item-name">Display Internal Modules</div>
      </div>
      <div class="installed-plugins-container">
        {#each commandsManager.getInstalledPluginIDs() as pluginID}
      
          {#if commandsManager.isInternalModule(pluginID)}
          <div class="setting-item mod-toggle">
            <div class="installed-plugin-name">{plugin.manifest.id}</div>
            <div class="installed-plugin-icon">
              <div class="checkbox-container">
                <input
                  type="checkbox"
                  tabindex="0"
                  checked={!excludedModules.includes(plugin.manifest.id)}
                  onchange={() => {
                    commandsManager.toggleExcludedModuleForGroup(selectedGroup, plugin.manifest.id)
                  }}
                />
              </div>
            </div>
          </div>
          {/if}
        {/each}

      </div>
      <!-- Add a list of modules with checkboxes here -->
    </div>
  </div>


{/if}
  <div class="community-plugin-search-summary u-muted">
    {#if searchCommandsCount !== 0}
      <span>
        {searchHotkeysCount} keys | {searchCommandsCount} cmds
      </span>
    {:else}
      <span>Hotkeys not found</span>
    {/if}
  </div>
  <button
    id="hotkey-refresh-button"
    aria-label="Refresh Commands"
    class={refreshIsActive ? 'animation-is-active' : ''}
    onclick={RefreshCommands}
  >
    <RefreshCw size={16} />
  </button>
</div>
