<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import { Star as StarIcon, ChevronDown } from 'lucide-svelte'
  import type SettingsManager from '../managers/settingsManager'
  import type GroupManager from '../managers/groupManager'

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

  // Using callback props instead of component events (Svelte 5)

  let groupSettings = $derived.by(() => {
    groupManager.groups
    const settings = groupManager.getGroupSettings(selectedGroup)
    console.log('[KB] CommandsList groupSettings derived', {
      selectedGroup,
      settings,
    })
    return settings
  })

  function renderHotkey(hotkey: hotkeyEntry) {
    return hotkeyManager.renderHotkey(hotkey)
  }

  function getDisplayCommandName(name: string, pluginName: string): string {
    const p = (pluginName || '').trim()
    const n = name || ''
    if (!p) return n
    const lower = n.toLowerCase()
    const pref = p.toLowerCase() + ': '
    if (lower.startsWith(pref)) {
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

  function handleDuplicateHotkeyClick(hotkey: hotkeyEntry) {
    onDuplicateHotkeyClick?.(hotkey)
  }

  // Grouped view state and helpers
  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
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

  type PluginGroup = { pluginName: string; commands: commandEntry[] }
  let groupedByPlugin: PluginGroup[] = $derived.by(() => {
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
      return { pluginName, commands }
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

<span>Selected Group: {selectedGroup}</span>
<div
  id="hotkeys-wrapper"
  class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
>
  <div class="hotkey-list-container">
    {#if filteredCommands.length === 0}
      <div class="empty-state u-muted">
        <div>No matching commands</div>
        <ul>
          <li>Try typing a different term</li>
          <li>Toggle the key listener to filter by keys</li>
          <li>Check filters or include built-in modules</li>
        </ul>
      </div>
    {:else}
      {#if groupSettings?.GroupByPlugin}
        <div class="plugin-groups-toolbar">
          <button class="btn-filter" onclick={collapseAll}>Collapse all</button>
          <button class="btn-filter" onclick={expandAll}>Expand all</button>
        </div>
        {#each groupedByPlugin as group (group.pluginName)}
          <div class="plugin-group">
            <div
              class="plugin-group-header"
              role="button"
              aria-expanded={!isCollapsed(group.pluginName)}
              aria-controls={`group-${slugify(group.pluginName)}`}
              onclick={() => togglePluginCollapse(group.pluginName)}
            >
              <span class="chevron {isCollapsed(group.pluginName) ? 'is-collapsed' : ''}">
                <ChevronDown size={14} />
              </span>
              <span class="plugin-name">{group.pluginName}</span>
              <span class="plugin-meta u-muted">{group.commands.length} cmds</span>
            </div>
            {#if !isCollapsed(group.pluginName)}
              <div class="plugin-group-body" id={`group-${slugify(group.pluginName)}`}>
                {#each group.commands as cmdEntry (cmdEntry.id)}
                  <div
                    class="kbanalizer-setting-item setting-item compact"
                    class:is-starred={commandsManager.featuredCommandIds.has(cmdEntry.id)}
                  >
                    <div class="setting-item-info">
                      <div class="setting-item-name">
                        <span class="command-name">{getDisplayCommandName(cmdEntry.name, cmdEntry.pluginName)}</span>
                        <div class="star-icon icon" onclick={() => handleStarClick(cmdEntry.id)}>
                          <StarIcon size={16} />
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
                            class:is-duplicate={hotkeyManager.isHotkeyDuplicate(cmdEntry.id, hotkey) && groupSettings?.HighlightDuplicates}
                            class:is-customized={hotkey.isCustom && groupSettings?.HighlightCustom}
                            onclick={() => handleDuplicateHotkeyClick(hotkey)}
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
            class:is-starred={commandsManager.featuredCommandIds.has(cmdEntry.id)}
          >
            <div class="setting-item-info">
              <div class="setting-item-name">
                <button
                  class="suggestion-prefix"
                  onclick={() => handlePluginNameClick(cmdEntry.pluginName)}
                >
                  {cmdEntry.pluginName}
                </button>
                <span class="command-name">{getDisplayCommandName(cmdEntry.name, cmdEntry.pluginName)}</span>
                <div class="star-icon icon" onclick={() => handleStarClick(cmdEntry.id)}>
                  <StarIcon size={16} />
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
                    class:is-duplicate={hotkeyManager.isHotkeyDuplicate(cmdEntry.id, hotkey) && groupSettings?.HighlightDuplicates}
                    class:is-customized={hotkey.isCustom && groupSettings?.HighlightCustom}
                    onclick={() => handleDuplicateHotkeyClick(hotkey)}
                  >
                    {renderHotkey(hotkey)}
                  </span>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
</div>
