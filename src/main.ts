import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  setIcon,
  Setting,
  WorkspaceLeaf,
} from 'obsidian'
import { openView, wait } from 'obsidian-community-lib'
import ShortcutsView from 'src/ShortcutsView'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from 'src/Constants'

// Remember to rename these classes and interfaces!

interface KeyboardAnalizerSettings {
  showStatusBarItem: string
}

const DEFAULT_SETTINGS: KeyboardAnalizerSettings = {
  showStatusBarItem: 'true',
}

export default class KeyboardAnalizerPlugin extends Plugin {
  settings: KeyboardAnalizerSettings

  async onload() {
    console.log('loading keyboard analizer plugin')
    await this.loadSettings()

    this.registerPluginHotkeys()
    // this.setWorkspaceAttribute();
    this.addStatusBarIndicator.apply(this)

    this.addCommand({
      id: 'show-shortcuts-analyzer-view',
      name: 'Open Keyboard Shorcuts Analizer View',
      checkCallback: (checking: boolean) => {
        let checkResult =
          this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
            .length === 0

        if (checkResult) {
          // Only perform work when checking is false
          if (!checking) {
            openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
          }
          return true
        }
      },
    })

    // This creates an icon in the left ribbon.
    // const ribbonIconEl = this.addRibbonIcon(
    //   'dice',
    //   'Sample Plugin',
    //   (evt: MouseEvent) => {
    //     // Called when the user clicks the icon.
    //     new Notice('Hello World, Madafaka!')
    //   }
    // )
    // Perform additional things with the ribbon
    // ribbonIconEl.addClass('my-plugin-ribbon-class')

    this.registerView(
      VIEW_TYPE_SHORTCUTS_ANALYZER,
      (leaf: WorkspaceLeaf) => new ShortcutsView(leaf, this)
    )

    // let checkResult =
    //   this.app.workspace.getLeavesOfType(VIEW_TYPE_GRAPH_ANALYSIS)
    //     .length === 0

    //   if (checkResult) {
    //     // Only perform work when checking is false
    //     if (!checking) {
    //       openView(this.app, VIEW_TYPE_GRAPH_ANALYSIS, AnalysisView)
    //     }
    //     return true
    //   }
    // }

    //     await this.disconnectDiscord();
    //   }
    // });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new KeyboardAnalyzerSettingTab(this.app, this))
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  addStatusBarIndicator() {
    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarEl = this.addStatusBarItem()
    statusBarEl.setText('Shortcuts')
    statusBarEl.addClass('mod-clickable')
    // statusBarEl.setAttribute("aria-label", "Shortcuts");

    // create the status bar icon
    // const icon = statusBarEl.createSpan("status-bar-item-segment icon");
    // setIcon(icon, "pane-layout"); // inject svg icon

    // create the status bar text

    // register click handler
    statusBarEl.addEventListener('click', (evt) => this.onStatusBarClick(evt))
  }

  async onStatusBarClick(evt: MouseEvent) {
    console.log('click')
    let checkResult =
      this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        .length === 0

    if (checkResult) {
      openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
      return true
    }
  }

  registerPluginHotkeys() {
    this.addCommand({
      id: 'show-shortcuts-analyzer-view',
      name: 'Open Keyboard Shorcuts Analizer View',
      checkCallback: (checking: boolean) => {
        let checkResult =
          this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
            .length === 0

        if (checkResult) {
          // Only perform work when checking is false
          if (!checking) {
            openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
          }
          return true
        }
      },
    })
  }
}

// onOpen() {
//   const { contentEl } = this
//   contentEl.setText('Woah!')
// }

// onClose() {
//   const { contentEl } = this
//   contentEl.empty()
// }

class KeyboardAnalyzerSettingTab extends PluginSettingTab {
  plugin: KeyboardAnalizerPlugin

  constructor(app: App, plugin: KeyboardAnalizerPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' })

    // todo: change for switcher
    new Setting(containerEl)
      .setName('Setting #1')
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder('Enter your secret')
          .setValue(this.plugin.settings.showStatusBarItem)
          .onChange(async (value) => {
            console.log('Secret: ' + value)
            this.plugin.settings.showStatusBarItem = value
            await this.plugin.saveSettings()
          })
      )
  }
}
