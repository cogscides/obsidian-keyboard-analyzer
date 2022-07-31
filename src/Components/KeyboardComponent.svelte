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
    allHotkeys,
  } from 'src/Interfaces'
  // funcs
  import { getHotkeysV2 } from 'src/AppShortcuts'
  import { getSortedModifiers } from 'src/Utility'
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

  let cmds2: any = getHotkeysV2(app)
  // hotkeys fetched from inside the keyboard component -> move to view
  // console.log(cmds2)

  // convert cmds2 to sorted list of command objects
  let cmds: any[] = []
  for (let cmd of Object.keys(cmds2)) {
    cmds.push({
      name: cmd,
      hotkeys: cmds2[cmd],
      // description: cmd.description,
      // shortcut: cmd.shortcut,
      // category: cmd.category,
      // hidden: cmd.hidden,
    })
  }

  // sort commands by name
  cmds.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })

  // sort command hotkeys with sortModifiers()
  for (let entry of cmds) {
    for (let hotkey of entry.hotkeys) {
      hotkey.modifiers = getSortedModifiers(hotkey.modifiers).join(',')
    }
  }

  // get the command name from the hotkey usind app.commands.commands
  function getCommandNameById(id: string) {
    let cmd = app.commands.commands[id]
    if (cmd) {
      return cmd.name
    }
    return ''
  }

  // check if hotkey is Customized
  // if reassigned return true
  // https://forum.obsidian.md/t/dataviewjs-snippet-showcase/17847/37
  let customKeys = app.hotkeyManager.customKeys
  function isCustomHotkey(name: string, hotkey: Hotkey) {
    let customHotkey = customKeys[name]
    if (customHotkey) {
      for (let i = 0; i < customHotkey.length; i++) {
        if (
          customHotkey[i].key === hotkey.key &&
          customHotkey[i].modifiers === hotkey.modifiers
        ) {
          return true
        }
      }
    }
  }

  // console.log(cmds)
  console.log('customKeys', customKeys)

  // amount of hotkeys for all commands
  let hotkeysCount = 0
  for (let cmd of cmds) {
    hotkeysCount += cmd.hotkeys.length
  }

  // get a list of all hotkeys

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
          {hotkeysCount} hotkeys in {cmds.length} commands.
        </div>
        <div class="kb-analizer-hotkey-list-container">
          {#each cmds as entry}
            <div class="kbanalizer-setting-item">
              <div class="setting-item-info">
                <div class="setting-item-name">
                  {getCommandNameById(entry.name)}
                </div>
                <small>{entry.name}</small>
              </div>
              <div class="kbanalizer-setting-item-control">
                <div class="setting-command-hotkeys">
                  {#each entry.hotkeys as hotkey}
                    <span class="kbanalizer-setting-hotkey">
                      {hotkey.modifiers
                        ? hotkey.modifiers.split(',').join('+') + '+'
                        : ''}{hotkey.key in SpecialSymbols
                        ? SpecialSymbols[hotkey.key]
                        : hotkey.key}
                      {#if isCustomHotkey(entry.name, hotkey)}
                        <span class="default-hotkey"
                          ><small>default</small></span
                        >
                      {/if}
                    </span>
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
