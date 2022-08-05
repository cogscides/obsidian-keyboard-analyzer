<script lang="ts">
  import { flip } from 'svelte/animate'
  import { createEventDispatcher } from 'svelte'

  import type { commandsArray } from 'src/Interfaces'
  import { SpecialSymbols } from 'src/Constants'
  import {
    prepareModifiersString,
    getConvertedModifiers,
    sortModifiers,
  } from 'src/AppShortcuts'

  export let visibleCommands: commandsArray
  // console.log(visibleCommands)

  const dispatch = createEventDispatcher()
  function sendPluginName(e: any) {
    const clicked = e.target.innerHTML
    dispatch('pluginNameClicked', clicked)
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
        animate:flip={{ duration: 150 }}
      >
        <div class="kbanalizer-setting-item setting-item">
          <div class="setting-item-info">
            <div class="setting-item-name">
              <span class="suggestion-prefix" on:click={sendPluginName}>
                {cmdEntry.pluginName}
              </span>
              {cmdEntry.cmdName}
            </div>
            <!-- <small>{cmdEntry.id}</small> -->
          </div>
          <div class="kbanalizer-setting-item-control setting-item-control">
            <div class="setting-command-hotkeys">
              {#each cmdEntry.hotkeys as hotkey}
                <span
                  class="kbanalizer-setting-hotkey setting-hotkey {hotkey.isCustom
                    ? 'is-customized'
                    : ''}"
                >
                  {hotkey.modifiers.length !== 0
                    ? getConvertedModifiers(
                        sortModifiers(hotkey.modifiers)
                      ).join(' + ')
                    : ''} + {hotkey.key in SpecialSymbols
                    ? SpecialSymbols[hotkey.key]
                    : hotkey.key.length === 1
                    ? hotkey.key.toUpperCase()
                    : hotkey.key}
                </span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
