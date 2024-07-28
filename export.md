This is the Obsidian plugin for visual Keyboard hotkeys representation. It helps you to see and analyze your keyboard hotkeys and shortcuts, view them in a comfort way with different search and filter options.

# Project Structure

```
.obsidian/
  app.json
  appearance.json
  core-plugins-migration.json
  core-plugins.json
  workspace.json
layouts/
patches/
  svelte@5.0.0-next.198.patch
public/
  manifest.json
  versions.json
screens/
  Image1.png
src/
  components/
    CommandsList.svelte
    Example.svelte
    KeyboardComponent.svelte
    KeyboardKey.svelte
    KeyboardLayout.svelte
    SearchMenu.svelte
  interfaces/
    Interfaces.ts
  managers/
    hotkeyManager.ts
    settingsManager.svelte.ts
  stores/
    activeKeysStore.svelte.ts
  utils/
    _AppShortcuts.old.ts
    hotkeyUtils.ts
    longpress.js
    modifierUtils.ts
  views/
    ExampleView.ts
    ShortcutsView.ts
  Constants.ts
  main.ts
  Obsidian.internal.d.ts
  styles.css
test-vault/
  .obsidian/
    plugins/
      hot-reload/
        main.js
        manifest.json
      obsidian-svelte-plugin/
        .hotreload
        data.json
        main.js
        manifest.json
        styles.css
        versions.json
      obsidian42-brat/
        data.json
        main.js
        manifest.json
        styles.css
    themes/
      Minimal/
        manifest.json
        theme.css
    app.json
    appearance.json
    community-plugins.json
    core-plugins-migration.json
    core-plugins.json
    hotkeys.json
    workspace.json
    workspace.sync-conflict-20240727-134328-ZOWPHGN.json
    workspace.sync-conflict-20240727-201813-ZOWPHGN.json
biome.json
bun.lockb
export.md
exportconfig.json
LICENSE.txt
package-lock.json
package.json
README.md
tsconfig.json
uno.config.ts
vite.config.ts
```



# Selected Files Content

## src/components/KeyboardComponent.svelte

```svelte
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
  let hotkeyManager = $derived(app.hotkeyManager)
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

  let commands = $state(getHotkeysV2(app))
  let cmdsArray: commandsArray = $derived(Object.values(commands))

  function refreshCommandsList() {
    commands = getHotkeysV2(app)
  }

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
    refreshCommandsList()

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

  // TODO create a new store for this
  let searchHotkeysCount: number = $state(0)

  $effect(() => {
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
```

## src/interfaces/Interfaces.ts

```ts
import type { Hotkey, Modifier } from 'obsidian'

// Plugin Settings
export interface FilterSettings {
  FeaturedFirst: boolean
  StrictSearch: boolean
  HighlightCustom: boolean
  HighlightDuplicates: boolean
  DisplayWOhotkeys: boolean
  DisplayIDs: boolean
}

export interface PluginSettings {
  showStatusBarItem: boolean
  filterSettings: FilterSettings
  featuredCommandIDs?: string[]
}

// Plugin Data
export interface hotkeyEntry extends Omit<Hotkey, 'modifiers'> {
  modifiers: Modifier[]
  backedModifiers?: string
  isCustom: boolean
}

export interface commandEntry {
  id: string
  pluginName: string
  cmdName: string
  hotkeys: hotkeyEntry[] | []
}

export interface hotkeyDict {
  [id: string]: commandEntry
}

export type commandsArray = commandEntry[]

export interface Key {
  label: string
  color?: string
  fontSize?: string
  smallText?: boolean
  caps?: string
  strictCode?: boolean
  tryUnicode?: boolean
  width?: number
  height?: number
}

export type Row = Key[]

export interface KeyboardSection {
  name: string
  rows: Row[]
  gridRatio: number
}

export type Keyboard = KeyboardSection[]
```

## src/managers/hotkeyManager.ts

```ts
// hotkeyManager.ts
import type { App, Hotkey } from 'obsidian'
import { getHotkeysV2, isHotkeyDuplicate } from '../utils/hotkeyUtils'

class HotkeyManager {
  private app: App

  constructor(app: App) {
    this.app = app
  }

  getHotkeys() {
    return getHotkeysV2(this.app)
  }

  isHotkeyDuplicate(commandID: string, hotkey: Hotkey): boolean {
    return isHotkeyDuplicate(commandID, hotkey, this.app)
  }
}

export default HotkeyManager
```

## src/managers/settingsManager.svelte.ts

