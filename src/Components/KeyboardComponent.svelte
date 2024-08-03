<!-- src/components/KeyboardComponent.svelte -->

<script lang="ts">
  import { setContext, onMount } from 'svelte'
  import type { Hotkey, Modifier } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import type { commandEntry, KeyboardLayout } from '../interfaces/Interfaces'
  import { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
  import { convertModifiers } from '../utils/modifierUtils'
  import { UNIFIED_KEYBOARD_LAYOUT } from '../Constants'
  import KeyboardLayoutComponent from './KeyboardLayoutComponent.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'
  import type { CommandsManager } from '../managers/commandsManager.svelte'
  import type SettingsManager from '../managers/settingsManager.svelte'

  // Props and Context
  interface Props {
    plugin: KeyboardAnalyzerPlugin
    view: ShortcutsView
    activeKeysStore: ActiveKeysStore
  }

  let { plugin, view, activeKeysStore }: Props = $props()

  // Managers and stores
  const visualKeyboardManager = new VisualKeyboardManager()
  const commandsManager: CommandsManager = plugin.commandsManager
  const settingsManager: SettingsManager = plugin.settingsManager

  setContext('keyboard-analyzer-plugin', plugin)
  setContext('activeKeysStore', activeKeysStore)
  setContext('visualKeyboardManager', visualKeyboardManager)

  // Reactive variables
  let filterSettings = $derived(settingsManager.settings.filterSettings)
  let viewWidth = $state(0)
  let viewMode = $state('desktop')
  let search = $state('')
  let input: HTMLInputElement | undefined = $state()
  let keyboardListenerIsActive = $state(false)
  let selectedGroup = $state('')

  let visibleCommands = $state<commandEntry[]>([])
  let searchCommandsCount = $derived(visibleCommands.length)
  let searchHotkeysCount = $derived(
    visibleCommands.reduce(
      (count, command) => count + command.hotkeys.length,
      0
    )
  )

  $effect(() => {
    visibleCommands = commandsManager.filterCommands(
      search,
      activeKeysStore.ActiveModifiers,
      activeKeysStore.ActiveKey,
      selectedGroup
    )
    return
  })

  $effect(() => {
    input?.focus()
  })

  $effect(() => {
    handleResize(viewWidth)
  })

  // function handleGroupSelection(event: CustomEvent<string>) {
  //   selectedGroup = event.detail
  //   handleSearch()
  // }

  // Effect to trigger search on group change (effects are triggered each time the values of the variables form inside the effect change)

  // Helper functions
  // function updateSearchCounts() {
  //   searchCommandsCount = visibleCommands.length
  //   searchHotkeysCount = visibleCommands.reduce(
  //     (count, command) => count + command.hotkeys.length,
  //     0
  //   )
  // }

  function handleResize(width: number) {
    if (width >= 1400) viewMode = 'xxl'
    else if (width >= 1200) viewMode = 'xl'
    else if (width >= 992) viewMode = 'lg'
    else if (width >= 768) viewMode = 'md'
    else if (width >= 576) viewMode = 'sm'
    else viewMode = 'xs'
  }

  // Event handlers
  function handleSearch(
    search: string,
    activeModifiers: string[],
    activeKey: string,
    selectedGroup?: string
  ) {
    visibleCommands = commandsManager.filterCommands(
      search,
      activeModifiers,
      activeKey,
      selectedGroup
    )
  }

  function handlePluginNameClicked(event: CustomEvent<string>) {
    const pluginName = event.detail
    if (!search) {
      input?.focus()
      search = pluginName
    } else if (search.startsWith(pluginName)) {
      search = search.replace(pluginName, '')
    } else {
      search = pluginName + search
    }
  }

  function handleDuplicateHotkeyClicked(event: CustomEvent<Hotkey>) {
    const { modifiers, key } = event.detail
    const duplicativeModifiers = convertModifiers(modifiers)

    if (
      activeKeysStore.ActiveModifiers.every((modifier) =>
        duplicativeModifiers.includes(modifier as Modifier)
      ) &&
      activeKeysStore.ActiveKey.toLowerCase() === key.toLowerCase()
    ) {
      activeKeysStore.reset()
    } else {
      activeKeysStore.ActiveModifiers = duplicativeModifiers
      activeKeysStore.ActiveKey = key
      search = ''
    }
  }

  function handleStarIconClicked(event: CustomEvent<string>) {
    const commandId = event.detail
    commandsManager.toggleFeaturedCommand(commandId)
  }
</script>

<div
  id="keyboard-component"
  class="{viewMode} {viewMode === 'xs' ? 'is-mobile' : ''}"
  bind:offsetWidth={viewWidth}
>
  <div id="keyboard-preview-view">
    <KeyboardLayoutComponent {visibleCommands} />
  </div>
  <div class="shortcuts-wrapper">
    <SearchMenu
      bind:inputHTML={input}
      {searchCommandsCount}
      {searchHotkeysCount}
      bind:keyboardListenerIsActive
      bind:selectedGroup
      {plugin}
      onSearch={handleSearch}
    />

    <CommandsList
      bind:visibleCommands
      bind:selectedGroup
      on:starClick={handleStarIconClicked}
      on:duplicateHotkeyClick={handleDuplicateHotkeyClicked}
      on:pluginNameClick={handlePluginNameClicked}
    />
  </div>
</div>

<style>
  /* Your styles here */
</style>
