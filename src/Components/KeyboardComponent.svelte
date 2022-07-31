<script lang="ts">
  import type { App, Hotkey, Command } from 'obsidian'
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    KeyboardAnalizerSettings,
    KeyboardInterface,
    allHotkeys,
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

  let cmds2: allHotkeys = getHotkeysV2(app)
  // hotkeys fetched from inside the keyboard component -> move to view
  // console.log(cmds2)

  // let cmdsSorted = cmds2.map((name, i) => [name, cmds2[i]]).sort()
  // console.log(cmdsSorted)

  // convert hotkeys object cmds2 to array of objects with name and assigned hotkey
  let hotkeysList: any = [
    ...Object.keys(cmds2).map((name) => {
      return {
        name,
        ...cmds2[name],
      }
    }),
  ]

  // track resize and assign device classes to each width
  function handleResize() {
    // check screen resolution variable "viewWidth" and update state to viewMode
    if (viewWidth >= 1400) {
      viewMode = 'xxl'
    } else if (viewWidth >= 1200 && viewWidth < 1400) {
      viewMode = 'xl'
    } else if (viewWidth >= 992 && viewWidth < 1200) {
      viewMode = 'lg'
    } else if (viewWidth >= 768 && viewWidth < 992) {
      viewMode = 'md'
    } else if (viewWidth >= 576 && viewWidth < 768) {
      viewMode = 'sm'
    } else if (viewWidth < 576) {
      viewMode = 'xs'
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

<div
  id="keyboard-component"
  class={viewMode}
  use:watchResize={handleResize}
  bind:offsetWidth={viewWidth}
>
  <div class="markdown-preview-view" id="keyboard-preview-view">
    <KeyboardLayout
      bind:keyboardObj_qwerty
      bind:keyboardObj_other
      bind:keyboardObj_num
      screenState={viewMode}
    />
    <div
      id="hotkeys-wrapper"
      class="markdown-preview-sizer markdown-preview-section"
    >
      <h1>Hello Maaaan 123!</h1>
      <code
        >viewWidth: {viewWidth}<br />
        viewClass: {viewMode}</code
      >

      <!-- <button on:click={handlePickKey}>test me</button> -->

      <!-- <KeyboardLayout {app} /> -->
      <!-- <KeyboardLayout bind:keyboardKeys={keyboardString} /> -->

      <div class="hotkey-settings-container">
        <div class="hotkey-search-container">
          <input type="text" placeholder="Filter..." />
        </div>
        <div class="search-results">
          Found {hotkeysList.length} assigned hotkeys
        </div>
        <div class="kb-analizer-hotkey-list-container">
          {#each hotkeysList as hotkey, i}
            <div class="kbanalizer-setting-item">
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {i + 1}
                  {hotkey.name}
                  {#if hotkeysList[hotkey.name] == typeof Array}
                    {#each hotkeysList[hotkey.name] as modifiers}
                      {modifiers}
                    {/each}
                  {:else}
                    {hotkey.key} - {hotkey.modifiers}
                  {/if}
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
  #hotkeys-wrapper {
    background-color: black;
  }
</style>
