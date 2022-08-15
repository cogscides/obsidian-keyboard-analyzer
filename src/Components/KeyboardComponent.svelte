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
    PluginSettings,
    Keyboard,
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
    mainSectionQwerty,
    keyboardOther,
    keyboardNum,
    SpecialSymbols,
    DEFAULT_FILTER_SETTINGS,
  } from 'src/Constants'

  // LAYOUT
  import KeyboardLayout from './KeyboardLayout.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'

  // INITIALIZE PROPERTIES
  export let app: App
  export let plugin: KeyboardAnalizerPlugin
  export let settings: PluginSettings
  export let view: ShortcutsView
  let viewWidth: number
  let viewMode: string = 'desktop'

  // INITIALIZE SEARCH MENU
  let search: string = ''
  let input: HTMLInputElement
  let keyboardListenerIsActive: boolean = false
  let activeSearchModifiers: string[] = []
  let activeSearchKey: string = ''

  // Implements Cmd+F functionality for focus on input field
  // thanks to @Fevol - https://discord.com/channels/686053708261228577/840286264964022302/1005131941240115221
  const view_scope = new Scope(app.scope)
  view_scope.register(['Mod'], 'f', (e) => {
    console.log('ctrl + f pressed in scope')
    console.log(document.activeElement)
    if (e.ctrlKey && e.key === 'f') {
      if (
        input === document.activeElement &&
        keyboardListenerIsActive === false
      ) {
        keyboardListenerIsActive = true
      } else if (
        input === document.activeElement &&
        keyboardListenerIsActive === true
      ) {
        keyboardListenerIsActive = false
      } else {
        input.focus()
      }
      return false
    }
  })

  let kbLayout_main = mainSectionQwerty
  let kbLayout_other = keyboardOther
  let kbLayout_num = keyboardNum

  let KeyboardObject: Keyboard = [kbLayout_main, kbLayout_other, kbLayout_num] // Keyboard

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

  function triggerRenderCommands() {
    visibleCommands = visibleCommands
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

  // sort commands by featured commands first
  function sortByFeaturedFirst(cmds: commandsArray, featured: string[]) {
    let sortedCmds: commandsArray = []
    let featuredCmds: commandsArray = []
    let otherCmds: commandsArray = []

    // sort commands by name when type is name
    cmds.forEach((cmd: commandEntry) => {
      if (featured.includes(cmd.id)) {
        featuredCmds.push(cmd)
      } else {
        otherCmds.push(cmd)
      }
    }),
      (sortedCmds = featuredCmds.concat(otherCmds))
    return sortedCmds
  }

  // filter commands array by search string
  function filterCommandsArray(
    cmds: commandsArray,
    search: string,
    activeSearchModifiers: string[],
    activeSearchKey: string
  ) {
    let filteredCmds: commandsArray = []

    // function to filter commands by search string
    function filterByName(command: commandEntry) {
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
    }

    // filter commands by activeSearchModifiers
    // if no activeSearchModifiers, filter by all commands
    function filterByModifiers(command: commandEntry) {
      return command.hotkeys.some((hotkey) => {
        return activeSearchModifiers.every((modifier) => {
          return getConvertedModifiers(hotkey.modifiers).includes(modifier)
        })
      })
    }

    // filter commands by activeSearchModifiers
    function filterByKey(command: commandEntry) {
      return command.hotkeys.some((hotkey) => {
        return (
          hotkey.key.toLocaleLowerCase() === activeSearchKey.toLocaleLowerCase()
        )
      })
    }

    // filter commands by activeSearchKey
    // if (activeSearchKey !== '') {

    filteredCmds = cmds
      .filter((command) => {
        return (
          filterByName(command) &&
          (activeSearchModifiers.length === 0 || filterByModifiers(command)) &&
          (activeSearchKey === '' || filterByKey(command))
        )
      })
      .sort((a: commandEntry, b: commandEntry) => {
        return a.pluginName.localeCompare(b.pluginName)
      })

    // console.log(filteredCmds)
    // sortCommandsArrayByName(filteredCmds)

    if (settings.filterSettings.FeaturedFirst) {
      filteredCmds = sortByFeaturedFirst(
        filteredCmds,
        settings.featuredCommandIDs
      )
    }

    return filteredCmds
  }

  // REACTIVE PROPERTIES
  $: visibleCommands = filterCommandsArray(
    commandsArray,
    search,
    activeSearchModifiers,
    activeSearchKey
  )

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

  function handleFeaturedFirstOptionClicked(event: CustomEvent) {
    settings.filterSettings.FeaturedFirst =
      !settings.filterSettings.FeaturedFirst
    plugin.saveSettings()
    // settings.filterSettings.FeaturedFirst is triggered
    triggerRenderCommands()
  }

  function handleDuplicateHotkeyClicked(event: CustomEvent) {
    let listedHotkey: Hotkey = event.detail
    let listedModifiers: string[] = getConvertedModifiers(
      listedHotkey.modifiers
    )

    // check if modifiers and ket already active search then remove them
    if (
      activeSearchModifiers.every((modifier: string) => {
        return listedModifiers.includes(modifier)
      }) &&
      activeSearchKey.toLocaleLowerCase() ===
        listedHotkey.key.toLocaleLowerCase()
    ) {
      activeSearchModifiers = []
      activeSearchKey = ''
    } else {
      // add modifiers and key to active search
      activeSearchModifiers = listedModifiers
      activeSearchKey = listedHotkey.key
      search = ''
    }
  }

  function handleStarIconClicked(event: CustomEvent) {
    let pluginName: string = event.detail

    if (settings.featuredCommandIDs.includes(pluginName)) {
      settings.featuredCommandIDs = settings.featuredCommandIDs.filter(
        (id: string) => id !== pluginName
      )
      plugin.saveSettings()
    } else {
      // add pluginName to settings.featuredCommandIDs
      settings.featuredCommandIDs.push(pluginName)
      settings = settings
      plugin.saveSettings()
    }
    triggerRenderCommands()
  }

  // 2. if refresh button is clicked
  function handleRefreshClicked() {
    // console.log('RefreshCommands received')

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
  on:mouseenter={() => {
    app.keymap.pushScope(view_scope)
    console.log('mouseenter:', app.keymap)
  }}
  on:mouseleave={() => {
    app.keymap.popScope(view_scope)
  }}
>
  <div class="" id="keyboard-preview-view">
    <KeyboardLayout bind:KeyboardObject />
  </div>
  <div class="shortcuts-wrapper">
    <code> {viewMode} :: {viewWidth}</code>
    <SearchMenu
      bind:inputHTML={input}
      bind:search
      bind:searchCommandsCount
      bind:searchHotkeysCount
      bind:activeSearchModifiers
      bind:activeSearchKey
      bind:keyboardListenerIsActive
      bind:FilterSettings={settings.filterSettings}
      bind:plugin
      on:featured-first-option-triggered={handleFeaturedFirstOptionClicked}
      on:refresh-commands={handleRefreshClicked}
    />

    <CommandsList
      bind:visibleCommands
      bind:settings
      on:star-clicked={handleStarIconClicked}
      on:duplicate-hotkey-clicked={handleDuplicateHotkeyClicked}
      on:plugin-name-clicked={handlePluginNameClicked}
    />
  </div>
</div>

<style>
</style>
