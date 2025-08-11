<!-- src/components/KeyboardComponent.svelte -->

<script lang="ts">
  import { setContext, onMount } from 'svelte'
  import type { Modifier } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import type {
    commandEntry,
    hotkeyEntry,
  } from '../interfaces/Interfaces'
  import { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts'
  import { convertModifiers } from '../utils/modifierUtils'

  import type CommandsManager from '../managers/commandsManager'

  import KeyboardLayoutComponent from './KeyboardLayoutComponent.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'
  import { GroupType } from '../managers/groupManager/groupManager.svelte.ts'

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

  // Attach physical keyboard listeners only when explicitly enabled
  const down = (e: KeyboardEvent) => activeKeysStore.handlePhysicalKeyDown(e)
  const up = (e: KeyboardEvent) => activeKeysStore.handlePhysicalKeyUp(e)
  $effect(() => {
    if (keyboardListenerIsActive) {
      window.addEventListener('keydown', down)
      window.addEventListener('keyup', up)
      return () => {
        window.removeEventListener('keydown', down)
        window.removeEventListener('keyup', up)
      }
    }
  })

  // Reactive variables
  let viewWidth = $state(0)
  let viewMode = $state('desktop')
  let search = $state('')
  let input: HTMLInputElement | undefined = $state()
  let keyboardListenerIsActive = $state(false)

  let selectedGroupID = $state(
    (plugin.settingsManager.settings.lastOpenedGroupId as string) || GroupType.All
  )

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

  // Persist last opened group for future opens.
  // Avoid creating a reactive dependency on settings to prevent rerender loops.
  let lastPersistedGroup = $state(
    (plugin.settingsManager.getSetting('lastOpenedGroupId') as string) || GroupType.All
  )
  let persistTimer: ReturnType<typeof setTimeout> | null = null
  $effect(() => {
    // Only react to local selectedGroupID changes
    const next = selectedGroupID
    if (next && next !== lastPersistedGroup) {
      if (persistTimer) clearTimeout(persistTimer)
      // Debounce to coalesce rapid group switches and reduce save churn
      persistTimer = setTimeout(() => {
        plugin.settingsManager.updateSettings({ lastOpenedGroupId: next })
        lastPersistedGroup = next
      }, 200)
    }
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