```ts
// settingsManager.ts
import type { PluginSettings, FilterSettings } from '../interfaces/Interfaces'
import { DEFAULT_PLUGIN_SETTINGS } from '../Constants'
import type KeyboardAnalyzerPlugin from '../main'

class SettingsManager {
  private static instance: SettingsManager | null = null
  settings: PluginSettings = $state(DEFAULT_PLUGIN_SETTINGS)
  private plugin: KeyboardAnalyzerPlugin

  private constructor(plugin: KeyboardAnalyzerPlugin) {
    this.plugin = plugin
  }

  static getInstance(plugin?: KeyboardAnalyzerPlugin): SettingsManager {
    if (!SettingsManager.instance) {
      if (!plugin) {
        throw new Error(
          'Plugin instance must be provided when creating SettingsManager'
        )
      }
      SettingsManager.instance = new SettingsManager(plugin)
    }
    return SettingsManager.instance
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_PLUGIN_SETTINGS,
      await this.plugin.loadData()
    )
  }

  async saveSettings(): Promise<void> {
    await this.plugin.saveData(this.settings)
  }

  updateFilterSettings(newFilterSettings: Partial<FilterSettings>): void {
    this.settings.filterSettings = {
      ...this.settings.filterSettings,
      ...newFilterSettings,
    }
    this.saveSettings()
  }

  toggleFeaturedFirst(): void {
    this.settings.filterSettings.FeaturedFirst =
      !this.settings.filterSettings.FeaturedFirst
    this.saveSettings()
  }

  public async resetSettings(): Promise<void> {
    this.settings = DEFAULT_PLUGIN_SETTINGS
    await this.saveSettings()
  }

  public getSettings(): Readonly<PluginSettings> {
    return this.settings
  }

  public updateSettings(newSettings: Partial<PluginSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  public getSetting<K extends keyof PluginSettings>(key: K): PluginSettings[K] {
    return this.settings[key]
  }

  public async setSetting<K extends keyof PluginSettings>(
    key: K,
    value: PluginSettings[K]
  ): Promise<void> {
    this.settings[key] = value
    await this.saveSettings()
  }
}

// export const settingsManager = SettingsManager.getInstance() // Export the singleton instance
export default SettingsManager // Export the class
```

## src/stores/activeKeysStore.svelte.ts

```ts
import { sortModifiers } from '../utils/modifierUtils'
import { JavaSciptKeyCodes, SpecialSymbols } from '../Constants'

class ActiveKeysStore {
  activeKey = $state('')
  activeModifiers: string[] = $state([])

  get ActiveKey() {
    return this.activeKey
  }

  set ActiveKey(key: string) {
    this.activeKey = key
  }

  get ActiveModifiers() {
    return this.activeModifiers
  }

  set ActiveModifiers(modifiers: string[]) {
    this.activeModifiers = modifiers
  }

  get state() {
    return {
      activeKey: this.activeKey,
      activeModifiers: this.activeModifiers,
    }
  }

  set state(newState: { activeKey: string; activeModifiers: string[] }) {
    this.activeKey = newState.activeKey
    this.activeModifiers = newState.activeModifiers
  }

  public reset() {
    this.activeKey = ''
    this.activeModifiers = []
  }

  public handleModifierKeyDown(e: KeyboardEvent) {
    const handleModifier = (modifierKey: string) => {
      if (this.activeModifiers.includes(modifierKey)) {
        this.activeModifiers = this.activeModifiers.filter(
          (mod) => mod !== modifierKey
        )
      } else {
        this.activeModifiers = [...this.activeModifiers, modifierKey]
      }
    }

    if (e.getModifierState('Shift')) handleModifier('Shift')
    if (e.getModifierState('Alt')) handleModifier('Alt')
    if (e.getModifierState('Control')) handleModifier('Ctrl')
    if (e.getModifierState('Meta')) handleModifier('Meta')
  }

  public handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (this.activeKey !== '') {
        this.activeKey = ''
      } else if (this.activeModifiers.length > 0) {
        this.activeModifiers = this.activeModifiers.slice(0, -1)
      }
      return
    }

    const clickedKeyJS = JavaSciptKeyCodes[e.keyCode]
    if (clickedKeyJS) {
      e.preventDefault()
      this.activeKey =
        clickedKeyJS.Code === `Numpad${clickedKeyJS.Key}`
          ? clickedKeyJS.Code
          : clickedKeyJS.Key
    }
  }

  public getDisplayKey() {
    return this.activeKey in SpecialSymbols
      ? SpecialSymbols[this.activeKey]
      : this.activeKey.length === 1
      ? this.activeKey.toUpperCase()
      : this.activeKey
  }

  sortedModifiers = $derived(sortModifiers(this.activeModifiers))
}

const activeKeysStore = new ActiveKeysStore()
export default activeKeysStore
```

## src/views/ShortcutsView.ts

