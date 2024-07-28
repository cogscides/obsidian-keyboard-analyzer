<script lang="ts">
  import type { App, Hotkey, Command, Modifier } from 'obsidian'
  import { Scope } from 'obsidian'
  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'
  import type {
    Keyboard,
    hotkeyDict,
    commandEntry,
    commandsArray,
  } from '../interfaces/Interfaces'
  import { getHotkeysV2 } from '../utils/hotkeyUtils'
  import { getConvertedModifiers } from '../utils/modifierUtils'
  import { mainSectionQwerty, keyboardOther, keyboardNum } from '../Constants'
  import settingsManager from '../managers/settingsManager.svelte'
  import activeKeysStore from '../stores/activeKeysStore.svelte'

  import KeyboardLayout from './KeyboardLayout.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'

  interface Props {
    app: App
    plugin: KeyboardAnalyzerPlugin
    view: ShortcutsView
  }

  let { app, plugin, view }: Props = $props()

  let filterSettings = $derived(plugin.settingsManager.settings.filterSettings)
  let featuredCommandIDs = $derived(
    plugin.settingsManager.settings.featuredCommandIDs
  )
  let viewWidth = $state(0)
  let viewMode = $state('desktop')

  let search = $state('')
  let input: HTMLInputElement | undefined = $state()

  const kbLayout_main = mainSectionQwerty
  const kbLayout_other = keyboardOther
  const kbLayout_num = keyboardNum

  let KeyboardObject: Keyboard = $state([
    kbLayout_main,
    kbLayout_other,
    kbLayout_num,
  ])
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let KeyboardStateDict: Record<string, any> = $state({})
  let keyboardListenerIsActive = $state(false)

  const view_scope = new Scope(app?.scope)

  view_scope.register(['Mod'], 'f', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'f') {
      if (input === document.activeElement && !keyboardListenerIsActive) {
        keyboardListenerIsActive = true
      } else if (input === document.activeElement && keyboardListenerIsActive) {
        keyboardListenerIsActive = false
      } else {
        input?.focus()
      }
      return false
    }
  })

  let commands = $derived(getHotkeysV2(app))
  let cmdsArray: commandsArray = $derived(Object.values(commands))

  let searchCommandsCount = $state(0)
  let searchHotkeysCount = $state(0)

  function sortByFeaturedFirst(cmds: commandsArray, featured: string[]) {
    const featuredCmds = cmds.filter((cmd) => featured.includes(cmd.id))
    const otherCmds = cmds.filter((cmd) => !featured.includes(cmd.id))
    return [...featuredCmds, ...otherCmds]
  }

  function filterCommandsArray(
    cmds: commandsArray,
    search: string,
    activeSearchModifiers: string[],
    activeSearchKey: string
  ) {
    const filterByName = (command: commandEntry) => {
      const CommandName = `${command.pluginName.toLowerCase()} ${command.cmdName.toLowerCase()}`
      const searchWords = search.toLowerCase().split(' ').filter(Boolean)

      return searchWords.every(
        (word) =>
          CommandName.includes(word) ||
          command.hotkeys.some(
            (hotkey) =>
              hotkey.key.toLowerCase().includes(word) ||
              getConvertedModifiers(hotkey.modifiers || []).some((modifier) =>
                modifier.toLowerCase().includes(word)
              )
          )
      )
    }

    const filterByModifiers = (
      command: commandEntry,
      activeModifiers: string[],
      strictHotkeyChecker: boolean
    ) => {
      if (!strictHotkeyChecker) {
        return command.hotkeys.some((hotkey) =>
          activeModifiers.every((modifier) =>
            getConvertedModifiers(hotkey.modifiers || []).includes(modifier)
          )
        )
      }

      command.hotkeys = command.hotkeys.filter(
        (hotkey) =>
          hotkey.modifiers?.length === activeModifiers.length &&
          activeModifiers.every((modifier) =>
            getConvertedModifiers(hotkey.modifiers || []).includes(modifier)
          )
      )

      return command.hotkeys.length > 0
    }

    const filterByKey = (command: commandEntry) =>
      command.hotkeys.some(
        (hotkey) =>
          hotkey.key.toLowerCase() === activeKeysStore.activeKey.toLowerCase()
      )

    let filteredCmds = cmdsArray
      .filter(
        (command) =>
          filterByName(command) &&
          (activeSearchModifiers.length === 0 ||
            filterByModifiers(
              command,
              activeSearchModifiers,
              filterSettings.StrictSearch ?? false
            )) &&
          (activeSearchKey === '' || filterByKey(command))
      )
      .sort((a, b) => a.pluginName.localeCompare(b.pluginName))
      .filter((command) => command.hotkeys.length > 0)

    if (filterSettings.FeaturedFirst) {
      filteredCmds = sortByFeaturedFirst(filteredCmds, featuredCommandIDs ?? [])
    }

    return filteredCmds
  }

  let visibleCommands = $derived(
    filterCommandsArray(
      cmdsArray,
      search,
      activeKeysStore.activeModifiers,
      activeKeysStore.activeKey
    )
  )

  function handlePluginNameClicked(event: CustomEvent<string>) {
    const pluginName = event.detail
    if (!search) {
      input?.focus()
      search = pluginName
    } else if (search.startsWith(pluginName)) {
      search = search.replace(pluginName, '')
    } else {
      search = pluginName + search
    }
  }

  function handleDuplicateHotkeyClicked(event: CustomEvent<Hotkey>) {
    const duplicativeHotkey = event.detail
    const duplicativeModifiers = getConvertedModifiers(
      duplicativeHotkey.modifiers
    )
    const duplicativeKey = duplicativeHotkey.key

    if (
      activeKeysStore.activeModifiers.every((modifier) =>
        duplicativeModifiers.includes(modifier)
      ) &&
      activeKeysStore.activeKey.toLowerCase() === duplicativeKey.toLowerCase()
    ) {
      activeKeysStore.reset()
    } else {
      activeKeysStore.activeModifiers = duplicativeModifiers
      activeKeysStore.activeKey = duplicativeKey
      search = ''
    }
  }

  function handleStarIconClicked(event: CustomEvent<string>) {
    const pluginName = event.detail
    const featuredCommandIDs =
      plugin.settingsManager.settings.featuredCommandIDs || []

    if (featuredCommandIDs.includes(pluginName)) {
      plugin.settingsManager.updateSettings({
        featuredCommandIDs: featuredCommandIDs.filter(
          (id) => id !== pluginName
        ),
      })
    } else {
      plugin.settingsManager.updateSettings({
        featuredCommandIDs: [...featuredCommandIDs, pluginName],
      })
    }
  }

  $effect(() => {
    searchCommandsCount = visibleCommands.length
    searchHotkeysCount = visibleCommands.reduce(
      (count, command) => count + command.hotkeys.length,
      0
    )
  })

  function handleResize(viewWidth: number) {
    if (viewWidth >= 1400) viewMode = 'xxl'
    else if (viewWidth >= 1200) viewMode = 'xl'
    else if (viewWidth >= 992) viewMode = 'lg'
    else if (viewWidth >= 768) viewMode = 'md'
    else if (viewWidth >= 576) viewMode = 'sm'
    else viewMode = 'xs'
  }

  $effect(() => {
    input?.focus()

    return () => {
      app?.keymap.popScope(view_scope)
    }
  })

  $effect(() => {
    handleResize(viewWidth)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  id="keyboard-component"
  class="{viewMode} {viewMode === 'xs' ? 'is-mobile' : ''}"
  bind:offsetWidth={viewWidth}
  onmouseenter={() => app?.keymap.pushScope(view_scope)}
  onmouseleave={() => app?.keymap.popScope(view_scope)}
>
  <div id="keyboard-preview-view">
    <KeyboardLayout {KeyboardObject} {KeyboardStateDict} {visibleCommands} />
  </div>
  <div class="shortcuts-wrapper">
    <SearchMenu
      bind:inputHTML={input}
      bind:search
      bind:searchCommandsCount={visibleCommands.length}
      bind:searchHotkeysCount
      bind:keyboardListenerIsActive
      bind:plugin
    />
    <!-- on:featured-first-option-triggered={handleFeaturedFirstOptionClicked}
      on:refresh-commands={handleRefreshClicked} -->

    <CommandsList
      {visibleCommands}
      {plugin}
      on:star-clicked={handleStarIconClicked}
      on:duplicate-hotkey-clicked={handleDuplicateHotkeyClicked}
      on:plugin-name-clicked={handlePluginNameClicked}
    />
  </div>
</div>

<style>
  /* Your styles here */
</style>
