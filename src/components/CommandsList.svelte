<script lang="ts">
  import { getContext } from 'svelte'
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
  } from 'lucide-svelte'

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
    const map = new Map<string, commandEntry[]>()
    for (const cmd of filteredCommands) {
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
                  class="kbanalizer-setting-item setting-item compact"
                  class:is-starred={featuredIds.has(cmdEntry.id)}
                  class:show-actions={openPopoverFor === cmdEntry.id}
                >
                  <div class="setting-item-info">
                    <div class="setting-item-name">
                      <span class="command-name"
                        >{getDisplayCommandName(
                          cmdEntry.name,
                          cmdEntry.pluginName
                        )}</span
                      >
                      <div class="action-icons">
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
                        </span>
                      {/each}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      {#each filteredCommands as cmdEntry (cmdEntry.id)}
        <div
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
              <span class="command-name"
                >{getDisplayCommandName(
                  cmdEntry.name,
                  cmdEntry.pluginName
                )}</span
              >
              <div class="action-icons">
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
                </span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

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
  .folder-plus-icon {
    margin-left: 6px;
    cursor: pointer;
    opacity: 0.8;
  }
  .folder-plus-icon:hover {
    opacity: 1;
  }
</style>
