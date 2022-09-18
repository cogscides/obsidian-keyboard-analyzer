<script lang="ts">
  import type { Hotkey } from 'obsidian'
  import type { commandsArray, PluginSettings } from 'src/Interfaces'
  // @ts-ignore
  import { flip } from 'svelte/animate'
  import { createEventDispatcher } from 'svelte'
  import { fly, fade, slide, blur } from 'svelte/transition'

  import { SpecialSymbols } from 'src/Constants'
  import {
    prepareModifiersString,
    getConvertedModifiers,
    sortModifiers,
    isHotkeyDuplicate,
  } from 'src/AppShortcuts'
  import { Star as StarIcon } from 'lucide-svelte'

  export let visibleCommands: commandsArray

  export let settings: PluginSettings

  function renderHotkey(hotkey: Hotkey) {
    let modifiersString =
      hotkey.modifiers.length !== 0
        ? getConvertedModifiers(sortModifiers(hotkey.modifiers)).join(' + ') +
          ' + '
        : ''
    let key =
      hotkey.key in SpecialSymbols
        ? SpecialSymbols[hotkey.key]
        : hotkey.key.length === 1
        ? hotkey.key.toUpperCase()
        : hotkey.key
    return modifiersString + key
  }

  const dispatch = createEventDispatcher()
  function sendPluginName(e: any) {
    const clicked = e.target.innerHTML
    dispatch('plugin-name-clicked', clicked)
  }

  $: props = {
    settings,
  }
</script>

<!-- <button on:click={handlePickKey}>test me</button> -->

<!-- <KeyboardLayout {app} /> -->
<!-- <KeyboardLayout bind:keyboardKeys={keyboardString} /> -->

<div
  id="hotkeys-wrapper"
  class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
>
  <div class="hotkey-list-container">
    {#each visibleCommands as cmdEntry (cmdEntry.id)}
      <div
        class="kbanalizer-setting-item setting-item"
        class:is-starred={settings.featuredCommandIDs.includes(cmdEntry.id)}
      >
        <!-- animate:flip={{ duration: 200 }} -->
        <!-- transition:fade={{ duration: 200 }} -->
        <div class="setting-item-info">
          <div class="setting-item-name">
            <span class="suggestion-prefix" on:click={sendPluginName}>
              {cmdEntry.pluginName}
            </span>
            <span class="command-name">{cmdEntry.cmdName}</span>
            <div
              class="star-icon icon"
              on:click={() => {
                dispatch('star-clicked', cmdEntry.id)
              }}
            >
              <StarIcon size={16} />
            </div>
          </div>
          {#if settings.filterSettings.DisplayIDs}
            <small>
              {cmdEntry.id}
            </small>
          {/if}
        </div>
        <div class="kbanalizer-setting-item-control setting-item-control">
          <div class="setting-command-hotkeys">
            {#each cmdEntry.hotkeys as hotkey}
              {#if isHotkeyDuplicate(cmdEntry.id, hotkey)}
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey is-duplicate"
                  class:is-duplicate={settings.filterSettings
                    .HighlightDuplicates}
                  on:click={() => dispatch('duplicate-hotkey-clicked', hotkey)}
                  >{renderHotkey(hotkey)}</span
                >
              {:else}
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey"
                  class:is-customized={hotkey.isCustom &&
                    settings.filterSettings.HighlightCustom}
                  >{renderHotkey(hotkey)}</span
                >
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
