<script lang="ts">
  import type { App, Hotkey, Command } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    KeyboardAnalizerSettings,
    KeyboardInterface,
  } from 'src/Interfaces'
  import { watchResize } from 'svelte-watch-resize'
  import KeyboardLayout from './KeyboardLayout.svelte'
  import { getHotkeysV2 } from 'src/AppShortcuts'
  import {
    kbWinNum,
    kb_layout_ansi104eng,
    keyboard_svelte,
    keyboard_svelte_num,
    keyboard_svelte_other,
  } from 'src/Constants'
  import { onMount } from 'svelte'

  // obsidian init
  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: KeyboardAnalizerSettings
  export let view: ShortcutsView
  let viewWidth: number
  let viewMode: string = 'desktop'

  // instance of Keyboard
  let keyboardObj_qwerty = keyboard_svelte
  let keyboardObj_num = keyboard_svelte_num
  let keyboardObj_other = keyboard_svelte_other

  // receive hotkeys
  // let cmds = getCommands(app)
  let cmds2: Hotkey[] = getHotkeysV2(app)
  // console.log(app.hotkeyManager)

  // let cmdsSorted = cmds2.map((name, i) => [name, cmds2[i]]).sort()
  // console.log(cmdsSorted)

  function handleLeftResize(node: any) {
    // check screen resolution variable "viewWidth" and update state to viewMode
    if (viewWidth < 768) {
      viewMode = 'mobile'
    } else if (viewWidth >= 768 && viewWidth < 1280) {
      viewMode = 'laptop'
    } else if (viewWidth >= 1281) {
      viewMode = 'desktop'
    }
  }

  // const handlePickKey = (value: any) => {
  //   console.log(value)
  // }

  $: props = {
    app,
    plugin,
    settings,
    view,
    cmds2,
  }
</script>

<div id="keyboard-component" style="width: 100%; height:100%;" class={viewMode}>
  <div
    class="markdown-preview-view is-readable-line-width"
    id="keyboard-preview-view"
    bind:offsetWidth={viewWidth}
    use:watchResize={handleLeftResize}
  >
    <KeyboardLayout
      bind:keyboardObj_qwerty
      bind:keyboardObj_other
      bind:keyboardObj_num
      screenState={viewMode}
    />
    <div class="markdown-preview-sizer markdown-preview-section">
      <h1>Hello Maaaan 123!</h1>
      <code
        >viewWidth: {viewWidth}<br />
        {#if viewWidth >= 1281}
          viewClass: desktop
        {:else if viewWidth < 1280 && viewWidth >= 769}
          viewClass: laptop
        {:else if viewWidth < 768}
          viewClass: mobile
        {/if}</code
      >

      <!-- <button on:click={handlePickKey}>test me</button> -->

      <!-- <KeyboardLayout {app} /> -->
      <!-- <KeyboardLayout bind:keyboardKeys={keyboardString} /> -->

      <div class="hotkey-settings-container">
        <div class="hotkey-search-container">
          <input type="text" placeholder="Filter..." />
        </div>
        <div class="search-results">
          Found {Object.keys(cmds2).length} assigned hotkeys
        </div>
        {#each cmds2 as hotkey, key}
          hotkey
        {/each}
        <div class="kb-analizer-hotkey-list-container">
          {#each cmds2 as hotkey}
            <div class="kbanalizer-setting-item">
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {hotkey}
                  something
                </div>
              </div>
              <!-- <div class="kbanalizer-setting-item-control">
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
              </div> -->
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .keyboard-wrapper {
    max-width: 700px;
  }

  #KB-view {
    padding: 0px !important;
  }

  .KB-view > .hotkey-setting-container {
    display: flex;
    overflow: visible;
    flex-direction: column;
    padding-bottom: 60px;
  }

  #keyboard-preview-view {
    overflow-x: hidden;
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

  .kb-analizer-hotkey-list-container {
    padding-right: 0px !important;
  }
</style>
