<!-- svelte-ignore a11y_click_events_have_key_events -->
<script lang="ts">
  import type { Modifier } from 'obsidian'
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import {
    CircleDotIcon,
    FilterIcon,
    CrossIcon,
    RefreshCw,
  } from 'lucide-svelte'
  import getActiveKeysStore from '../stores/activeKeysStore.svelte'
  import { convertModifiers, sortModifiers } from '../utils/modifierUtils'
  import { slide, fade } from 'svelte/transition'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    inputHTML?: HTMLInputElement
    searchCommandsCount?: number
    searchHotkeysCount?: number
    keyboardListenerIsActive?: boolean
    selectedGroup?: string
    onSearch?: (
      search: string,
      activeModifiers: Modifier[],
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
  const filterSettings = $derived(settingsManager.getSetting('filterSettings'))

  const activeKeysStore = getContext<ActiveKeysStore>('activeKeysStore')

  let inputIsFocused = $state(false)
  let filterIsOpen = $state(false)
  let refreshIsActive = $state(false)
  let PressedKeysStore = $derived(activeKeysStore)

  function ClearSearch() {
    if (search === '') {
      PressedKeysStore.reset()
    } else {
      search = ''
    }
    inputHTML?.focus()
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
    commandsManager.updateVisibleCommands()
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
      PressedKeysStore.activeModifiers,
      PressedKeysStore.activeKey,
      selectedGroup
    )
  }

  $effect(() => {
    handleSearchInput()
  })

  function toggleFilterSetting(setting: keyof typeof filterSettings) {
    settingsManager.updateFilterSettings({
      [setting]: !filterSettings[setting],
    })
    RefreshCommands()
  }
</script>

<select
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
            class:is-enabled={filterSettings.StrictSearch}
            onclick={() => {
              plugin.settingsManager.updateSettings({
                filterSettings: {
                  ...filterSettings,
                  StrictSearch: !filterSettings.StrictSearch,
                },
              })
              RefreshCommands()
            }}
          >
            <input
              type="checkbox"
              tabindex="0"
              bind:checked={filterSettings.StrictSearch}
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
              RefreshCommands()
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
              RefreshCommands()
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
              RefreshCommands()
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
  <!-- filter menu here -->
  <!-- </div> -->
  <!-- <div class="search-results"> -->
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
