<script lang="ts">
  // EXTERNAL
  import type { App, Hotkey, Command, Modifier } from 'obsidian'
  import { Scope } from 'obsidian'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount, onDestroy } from 'svelte'

  // TYPES
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    KeyboardAnalizerSettings,
    KeyboardInterface,
    hotkeyDict,
    commandEntry,
    commandsArray,
  } from 'src/Interfaces'

  // UTILS
  import {
    getHotkeysV2,
    getConvertedModifiers,
    sortModifiers,
  } from 'src/AppShortcuts'

  // CONSTANTS
  import {
    kbWinNum,
    kb_layout_ansi104eng,
    keyboard_svelte,
    keyboard_svelte_num,
    keyboard_svelte_other,
    SpecialSymbols,
  } from 'src/Constants'

  // LAYOUT
  import KeyboardLayout from './KeyboardLayout.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'

  // INITIALIZE PROPERTIES
  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: KeyboardAnalizerSettings
  export let view: ShortcutsView
  let viewWidth: number
  let viewMode: string = 'desktop'

  // INITIALIZE SEARCH MENU
  let search: string
  let input: HTMLInputElement
  let activeSearchModifiers: string[]

  // Implements Cmd+F functionality for focus on input field
  // thanks to @Fevol - https://discord.com/channels/686053708261228577/840286264964022302/1005131941240115221
  const view_scope = new Scope(app.scope)
  view_scope.register(['Mod'], 'f', (e) => {
    if (e.ctrlKey && e.key === 'f') {
      console.log('ctrl + f pressed in scope')
      input.focus()
      return false
    }
  })

  // INITIALIZE KEYBOARD LAYOUT
  let keyboardComponentHTML: HTMLElement

  let keyboardObj_qwerty = keyboard_svelte
  let keyboardObj_num = keyboard_svelte_num
  let keyboardObj_other = keyboard_svelte_other

  // COMMANDS LIST
  let commands: hotkeyDict = getHotkeysV2(app)

  // 0. prepare commands array from commands object
  let commandsArray: commandsArray = Object.keys(commands).map(
    (key: string) => commands[key]
  )

  // 1. refresh commands array
  function refreshCommandsList() {
    commands = getHotkeysV2(app)
    commandsArray = Object.keys(commands).map((key: string) => commands[key])
  }

  // 2. sort commands array
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

  // filter commands array by search string
  function filterCommandsArray(
    cmds: commandsArray,
    search: string,
    type: string = 'name'
  ) {
    let filteredCmds: commandsArray = []

    // filter commands by name when type is name
    if (type === 'name') {
      filteredCmds = cmds.filter((command) => {
        let fullName =
          command.pluginName.toLocaleLowerCase() +
          ' ' +
          command.cmdName.toLowerCase()

        // get array of search words and search in fullName
        let searchWords = search
          .toLocaleLowerCase()
          .split(' ')
          .filter((word) => word.length > 0)

        // return true if all search word are in fullName, hotkeys or key
        return searchWords.every((word) => {
          return (
            fullName.includes(word) ||
            command.hotkeys.some((hotkey) => {
              return (
                hotkey.key.toLocaleLowerCase().includes(word) ||
                getConvertedModifiers(hotkey.modifiers).some((modifier) =>
                  modifier.toLocaleLowerCase().includes(word)
                )
              )
            })
          )
        })
      })
    }

    // console.log(filteredCmds)
    return filteredCmds
  }

  // REACTIVE PROPERTIES
  $: visibleCommands = search
    ? filterCommandsArray(commandsArray, search)
    : sortCommandsArrayByName(commandsArray)

  // HANDLE COMPONENT EVENTS

  // 1. if plugin name clicked inside commands list
  function handlePluginNameClicked(event: CustomEvent) {
    let pluginName: string = event.detail
    if (search === '' || search === undefined) {
      // scroll to input field
      input.focus()
      search = pluginName
    } else if (search.startsWith(pluginName)) {
      search = search.replace(pluginName, '')
    } else {
      search = pluginName + search
    }
  }

  // 2. if refresh button is clicked
  function handleRefreshClicked() {
    console.log('RefreshCommands received')

    refreshCommandsList()
  }

  // COUNTERS
  // let allCommandsCount: number
  // let allHotkeysCount: number
  $: searchCommandsCount = updateCommandsCount(visibleCommands)
  $: searchHotkeysCount = countHotkeys(visibleCommands)

  // function to update amount of hotkeys for all commands
  function updateCommandsCount(array: commandsArray) {
    let commandsCount: number
    return (commandsCount = array.length)
  }

  // function to count hotkeys for all commands
  function countHotkeys(array: commandsArray) {
    let hotkeysCount: number = 0
    for (let command of array) {
      hotkeysCount += command.hotkeys.length
    }
    return hotkeysCount
  }

  // track resize and assign device classes to each width
  function handleResize() {
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

  onMount(() => {
    input.focus()
  })

  onDestroy(() => {
    app.keymap.popScope(view_scope)
  })

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
  bind:this={keyboardComponentHTML}
  on:mouseenter={() => app.keymap.pushScope(view_scope)}
  on:mouseleave={() => {
    // console.log('mouseleave')
    app.keymap.popScope(view_scope)
  }}
>
  <!-- markdown-preview-view -->
  <div class="" id="keyboard-preview-view">
    <!-- <KeyboardLayout
      bind:keyboardObj_qwerty
      bind:keyboardObj_other
      bind:keyboardObj_num
      screenState={viewMode}
    /> -->
    <div class="shortcuts-wrapper">
      <code> {viewMode} :: {viewWidth}</code>
      <SearchMenu
        bind:inputHTML={input}
        bind:search
        bind:searchCommandsCount
        bind:searchHotkeysCount
        bind:activeSearchModifiers
        on:refresh-commands={handleRefreshClicked}
      />

      <CommandsList
        bind:visibleCommands
        on:plugin-name-clicked={handlePluginNameClicked}
      />
    </div>
  </div>
</div>

<style>
</style>
