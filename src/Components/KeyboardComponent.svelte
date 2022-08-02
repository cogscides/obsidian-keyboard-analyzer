<script lang="ts">
  // ext
  import type { App, Hotkey, Command } from 'obsidian'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount } from 'svelte'
  // types
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    KeyboardAnalizerSettings,
    KeyboardInterface,
    hotkeyDict,
  } from 'src/Interfaces'
  // funcs
  import {
    getHotkeysV2,
    getCommandNameById,
    getConvertedModifiers,
    sortModifiers,
    prepareModifiersString,
    isCustomizedHotkey,
  } from 'src/AppShortcuts'
  // layout
  import KeyboardLayout from './KeyboardLayout.svelte'
  import {
    kbWinNum,
    kb_layout_ansi104eng,
    keyboard_svelte,
    keyboard_svelte_num,
    keyboard_svelte_other,
    SpecialSymbols,
  } from 'src/Constants'

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

  let commands: hotkeyDict = getHotkeysV2(app)
  $: visibleCommands = sortCommandsArrayByName(commands)

  // hotkeys fetched from inside the keyboard component -> move to view
  // console.log(cmds2)

  // convert cmds2 to sorted list of command objects
  // let cmds: any[] = []
  // for (let cmd of Object.keys(cmds2)) {
  //   cmds.push({
  //     name: cmd,
  //     hotkeys: cmds2[cmd],
  //     // description: cmd.description,
  //     // shortcut: cmd.shortcut,

  //     // hidden: cmd.hidden,
  //   })
  // }

  // function to trigger sort commands by name, alphabetically
  function sortCommandsArrayByName(cmds: hotkeyDict) {
    let sortedCmds: hotkeyDict = {}
    let cmdsNames: string[] = Object.keys(cmds)
    cmdsNames.sort()
    for (let cmdName of cmdsNames) {
      sortedCmds[cmdName] = cmds[cmdName]
    }
    return sortedCmds
  }

  // amount of commands
  let commandsCount: number = 0

  // function to update amount of hotkeys for all commands
  function updateCommandsCount() {
    commandsCount = Object.keys(commands).length
  }
  updateCommandsCount()

  let allHotkeysCount: number = 0
  // function to count hotkeys for all commands
  function countHotkeys() {
    allHotkeysCount = 0
    for (let command of Object.keys(commands)) {
      allHotkeysCount += commands[command].length
    }
  }
  countHotkeys()

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

  // search
  // https://svelte.dev/repl/0429bd69748e44cdaeb8074c982f967d?version=3.41.0

  // const handlePickKey = (value: any) => {
  //   console.log(value)
  // }

  $: props = {
    app,
    plugin,
    settings,
    view,
    commands,
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
      class="markdown-preview-sizer markdown-preview-section hotkey-settings-container"
    >
      <h1>Hello Maaaan 123!</h1>
      <code>
        viewWidth: {viewWidth}<br />
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
          {allHotkeysCount} hotkeys in {commandsCount} commands.
        </div>
        <div class="hotkey-list-container">
          {#each Object.keys(visibleCommands) as key, index}
            <div class="kbanalizer-setting-item setting-item">
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {getCommandNameById(key, app)}
                </div>
                <small>{key}</small>
              </div>
              <div class="kbanalizer-setting-item-control setting-item-control">
                <div class="setting-command-hotkeys">
                  {#each commands[key] as hotkey}
                    <span class="kbanalizer-setting-hotkey setting-hotkey">
                      {prepareModifiersString(hotkey.modifiers)}{hotkey.key in
                      SpecialSymbols
                        ? SpecialSymbols[hotkey.key]
                        : hotkey.key.length === 1
                        ? hotkey.key.toUpperCase()
                        : hotkey.key}
                      {isCustomizedHotkey(key, hotkey, app) ? '*' : ''}
                    </span>
                    <!-- {#if isCustomHotkey(entry.name, hotkey)} -->
                    <!-- <span
                        class="custom-hotkey"
                        style="background-color: red;"
                      >
                        ><small>default</small></span
                      >
                    {/if} -->
                  {/each}
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
</style>
