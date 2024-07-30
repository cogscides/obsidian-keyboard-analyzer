<!-- src/components/KeyboardComponent.svelte -->

<script lang="ts">
  import { setContext } from 'svelte'
  import type { Hotkey, Modifier } from 'obsidian'
  import { VisualKeyboardManager } from '../managers/visualKeyboardManager.svelte'
  import type { ActiveKeysStore } from '../stores/activeKeysStore.svelte'

  import type KeyboardAnalyzerPlugin from '../main'
  import type ShortcutsView from '../views/ShortcutsView'

  import type { KeyboardLayout, commandEntry } from '../interfaces/Interfaces'
  import { getConvertedModifiers } from '../utils/modifierUtils'

  import { UNIFIED_KEYBOARD_LAYOUT } from '../Constants'

  import KeyboardLayoutComponent from './KeyboardLayoutComponent.svelte'
  import SearchMenu from './SearchMenu.svelte'
  import CommandsList from './CommandsList.svelte'

  interface Props {
    plugin: KeyboardAnalyzerPlugin
    view: ShortcutsView
    activeKeysStore: ActiveKeysStore
  }

  let { plugin, view, activeKeysStore }: Props = $props()

  setContext('keyboard-analyzer-plugin', plugin)

  const visualKeyboardManager = new VisualKeyboardManager()
  setContext('visualKeyboardManager', visualKeyboardManager)
  setContext('activeKeysStore', activeKeysStore)

  const hotkeyManager = plugin.hotkeyManager

  let filterSettings = $derived(plugin.settingsManager.settings.filterSettings)
  let featuredCommandIDs = $derived(
    plugin.settingsManager.settings.featuredCommandIDs
  )
  let viewWidth = $state(0)
  let viewMode = $state('desktop')

  let search = $state('')
  let input: HTMLInputElement | undefined = $state()

  let KeyboardObject: KeyboardLayout = $state(UNIFIED_KEYBOARD_LAYOUT)

  let keyboardListenerIsActive = $state(false)

  let searchCommandsCount = $state(0)
  let searchHotkeysCount = $state(0)

  function sortByFeaturedFirst(cmds: commandEntry[], featured: string[]) {
    const featuredCmds = cmds.filter((cmd) => featured.includes(cmd.id))
    const otherCmds = cmds.filter((cmd) => !featured.includes(cmd.id))
    return [...featuredCmds, ...otherCmds]
  }

  let visibleCommands: commandEntry[] = $state([])

  $effect(() => {
    const filteredCmds = hotkeyManager.getFilteredCommands()
    visibleCommands = filterSettings.FeaturedFirst
      ? sortByFeaturedFirst(filteredCmds, featuredCommandIDs ?? [])
      : filteredCmds

    searchCommandsCount = visibleCommands.length
    searchHotkeysCount = visibleCommands.reduce(
      (count, command) => count + command.hotkeys.length,
      0
    )
  })

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
    hotkeyManager.filterCommands(
      search,
      activeKeysStore.ActiveModifiers,
      activeKeysStore.ActiveKey
    )
  }

  function handleDuplicateHotkeyClicked(event: CustomEvent<Hotkey>) {
    const duplicativeHotkey = event.detail
    const duplicativeModifiers = getConvertedModifiers(
      duplicativeHotkey.modifiers
    )
    const duplicativeKey = duplicativeHotkey.key

    if (
      activeKeysStore.ActiveModifiers.every((modifier) =>
        duplicativeModifiers.includes(modifier as Modifier)
      ) &&
      activeKeysStore.ActiveKey.toLowerCase() === duplicativeKey.toLowerCase()
    ) {
      activeKeysStore.reset()
    } else {
      activeKeysStore.ActiveModifiers = duplicativeModifiers
      activeKeysStore.ActiveKey = duplicativeKey
      search = ''
    }
    hotkeyManager.filterCommands(
      search,
      activeKeysStore.ActiveModifiers,
      activeKeysStore.ActiveKey
    )
  }

  function handleStarIconClicked(event: CustomEvent<string>) {
    const commandId = event.detail
    const featuredCommandIDs =
      plugin.settingsManager.settings.featuredCommandIDs || []

    if (featuredCommandIDs.includes(commandId)) {
      plugin.settingsManager.updateSettings({
        featuredCommandIDs: featuredCommandIDs.filter((id) => id !== commandId),
      })
    } else {
      plugin.settingsManager.updateSettings({
        featuredCommandIDs: [...featuredCommandIDs, commandId],
      })
    }
  }

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
  })

  $effect(() => {
    handleResize(viewWidth)
  })
</script>

<div
  id="keyboard-component"
  class="{viewMode} {viewMode === 'xs' ? 'is-mobile' : ''}"
  bind:offsetWidth={viewWidth}
>
  <div id="keyboard-preview-view">
    <KeyboardLayoutComponent {KeyboardObject} {visibleCommands} />
  </div>
  <div class="shortcuts-wrapper">
    <SearchMenu
      bind:inputHTML={input}
      bind:search
      bind:searchCommandsCount
      bind:searchHotkeysCount
      bind:keyboardListenerIsActive
      {plugin}
    />

    <CommandsList {visibleCommands} />
    <!-- onStarClick={handleStarIconClicked}
      onDuplicateHotkeyClick={handleDuplicateHotkeyClicked}
      onPluginNameClick={handlePluginNameClicked} -->
  </div>
</div>

<style>
  /* Your styles here */
</style>
