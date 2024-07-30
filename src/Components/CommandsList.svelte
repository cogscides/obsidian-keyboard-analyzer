<script lang="ts">
  import { getContext } from 'svelte'
  import type KeyboardAnalyzerPlugin from '../main'
  import type { Hotkey } from 'obsidian'
  import type {
    commandsArray,
    PluginSettings,
    UnsafeAppInterface,
  } from '../interfaces/Interfaces'
  // import { SpecialSymbols } from '../Constants'
  import type { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
  import {
    prepareModifiersString,
    getConvertedModifiers,
    sortModifiers,
  } from '../utils/modifierUtils'
  import { Star as StarIcon } from 'lucide-svelte'

  interface Props {
    visibleCommands: commandsArray
  }

  let { visibleCommands = $bindable([]) }: Props = $props()

  const plugin = getContext<KeyboardAnalyzerPlugin>('keyboard-analyzer-plugin')
  const visualKeyboardManager = getContext<VisualKeyboardManager>(
    'visualKeyboardManager'
  )
  const hotkeyManager = plugin.hotkeyManager
  const settings = plugin.settingsManager.settings

  function renderHotkey(hotkey: Hotkey) {
    let modifiersString =
      hotkey.modifiers.length !== 0
        ? `${getConvertedModifiers(sortModifiers(hotkey.modifiers)).join(' + ')} + `
        : ''

    let specialKeys = visualKeyboardManager.layout.specialKeys
    let key =
      hotkey.key in specialKeys
        ? specialKeys[hotkey.key]
        : hotkey.key.length === 1
          ? hotkey.key.toUpperCase()
          : hotkey.key
    return modifiersString + key
  }

  // const dispatch = createEventDispatcher()
  // function sendPluginName(e: any) {
  //   const clicked = e.target.innerHTML
  //   dispatch('plugin-name-clicked', clicked)
  // }

  // $: props = {
  //   settings,
  // }
</script>

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
                  onclick={() =>
                    console.log('duplicate-hotkey-clicked', hotkey)}
                >
                  {renderHotkey(hotkey)}
                </button>
              {:else}
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey"
                  class:is-customized={hotkey.isCustom &&
                    settings.filterSettings.HighlightCustom}
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
