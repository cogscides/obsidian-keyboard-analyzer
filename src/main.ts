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
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from 'src/Constants'
import type { KeyboardAnalizerSettings } from 'src/Interfaces'

// Remember to rename these classes and interfaces!
const DEFAULT_SETTINGS: KeyboardAnalizerSettings = {
  showStatusBarItem: 'true',
}

export default class KeyboardAnalizerPlugin extends Plugin {
  settings: KeyboardAnalizerSettings

  get full() {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )
    const leaf = leaves.length ? leaves[0] : null
    if (leaf && leaf.view && leaf.view instanceof ShortcutsView)
      console.log('Already opened')

    return leaf.view
  }

  async onload() {
    console.log('loading keyboard analizer plugin')
    await this.loadSettings()

    this.registerPluginHotkeys()
    // this.setWorkspaceAttribute();
    this.addStatusBarIndicator.apply(this)

    // this.addCommand({
    //   id: 'show-shortcuts-analyzer-view',
    //   name: 'Open Keyboard Shorcuts Analizer View',
    //   checkCallback: (checking: boolean) => {
    //     let checkResult =
    //       this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
    //         .length === 0

    //     if (checkResult) {
    //       // Only perform work when checking is false
    //       if (!checking) {
    //         openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
    //       }
    //       return true
    //     }
    //   },
    // })

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

    this.addRibbonIcon('dice', 'Print leaf types', () => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        console.log(leaf.getViewState().type)
      })
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new KeyboardAnalyzerSettingTab(this.app, this))
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  addStatusBarIndicator() {
    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarEl = this.addStatusBarItem()
    // statusBarEl.setText('Shortcuts')
    statusBarEl.addClass('mod-clickable')
    // statusBarEl.setAttribute("aria-label", "Shortcuts");

    // create the status bar icon
    const icon = statusBarEl.createSpan('status-bar-item-segment icon')
    setIcon(icon, 'keyboard-glyph') // inject svg icon

    // create the status bar text

    // register click handler
    statusBarEl.addEventListener('click', (evt) => this.onStatusBarClick(evt))
    // TODO update view on click
    // TODO update view when commands added or hotkeys changed
  }

  async onStatusBarClick(evt: MouseEvent) {
    console.log('click')
    if (evt.ctrlKey == true) {
      let checkResult =
        this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
          .length === 0

      if (checkResult) {
        this.app.workspace
          .getLeaf(true)
          .setViewState({ type: VIEW_TYPE_SHORTCUTS_ANALYZER })
      }
    } else {
      this.addShortcutsView()
    }
  }

  async addShortcutsView(startup: boolean = false) {
    let checkResult =
      this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        .length === 0

    if (checkResult) {
      this.app.workspace
        .getLeaf()
        .setViewState({ type: VIEW_TYPE_SHORTCUTS_ANALYZER })
      // if (
      //   startup &&
      //   this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER).length
      // )
      //   return this.app.workspace.getLeaf(false)
      // if (this.full) {
      //   this.app.workspace.revealLeaf(this.full.leaf)
      // }
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
            this.addShortcutsView()
            // openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
          }
          return true
        }
        // let checkResult =
        //   this.app.workspace.getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        //     .length === 0

        // if (checkResult) {
        //   // Only perform work when checking is false
        //   if (!checking) {
        //     openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)
        //   }
        //   return true
      },
    })
  }
  // END OF PLUGIN DECLARATION
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
