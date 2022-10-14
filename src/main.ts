import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  Hotkey,
  PluginSettingTab,
  setIcon,
  Setting,
  WorkspaceLeaf,
} from 'obsidian'
import { openView, wait } from 'obsidian-community-lib'
import ShortcutsView from 'src/ShortcutsView'
// @ts-ignore
import {
  VIEW_TYPE_SHORTCUTS_ANALYZER,
  DEFAULT_FILTER_SETTINGS,
  DEFAULT_PLUGIN_SETTINGS,
} from 'src/Constants'
import type { PluginSettings } from 'src/Interfaces'

export default class KeyboardAnalizerPlugin extends Plugin {
  settings: PluginSettings

  get full() {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )
    const leaf = leaves.length ? leaves[0] : null
    if (leaf && leaf.view && leaf.view instanceof ShortcutsView)
      return leaf.view
  }

  async onload() {
    await this.loadSettings()

    this.registerPluginHotkeys()
    this.addStatusBarIndicator.apply(this)

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

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_PLUGIN_SETTINGS,
      await this.loadData()
    )
  }

  async saveSettings() {
    await this.saveData(this.settings)
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
    if (evt.ctrlKey == true) {
      this.addShortcutsView(true)
    } else {
      this.addShortcutsView()
    }
  }

  async addShortcutsView(newLeaf: boolean = false) {
    let checkResult =
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
        let checkResult =
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
  // END OF PLUGIN DECLARATION
}

// class KeyboardAnalyzerSettingTab extends PluginSettingTab {
//   plugin: KeyboardAnalizerPlugin

//   constructor(app: App, plugin: KeyboardAnalizerPlugin) {
//     super(app, plugin)
//     this.plugin = plugin
//   }

//   display(): void {
//     const { containerEl } = this

//     containerEl.empty()

//     containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' })

//     // checkbox for showing status bar item
//     new Setting(containerEl)
//       .setName('Show Status Bar Item')
//       .setDesc('Show the status bar item')
//       .addToggle((checkbox: any) =>
//         checkbox
//           .setChecked(this.plugin.settings.showStatusBarItem)
//           .onChange(async (value: boolean) => {
//             this.plugin.settings.showStatusBarItem = value
//             await this.plugin.saveSettings()
//           })
//       )
//   }
// }
