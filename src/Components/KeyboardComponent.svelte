<script lang="ts">
  // EXTERNAL
  import type { App, Hotkey, Command, Modifier } from 'obsidian'
  import { Scope } from 'obsidian'
  import { watchResize } from 'svelte-watch-resize'
  import { onMount, onDestroy } from 'svelte'
  import { get } from 'svelte/store'

  // TYPES
  import type ShortcutsView from 'src/ShortcutsView'
  import type KeyboardAnalizerPlugin from 'src/main'
  import type {
    PluginSettings,
    Keyboard,
    hotkeyDict,
    commandEntry,
    commandsArray,
    hotkeyEntry,
  } from 'src/Interfaces'

  // UTILS
  import {
    getHotkeysV2,
    getConvertedModifiers,
    sortModifiers,
  } from 'src/AppShortcuts'

  // STORE
  import { activeKey, activeModifiers } from './activeKeysStore'

  // CONSTANTS
  import {
    mainSectionQwerty,
    keyboardOther,
    keyboardNum,
    SpecialSymbols,
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

  // Implements Cmd+F functionality for focus on input field
  // thanks to @Fevol - https://discord.com/channels/686053708261228577/840286264964022302/1005131941240115221
  const view_scope = new Scope(app.scope)
  view_scope.register(['Mod'], 'f', (e) => {
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

  let KeyboardObject: Keyboard = [kbLayout_main, kbLayout_other, kbLayout_num] // kbLayout_num //Keyboard
  let KeyboardStateDict: any

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

  // 2. sort commands array - DEPRECATED
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
    refreshCommandsList()
    let filteredCmds: commandsArray = []

    // function to filter commands by search string
    function filterByName(command: commandEntry) {
      let CommandName =
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
          CommandName.includes(word) ||
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
    function filterByModifiers(
      command: commandEntry,
      activeModifiers: string[],
      strictHotkeyChecker: boolean
    ) {
      if (strictHotkeyChecker === false) {
        return command.hotkeys.some((hotkey) => {
          return activeModifiers.every((modifier) => {
            return getConvertedModifiers(hotkey.modifiers).includes(modifier)
          })
        })
      } else if (strictHotkeyChecker === true) {
        command.hotkeys = command.hotkeys.filter((hotkey) => {
          if (
            hotkey.modifiers.length === activeModifiers.length &&
            activeModifiers.every((modifier) => {
              return getConvertedModifiers(hotkey.modifiers).includes(modifier)
            })
          ) {
            return true
          }
        })

        return command.hotkeys.every((hotkey) => {
          return activeModifiers.every((modifier) => {
            return getConvertedModifiers(hotkey.modifiers).includes(modifier)
          })
        })
      }
    }

    // filter commands by activeSearchModifiers
    function filterByKey(command: commandEntry) {
      return command.hotkeys.some((hotkey) => {
        return hotkey.key.toLocaleLowerCase() === $activeKey.toLocaleLowerCase()
      })
    }

    function strictHotkeyChecker(
      hotkey: hotkeyEntry,
      activeModifiers: string[]
    ) {
      if (
        hotkey.modifiers.length === activeModifiers.length &&
        activeModifiers.every((modifier) => {
          return getConvertedModifiers(hotkey.modifiers).includes(modifier)
        })
      ) {
        return hotkey
      }
    }

    filteredCmds = cmds
      .filter((command) => {
        return (
          filterByName(command) &&
          (activeSearchModifiers.length === 0 ||
            filterByModifiers(
              command,
              activeSearchModifiers,
              settings.filterSettings.StrictSearch
            )) &&
          (activeSearchKey === '' || filterByKey(command))
        )
      })
      .sort((a: commandEntry, b: commandEntry) => {
        return a.pluginName.localeCompare(b.pluginName)
      })
      .filter((command) => command.hotkeys.length > 0)

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
    $activeModifiers,
    $activeKey
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
    triggerRenderCommands()
  }

  function handleDuplicateHotkeyClicked(event: CustomEvent) {
    let duplicativeHotkey: Hotkey = event.detail
    let duplicativeModifiers: string[] = getConvertedModifiers(
      duplicativeHotkey.modifiers
    )
    let duplicativeKey: string = duplicativeHotkey.key

    // check if modifiers and key already active search then remove them
    if (
      $activeModifiers.every((modifier: string) => {
        return duplicativeModifiers.includes(modifier)
      }) &&
      $activeKey.toLocaleLowerCase() === duplicativeKey.toLocaleLowerCase()
    ) {
      $activeModifiers = []
      $activeKey = ''
    } else {
      $activeModifiers = duplicativeModifiers
      $activeKey = duplicativeKey
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
    refreshCommandsList()
  }

  // COUNTERS
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
  }}
  on:mouseleave={() => {
    app.keymap.popScope(view_scope)
  }}
>
  <div class="" id="keyboard-preview-view">
    <KeyboardLayout
      bind:KeyboardObject
      bind:KeyboardStateDict
      bind:visibleCommands
    />
  </div>
  <div class="shortcuts-wrapper">
    <!-- <code> {viewMode} :: {viewWidth}</code> -->
    <SearchMenu
      bind:inputHTML={input}
      bind:search
      bind:searchCommandsCount
      bind:searchHotkeysCount
      bind:keyboardListenerIsActive
      bind:FilterSettings={settings.filterSettings}
      bind:plugin
      on:featured-first-option-triggered={handleFeaturedFirstOptionClicked}
      on:refresh-commands={handleRefreshClicked}
    />

    <CommandsList
      bind:visibleCommands
      bind:settings
      {app}
      on:star-clicked={handleStarIconClicked}
      on:duplicate-hotkey-clicked={handleDuplicateHotkeyClicked}
      on:plugin-name-clicked={handlePluginNameClicked}
    />
  </div>
</div>

<style>
</style>
