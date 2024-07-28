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
import HotkeyManager from './managers/hotkeyManager.svelte'

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
