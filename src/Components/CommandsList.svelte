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

  interface Props {
    visibleCommands: commandEntry[]
    selectedGroup?: string
  }

  let {
    visibleCommands = $bindable([]),
    selectedGroup = $bindable(''),
  }: Props = $props()

  const plugin = getContext<KeyboardAnalyzerPlugin>('keyboard-analyzer-plugin')
  const visualKeyboardManager: VisualKeyboardManager = getContext(
    'visualKeyboardManager'
  )
  const commandsManager = plugin.commandsManager
  const settingsManager = plugin.settingsManager
  const hotkeyManager: HotkeyManager = plugin.hotkeyManager
  const settings = $derived(settingsManager.getSettings())

  function renderHotkey(hotkey: hotkeyEntry) {
    return hotkeyManager.renderHotkey(hotkey)
  }

  function handleStarClick(commandId: string) {
    commandsManager.toggleFeaturedCommand(commandId)
  }

  function handlePluginNameClick(pluginName: string) {
    // Implement the logic for plugin name click
  }

  function handleDuplicateHotkeyClick(hotkey: Hotkey) {
    // Implement the logic for duplicate hotkey click
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
              onclick={() => console.log('sendPluginName()')}
            >
              {cmdEntry.pluginName}
            </button>
            <span class="command-name">{cmdEntry.cmdName}</span>
            <button
              class="star-icon icon"
              onclick={() => {
                console.log('star-clicked', cmdEntry.id)
              }}
            >
              <StarIcon size={16} />
            </button>
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
                  onclick={() => {
                    console.log('duplicate-hotkey-clicked')
                    console.log(JSON.stringify(hotkey, null, 2))
                  }}
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
