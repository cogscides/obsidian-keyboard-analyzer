<script lang="ts">
  import { getContext, onMount } from 'svelte'
  import FloatingTooltip from './floating/FloatingTooltip.svelte'
  import { TOOLTIP_GROUPS } from '../utils/tooltipGroups'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import type KeyboardAnalyzerPlugin from '../main'
  import type GroupManager from '../managers/groupManager'
  import type SettingsManager from '../managers/settingsManager'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardsManager/visualKeyboardsManager.svelte.ts'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte.ts'
  import { convertModifiers } from '../utils/modifierUtils'
  import { formatHotkeyBaked } from '../utils/normalizeKeyDisplay'
  import AddToGroupPopover from './AddToGroupPopoverFloating.svelte'
  import {
    ChevronDown,
    Star as StarIcon,
    FolderPlus as FolderPlusIcon,
    Search as SearchIcon,
    Pin as PinIcon,
    Plus as PlusIcon,
    RotateCcw as RestoreIcon,
  } from 'lucide-svelte'
  import {
    assignHotkeyAdditive,
    restoreDefaults,
    undoLastChange,
    lastHotkeyChange,
  } from '../utils/hotkeyActions'
  import { sortModifiers, normalizeKey } from '../utils/modifierUtils'
  import { editModeStore } from '../stores/uiState.svelte.ts'
  import { removeHotkeySingle } from '../utils/hotkeyActions'
  import CommandsManager from '../managers/commandsManager'
  import logger from '../utils/logger'
  import ConfirmHotkeyModal from './modals/ConfirmHotkeyModal.svelte'
  import { changeLogStore, revertBufferStore, revertChangeForId, undoAllChanges } from '../utils/hotkeyActions'
  let changeLog: string[] = $state([])
  let lastChangeSummary: string = $state('')
  let modifiedIds: Set<string> = $state(new Set())
  onMount(() => {
    const unsubLog = changeLogStore.subscribe(v => {
      changeLog = v
      lastChangeSummary = v?.[0] || ''
    })
    const unsubBuf = revertBufferStore.subscribe((map: Map<string, any>) => {
      modifiedIds = new Set(map.keys())
    })
    return () => {
      try {
        unsubLog?.()
        unsubBuf?.()
      } catch {}
    }
  })

  interface Props {
    filteredCommands: commandEntry[]
    selectedGroup: string
    onStarClick?: (commandId: string) => void
    onDuplicateHotkeyClick?: (hotkey: hotkeyEntry) => void
    onPluginNameClick?: (pluginName: string) => void
  }

  let {
    filteredCommands = $bindable([]),
    selectedGroup = $bindable('all'),
    onStarClick,
    onDuplicateHotkeyClick,
    onPluginNameClick,
  }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const settingsManager: SettingsManager = plugin.settingsManager
  const groupManager: GroupManager = plugin.groupManager
  const commandsManager = plugin.commandsManager
  const hotkeyManager = plugin.hotkeyManager
  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager'
  )
  const activeKeysStore: ActiveKeysStore = getContext('activeKeysStore')
  // Track commands index changes to keep pinned section in sync
  let indexTick = $state(0)
  onMount(() => {
    const unsub = plugin.commandsManager.subscribe(() => {
      indexTick++
    })
    return () => {
      try {
        unsub?.()
      } catch {}
    }
  })

  // Using callback props instead of component events (Svelte 5)

  const groupSettings = $derived.by(() => {
    groupManager.groups
    const settings = groupManager.getGroupSettings(selectedGroup)
    return settings
  })

  const groupIsEmpty = $derived.by(() => {
    if (!selectedGroup || selectedGroup === 'all') return false
    const g = groupManager.getGroup(selectedGroup)
    return !g || (g.commandIds?.length || 0) === 0
  })

  function renderHotkey(hotkey: hotkeyEntry) {
    if (settingsManager.settings.useBakedKeyNames) {
      return formatHotkeyBaked(hotkey)
    }
    return hotkeyManager.renderHotkey(hotkey)
  }

  function isEffectivelyDefault(cmd: commandEntry, hk: hotkeyEntry): boolean {
    try {
      const mods = sortModifiers(
        (hk.modifiers as unknown as string[])
      )
      const sig = `${mods.join(',')}|${normalizeKey(hk.key || '')}`
      for (const d of cmd.defaultHotkeys || []) {
        const dm = sortModifiers((d.modifiers as unknown as string[]) || [])
        const ds = `${dm.join(',')}|${normalizeKey(d.key || '')}`
        if (ds === sig) return true
      }
    } catch {}
    return false
  }

  const featuredIds = $derived.by(
    () => new Set(settingsManager.settings.featuredCommandIDs || [])
  )

  function getDisplayCommandName(name: string, pluginName: string): string {
    const p = (pluginName || '').trim()
    const n = name || ''
    if (!p) return n
    const lower = n.toLowerCase()
    const pref = `${p.toLowerCase()}: `
    // In grouped view, always strip plugin prefix from title.
    // In flat view, strip only when showing plugin badges; otherwise keep full name for clarity.
    const shouldStripPrefix =
      groupSettings?.GroupByPlugin || groupSettings?.ShowPluginBadges
    if (shouldStripPrefix && lower.startsWith(pref)) {
      return n.slice(pref.length).trim()
    }
    return n
  }

  function handleStarClick(commandId: string) {
    onStarClick?.(commandId)
  }

  function handlePluginNameClick(pluginName: string) {
    onPluginNameClick?.(pluginName)
  }

  function handleDuplicateHotkeyClick(hotkey: hotkeyEntry, cmd?: commandEntry) {
    // Dev: record the clicked command and its hotkeys for inspector
    if (cmd) activeKeysStore.devSetLastCommand(cmd)
    onDuplicateHotkeyClick?.(hotkey)
  }

  // Edit mode state
  let editMode: boolean = $state(false)
  $effect(() => {
    const unsub = editModeStore.subscribe(v => (editMode = v))
    return () => unsub()
  })
  // Clear pins when exiting edit mode (temporal pinning)
  $effect(() => {
    if (!editMode && pinnedIds.size > 0) {
      pinnedIds = new Set()
    }
  })

  // Minimal inline capture to add a hotkey
  let captureForId: string | null = $state(null)
  let captureLabel: string = $state('')
  // Confirmation modal state
  type PendingAssign = {
    id: string
    chord: string
    mods: string[]
    key: string
    conflicts: commandEntry[]
  }
  type PendingRestore = { id: string; name: string }
  let pendingAssign: PendingAssign | null = $state(null)
  let pendingRestore: PendingRestore | null = $state(null)
  function startCapture(id: string) {
    captureForId = id
    captureLabel = 'Press hotkey...'
    window.addEventListener('keydown', onCaptureKeydown, true)
    window.addEventListener('keypress', onCaptureBlocker, true)
    window.addEventListener('keyup', onCaptureBlocker, true)
  }
  function endCapture() {
    window.removeEventListener('keydown', onCaptureKeydown, true)
    window.removeEventListener('keypress', onCaptureBlocker, true)
    window.removeEventListener('keyup', onCaptureBlocker, true)
    captureForId = null
    captureLabel = ''
  }
  function onCaptureBlocker(e: KeyboardEvent) {
    // Block propagation to avoid triggering Obsidian commands while capturing
    e.preventDefault()
    e.stopPropagation()
  }
  async function onCaptureKeydown(e: KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.key === 'Escape') {
      endCapture()
      return
    }
    if (
      e.key === 'Shift' ||
      e.key === 'Control' ||
      e.key === 'Alt' ||
      e.key === 'Meta'
    ) {
      captureLabel = 'Press hotkey...'
      return
    }
    const mods: string[] = []
    if (e.metaKey) mods.push('Meta')
    if (e.ctrlKey) mods.push('Ctrl')
    if (e.altKey) mods.push('Alt')
    if (e.shiftKey) mods.push('Shift')
    const sorted = sortModifiers(mods)
    const key = normalizeKey((e.code || '').toLowerCase())
    captureLabel = `${sorted.join(' ')}${sorted.length ? ' ' : ''}${key}`
    const id = captureForId
    endCapture()
    if (!id) return
    try {
      const hkKey = CommandsManager.makeHotkeyKey({ modifiers: sorted, key })
      const conflicts = commandsManager
        .getCommandsByHotkeyKey(hkKey)
        .filter(c => c && c.id !== id)
      if (conflicts.length > 0) {
        pendingAssign = {
          id,
          chord: captureLabel,
          mods: sorted,
          key,
          conflicts,
        }
      } else {
        await assignHotkeyAdditive(plugin.app, commandsManager, id, {
          modifiers: sorted,
          key,
        })
      }
    } catch (err) {
      logger.error('[hotkeys] assign: error', { err })
    }
  }

  async function handleRestore(id: string) {
    try {
      const entry = commandsManager.getCommandsIndex()[id]
      if (!entry) return
      pendingRestore = { id, name: entry.name }
    } catch (err) {
      logger.error('[hotkeys] restore: prep error', { err })
    }
  }

  async function handleUndo() {
    await undoAllChanges(plugin.app, commandsManager)
  }

  // Pinning state (session-only)
  let pinnedIds = $state(new Set<string>())
  function togglePin(commandId: string) {
    const next = new Set(pinnedIds)
    if (next.has(commandId)) next.delete(commandId)
    else next.add(commandId)
    pinnedIds = next
  }
  function isPinned(commandId: string): boolean {
    return pinnedIds.has(commandId)
  }
  function pinMany(ids: string[]) {
    const next = new Set(pinnedIds)
    for (const id of ids) next.add(id)
    pinnedIds = next
  }

  const pinnedEntries = $derived.by(() => {
    indexTick
    const index = commandsManager.getCommandsIndex()
    return Array.from(pinnedIds)
      .map(id => index[id])
      .filter(Boolean)
  })

  // Remove single hotkey
  async function handleRemoveHotkey(commandId: string, hotkey: hotkeyEntry) {
    await removeHotkeySingle(plugin.app, commandsManager, commandId, hotkey)
  }

  function openHotkeysSettings() {
    try {
      const appAny: any = plugin.app as any
      if (typeof appAny?.setting?.openTabById === 'function') {
        appAny.setting.openTabById('hotkeys')
        return
      }
      if (typeof appAny?.setting?.open === 'function') {
        appAny.setting.open()
      }
    } catch {}
  }

  function scrollToCommand(id: string) {
    try {
      const el = document.getElementById(`cmd-row-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('flash')
        setTimeout(() => el.classList.remove('flash'), 800)
      }
    } catch {}
  }

  function keepChanges() {
    // Clear the revert buffer and exit edit mode
    try { revertBufferStore.set(new Map()) } catch {}
    try { lastHotkeyChange.set(null) } catch {}
    try { editModeStore.set(false) } catch {}
  }

  function isSystemShortcut(cmd?: commandEntry): boolean {
    return (cmd?.pluginName || '') === 'System Shortcuts'
  }

  function shouldShowRestore(cmd: commandEntry): boolean {
    if (isSystemShortcut(cmd)) return false
    const customCount = (cmd.customHotkeys || []).length
    return customCount > 0
  }

  function defaultHotkeysTooltip(cmd: commandEntry): string {
    const defaults = cmd.defaultHotkeys || []
    if (defaults.length === 0) return 'Restore default'
    const pretty = defaults.map(d => renderHotkey(d)).join(', ')
    return `Restore default (${pretty})`
  }

  async function openVaultFolder() {
    logger.debug('[hotkeys] openVaultFolder: invoked')
    try {
      const adapter: any = plugin.app.vault.adapter as any
      const basePath: string | undefined = adapter?.basePath
      const opener = (plugin.app as any)?.openWithDefaultApp as
        | ((path: string) => Promise<void> | void)
        | undefined
      logger.debug('[hotkeys] openVaultFolder: adapter/basePath/opener', {
        hasAdapter: Boolean(adapter),
        basePath,
        hasOpener: typeof opener === 'function',
      })
      if (!basePath) {
        logger.warn('[hotkeys] openVaultFolder: missing basePath on adapter')
        return
      }
      if (typeof opener !== 'function') {
        logger.warn(
          '[hotkeys] openVaultFolder: app.openWithDefaultApp not available'
        )
        return
      }

      const sep = basePath.includes('\\') ? '\\' : '/'
      const vaultRoot = basePath.replace(/[\\/]+$/, '')
      const obsidianDir = `${vaultRoot}${sep}.obsidian`
      const hotkeysJson = `${obsidianDir}${sep}hotkeys.json`

      logger.debug(
        '[hotkeys] openVaultFolder: trying .obsidian dir',
        obsidianDir
      )
      try {
        await (opener as any).call(plugin.app, obsidianDir)
        logger.info('[hotkeys] openVaultFolder: opened .obsidian directory')
        // Even if the API reports success, on macOS opening a directory may do nothing in some cases.
        // Use Electron shell to reveal a file in Finder/Explorer for consistency.
        try {
          const shell = (globalThis as any)?.require?.('electron')?.shell
          if (shell?.showItemInFolder) {
            shell.showItemInFolder(hotkeysJson)
            logger.info(
              '[hotkeys] openVaultFolder: reveal via shell.showItemInFolder(hotkeys.json)'
            )
          } else if (shell?.openPath) {
            const err: string | undefined = await shell.openPath(obsidianDir)
            logger.info(
              '[hotkeys] openVaultFolder: shell.openPath(.obsidian) =>',
              err || 'ok'
            )
          }
        } catch (shellErr) {
          logger.warn(
            '[hotkeys] openVaultFolder: electron shell fallback failed',
            { err: shellErr }
          )
        }
        return
      } catch (err1) {
        logger.warn(
          '[hotkeys] openVaultFolder: failed opening .obsidian, try hotkeys.json',
          { err: err1 }
        )
      }
      try {
        await (opener as any).call(plugin.app, hotkeysJson)
        logger.info('[hotkeys] openVaultFolder: opened hotkeys.json')
        try {
          const shell = (globalThis as any)?.require?.('electron')?.shell
          if (shell?.showItemInFolder) {
            shell.showItemInFolder(hotkeysJson)
            logger.info(
              '[hotkeys] openVaultFolder: reveal via shell.showItemInFolder(hotkeys.json)'
            )
          }
        } catch (shellErr2) {
          logger.warn(
            '[hotkeys] openVaultFolder: electron shell fallback 2 failed',
            { err: shellErr2 }
          )
        }
        return
      } catch (err2) {
        logger.warn(
          '[hotkeys] openVaultFolder: failed opening hotkeys.json, fallback to vault root',
          { err: err2 }
        )
      }
      try {
        await (opener as any).call(plugin.app, vaultRoot)
        logger.info('[hotkeys] openVaultFolder: opened vault root')
        try {
          const shell = (globalThis as any)?.require?.('electron')?.shell
          if (shell?.openPath) {
            const err: string | undefined = await shell.openPath(vaultRoot)
            logger.info(
              '[hotkeys] openVaultFolder: shell.openPath(vaultRoot) =>',
              err || 'ok'
            )
          }
        } catch (shellErr3) {
          logger.warn(
            '[hotkeys] openVaultFolder: electron shell fallback 3 failed',
            { err: shellErr3 }
          )
        }
        return
      } catch (err3) {
        logger.error('[hotkeys] openVaultFolder: failed opening vault root', {
          err: err3,
        })
      }
    } catch (err) {
      logger.error('[hotkeys] openVaultFolder: fatal error', { err })
    }
  }

  // Hover preview for hotkeys on the visual keyboard
  function handleHotkeyMouseEnter(hk: hotkeyEntry) {
    const mods = convertModifiers(hk.modifiers)
    visualKeyboardManager.updateVisualState(
      activeKeysStore.ActiveKey,
      activeKeysStore.ActiveModifiers
    )
    visualKeyboardManager.previewHoverState(hk.key, mods)
  }
  function handleHotkeyMouseLeave() {
    visualKeyboardManager.updateVisualState(
      activeKeysStore.ActiveKey,
      activeKeysStore.ActiveModifiers
    )
  }

  // Grouped view state and helpers
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  let collapsedPlugins = $state(new Set<string>())
  function togglePluginCollapse(pluginName: string) {
    const next = new Set(collapsedPlugins)
    if (next.has(pluginName)) next.delete(pluginName)
    else next.add(pluginName)
    collapsedPlugins = next
  }
  function isCollapsed(pluginName: string): boolean {
    return collapsedPlugins.has(pluginName)
  }

  // Add-to-group popover state
  let openPopoverFor: string | null = $state(null)

  function toggleAddToGroupPopover(event: MouseEvent, commandId: string) {
    event.stopPropagation()
    const wasOpen = openPopoverFor === commandId
    openPopoverFor = wasOpen ? null : commandId
  }

  type PluginGroup = {
    pluginName: string
    commands: commandEntry[]
    isBuiltIn: boolean
  }
  const groupedByPlugin: PluginGroup[] = $derived.by(() => {
    // Track changes
    groupSettings
    // Exclude pinned commands from the grouped list (they appear in the pinned section)
    const map = new Map<string, commandEntry[]>()
    for (const cmd of filteredCommands.filter(c => !pinnedIds.has(c.id))) {
      const key = cmd.pluginName || 'Unknown'
      const arr = map.get(key) || []
      arr.push(cmd)
      map.set(key, arr)
    }
    const groups = Array.from(map.entries()).map(([pluginName, commands]) => {
      // If FeaturedFirst is enabled, bring featured commands to the top within the group
      if (groupSettings?.FeaturedFirst) {
        commands = [...commands].sort((a, b) => {
          const aF = commandsManager.featuredCommandIds.has(a.id)
          const bF = commandsManager.featuredCommandIds.has(b.id)
          if (aF && !bF) return -1
          if (!aF && bF) return 1
          return 0
        })
      }
      const isBuiltIn = commands.some(c => c.isInternalModule)
      return { pluginName, commands, isBuiltIn }
    })
    groups.sort((a, b) => a.pluginName.localeCompare(b.pluginName))
    return groups
  })

  function collapseAll() {
    const next = new Set<string>()
    for (const g of groupedByPlugin) next.add(g.pluginName)
    collapsedPlugins = next
  }

  function expandAll() {
    collapsedPlugins = new Set<string>()
  }
</script>

<div
  id="hotkeys-wrapper"
  class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
>
  <div class="hotkey-list-container">
    {#if filteredCommands.length === 0}
      <div class="empty-state" role="status" aria-live="polite">
        <div class="empty-icon"><SearchIcon size={28} /></div>
        {#if groupIsEmpty}
          <div class="empty-title">This group is empty</div>
          <div class="empty-subtitle">
            Add commands from the “All Commands” list using the folder icon, or
            manage groups.
          </div>
        {:else}
          <div class="empty-title">No matching commands</div>
          <div class="empty-subtitle">
            Try a different term or adjust filters.
          </div>
        {/if}
        {#if !groupIsEmpty}
          <ul class="empty-hints">
            <li>Press Esc to clear keys</li>
            <li>Use the Filter button to tweak results</li>
            <li>Include built-ins if hidden</li>
          </ul>
        {/if}
      </div>
    {:else if groupSettings?.GroupByPlugin}
      {#if pinnedIds.size > 0}
        <div class="pinned-container">
          <div class="pinned-header">Pinned</div>
          {#each pinnedEntries as cmdEntry (cmdEntry.id)}
            <div id={`cmd-row-${cmdEntry.id}`} class="kbanalizer-setting-item setting-item is-pinned" class:is-starred={featuredIds.has(cmdEntry.id)}>
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {#if groupSettings?.ShowPluginBadges}
                    <button
                      class={`suggestion-prefix ${cmdEntry.isInternalModule && groupSettings?.HighlightBuiltIns ? 'is-builtin' : ''}`}
                      onclick={() => handlePluginNameClick(cmdEntry.pluginName)}
                    >
                      {cmdEntry.pluginName}
                    </button>
                  {/if}
                  <span class="command-name" class:is-modified={modifiedIds.has(cmdEntry.id)}
                    >{getDisplayCommandName(
                      cmdEntry.name,
                      cmdEntry.pluginName
                    )}</span
                  >
                  <div class="action-icons">
                    {#if editMode}
                      <div
                        class="pin-icon icon"
                        role="button"
                        tabindex="0"
                        title="Unpin from top"
                        onclick={() => togglePin(cmdEntry.id)}
                        onkeydown={(e: KeyboardEvent) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          (e.preventDefault(), togglePin(cmdEntry.id))}
                      >
                        <PinIcon size={16} />
                      </div>
                    {/if}
                  </div>
                </div>
                {#if groupSettings?.DisplayIDs}
                  <small>{cmdEntry.id}</small>
                {/if}
              </div>
              <div class="kbanalizer-setting-item-control setting-item-control">
                {#if editMode && shouldShowRestore(cmdEntry)}
                  <span
                    class="row-action-icon setting-restore-hotkey-button"
                    role="button"
                    tabindex="0"
                    aria-label={defaultHotkeysTooltip(cmdEntry)}
                    title={defaultHotkeysTooltip(cmdEntry)}
                    onclick={() => handleRestore(cmdEntry.id)}
                    onkeydown={(e: KeyboardEvent) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (e.preventDefault(), handleRestore(cmdEntry.id))}
                    ><RestoreIcon size={16} /></span
                  >
                {/if}
                <div class="setting-command-hotkeys">
                  {#each cmdEntry.hotkeys as hotkey}
                    <span
                      class="kbanalizer-setting-hotkey setting-hotkey"
                      class:is-duplicate={hotkeyManager.isHotkeyDuplicate(cmdEntry.id, hotkey) && groupSettings?.HighlightDuplicates}
                      class:is-customized={hotkey.isCustom && groupSettings?.HighlightCustom}
                      role="button"
                      tabindex="0"
                      onmouseenter={() => handleHotkeyMouseEnter(hotkey)}
                      onmouseleave={handleHotkeyMouseLeave}
                    >
                      {renderHotkey(hotkey)}
                      {#if editMode && !isSystemShortcut(cmdEntry)}
                        <span
                          class="chip-remove"
                          role="button"
                          tabindex="0"
                          title="Remove this hotkey"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation()
                            handleRemoveHotkey(cmdEntry.id, hotkey)
                          }}
                          onkeydown={(e: KeyboardEvent) =>
                            (e.key === 'Enter' || e.key === ' ') &&
                            (e.preventDefault(),
                            handleRemoveHotkey(cmdEntry.id, hotkey))}>×</span
                        >
                      {/if}
                    </span>
                  {/each}
                  {#if editMode && !isSystemShortcut(cmdEntry)}
                    {#if captureForId === cmdEntry.id}
                      <span
                        class="kbanalizer-setting-hotkey setting-hotkey mod-active"
                      >
                        {captureLabel || 'Press hotkey...'}
                      </span>
                    {:else}
                      <span
                        class="row-action-icon setting-add-hotkey-button"
                        role="button"
                        tabindex="0"
                        aria-label="Customize this command"
                        title="Customize this command"
                        onclick={() => startCapture(cmdEntry.id)}
                        onkeydown={(e: KeyboardEvent) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          (e.preventDefault(), startCapture(cmdEntry.id))}
                        ><PlusIcon size={16} /></span
                      >
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      <div class="plugin-groups-toolbar">
        <button class="btn-filter" onclick={collapseAll}>Collapse all</button>
        <button class="btn-filter" onclick={expandAll}>Expand all</button>
      </div>
      {#each groupedByPlugin as group (group.pluginName)}
        <div class="plugin-group">
          <div
            class="plugin-group-header {group.isBuiltIn &&
            groupSettings?.HighlightBuiltIns
              ? 'is-builtin'
              : ''}"
            role="button"
            tabindex="0"
            aria-expanded={!isCollapsed(group.pluginName)}
            aria-controls={`group-${slugify(group.pluginName)}`}
            onclick={() => togglePluginCollapse(group.pluginName)}
            onkeydown={(e: KeyboardEvent) =>
              (e.key === 'Enter' || e.key === ' ') &&
              (e.preventDefault(), togglePluginCollapse(group.pluginName))}
          >
            <span
              class="chevron {isCollapsed(group.pluginName)
                ? 'is-collapsed'
                : ''}"
            >
              <ChevronDown size={14} />
            </span>
            <span class="plugin-name">{group.pluginName}</span>
            {#if group.isBuiltIn}
              <span class="plugin-badge built-in">built-in</span>
            {/if}
            <span class="plugin-meta u-muted">{group.commands.length} cmds</span
            >
          </div>
          {#if !isCollapsed(group.pluginName)}
            <div
              class="plugin-group-body"
              id={`group-${slugify(group.pluginName)}`}
            >
              {#each group.commands as cmdEntry (cmdEntry.id)}
                <div
                  id={`cmd-row-${cmdEntry.id}`}
                  class="kbanalizer-setting-item setting-item compact"
                  class:is-starred={featuredIds.has(cmdEntry.id)}
                  class:show-actions={openPopoverFor === cmdEntry.id}
                >
                  <div class="setting-item-info">
                    <div class="setting-item-name">
                      <span class="command-name" class:is-modified={modifiedIds.has(cmdEntry.id)}
                        >{getDisplayCommandName(
                          cmdEntry.name,
                          cmdEntry.pluginName
                        )}</span
                      >
                      <div class="action-icons">
                        {#if editMode}
                          <div
                            class="pin-icon icon"
                            role="button"
                            tabindex="0"
                            title={isPinned(cmdEntry.id)
                              ? 'Unpin from top'
                              : 'Pin to top'}
                            onclick={() => togglePin(cmdEntry.id)}
                            onkeydown={(e: KeyboardEvent) =>
                              (e.key === 'Enter' || e.key === ' ') &&
                              (e.preventDefault(), togglePin(cmdEntry.id))}
                          >
                            <PinIcon size={16} />
                          </div>
                        {/if}
                        <div
                          class="star-icon icon"
                          role="button"
                          tabindex="0"
                          onclick={() => handleStarClick(cmdEntry.id)}
                          onkeydown={(e: KeyboardEvent) =>
                            (e.key === 'Enter' || e.key === ' ') &&
                            (e.preventDefault(), handleStarClick(cmdEntry.id))}
                        >
                          <StarIcon size={16} />
                        </div>
                        <div class="menu-anchor">
                          <div
                            class="folder-plus-icon icon"
                            title="Add to group"
                            role="button"
                            tabindex="0"
                            onclick={(e: MouseEvent) =>
                              toggleAddToGroupPopover(e, cmdEntry.id)}
                            onkeydown={(e: KeyboardEvent) =>
                              (e.key === 'Enter' || e.key === ' ') &&
                              (e.preventDefault(),
                              toggleAddToGroupPopover(
                                e as unknown as MouseEvent,
                                cmdEntry.id
                              ))}
                          >
                            <FolderPlusIcon size={16} />
                          </div>
                          {#if openPopoverFor === cmdEntry.id}
                            <AddToGroupPopover
                              commandId={cmdEntry.id}
                              onClose={() => (openPopoverFor = null)}
                            />
                          {/if}
                        </div>
                      </div>
                    </div>
                    {#if groupSettings?.DisplayIDs}
                      <small>{cmdEntry.id}</small>
                    {/if}
                  </div>
                  <div
                    class="kbanalizer-setting-item-control setting-item-control"
                  >
                    {#if editMode && shouldShowRestore(cmdEntry)}
                      <span
                        class="row-action-icon setting-restore-hotkey-button"
                        role="button"
                        tabindex="0"
                        aria-label={defaultHotkeysTooltip(cmdEntry)}
                        title={defaultHotkeysTooltip(cmdEntry)}
                        onclick={() => handleRestore(cmdEntry.id)}
                        onkeydown={(e: KeyboardEvent) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          (e.preventDefault(), handleRestore(cmdEntry.id))}
                        ><RestoreIcon size={16} /></span
                      >
                    {/if}
                    <div class="setting-command-hotkeys">
                      {#each cmdEntry.hotkeys as hotkey}
                        <span
                          class="kbanalizer-setting-hotkey setting-hotkey"
                          class:is-duplicate={hotkeyManager.isHotkeyDuplicate(
                            cmdEntry.id,
                            hotkey
                          ) && groupSettings?.HighlightDuplicates}
                          class:is-customized={hotkey.isCustom &&
                            groupSettings?.HighlightCustom}
                          role="button"
                          tabindex="0"
                          onclick={() =>
                            handleDuplicateHotkeyClick(hotkey, cmdEntry)}
                          onkeydown={(e: KeyboardEvent) =>
                            (e.key === 'Enter' || e.key === ' ') &&
                            (e.preventDefault(),
                            handleDuplicateHotkeyClick(hotkey, cmdEntry))}
                          onmouseenter={() => handleHotkeyMouseEnter(hotkey)}
                          onmouseleave={handleHotkeyMouseLeave}
                        >
                          {renderHotkey(hotkey)}
                          {#if editMode && !isSystemShortcut(cmdEntry)}
                            <span
                              class="chip-remove"
                              role="button"
                              tabindex="0"
                              title="Remove this hotkey"
                              onclick={(e: MouseEvent) => {
                                e.stopPropagation()
                                handleRemoveHotkey(cmdEntry.id, hotkey)
                              }}
                              onkeydown={(e: KeyboardEvent) =>
                                (e.key === 'Enter' || e.key === ' ') &&
                                (e.preventDefault(),
                                handleRemoveHotkey(cmdEntry.id, hotkey))}
                              >×</span
                            >
                          {/if}
                        </span>
                      {/each}
                      {#if editMode && !isSystemShortcut(cmdEntry)}
                        {#if captureForId === cmdEntry.id}
                          <span
                            class="kbanalizer-setting-hotkey setting-hotkey mod-active"
                          >
                            {captureLabel || 'Press hotkey...'}
                          </span>
                        {:else}
                          <span
                            class="row-action-icon setting-add-hotkey-button"
                            role="button"
                            tabindex="0"
                            aria-label="Customize this command"
                            title="Customize this command"
                            onclick={() => startCapture(cmdEntry.id)}
                            onkeydown={(e: KeyboardEvent) =>
                              (e.key === 'Enter' || e.key === ' ') &&
                              (e.preventDefault(), startCapture(cmdEntry.id))}
                            ><PlusIcon size={16} /></span
                          >
                        {/if}
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      {#if pinnedIds.size > 0}
        <div class="pinned-container">
          <div class="pinned-header">Pinned</div>
          {#each pinnedEntries as cmdEntry (cmdEntry.id)}
            <div id={`cmd-row-${cmdEntry.id}`} class="kbanalizer-setting-item setting-item is-pinned" class:is-starred={featuredIds.has(cmdEntry.id)}>
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {#if groupSettings?.ShowPluginBadges}
                    <button
                      class={`suggestion-prefix ${cmdEntry.isInternalModule && groupSettings?.HighlightBuiltIns ? 'is-builtin' : ''}`}
                      onclick={() => handlePluginNameClick(cmdEntry.pluginName)}
                    >
                      {cmdEntry.pluginName}
                    </button>
                  {/if}
                  <span class="command-name" class:is-modified={modifiedIds.has(cmdEntry.id)}
                    >{getDisplayCommandName(
                      cmdEntry.name,
                      cmdEntry.pluginName
                    )}</span
                  >
                  <div class="action-icons">
                    {#if editMode}
                      <div
                        class="pin-icon icon"
                        role="button"
                        tabindex="0"
                        title="Unpin from top"
                        onclick={() => togglePin(cmdEntry.id)}
                        onkeydown={(e: KeyboardEvent) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          (e.preventDefault(), togglePin(cmdEntry.id))}
                      >
                        <PinIcon size={16} />
                      </div>
                    {/if}
                  </div>
                </div>
                {#if groupSettings?.DisplayIDs}
                  <small>{cmdEntry.id}</small>
                {/if}
              </div>
              <div class="kbanalizer-setting-item-control setting-item-control">
                {#if editMode && shouldShowRestore(cmdEntry)}
                  <span
                    class="row-action-icon setting-restore-hotkey-button"
                    role="button"
                    tabindex="0"
                    aria-label={defaultHotkeysTooltip(cmdEntry)}
                    title={defaultHotkeysTooltip(cmdEntry)}
                    onclick={() => handleRestore(cmdEntry.id)}
                    onkeydown={(e: KeyboardEvent) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (e.preventDefault(), handleRestore(cmdEntry.id))}
                    ><RestoreIcon size={16} /></span
                  >
                {/if}
                <div class="setting-command-hotkeys">
                  {#each cmdEntry.hotkeys as hotkey}
                    <span
                      class="kbanalizer-setting-hotkey setting-hotkey"
                      class:is-duplicate={hotkeyManager.isHotkeyDuplicate(cmdEntry.id, hotkey) && groupSettings?.HighlightDuplicates}
                      class:is-customized={hotkey.isCustom && groupSettings?.HighlightCustom}
                      role="button"
                      tabindex="0"
                      onmouseenter={() => handleHotkeyMouseEnter(hotkey)}
                      onmouseleave={handleHotkeyMouseLeave}
                    >
                      {renderHotkey(hotkey)}
                      {#if editMode && !isSystemShortcut(cmdEntry)}
                        <span
                          class="chip-remove"
                          role="button"
                          tabindex="0"
                          title="Remove this hotkey"
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation()
                            handleRemoveHotkey(cmdEntry.id, hotkey)
                          }}
                          onkeydown={(e: KeyboardEvent) =>
                            (e.key === 'Enter' || e.key === ' ') &&
                            (e.preventDefault(),
                            handleRemoveHotkey(cmdEntry.id, hotkey))}>×</span
                        >
                      {/if}
                    </span>
                  {/each}
                  {#if editMode && !isSystemShortcut(cmdEntry)}
                    {#if captureForId === cmdEntry.id}
                      <span
                        class="kbanalizer-setting-hotkey setting-hotkey mod-active"
                      >
                        {captureLabel || 'Press hotkey...'}
                      </span>
                    {:else}
                      <span
                        class="row-action-icon setting-add-hotkey-button"
                        role="button"
                        tabindex="0"
                        aria-label="Customize this command"
                        title="Customize this command"
                        onclick={() => startCapture(cmdEntry.id)}
                        onkeydown={(e: KeyboardEvent) =>
                          (e.key === 'Enter' || e.key === ' ') &&
                          (e.preventDefault(), startCapture(cmdEntry.id))}
                        ><PlusIcon size={16} /></span
                      >
                    {/if}
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      {#each filteredCommands.filter(c => !isPinned(c.id)) as cmdEntry (cmdEntry.id)}
        <div
          id={`cmd-row-${cmdEntry.id}`}
          class="kbanalizer-setting-item setting-item"
          class:is-starred={featuredIds.has(cmdEntry.id)}
          class:show-actions={openPopoverFor === cmdEntry.id}
        >
          <div class="setting-item-info">
            <div class="setting-item-name">
              {#if groupSettings?.ShowPluginBadges}
                <button
                  class={`suggestion-prefix ${cmdEntry.isInternalModule && groupSettings?.HighlightBuiltIns ? 'is-builtin' : ''}`}
                  onclick={() => handlePluginNameClick(cmdEntry.pluginName)}
                >
                  {cmdEntry.pluginName}
                </button>
              {/if}
              <span class="command-name" class:is-modified={modifiedIds.has(cmdEntry.id)}
                >{getDisplayCommandName(
                  cmdEntry.name,
                  cmdEntry.pluginName
                )}</span
              >
              <div class="action-icons">
                {#if editMode}
                  <div
                    class="pin-icon icon"
                    role="button"
                    tabindex="0"
                    title={isPinned(cmdEntry.id)
                      ? 'Unpin from top'
                      : 'Pin to top'}
                    onclick={() => togglePin(cmdEntry.id)}
                    onkeydown={(e: KeyboardEvent) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (e.preventDefault(), togglePin(cmdEntry.id))}
                  >
                    <PinIcon size={16} />
                  </div>
                {/if}
                <FloatingTooltip
                  content={featuredIds.has(cmdEntry.id)
                    ? 'Remove from featured commands'
                    : 'Add to featured commands'}
                  placement="top"
                  delay={500}
                  group={TOOLTIP_GROUPS.ACTION_ICONS}
                >
                  <div
                    class="star-icon icon"
                    role="button"
                    tabindex="0"
                    onclick={() => handleStarClick(cmdEntry.id)}
                    onkeydown={(e: KeyboardEvent) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (e.preventDefault(), handleStarClick(cmdEntry.id))}
                  >
                    <StarIcon size={16} />
                  </div>
                </FloatingTooltip>
                <div class="menu-anchor">
                  <FloatingTooltip
                    content="Add command to a group for better organization"
                    placement="top"
                    delay={500}
                    group={TOOLTIP_GROUPS.ACTION_ICONS}
                  >
                    <div
                      class="folder-plus-icon icon"
                      title="Add to group"
                      role="button"
                      tabindex="0"
                      onclick={(e: MouseEvent) =>
                        toggleAddToGroupPopover(e, cmdEntry.id)}
                      onkeydown={(e: KeyboardEvent) =>
                        (e.key === 'Enter' || e.key === ' ') &&
                        (e.preventDefault(),
                        toggleAddToGroupPopover(
                          e as unknown as MouseEvent,
                          cmdEntry.id
                        ))}
                    >
                      <FolderPlusIcon size={16} />
                    </div>
                  </FloatingTooltip>
                  {#if openPopoverFor === cmdEntry.id}
                    <AddToGroupPopover
                      commandId={cmdEntry.id}
                      onClose={() => (openPopoverFor = null)}
                    />
                  {/if}
                </div>
              </div>
            </div>
            {#if groupSettings?.DisplayIDs}
              <small>{cmdEntry.id}</small>
            {/if}
          </div>
          <div class="kbanalizer-setting-item-control setting-item-control">
            {#if editMode}
              <span
                class="row-action-icon setting-restore-hotkey-button"
                role="button"
                tabindex="0"
                aria-label="Restore default"
                title="Restore default"
                onclick={() => handleRestore(cmdEntry.id)}
                onkeydown={(e: KeyboardEvent) =>
                  (e.key === 'Enter' || e.key === ' ') &&
                  (e.preventDefault(), handleRestore(cmdEntry.id))}
                ><RestoreIcon size={16} /></span
              >
            {/if}
            <div class="setting-command-hotkeys">
              {#each cmdEntry.hotkeys as hotkey}
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey"
                  class:is-duplicate={hotkeyManager.isHotkeyDuplicate(
                    cmdEntry.id,
                    hotkey
                  ) && groupSettings?.HighlightDuplicates}
                  class:is-customized={hotkey.isCustom &&
                    groupSettings?.HighlightCustom}
                  role="button"
                  tabindex="0"
                  onclick={() => handleDuplicateHotkeyClick(hotkey, cmdEntry)}
                  onkeydown={(e: KeyboardEvent) =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    (e.preventDefault(),
                    handleDuplicateHotkeyClick(hotkey, cmdEntry))}
                  onmouseenter={() => handleHotkeyMouseEnter(hotkey)}
                  onmouseleave={handleHotkeyMouseLeave}
                >
                  {renderHotkey(hotkey)}
                  {#if editMode}
                    <span
                      class="chip-remove"
                      role="button"
                      tabindex="0"
                      title="Remove this hotkey"
                      onclick={(e: MouseEvent) => {
                        e.stopPropagation()
                        handleRemoveHotkey(cmdEntry.id, hotkey)
                      }}
                      onkeydown={(e: KeyboardEvent) =>
                        (e.key === 'Enter' || e.key === ' ') &&
                        (e.preventDefault(),
                        handleRemoveHotkey(cmdEntry.id, hotkey))}>×</span
                    >
                  {/if}
                </span>
              {/each}
              {#if editMode}
                {#if captureForId === cmdEntry.id}
                  <span
                    class="kbanalizer-setting-hotkey setting-hotkey mod-active"
                  >
                    {captureLabel || 'Press hotkey...'}
                  </span>
                {:else}
                  <span
                    class="row-action-icon setting-add-hotkey-button"
                    role="button"
                    tabindex="0"
                    aria-label="Customize this command"
                    title="Customize this command"
                    onclick={() => startCapture(cmdEntry.id)}
                    onkeydown={(e: KeyboardEvent) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (e.preventDefault(), startCapture(cmdEntry.id))}
                    ><PlusIcon size={16} /></span
                  >
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if editMode || $lastHotkeyChange}
    <div class="hotkey-update-banner is-fixed" role="status" aria-live="polite">
      <!-- Row 1: Notice -->
      <div class="banner-row notice-row">
        <div class="banner-text">
          <strong>Edit mode is ON</strong> — This editor is beta/unstable. For safety, prefer the built‑in Hotkeys settings for assignments. Important: back up your vault’s <code>.obsidian/hotkeys.json</code> before using Edit mode.
        </div>
      </div>
      <!-- Row 2: Controls and Latest changes toggle -->
      <div class="banner-row controls-row">
        <details class="changes-toggle">
          <summary>Latest changes</summary>
          <!-- Row 3: Expanded list (revertable changes) -->
          <ul class="log-list">
            {#each Array.from(modifiedIds) as id}
              {#if commandsManager.getCommandsIndex()[id]}
                {@const c = commandsManager.getCommandsIndex()[id]}
                <li>
                  <button class="linkish" onclick={() => scrollToCommand(id)}><em>{c.name}</em></button>
                  —
                  {#each c.hotkeys as hk, j}
                    <strong>{renderHotkey(hk)}{j < c.hotkeys.length - 1 ? ', ' : ''}</strong>
                  {/each}
                  <button class="btn-banner" onclick={() => revertChangeForId(plugin.app, commandsManager, id)} title="Revert this change">Revert</button>
                </li>
              {/if}
            {/each}
          </ul>
        </details>
        <div class="banner-actions">
          <button class="btn-banner" onclick={openVaultFolder} title="Open your vault folder in the system file explorer">Open vault folder</button>
          {#if modifiedIds.size > 0}
            <button class="btn-banner" onclick={keepChanges} title="Clear revert list and exit Edit mode">Keep changes</button>
          {/if}
          {#if modifiedIds.size > 0}
            <button class="btn-banner is-accent" onclick={handleUndo} title="Undo all hotkey changes">Undo all</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

{#if pendingAssign}
  <ConfirmHotkeyModal
    title="Duplicate hotkey"
    chord={pendingAssign.chord}
    message="This hotkey is already used by the following commands. Proceed to add anyway?"
    conflicts={pendingAssign.conflicts}
    onConfirmPin={async () => {
      const p = pendingAssign; pendingAssign = null; if (!p) return;
      pinMany([p.id, ...p.conflicts.map(c => c.id)])
      await assignHotkeyAdditive(plugin.app, commandsManager, p.id, { modifiers: p.mods, key: p.key })
    }}
    onConfirm={async () => {
      const p = pendingAssign
      pendingAssign = null
      if (!p) return
      await assignHotkeyAdditive(plugin.app, commandsManager, p.id, {
        modifiers: p.mods,
        key: p.key,
      })
    }}
    onCancel={() => (pendingAssign = null)}
  />
{/if}

{#if pendingRestore}
  <ConfirmHotkeyModal
    title="Restore default hotkeys"
    chord=""
    message={`Restore \"${pendingRestore.name}\" to its default hotkeys?`}
    conflicts={[]}
    onConfirm={async () => {
      const p = pendingRestore
      pendingRestore = null
      if (!p) return
      await restoreDefaults(plugin.app, commandsManager, p.id)
    }}
    onCancel={() => (pendingRestore = null)}
  />
{/if}

<style>
  /* Centered, polished empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 220px;
    padding: 24px;
    margin: 24px auto;
    border: 1px dashed var(--indentation-guide);
    border-radius: 12px;
    background: var(--background-secondary);
  }
  .empty-icon {
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .empty-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .empty-subtitle {
    color: var(--text-muted);
    margin-bottom: 12px;
  }
  .empty-hints {
    color: var(--text-muted);
    text-align: left;
    margin: 0;
    padding-left: 18px;
  }
  .pinned-header {
    font-weight: 600;
    color: var(--text-muted);
    margin: 4px 0 6px 0;
  }
  .pinned-container {
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    border-radius: 8px;
    padding: 4px 8px 8px 8px;
    margin: 6px 0 10px 0;
  }

  .clickable-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-left: 6px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.85;
  }
  .clickable-icon:hover {
    opacity: 1;
    background: var(--background-modifier-hover);
  }

  .hotkey-update-banner {
    position: fixed;
    bottom: 12px;
    left: 8px;
    right: 8px;
    transform: none;
    width: auto;
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-secondary);
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    z-index: 150000;
  }
  .hotkey-update-banner .banner-text {
    color: var(--text-normal);
  }
  .banner-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .controls-row { align-items: flex-start; }
  .changes-toggle { margin: 0; }
  .changes-toggle > summary { cursor: pointer; color: var(--text-muted); }
  .log-list { margin: 6px 0 0 16px; padding: 0; }
  .log-list li { margin: 2px 0; }
  .hotkey-update-banner .banner-actions { display: inline-flex; gap: 8px; }
  .linkish { background: none; border: none; color: var(--text-accent); cursor: pointer; padding: 0; }
  .command-name.is-modified { font-style: italic; }
  #hotkeys-wrapper .flash { animation: flash-bg 0.8s ease; }
  @keyframes flash-bg {
    0% { background: var(--background-modifier-hover); }
    100% { background: transparent; }
  }
  .btn-banner {
    height: 28px;
    padding: 0 10px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
  }
  .btn-banner.is-accent {
    border-color: var(--interactive-accent);
    background: var(--interactive-accent);
    color: var(--text-primary);
  }

  /* Add-to-group popover anchored to icon group */
  .action-icons {
    position: relative;
    display: inline-flex;
    align-items: center;
    overflow: visible;
  }
  .menu-anchor {
    position: relative;
    display: inline-block;
    overflow: visible;
  }
  .kbanalizer-setting-hotkey.setting-hotkey {
    position: relative;
  }
  .chip-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
    border-radius: 50%;
    font-size: 11px;
    background: var(--background-modifier-border);
    color: var(--text-muted);
    cursor: pointer;
  }
  .chip-remove:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
  }
  .action-icons {
    position: relative;
    display: inline-flex;
    align-items: center;
    overflow: visible;
  }
  .action-icons .icon {
    margin-left: 6px;
    cursor: pointer;
    opacity: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }
  .kbanalizer-setting-item:hover .action-icons .icon {
    opacity: 0.85;
  }
  .action-icons .icon:first-child {
    margin-left: 0;
  }
  .action-icons .icon:hover {
    opacity: 1;
  }

  /* Low-emphasis row action icons (Add / Restore) */
  .row-action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-left: 6px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    background: transparent;
    opacity: 0.7;
  }
  .row-action-icon:hover,
  .row-action-icon:focus-visible {
    opacity: 1;
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    outline: none;
  }
</style>
