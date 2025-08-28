<!-- src/components/KeyboardComponent.svelte -->

<script lang="ts">
  import { onMount, setContext } from 'svelte'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import type KeyboardAnalyzerPlugin from '../main'
  import { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts'
  import { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import logger from '../utils/logger'
  import { convertModifiers } from '../utils/modifierUtils'
  import {
    getKeyListenerScope,
    isModifierPressModeEnabled,
  } from '../utils/runtimeConfig'
  import type ShortcutsView from '../views/ShortcutsView'
  import { VIEW_TYPE_SHORTCUTS_ANALYZER } from '../Constants'

  import type CommandsManager from '../managers/commandsManager'
  // Component imports
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

  const { plugin }: Props = $props()

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
    // Only treat shortcuts as ours when event originates inside this view
    // const insideView = rootEl?.contains(e.target as Node) === true
    // const focusWithin = !!(
    //   rootEl && (rootEl as HTMLElement).matches(':focus-within')
    // )
    const isActiveView: boolean = (() => {
      try {
        const v = plugin.app.workspace.activeLeaf?.view as
          | { getViewType?: () => string }
          | undefined
        return !!(
          v &&
          typeof v.getViewType === 'function' &&
          v.getViewType?.() === VIEW_TYPE_SHORTCUTS_ANALYZER
        )
      } catch {
        return false
      }
    })()
    // Global UX shortcuts for this view (only when this pane is the active view)
    if (isModF(e) && isActiveView) {
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
    if (e.key === 'Escape' && isActiveView) {
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

    // Respect configured listener scope (default: only when Analyzer view is active)
    const scope = getKeyListenerScope()
    // Global scope is only effective when modifier activation is 'On press'
    const scopeAllows =
      scope === 'global' ? isModifierPressModeEnabled() : isActiveView

    if (!keyboardListenerIsActive || !scopeAllows) {
      // Privacy: do not record or log key details when listener is off
      // Avoid noisy logs for common editing keys like Backspace while typing in inputs
      if (e.key !== 'Backspace') {
        logger.debug('[keys] ignored keydown (listener off)')
      }
      return
    }

    // Record raw input only when actively listening
    activeKeysStore.recordPhysicalRaw(e)
    logger.debug('[keys] keydown', { key: e.key, code: e.code })
    activeKeysStore.handlePhysicalKeyDown(e, { inActiveView: isActiveView })
    logger.debug('[keys] state after keydown', activeKeysStore.state)
  }
  const up = (e: KeyboardEvent) => {
    const scope = getKeyListenerScope()
    const scopeAllows =
      scope === 'global'
        ? isModifierPressModeEnabled()
        : (() => {
            try {
              const v = plugin.app.workspace.activeLeaf?.view as
                | { getViewType?: () => string }
                | undefined
              return !!(
                v &&
                typeof v.getViewType === 'function' &&
                v.getViewType?.() === VIEW_TYPE_SHORTCUTS_ANALYZER
              )
            } catch {
              return false
            }
          })()

    if (!keyboardListenerIsActive || !scopeAllows) {
      // Privacy: do not log key details when listener is off
      logger.debug('[keys] ignored keyup (listener off)')
      return
    }

    const isActiveView: boolean = (() => {
      try {
        const v = plugin.app.workspace.activeLeaf?.view as
          | { getViewType?: () => string }
          | undefined
        return !!(
          v &&
          typeof v.getViewType === 'function' &&
          v.getViewType?.() === VIEW_TYPE_SHORTCUTS_ANALYZER
        )
      } catch {
        return false
      }
    })()
    logger.debug('[keys] keyup', { key: e.key, code: e.code })
    activeKeysStore.handlePhysicalKeyUp(e, { inActiveView: isActiveView })
    logger.debug('[keys] state after keyup', activeKeysStore.state)
  }
  type WindowWithKb = Window & {
    __kb_analyzer_keys_down?: (e: KeyboardEvent) => void
    __kb_analyzer_keys_up?: (e: KeyboardEvent) => void
  }

  onMount(() => {
    // Subscribe to commands index changes to live-refresh visibleCommands
    const unsubscribe = plugin.commandsManager.subscribe(() => {
      visibleCommands = plugin.commandsManager.filterCommands(
        search,
        activeKeysStore.ActiveModifiers,
        activeKeysStore.ActiveKey,
        selectedGroupID
      )
    })
    const w = window as WindowWithKb
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
    w.__kb_analyzer_keys_down = down
    w.__kb_analyzer_keys_up = up
    logger.debug('[keys] global listeners attached')
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      if (w.__kb_analyzer_keys_down === down)
        w.__kb_analyzer_keys_down = undefined
      if (w.__kb_analyzer_keys_up === up) w.__kb_analyzer_keys_up = undefined
      try { unsubscribe?.() } catch {}
    }
  })

  // Reactive variables
  let viewWidth = $state(0)
  let rootEl: HTMLDivElement | null = null
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
  // Apply on-open behavior only when group changes (not on every settings flush)
  $effect(() => {
    const gid = selectedGroupID || String(GroupType.All)
    // Run in a microtask to avoid tracking reactive reads of groups/settings here.
    queueMicrotask(() => {
      try {
        const mode = groupManager.getGroupBehavior(gid)
        if (gid === String(GroupType.All)) {
          if (mode === 'default') {
            groupManager.applyDefaultsToAllFilters()
          }
          return
        }
        const g = groupManager.getGroup(gid)
        if (!g) {
          logger.warn(
            '[groups] selected group not found; skipping behavior apply',
            { gid }
          )
          return
        }
        if (mode === 'default') {
          groupManager.applyDefaultsToGroupFilters(gid)
        } else {
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
  })

  // Recompute list when default filters change (do not re-apply defaults)
  $effect(() => {
    // Track global default filters so All Commands resets reflect immediately
    plugin.settingsManager.settings.defaultFilterSettings
    visibleCommands = commandsManager.filterCommands(
      search,
      activeKeysStore.ActiveModifiers,
      activeKeysStore.ActiveKey,
      selectedGroupID
    )
  })

  // Strict modifier match flag derived from current group's filter settings
  const strictModifierMatch = $derived.by(() => {
    // Track groups to recompute when settings update
    groupManager.groups
    const gid = selectedGroupID
    const settings = groupManager.getGroupSettings(gid)
    return Boolean(settings?.StrictModifierMatch)
  })

  let visibleCommands = $state<commandEntry[]>([])
  const searchCommandsCount = $derived(visibleCommands.length)
  const searchHotkeysCount = $derived(
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
      activeKeysStore.ActiveModifiers.every(modifier =>
        duplicativeModifiers.includes(modifier)
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

<!-- class="{viewMode} {viewMode === 'xs' ? 'is-mobile' : ''}" -->
<div
  id="keyboard-component"
  class={viewMode}
  bind:this={rootEl}
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
