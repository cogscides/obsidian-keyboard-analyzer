<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import { Star as StarIcon } from 'lucide-svelte'
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

  function handleStarClick(commandId: string) {
    onStarClick?.(commandId)
  }

  function handlePluginNameClick(pluginName: string) {
    onPluginNameClick?.(pluginName)
  }

  function handleDuplicateHotkeyClick(hotkey: hotkeyEntry) {
    onDuplicateHotkeyClick?.(hotkey)
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
            <span class="command-name">{cmdEntry.name}</span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="star-icon icon"
              onclick={() => handleStarClick(cmdEntry.id)}
            >
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
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span
                class="kbanalizer-setting-hotkey setting-hotkey"
                class:is-duplicate={hotkeyManager.isHotkeyDuplicate(
                  cmdEntry.id,
                  hotkey,
                ) && groupSettings?.HighlightDuplicates}
                class:is-customized={hotkey.isCustom &&
                  groupSettings?.HighlightCustom}
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
  </div>
</div>
