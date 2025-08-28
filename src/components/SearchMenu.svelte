<script lang="ts">
  import type { Modifier } from 'obsidian'
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { CGroupFilterSettings } from '../managers/settingsManager'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import logger from '../utils/logger'
  import { convertModifiers, unconvertModifier } from '../utils/modifierUtils'
  import GroupSelector from './GroupSelector.svelte'
  import FloatingTooltip from './floating/FloatingTooltip.svelte'
  import FloatingDropdown from './floating/FloatingDropdown.svelte'
  import {
    CircleDot as CircleDotIcon,
    X,
    Filter as FilterIcon,
    Info as InfoIcon,
    RefreshCw,
    PencilLine as EditIcon,
  } from 'lucide-svelte'
  import type { FilterSettings } from '../managers/settingsManager/settingsManager.d'
  import {
    FilterSettingsKeyValues,
    ViewSettingsKeyValues,
  } from '../managers/settingsManager/keys'
  import {
    getBakedKeyLabel,
    getBakedModifierLabel,
  } from '../utils/normalizeKeyDisplay'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    inputHTML?: HTMLInputElement
    search?: string
    searchCommandsCount?: number
    searchHotkeysCount?: number
    keyboardListenerIsActive?: boolean
    selectedGroup: string
    onSearch?: (
      search: string,
      activeModifiers: string[],
      activeKey: string,
      selectedGroup: string
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
    OnlyCustom: 'Only custom hotkeys',
    OnlyDuplicates: 'Only duplicates',
    FeaturedFirst: 'Featured first',
    HighlightCustom: 'Highlight custom keys',
    HighlightDuplicates: 'Highlight duplicates',
    HighlightBuiltIns: 'Highlight built-in modules',
    DisplayIDs: 'Display command IDs',
    ShowPluginBadges: 'Show plugin badges',
    GroupByPlugin: 'Group by plugin',
    DisplayGroupAssignment: 'Show group assignment',
    DisplayInternalModules: 'Display internal modules',
    DisplaySystemShortcuts: 'Include system shortcuts',
  }

  const settingTooltips: Record<string, string> = {
    StrictModifierMatch:
      "Match modifiers exactly. Example: Ctrl+K won't match Ctrl+Shift+K.",
    ViewWOhotkeys: 'Show only commands that have at least one hotkey assigned.',
    OnlyCustom: 'Show only commands that have at least one user-set hotkey.',
    OnlyDuplicates:
      'Show only commands where at least one hotkey is duplicated.',
    FeaturedFirst: 'Pin featured commands to the top of results.',
    HighlightCustom: 'Visually mark hotkeys customized by you.',
    HighlightDuplicates:
      'Highlight when the same hotkey is used by multiple commands.',
    HighlightBuiltIns:
      'Subtly mark built-in (internal) plugin groups in commands list.',
    DisplayIDs: 'Show internal command IDs and allow searching by ID.',
    ShowPluginBadges:
      'Show a compact plugin label before each command (flat list).',
    GroupByPlugin: 'Group commands by their plugin.',
    DisplayGroupAssignment: 'Display which group a command belongs to.',
    DisplayInternalModules:
      'Include commands from Obsidian’s built-in modules (e.g., File Explorer).',
    DisplaySystemShortcuts:
      'List common OS/editor defaults like Copy/Paste, Undo/Redo, Zoom.',
  }

  const filterSettings: CGroupFilterSettings = $derived.by(() => {
    // Track group and default settings changes so this recomputes when settings update
    groupManager.groups
    settingsManager.settings.defaultFilterSettings
    return groupManager.getGroupSettings(selectedGroup)
  })

  // Quiet derived re-computations to avoid noisy consoles
  $effect(() => {
    filterSettings
    selectedGroup
  })

  // Removed noisy $inspect to avoid dev console spam
  // logger.debug('GroupManager try to find', selectedGroup, groupManager.getGroup(selectedGroup))

  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')

  let viewDropdownOpen = $state(false)
  // let modulesDropdownOpen = $state(false) // removed
  let inputIsFocused = $state(false)
  let filterIsOpen = $state(false)
  let refreshIsActive = $state(false)
  let editMode = $state(false)
  const PressedKeysStore = $derived(activeKeysStore)
  import { editModeStore } from '../stores/uiState.svelte.ts'
  $effect(() => {
    const unsub = editModeStore.subscribe(v => (editMode = v))
    return () => unsub()
  })

  function ToggleEditMode() {
    editModeStore.update(v => !v)
  }

  // Debounce for text input
  let inputDebounce: ReturnType<typeof setTimeout> | null = null

  // No local UI snapshot to avoid reactive loops; use derived filterSettings directly
  // Idempotent guard to avoid re-entrant onSearch loops (stabilizes UI)
  let lastSearchPayload: {
    search: string
    activeKey: string
    selectedGroup: string
    modifiersSig: string
  } = $state({ search: '', activeKey: '', selectedGroup: '', modifiersSig: '' })

  function ClearSearch() {
    if (search === '') {
      PressedKeysStore.reset()
    } else {
      search = ''
    }
    inputHTML?.focus()
  }

  // function ToggleModulesDropdown() {} // removed

  // TODO Unify this with the settingsManager
  function setFilterSetting(
    setting: keyof CGroupFilterSettings,
    value: boolean
  ) {
    logger.debug('SearchMenu setFilterSetting called', {
      selectedGroup,
      setting,
      value,
    })
    groupManager.updateGroupFilterSettings(selectedGroup, { [setting]: value })
    logger.debug('SearchMenu after updateGroupFilterSettings', {
      selectedGroup,
      persisted: groupManager.getGroupSettings(selectedGroup),
    })
    handleSearchInput()
  }

  function ActivateKeyboardListener() {
    const next = !keyboardListenerIsActive
    logger.debug('[keys] toggle listener', {
      from: keyboardListenerIsActive,
      to: next,
    })
    keyboardListenerIsActive = next
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
    if (e.key === 'Escape') {
      if (viewDropdownOpen || filterIsOpen) {
        viewDropdownOpen = false
        filterIsOpen = false
        e.stopPropagation()
        return
      }
    }
    // When listener is active, let global handler own keys entirely
    if (keyboardListenerIsActive) {
      e.stopPropagation()
      e.preventDefault()
      return
    }

    // Backspace should pop activeKey/modifiers when text query is empty (listener is not active)
    if (e.key === 'Backspace' && String(search || '').trim() === '') {
      if (PressedKeysStore.activeKey) {
        PressedKeysStore.clearActiveKey()
      } else if (PressedKeysStore.activeModifiers.length > 0) {
        // Pop from the end of the sorted list so UX reflects visual order
        const sorted = [...PressedKeysStore.sortedModifiers]
        sorted.pop()
        PressedKeysStore.ActiveModifiers = sorted as unknown as Modifier[]
      }
      handleSearchInput()
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Normal path: apply search for any other key affecting input
    handleSearchInput()
  }

  function handleSearchInput() {
    try {
      // Normalize payload and short-circuit identical requests to avoid reactive loops
      const mods = convertModifiers(PressedKeysStore.activeModifiers)
      const next = {
        search: String(search ?? ''),
        activeKey: String(PressedKeysStore.activeKey ?? ''),
        selectedGroup: String(selectedGroup ?? ''),
        modifiersSig: mods.join('+'),
      }
      if (
        next.search === lastSearchPayload.search &&
        next.activeKey === lastSearchPayload.activeKey &&
        next.selectedGroup === lastSearchPayload.selectedGroup &&
        next.modifiersSig === lastSearchPayload.modifiersSig
      ) {
        return
      }
      lastSearchPayload = next
      onSearch(next.search, mods, next.activeKey, next.selectedGroup)
    } catch {
      // Defensive: never throw from UI handler
    }
  }

  function handleDebouncedInput() {
    if (inputDebounce) clearTimeout(inputDebounce)
    const ms = Number(settingsManager.settings.searchDebounceMs ?? 200)
    inputDebounce = setTimeout(
      () => {
        handleSearchInput()
      },
      Number.isNaN(ms) ? 200 : Math.max(0, Math.min(2000, ms))
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
        onkeydown={handleKeyDown}
        onfocus={() => (inputIsFocused = true)}
        onblur={() => (inputIsFocused = false)}
        oninput={handleDebouncedInput}
      />
      <div class="meta-search-wrapper">
        <FloatingTooltip
          content={keyboardListenerIsActive
            ? 'Deactivate key listener (Esc)'
            : 'Activate key listener'}
          placement="bottom"
          delay={500}
        >
          <button
            class="keyboard-icon icon {keyboardListenerIsActive ? 'pulse' : ''}"
            aria-label={keyboardListenerIsActive
              ? 'Press Esc to deactivate key listener'
              : `Press ${convertModifiers(['Mod'])[0]}+F or long press to activate key listener`}
            aria-pressed={keyboardListenerIsActive}
            onclick={ActivateKeyboardListener}
          >
            <CircleDotIcon size={16} />
          </button>
        </FloatingTooltip>
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
  <FloatingDropdown
    bind:open={filterIsOpen}
    placement="bottom-start"
    class="filter-dropdown"
  >
    {#snippet trigger()}
      <button
        id="hotkey-filter-button"
        class={filterIsOpen ? 'is-active' : ''}
        aria-label="Filter Commands"
        aria-pressed={filterIsOpen}
      >
        <FilterIcon size={16} />
      </button>
    {/snippet}

    {#snippet content()}
      <div class="popup-filter-menu">
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
            <span class="info-icon" title={settingTooltips.StrictModifierMatch}>
              <FloatingTooltip
                content={settingTooltips.StrictModifierMatch}
                placement="top"
                delay={300}
              >
                <InfoIcon size={14} />
              </FloatingTooltip>
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
            <span class="info-icon">
              <FloatingTooltip
                content={settingTooltips.ViewWOhotkeys}
                placement="top"
                delay={300}
              >
                <InfoIcon size={14} />
              </FloatingTooltip>
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
            <span class="info-icon">
              <FloatingTooltip
                content={settingTooltips.OnlyCustom}
                placement="top"
                delay={300}
              >
                <InfoIcon size={14} />
              </FloatingTooltip>
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
            <span class="info-icon">
              <FloatingTooltip
                content={settingTooltips.OnlyDuplicates}
                placement="top"
                delay={300}
              >
                <InfoIcon size={14} />
              </FloatingTooltip>
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
            <span class="info-icon">
              <FloatingTooltip
                content={settingTooltips.DisplaySystemShortcuts}
                placement="top"
                delay={300}
              >
                <InfoIcon size={14} />
              </FloatingTooltip>
            </span>
          </div>
        </div>
      </div>
    {/snippet}
  </FloatingDropdown>

  <!-- COMPONENT: View Dropdown -->

  <FloatingDropdown
    bind:open={viewDropdownOpen}
    placement="bottom-start"
    class="view-dropdown"
  >
    {#snippet trigger()}
      <button
        id="hotkey-view-button"
        aria-label="View Options"
        class={viewDropdownOpen ? 'is-active' : ''}
        aria-pressed={viewDropdownOpen}
        >View
      </button>
    {/snippet}

    {#snippet content()}
      <div class="popup-filter-menu">
        {#each Object.values(ViewSettingsKeyValues) as setting}
          <div class="setting-item mod-toggle">
            <div
              class="checkbox-container"
              class:is-enabled={filterSettings[setting as keyof FilterSettings]}
              role="button"
              tabindex="0"
              onclick={() =>
                setFilterSetting(
                  setting as keyof CGroupFilterSettings,
                  !filterSettings[setting as keyof FilterSettings]
                )}
              onkeydown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setFilterSetting(
                    setting as keyof CGroupFilterSettings,
                    !filterSettings[setting as keyof FilterSettings]
                  )
                }
              }}
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
              <span class="info-icon">
                <FloatingTooltip
                  content={settingTooltips[setting] || setting}
                  placement="top"
                  delay={300}
                >
                  <InfoIcon size={14} />
                </FloatingTooltip>
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/snippet}
  </FloatingDropdown>

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

  <!-- COMPONENT: Edit + Refresh Buttons (Edit first) -->
  <FloatingTooltip content={editMode ? 'Exit Edit mode' : 'Enter Edit mode'} placement="bottom" delay={500}>
    <button
      id="hotkey-edit-button"
      class={`clear-icon icon ${editMode ? 'is-active' : ''}`}
      aria-pressed={editMode}
      aria-label={editMode ? 'Exit Edit mode' : 'Enter Edit mode'}
      onclick={ToggleEditMode}
      style="margin-right: 6px;"
    >
      <EditIcon size={16} />
    </button>
  </FloatingTooltip>

  <FloatingTooltip content="Refresh commands" placement="bottom" delay={500}>
    <button
      id="hotkey-refresh-button"
      aria-label="Refresh Commands"
      class={`clear-icon icon ${refreshIsActive ? 'animation-is-active' : ''}`}
      onclick={RefreshCommands}
    >
      <RefreshCw size={16} />
    </button>
  </FloatingTooltip>
</div>