```ts
import { ItemView, type WorkspaceLeaf } from 'obsidian'
import type KeyboardAnalyzerPlugin from '../main'
// @ts-ignore
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from '../Constants'
import KeyboardComponent from '../components/KeyboardComponent.svelte'
import { mount, unmount } from 'svelte'
import type { PluginSettings } from '../interfaces/Interfaces'

export default class ShortcutsView extends ItemView {
  private plugin: KeyboardAnalyzerPlugin
  private component: ReturnType<typeof mount> | null = null

  navigation = true

  constructor(leaf: WorkspaceLeaf, plugin: KeyboardAnalyzerPlugin) {
    super(leaf)
    this.plugin = plugin
  }

  async onload(): Promise<void> {
    super.onload()
  }

  getViewType(): string {
    return VIEW_TYPE_SHORTCUTS_ANALYZER
  }

  getDisplayText(): string {
    return 'Keyboard Shortcuts'
  }

  async onOpen(): Promise<void> {
    await this.draw()
  }

  onClose(): Promise<void> {
    if (this.component) {
      unmount(this.component)
      this.component = null
    }
    return Promise.resolve()
  }

  async draw(): Promise<void> {
    const { app, contentEl } = this

    contentEl.empty()
    contentEl.setAttribute('id', 'KB-view')
    contentEl.style.padding = '0'

    this.component = mount(KeyboardComponent, {
      target: contentEl,
      props: {
        app,
        plugin: this.plugin,
        view: this,
      },
    })
  }

  // private async onSettingsChange(
  //   newSettings: Partial<PluginSettings>
  // ): Promise<void> {
  //   await this.plugin.updateSettings(newSettings)
  //   // Optionally, you can redraw the component or update specific parts
  //   // await this.draw();
  // }
}
```

## src/main.ts

```ts
import {
  Plugin,
  setIcon,
  type WorkspaceLeaf,
  type App,
  type PluginManifest,
} from 'obsidian'
import SettingsManager from './managers/settingsManager.svelte'
import ShortcutsView from './views/ShortcutsView'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from './Constants'
import type { PluginSettings } from './interfaces/Interfaces'
import HotkeyManager from './managers/hotkeyManager'

import 'virtual:uno.css'
import './styles.css'

export default class KeyboardAnalyzerPlugin extends Plugin {
  settingsManager: SettingsManager
  hotkeyManager: HotkeyManager

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.settingsManager = SettingsManager.getInstance(this)
    this.hotkeyManager = new HotkeyManager(this.app)
  }

  get full() {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )

    const leaf = leaves.length ? leaves[0] : null
    return leaf?.view instanceof ShortcutsView ? leaf.view : null
  }

  async onload() {
    await this.settingsManager.loadSettings()

    this.registerPluginHotkeys()
    this.addStatusBarIndicator()

    this.registerView(
      VIEW_TYPE_SHORTCUTS_ANALYZER,
      (leaf: WorkspaceLeaf) => new ShortcutsView(leaf, this)
    )

    // This adds a settings tab so the user can configure various aspects of the plugin
    // this.addSettingTab(new KeyboardAnalyzerSettingTab(this.app, this))
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
  }

  addStatusBarIndicator() {
    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarIcon = this.addStatusBarItem()
    statusBarIcon.addClass('mod-clickable')
    statusBarIcon.setAttribute('aria-label', 'Keyboard Shortcuts')
    statusBarIcon.style.order = '10'

    // create the status bar icon
    const icon = statusBarIcon.createSpan('icon')

    // register click handler
    setIcon(icon, 'keyboard-glyph') // inject svg icon
    icon.addEventListener('click', (evt) => this.onStatusBarClick(evt))
    // TODO update view on click
    // TODO update view when commands added or hotkeys changed
  }

  async onStatusBarClick(evt: MouseEvent) {
    if (evt.ctrlKey === true) {
      this.addShortcutsView(true)
    } else {
      this.addShortcutsView()
    }
  }

  async addShortcutsView(newLeaf = false) {
    const checkResult =
      this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        .length === 0

    if (checkResult) {
      if (newLeaf) {
        this.app.workspace
          .getLeaf(true)
          .setViewState({ type: VIEW_TYPE_SHORTCUTS_ANALYZER })
      } else {
        this.app.workspace
          .getLeaf()
          .setViewState({ type: VIEW_TYPE_SHORTCUTS_ANALYZER })
      }
    }
  }

  registerPluginHotkeys() {
    this.addCommand({
      id: 'show-shortcuts-analyzer-view',
      name: 'Open keyboard shortcuts view',
      checkCallback: (checking: boolean) => {
        const checkResult =
          this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
            .length === 0

        if (checkResult) {
          // Only perform work when checking is false
          if (!checking) {
            this.addShortcutsView()
            // openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
          }
          return true
        }
      },
    })
  }

  // Helper methods to access settings
  async getSetting<K extends keyof PluginSettings>(
    key: K
  ): Promise<PluginSettings[K]> {
    return this.settingsManager.getSetting(key)
  }

  async setSetting<K extends keyof PluginSettings>(
    key: K,
    value: PluginSettings[K]
  ): Promise<void> {
    await this.settingsManager.setSetting(key, value)
  }

  async updateSettings(newSettings: Partial<PluginSettings>): Promise<void> {
    await this.settingsManager.updateSettings(newSettings)
  }

  getSettings(): Readonly<PluginSettings> {
    return this.settingsManager.getSettings()
  }

  // END OF PLUGIN DECLARATION
}
```

