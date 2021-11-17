<script lang="ts">
  import type { App } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type { KeyboardAnalizerSettings } from 'src/Interfaces'
  import { getCommands } from 'src/AppShortcuts'
  // import { keyboard_svg } from 'src/Constants'
  import KeyboardLayout from './KeyboardLayout.svelte'

  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: KeyboardAnalizerSettings
  export let view: ShortcutsView

  let cmds = getCommands(app)

  $: props = {
    app,
    plugin,
    settings,
    view,
    cmds,
  }
</script>

<div class="markdown-preview-sizer markdown-preview-section">
  <h1>Hello Maaaan 123!</h1>
  <!-- <div class="keyboard_svg_wrapper">
    {@html keyboard_svg}
  </div> -->
  <KeyboardLayout />
  <div class="hotkey-settings-container">
    <div class="hotkey-search-container">
      <input type="text" placeholder="Filter..." />
    </div>
    <div class="search-results">
      Found {cmds.length} assigned hotkeys
    </div>
    <div class="hotkey-list-container">
      {#each cmds as command, i}
        {#if command.hotkeys != undefined && command.hotkeys.length > 0}
          <div class="kbanalizer-setting-item">
            <div class="setting-item-info">
              <div class="setting-item-name">
                {i}. {command.name}
              </div>
            </div>
            <div class="kbanalizer-setting-item-control">
              <div class="setting-command-hotkeys">
                {#each command.hotkeys as hotkey}
                  {#if hotkey.modifiers}
                    <span class="kbanalizer-setting-hotkey">
                      {#each hotkey.modifiers as modifier}
                        {#if modifier == 'Mod'}
                          {'Ctrl'} + {' '}
                        {:else}
                          {modifier} + {' '}
                        {/if}
                      {/each}
                      {#if hotkey.key.length > 1}
                        {hotkey.key}
                      {:else}
                        {hotkey.key.toUpperCase()}
                      {/if}
                    </span>
                  {:else if hotkey.key.length > 1}
                    {hotkey.key}
                  {:else}
                    {hotkey.key.toUpperCase()}
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .keyboard_svg_wrapper {
    width: 100%;
    height: auto;
  }

  .KB-view > .hotkey-setting-container {
    display: flex;
    overflow: visible;
    flex-direction: column;
    padding-bottom: 60px;
  }

  .search-results {
    color: var(--text-muted);
    padding: 0px 20px 20px 0px;
    /* border-bottom: 1px solid var(--background-modifier-border) !important; */
  }

  /* .KB-view > .setting-item {
    display: flex;
    align-items: center;
    padding: 12px 0 12px 0;
    border-top: 1px solid var(--background-modifier-border);
  } */

  .kbanalizer-setting-item {
    display: flex;
    align-items: center;
    border-top: 1px solid var(--background-modifier-border);
    padding: 18px 0px 18px 0px;
  }

  .kbanalizer-setting-item-control {
    flex: 1 0 auto !important;
    flex-shrink: 0 !important;
  }

  .KB-view > .setting-command-hotkeys {
    flex-shrink: 0 !important;
    flex: 1 0 auto !important;
  }

  .kbanalizer-setting-hotkey {
    min-height: 24px !important;
    position: relative;
    font-size: 12px;
    background-color: var(--background-secondary-alt);
    border-radius: 4px;
    padding: 4px 10px;
    min-height: 24px;
    align-self: flex-end;
    position: relative;
  }

  .KB-view > .hotkey-list-container {
    padding-right: 0px !important;
  }
</style>
