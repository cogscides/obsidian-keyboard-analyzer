<!-- src/Components/KeyboardComponent.svelte -->

<script lang="ts">
  import { setContext } from 'svelte'
  import type { Hotkey, Modifier } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
  import type {
    commandEntry,
    KeyboardLayout,
    hotkeyEntry,
  } from '../interfaces/Interfaces'
  import { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte'
  import { convertModifiers } from '../utils/modifierUtils'
  import { UNIFIED_KEYBOARD_LAYOUT } from '../Constants'

  import type CommandsManager from '../managers/commandsManager'
  import type SettingsManager from '../managers/settingsManager'

  import KeyboardLayoutComponent from '../Components/KeyboardLayoutComponent.svelte'
  import SearchMenu from '../Components/SearchMenu.svelte'
  import CommandsList from '../Components/CommandsList.svelte'
  import { DEFAULT_GROUP_NAMES } from '../managers/groupManager/groupManager.svelte'
  import { GroupType } from '../managers/settingsManager'

  // Props and Context
  interface Props {
    plugin: KeyboardAnalyzerPlugin
    view: ShortcutsView
  }

  let { plugin, view }: Props = $props()

  // Managers and stores
  const commandsManager: CommandsManager = plugin.commandsManager
  const visualKeyboardManager = new VisualKeyboardManager()
  const activeKeysStore = new ActiveKeysStore(plugin.app, visualKeyboardManager)

  setContext('keyboard-analyzer-plugin', plugin)
  setContext('activeKeysStore', activeKeysStore)
  setContext('visualKeyboardManager', visualKeyboardManager)

  // Reactive variables
  let viewWidth = $state(0)
  let viewMode = $state('desktop')
  let search = $state('')
  let input: HTMLInputElement | undefined = $state()
  let keyboardListenerIsActive = $state(false)

  let selectedGroupID = $state(GroupType.All)

  let visibleCommands = $state<commandEntry[]>([])
  let searchCommandsCount = $derived(visibleCommands.length)
  let searchHotkeysCount = $derived(
    visibleCommands.reduce(
      (count, command) => count + command.hotkeys.length,
      0,
    ),
  )

  $effect(() => {
    visibleCommands = commandsManager.filterCommands(
      search,
      activeKeysStore.ActiveModifiers,
      activeKeysStore.ActiveKey,
      selectedGroupID,
    )
    return
  })

  $effect(() => {
    input?.focus()
  })

  $effect(() => {
    handleResize(viewWidth)
  })

  // Keep visual keyboard in sync when active key/modifiers change
  $effect(() => {
    visualKeyboardManager.updateVisualState(
      activeKeysStore.ActiveKey,
      activeKeysStore.ActiveModifiers,
    )
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
    selectedGroup?: string,
  ) {
    visibleCommands = commandsManager.filterCommands(
      search,
      activeModifiers,
      activeKey,
      selectedGroup,
    )
  }

  function handlePluginNameClicked(pluginName: string) {
    if (!search) {
      input?.focus()
      search = pluginName
    } else if (search.startsWith(pluginName)) {
      search = search.replace(pluginName, '')
    } else {
      search = pluginName + search
    }
  }

  function handleDuplicateHotkeyClicked(hotkey: hotkeyEntry) {
    const { modifiers, key } = hotkey
    const duplicativeModifiers = convertModifiers(modifiers)

    if (
      activeKeysStore.ActiveModifiers.every((modifier) =>
        duplicativeModifiers.includes(modifier as Modifier),
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

  function handleStarIconClicked(commandId: string) {
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
      bind:search
      {searchCommandsCount}
      {searchHotkeysCount}
      bind:keyboardListenerIsActive
      bind:selectedGroup={selectedGroupID}
      {plugin}
      onSearch={handleSearch}
    />

    <CommandsList
      bind:filteredCommands={visibleCommands}
      bind:selectedGroup={selectedGroupID}
      onStarClick={handleStarIconClicked}
      onDuplicateHotkeyClick={handleDuplicateHotkeyClicked}
      onPluginNameClick={handlePluginNameClicked}
    />
  </div>
</div>

<style>
  /* Your styles here */
</style>
