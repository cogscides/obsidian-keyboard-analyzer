import {
  setIcon,
  Plugin,
  type App,
  type WorkspaceLeaf,
  type PluginManifest,
  SuggestModal,
} from 'obsidian'

import ShortcutsView from './views/ShortcutsView'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from './Constants'

import CommandsManager from './managers/commandsManager'
import HotkeyManager from './managers/hotkeyManager'
import SettingsManager from './managers/settingsManager'
import GroupManager from './managers/groupManager'

import type { PluginSettings } from './managers/settingsManager'

import 'virtual:uno.css'
import './styles.css'
import {
  setDevLoggingEnabled,
  setEmulatedOS,
  setLogLevel,
} from './utils/runtimeConfig'
import KeyboardAnalyzerSettingTab from './settingsTab'

export default class KeyboardAnalyzerPlugin extends Plugin {
  commandsManager: CommandsManager
  hotkeyManager: HotkeyManager
  settingsManager: SettingsManager
  groupManager: GroupManager

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)
    this.settingsManager = SettingsManager.getInstance(this)
    this.groupManager = GroupManager.getInstance(this.settingsManager)
    this.commandsManager = CommandsManager.getInstance(this.app, this)
    this.hotkeyManager = HotkeyManager.getInstance(this.app)
  }

  get full() {
    const leaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )

    const leaf = leaves.length ? leaves[0] : null
    return leaf?.view instanceof ShortcutsView ? leaf.view : null
  }

  async focusView(type: string) {
    const leafView = this.full
    if (leafView) {
      this.app.workspace.revealLeaf(leafView.leaf)
    }
  }
  // openView(this.app, VIEW_TYPE_SHORTCUTS_ANALYZER, ShortcutsView)

  async onload() {
    await this.settingsManager.loadSettings()
    await this.hotkeyManager.initialize()
    this.commandsManager.initialize()

    // Initialize runtime config from settings
    setDevLoggingEnabled(!!this.settingsManager.getSetting('devLoggingEnabled'))
    setLogLevel('debug')
    setEmulatedOS(
      (this.settingsManager.getSetting('emulatedOS') || 'none') as
        | 'none'
        | 'windows'
        | 'macos'
        | 'linux'
    )

    this.registerPluginHotkeys()
    this.registerGroupOpenCommand()
    this.addStatusBarIndicator()

    this.registerView(
      VIEW_TYPE_SHORTCUTS_ANALYZER,
      (leaf: WorkspaceLeaf) => new ShortcutsView(leaf, this)
    )

    this.addSettingTab(new KeyboardAnalyzerSettingTab(this))

    // This will handle plugin reloads
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace
        .getLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
        .forEach((leaf) => {
          if (leaf.view instanceof ShortcutsView) {
            leaf.view.plugin = this // Update the plugin instance
            leaf.view.onOpen() // Re-run onOpen to refresh the view
          }
        })
    })
  }

  async onunload() {
    // Try to flush any pending settings writes to avoid truncated JSON on shutdown
    try {
      await this.settingsManager.flushAllSaves()
    } catch {}
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SHORTCUTS_ANALYZER)
  }

  addStatusBarIndicator() {
    const statusBarIcon = this.addStatusBarItem()
    statusBarIcon.addClass('mod-clickable')
    statusBarIcon.setAttribute('aria-label', 'Keyboard Shortcuts')
    statusBarIcon.setAttribute(
      'title',
      'Keyboard Shortcuts — Cmd/Ctrl+Click to open in a new pane.'
    )
    statusBarIcon.style.order = '10'
    const icon = statusBarIcon.createSpan('icon')
    setIcon(icon, 'keyboard-glyph')
    icon.addEventListener('click', (evt) => this.onStatusBarClick(evt))
  }

  async onStatusBarClick(evt: MouseEvent) {
    const isMeta = evt.ctrlKey === true || evt.metaKey === true
    const useSplit = evt.altKey === true

    let leafBehavior: boolean | 'split' = false
    if (isMeta && useSplit) {
      leafBehavior = 'split'
    } else if (isMeta) {
      leafBehavior = true
    }

    this.addShortcutsView(leafBehavior)
  }

  async addShortcutsView(leafBehavior: boolean | 'split' = false) {
    const existingLeaves = this.app.workspace.getLeavesOfType(
      VIEW_TYPE_SHORTCUTS_ANALYZER
    )

    if (existingLeaves.length > 0 && !leafBehavior) {
      this.app.workspace.revealLeaf(existingLeaves[0])
      return
    }

    const leaf = this.app.workspace.getLeaf(leafBehavior || false)
    await leaf.setViewState({
      type: VIEW_TYPE_SHORTCUTS_ANALYZER,
      active: true,
    })
  }

  registerPluginHotkeys() {
    this.addCommand({
      id: 'open-shortcuts-analyzer-view',
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

    this.addCommand({
      id: 'focus-shortcuts-analyzer-view',
      name: 'Focus keyboard shortcuts view',
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.focusView(VIEW_TYPE_SHORTCUTS_ANALYZER)
        }
        return true
      },
    })
  }

  private registerGroupOpenCommand() {
    this.addCommand({
      id: 'open-keyboard-analyzer-group',
      name: 'Open Keyboard Analyzer: Group…',
      callback: () => this.openGroupPicker(),
    })
  }

  private async openGroupPicker() {
    const plugin = this
    const groups = [
      { id: 'all', name: 'All Commands' },
      ...plugin.settingsManager.settings.commandGroups,
    ]
    class GroupSuggest extends SuggestModal<{ id: string; name: string }> {
      available: { id: string; name: string }[]
      constructor(app: App, items: { id: string; name: string }[]) {
        super(app)
        this.available = items
        this.setPlaceholder('Open group…')
      }
      getSuggestions(query: string) {
        const q = query.toLowerCase().trim()
        return !q
          ? this.available
          : this.available.filter((g) => g.name.toLowerCase().includes(q))
      }
      renderSuggestion(value: { id: string; name: string }, el: HTMLElement) {
        el.setText(value.name)
      }
      onChooseSuggestion(item: { id: string; name: string }) {
        plugin.openWithGroup(item.id)
      }
    }
    const modal = new GroupSuggest(
      this.app,
      groups.map((g) => ({
        id: String((g as any).id || g.id),
        name: (g as any).name || g.name,
      }))
    )
    modal.open()
  }

  public async openWithGroup(groupId: string) {
    this.settingsManager.updateSettings({ lastOpenedGroupId: groupId })
    await this.addShortcutsView(false)
  }

  // // Helper methods to access settings
  // async getSetting<K extends keyof PluginSettings>(
  //   key: K
  // ): Promise<PluginSettings[K]> {
  //   return this.settingsManager.getSetting(key)
  // }

  // async setSetting<K extends keyof PluginSettings>(
  //   key: K,
  //   value: PluginSettings[K]
  // ): Promise<void> {
  //   await this.settingsManager.setSetting(key, value)
  // }

  // async updateSettings(newSettings: Partial<PluginSettings>): Promise<void> {
  //   await this.settingsManager.updateSettings(newSettings)
  // }

  // getSettings(): Readonly<PluginSettings> {
  //   return this.settingsManager.getSettings()
  // }

  // END OF PLUGIN DECLARATION
}
