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
  } from 'lucide-svelte'
  import { slide, fade } from 'svelte/transition'
  import {
    FilterSettingsKeys,
    type CGroup,
    type CGroupFilterSettings,
    type CGroupSettingTitles,
  } from '../managers/settingsManager'
  import type { FilterSettings } from '../managers/settingsManager'
  import { convertModifiers } from '../utils/modifierUtils'

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
  }: Props = $props()

  let search = $state('')

  const settingsManager = plugin.settingsManager
  const commandsManager = plugin.commandsManager
  const groupManager = plugin.groupManager

  const filterSettings: CGroupFilterSettings = $derived(
    groupManager.getGroupSettings(selectedGroup),
  )

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

  // Groups
  let excludedModules = $derived(
    groupManager.getExcludedModulesForGroup(selectedGroup),
  )

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
  function toggleFilterSetting(setting: keyof typeof filterSettings) {
    groupManager.updateGroupFilterSettings(selectedGroup, {
      [setting]: !filterSettings[setting],
    })
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
      selectedGroup,
    )
  }

  // $effect(() => {
  //   handleSearchInput()
  // })
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

  <!-- COMPONENT: Popup Filter Menu -->

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
        <!-- OPTION: Featured First -->
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.StrictModifierMatch}
            onclick={() => {
              toggleFilterSetting(FilterSettingsKeys.StrictModifierMatch)
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
        <!-- OPTION: Highlight Custom -->
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.ViewWOhotkeys}
            onclick={() => {
              toggleFilterSetting(FilterSettingsKeys.ViewWOhotkeys)
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.ViewWOhotkeys}
            />
          </div>
          <div class="setting-item-name popup-filter-title">
            Only with hotkeys
          </div>
        </div>
        <!-- OPTION: Highlight Duplicates -->
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.HighlightDuplicates}
            onclick={() => {
              toggleFilterSetting(FilterSettingsKeys.HighlightDuplicates)
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
        <!-- OPTION: Display Command IDs -->
        <div class="setting-item mod-toggle popup-filter-menu">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.DisplayIDs}
            onclick={() => {
              toggleFilterSetting(FilterSettingsKeys.DisplayIDs)
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

  <!-- COMPONENT: View Dropdown -->

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
        {#each Object.values(FilterSettingsKeys) as setting}
          <div class="setting-item mod-toggle">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              aria-label="Toggle {setting}"
              class="checkbox-container"
              class:is-enabled={filterSettings[setting as keyof FilterSettings]}
              onclick={() =>
                toggleFilterSetting(setting as keyof FilterSettings)}
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

  <!-- COMPONENT: Modules Dropdown -->

  <button
    id="hotkey-modules-button"
    class={modulesDropdownOpen ? 'is-active' : ''}
    aria-label="Modules Options"
    onclick={ToggleModulesDropdown}
  >
    Modules <ChevronDown size={16} />
  </button>

  <!-- COMPONENT: Popup Filter Menu -->

  {#if modulesDropdownOpen}
    <div class="popup-filter-menu-container is-open" transition:slide>
      <div class="popup-filter-menu">
        <div class="setting-item mod-toggle">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            class="checkbox-container"
            class:is-enabled={filterSettings.DisplayInternalModules}
            onclick={() =>
              toggleFilterSetting(
                'DisplayInternalModules' as keyof FilterSettings,
              )}
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
                        groupManager.toggleExcludedModuleForGroup(
                          selectedGroup,
                          plugin.manifest.id,
                        )
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
