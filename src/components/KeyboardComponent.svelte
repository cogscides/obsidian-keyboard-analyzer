<!-- src/components/KeyboardComponent.svelte -->

<script lang="ts">
  import { setContext, onMount } from 'svelte'
  import type { Modifier } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts'
  import { convertModifiers } from '../utils/modifierUtils'
  import logger from '../utils/logger'

  import type CommandsManager from '../managers/commandsManager'

  import KeyboardLayoutComponent from './KeyboardLayoutComponent.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'
  import { GroupType } from '../managers/groupManager/groupManager.svelte.ts'

  function isModF(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey
    return isMod && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'f'
  }

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
  const groupManager = plugin.groupManager

  setContext('keyboard-analyzer-plugin', plugin)
  setContext('activeKeysStore', activeKeysStore)
  setContext('visualKeyboardManager', visualKeyboardManager)
  // Expose a live getter for whether physical listener is active to disable Alt-hover when active
  setContext('isPhysicalListenerActive', () => keyboardListenerIsActive)

  // Always attach listeners; handlers no-op unless listener is active
  const down = (e: KeyboardEvent) => {
    // Global UX shortcuts for this view
    if (isModF(e)) {
      e.preventDefault()
      e.stopPropagation()
      if (document.activeElement !== input) {
        input?.focus()
        logger.debug('[keys] Mod+F: focus search')
      } else {
        keyboardListenerIsActive = !keyboardListenerIsActive
        logger.debug('[keys] Mod+F: toggle listener', {
          to: keyboardListenerIsActive,
        })
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (keyboardListenerIsActive) {
        keyboardListenerIsActive = false
        input?.focus()
        logger.debug('[keys] Esc: disable listener and focus search')
      } else if (document.activeElement === input) {
        // Unfocus search for accessibility
        ;(document.activeElement as HTMLElement)?.blur()
        logger.debug('[keys] Esc: blur search input')
      }
      return
    }

    if (!keyboardListenerIsActive) {
      logger.debug('[keys] ignored keydown (listener off)', e.key, e.code)
      return
    }
    logger.debug('[keys] keydown', { key: e.key, code: e.code })
    activeKeysStore.handlePhysicalKeyDown(e)
    logger.debug('[keys] state after keydown', activeKeysStore.state)
  }
  const up = (e: KeyboardEvent) => {
    if (!keyboardListenerIsActive) {
      logger.debug('[keys] ignored keyup (listener off)', e.key, e.code)
      return
    }
    logger.debug('[keys] keyup', { key: e.key, code: e.code })
    activeKeysStore.handlePhysicalKeyUp(e)
    logger.debug('[keys] state after keyup', activeKeysStore.state)
  }
  onMount(() => {
    const w = window as unknown as Record<string, unknown>
    // Remove any stale listeners from previous mounts/reloads
    const prevDown = w.__kb_analyzer_keys_down as
      | ((e: KeyboardEvent) => void)
      | undefined
    const prevUp = w.__kb_analyzer_keys_up as
      | ((e: KeyboardEvent) => void)
      | undefined
    if (prevDown) {
      window.removeEventListener('keydown', prevDown)
    }
    if (prevUp) {
      window.removeEventListener('keyup', prevUp)
    }
    // Attach fresh listeners and stash them on window for future cleanup
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    ;(w as any).__kb_analyzer_keys_down = down
    ;(w as any).__kb_analyzer_keys_up = up
    logger.debug('[keys] global listeners attached')
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      if ((w as any).__kb_analyzer_keys_down === down)
        (w as any).__kb_analyzer_keys_down = undefined
      if ((w as any).__kb_analyzer_keys_up === up)
        (w as any).__kb_analyzer_keys_up = undefined
    }
  })

  // Reactive variables
  let viewWidth = $state(0)
  let viewMode = $state('desktop')
  let search = $state('')
  let input: HTMLInputElement | undefined = $state()
  let keyboardListenerIsActive = $state(false)

  let selectedGroupID = $state(
    (plugin.settingsManager.settings.lastOpenedGroupId as string) ||
      GroupType.All
  )

  // Apply group's on-open behavior (defaults vs dynamic) when group changes.
  // For now, we apply only filter state since that's what's persisted.
  $effect(() => {
    try {
      const gid = selectedGroupID
      if (!gid || gid === GroupType.All) return
      const g = groupManager.getGroup(gid) as any
      if (!g) {
        logger.warn(
          '[groups] selected group not found; skipping behavior apply',
          { gid }
        )
        return
      }
      const mode = groupManager.getGroupBehavior(gid)
      if (mode === 'default') {
        groupManager.applyDefaultsToGroupFilters(gid)
      } else {
        // Dynamic: use last used if available, otherwise fall back to defaults
        if (g?.lastUsedState?.filters) {
          groupManager.applyDynamicLastUsedToGroupFilters(gid)
        } else {
          groupManager.applyDefaultsToGroupFilters(gid)
        }
      }
    } catch (err) {
      logger.error('[groups] error applying on-open behavior', {
        err,
        selectedGroupID,
      })
    }
  })

  // Strict modifier match flag derived from current group's filter settings
  let strictModifierMatch = $derived.by(() => {
    // Track groups to recompute when settings update
    groupManager.groups
    const gid = selectedGroupID
    const settings = groupManager.getGroupSettings(gid)
    return Boolean(settings?.StrictModifierMatch)
  })

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
      selectedGroupID
    )
    return
  })

  // Persist last opened group for future opens.
  // Avoid creating a reactive dependency on settings to prevent rerender loops.
  let lastPersistedGroup = $state(
    (plugin.settingsManager.getSetting('lastOpenedGroupId') as string) ||
      GroupType.All
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
      activeKeysStore.ActiveModifiers
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
    selectedGroup?: string
  ) {
    visibleCommands = commandsManager.filterCommands(
      search,
      activeModifiers,
      activeKey,
      selectedGroup
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
    <KeyboardLayoutComponent
      {visibleCommands}
      {strictModifierMatch}
      {selectedGroupID}
    />
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
