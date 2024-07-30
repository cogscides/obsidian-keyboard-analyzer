import { ItemView, type WorkspaceLeaf } from 'obsidian'
import { mount, unmount } from 'svelte'

import type KeyboardAnalyzerPlugin from '../main'
import KeyboardComponent from '../components/KeyboardComponent.svelte'
import { ActiveKeysStore } from '../stores/activeKeysStore.svelte'
import { VIEW_TYPE_SHORTCUTS_ANALYZER } from '../Constants'

export default class ShortcutsView extends ItemView {
  plugin: KeyboardAnalyzerPlugin
  component: ReturnType<typeof mount> | null = null
  activeKeysStore: ActiveKeysStore

  navigation = true

  constructor(leaf: WorkspaceLeaf, plugin: KeyboardAnalyzerPlugin) {
    super(leaf)
    this.plugin = plugin
    this.activeKeysStore = new ActiveKeysStore(
      this.app,
      this.plugin.visualKeyboardManager
    )
  }

  async onload(): Promise<void> {
    super.onload()
  }

  async onOpen() {
    await this.draw()
  }
  // async focus(): Promise<void> {
  //   await this.app.workspace.getLeafById(this.id)
  // }

  getViewType(): string {
    return VIEW_TYPE_SHORTCUTS_ANALYZER
  }

  getDisplayText(): string {
    return 'Keyboard Shortcuts Analyzer'
  }

  async draw(): Promise<void> {
    const { app, contentEl } = this

    contentEl.empty()
    contentEl.setAttribute('id', 'KB-view')
    contentEl.style.padding = '0'

    this.component = mount(KeyboardComponent, {
      target: contentEl,
      props: {
        plugin: this.plugin,
        view: this,
        activeKeysStore: this.activeKeysStore,
      },
    })
  }

  onClose(): Promise<void> {
    if (this.component) {
      unmount(this.component)
      this.component = null
    }
    return Promise.resolve()
  }
}

// private async onSettingsChange(
//   newSettings: Partial<PluginSettings>
// ): Promise<void> {
//   await this.plugin.updateSettings(newSettings)
//   // Optionally, you can redraw the component or update specific parts
//   // await this.draw();
// }
