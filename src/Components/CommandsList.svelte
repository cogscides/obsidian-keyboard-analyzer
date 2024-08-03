<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { Hotkey } from 'obsidian'
  import type { commandEntry, hotkeyEntry } from '../interfaces/Interfaces'
  import {
    prepareModifiersString,
    convertModifiers,
    sortModifiers,
  } from '../utils/modifierUtils'
  import { Star as StarIcon } from 'lucide-svelte'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
  import type HotkeyManager from '../managers/hotkeyManager.svelte'
  import type { CommandsManager } from '../managers/commandsManager.svelte'
  import type SettingsManager from '../managers/settingsManager.svelte'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'

  interface Props {
    visibleCommands: commandEntry[]
    selectedGroup?: string
  }

  let {
    visibleCommands = $bindable([]),
    selectedGroup = $bindable(''),
  }: Props = $props()

  const plugin: KeyboardAnalyzerPlugin = getContext('keyboard-analyzer-plugin')
  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager'
  )
  const commandsManager: CommandsManager = plugin.commandsManager
  const settingsManager: SettingsManager = plugin.settingsManager
  const hotkeyManager: HotkeyManager = plugin.hotkeyManager
  const settings = $derived(settingsManager.getSettings())

  function renderHotkey(hotkey: hotkeyEntry) {
    return hotkeyManager.renderHotkey(hotkey)
  }

  function handleStarClick(commandId: string) {
    commandsManager.toggleFeaturedCommand(commandId)
  }

  function handlePluginNameClick(pluginName: string) {
    // TODO to implement this logic we could move the search to the activeKeysStore (potential renaming to searchStore)
    console.log('pluginNameClick', pluginName)
  }

  function handleDuplicateHotkeyClick(hotkey: Hotkey) {
    console.log('duplicateHotkeyClick', hotkey)
  }
</script>

<span> Selected Group: {selectedGroup} </span>
<div
  id="hotkeys-wrapper"
  class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
>
  <div class="hotkey-list-container">
    {#each visibleCommands as cmdEntry (cmdEntry.id)}
      <div
        class="kbanalizer-setting-item setting-item"
        class:is-starred={settings && settings.featuredCommandIDs
          ? settings.featuredCommandIDs.includes(cmdEntry.id)
          : false}
      >
        <!-- animate:flip={{ duration: 200 }} -->
        <!-- transition:fade={{ duration: 200 }} -->
        <div class="setting-item-info">
          <div class="setting-item-name">
            <button
              class="suggestion-prefix"
              onclick={() => handlePluginNameClick(cmdEntry.pluginName)}
            >
              {cmdEntry.pluginName}
            </button>
            <span class="command-name">{cmdEntry.cmdName}</span>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="star-icon icon"
              onclick={() => handleStarClick(cmdEntry.id)}
            >
              <StarIcon size={16} />
            </div>
          </div>
          {#if settings.filterSettings?.DisplayIDs}
            <small>
              {cmdEntry.id}
            </small>
          {/if}
        </div>
        <div class="kbanalizer-setting-item-control setting-item-control">
          <div class="setting-command-hotkeys">
            {#each cmdEntry.hotkeys as hotkey}
              {#if hotkeyManager.isHotkeyDuplicate( cmdEntry.id, { ...hotkey, modifiers: hotkey.modifiers ?? [] } )}
                <button
                  class="kbanalizer-setting-hotkey setting-hotkey is-duplicate"
                  class:is-duplicate={settings.filterSettings
                    .HighlightDuplicates}
                  onclick={() => handleDuplicateHotkeyClick(hotkey)}
                >
                  {renderHotkey(hotkey)}
                </button>
              {:else}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey"
                  class:is-customized={hotkey.isCustom &&
                    settings.filterSettings.HighlightCustom}
                  onclick={() => {
                    console.log('hotkey-clicked')
                    console.log(JSON.stringify(hotkey, null, 2))
                  }}
                >
                  {renderHotkey(hotkey)}
                </span>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
