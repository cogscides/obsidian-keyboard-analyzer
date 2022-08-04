<script lang="ts">
  import type { commandsArray } from 'src/Interfaces'
  import { SpecialSymbols } from 'src/Constants'
  import {
    prepareModifiersString,
    getConvertedModifiers,
    sortModifiers,
  } from 'src/AppShortcuts'

  export let visibleCommands: commandsArray
  console.log(visibleCommands)
</script>

<!-- <button on:click={handlePickKey}>test me</button> -->

<!-- <KeyboardLayout {app} /> -->
<!-- <KeyboardLayout bind:keyboardKeys={keyboardString} /> -->

<div
  id="hotkeys-wrapper"
  class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
>
  <div class="hotkey-list-container">
    {#each visibleCommands as cmdEntry}
      <div class="kbanalizer-setting-item setting-item">
        <div class="setting-item-info">
          <div class="setting-item-name">
            <span class="suggestion-prefix">
              {cmdEntry.pluginName}
            </span>
            {cmdEntry.cmdName}
          </div>
          <small>{cmdEntry.id}</small>
        </div>
        <div class="kbanalizer-setting-item-control setting-item-control">
          <div class="setting-command-hotkeys">
            {#each cmdEntry.hotkeys as hotkey}
              <span
                class="kbanalizer-setting-hotkey setting-hotkey {hotkey.isCustom
                  ? 'is-customized'
                  : ''}"
              >
                {getConvertedModifiers(sortModifiers(hotkey.modifiers)).join(
                  ' + '
                )} + {hotkey.key in SpecialSymbols
                  ? SpecialSymbols[hotkey.key]
                  : hotkey.key.length === 1
                  ? hotkey.key.toUpperCase()
                  : hotkey.key}
              </span>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
