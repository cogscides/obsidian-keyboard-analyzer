<script lang="ts">
  // ext
  import type { App, Hotkey, Command } from 'obsidian'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount } from 'svelte'
  // @ts-ignore
  import { hotkeys } from 'svelte-hotkeys'

  // types
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    KeyboardAnalizerSettings,
    KeyboardInterface,
    hotkeyDict,
    commandEntry,
    commandsArray,
  } from 'src/Interfaces'
  // funcs
  import {
    getHotkeysV2,
    getCommandNameById,
    getConvertedModifiers,
    sortModifiers,
    isCustomizedHotkey,
  } from 'src/AppShortcuts'
  // Constants
  import {
    kbWinNum,
    kb_layout_ansi104eng,
    keyboard_svelte,
    keyboard_svelte_num,
    keyboard_svelte_other,
    SpecialSymbols,
  } from 'src/Constants'
  // layout
  import KeyboardLayout from './KeyboardLayout.svelte'
  import CommandsList from './CommandsList.svelte'

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

  // init hotkeys
  let commands: hotkeyDict = getHotkeysV2(app)

  // init commands
  let commandsArray: commandsArray = Object.keys(commands).map(
    (key: string) => commands[key]
  )

  let search: string = undefined

  $: visibleCommands = search
    ? commandsArray.filter((command) => {
        return (
          command.cmdName.toLowerCase().includes(search.toLowerCase()) ||
          command.pluginName
            .toLocaleLowerCase()
            .includes(search.toLowerCase()) ||
          command.hotkeys.some((hotkey) => {
            return (
              (hotkey.modifiers.length !== 0 &&
                hotkey.backedModifiers
                  .toLocaleLowerCase()
                  .includes(search.toLowerCase())) ||
              hotkey.key.toLocaleLowerCase().includes(search.toLowerCase())
            )
          })
        )
      })
    : sortCommandsArrayByName(commandsArray)

  // on click clear button clear search
  const ClearSearch = () => {
    search = ''
  }

  // function to trigger sort commands by name, alphabetically
  function sortCommandsArrayByName(
    cmds: commandsArray,
    type: string = 'name',
    order: string = 'asc'
  ) {
    let sortedCmds: commandsArray = []

    // sort commands by name when type is name
    if (type === 'name') {
      sortedCmds = cmds.sort((a: commandEntry, b: commandEntry) => {
        if (order === 'asc') {
          return a.pluginName.localeCompare(b.pluginName)
        } else {
          return b.pluginName.localeCompare(a.pluginName)
        }
      })
    }

    // console.log(sortedCmds)
    return sortedCmds
  }

  // handle component events
  function handlePluginNameClicked(event: CustomEvent) {
    let pluginName: string = event.detail
    if (search === '' || search === undefined) {
      search = pluginName
    } else if (search.startsWith(pluginName)) {
      search = search.replace(pluginName, '')
    } else {
      search = pluginName + search
    }
  }

  // ###############################################################################
  // #COUNTERS
  let commandsCount: number = 0
  let allHotkeysCount: number = 0

  // function to update amount of hotkeys for all commands
  function updateCommandsCount() {
    commandsCount = Object.keys(commands).length
  }

  // function to count hotkeys for all commands
  function countHotkeys() {
    allHotkeysCount = 0
    for (let key of Object.keys(commands)) {
      allHotkeysCount += commands[key].hotkeys.length
    }
  }

  updateCommandsCount()
  countHotkeys()

  // ###############################################################################
  // #Resize
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
  class="{viewMode} {viewMode === 'xs' ? 'is-mobile' : ''}"
  use:watchResize={handleResize}
  bind:offsetWidth={viewWidth}
  use:hotkeys={{
    keys: 'ctrl+f',
    handler: () => {
      search = ''
    },
  }}
>
  <div class="markdown-preview-view" id="keyboard-preview-view">
    <!-- <KeyboardLayout
      bind:keyboardObj_qwerty
      bind:keyboardObj_other
      bind:keyboardObj_num
      screenState={viewMode}
    /> -->
    <div class="hotkey-settings-container">
      <code>
        viewWidth: {viewWidth}<br />
        viewClass: {viewMode}</code
      >
      <div class="hotkey-search-container">
        <input type="text" placeholder="Filter..." bind:value={search} />
        <div class="search-input-clear-button" on:click={ClearSearch} />
      </div>
      <div class="search-results community-plugin-search-summary u-muted">
        {allHotkeysCount} hotkeys in {commandsCount} commands.
      </div>
    </div>

    <CommandsList
      bind:visibleCommands
      on:pluginNameClicked={handlePluginNameClicked}
    />
  </div>
</div>

<style>
</style>
